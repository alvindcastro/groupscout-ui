import { designTokens } from "../design/tokens.js";

export const mockPipelineRuns = [
  {
    id: "run_20260508_001",
    status: "succeeded",
    requestedAt: "2026-05-08T14:59:58Z",
    startedAt: "2026-05-08T15:00:00Z",
    finishedAt: "2026-05-08T15:01:10Z",
    result: "healthy",
    collector: {
      collected: 42,
      skipped: 5,
      enriched: 36,
      failures: ["permit_feed timeout"]
    },
    llm: {
      provider: "openai",
      latencyMs: 820,
      errors: 0
    },
    notifications: {
      slackFailures: 0,
      emailFailures: 1,
      webhookFailures: 0
    },
    links: {
      logs: "https://logs.groupscout.test/runs/run_20260508_001",
      grafana: "https://grafana.groupscout.test/d/pipeline"
    }
  },
  {
    id: "run_20260508_000",
    status: "partial",
    requestedAt: "2026-05-08T13:00:00Z",
    startedAt: "2026-05-08T13:00:03Z",
    finishedAt: "2026-05-08T13:03:30Z",
    result: "degraded",
    collector: {
      collected: 21,
      skipped: 9,
      enriched: 18,
      failures: ["email delivery rejected", "webhook 500"]
    },
    llm: {
      provider: "openai",
      latencyMs: 1320,
      errors: 1
    },
    notifications: {
      slackFailures: 0,
      emailFailures: 1,
      webhookFailures: 1
    },
    links: {}
  }
];

const CONTROL_DEFINITIONS = [
  ["startRun", "Start run", "button"],
  ["refreshHistory", "Refresh history", "button"]
];

const HISTORY_COLUMNS = [
  { key: "status", label: "Status" },
  { key: "result", label: "Result" },
  { key: "collector", label: "Collector" },
  { key: "llm", label: "LLM" },
  { key: "delivery", label: "Delivery" },
  { key: "failures", label: "Failures" },
  { key: "finished", label: "Finished" }
];

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short"
});

export function createPipelineMonitorScreen({
  runs = mockPipelineRuns,
  state,
  errorMessage,
  viewport = "desktop",
  startRun = async () => {
    throw new Error("Pipeline run client is not configured");
  }
} = {}) {
  const displayState = state ?? inferState(runs);
  const layout = createLayout(viewport);
  const baseScreen = {
    kind: "pipeline-monitor-screen",
    heading: "Pipeline Monitor",
    state: displayState,
    layout,
    controls: createControls(),
    tokens: {
      card: designTokens.components["card-base"],
      primaryAction: designTokens.components["button-primary"],
      secondaryAction: designTokens.components["button-secondary"],
      badge: designTokens.components["badge-tag"],
      row: designTokens.components["property-row"]
    },
    runControl: {
      label: "Start run",
      endpoint: "POST /api/pipeline/runs",
      blocksBrowserUntilFinished: false,
      automationEndpointExposed: false
    },
    actions: {
      startRun: async (payload = { reason: "manual_operator_run" }) => ({
        state: "starting",
        run: await startRun(payload)
      })
    }
  };

  if (displayState === "loading") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "status",
        message: "Loading pipeline health."
      }
    };
  }

  if (displayState === "error") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: errorMessage ?? "Pipeline monitor could not load."
      },
      errorState: {
        title: "Pipeline monitor could not load",
        message: errorMessage ?? "Try again after the pipeline API recovers."
      }
    };
  }

  if (runs.length === 0) {
    return {
      ...baseScreen,
      state: "empty",
      emptyState: {
        title: "No pipeline runs have been recorded",
        action: { label: "Start run" }
      },
      history: createHistory([])
    };
  }

  const latestRun = runs[0];

  return {
    ...baseScreen,
    health: createHealth(latestRun),
    history: createHistory(runs),
    recentFailures: createRecentFailures(runs),
    links: createLinks(latestRun.links)
  };
}

export function createPipelineRunRequest({ reason = "manual_operator_run" } = {}) {
  return {
    method: "POST",
    path: "/api/pipeline/runs",
    body: { reason },
    browserAsync: true
  };
}

function inferState(runs) {
  if (runs.length === 0) {
    return "empty";
  }

  const latestRun = runs[0];
  if (!latestRun.llm || !latestRun.notifications || !latestRun.collector) {
    return "partial";
  }

  return "ready";
}

function createHealth(run) {
  return {
    freshness: {
      status: run.result === "healthy" ? "healthy" : "degraded",
      lastRun: formatDateTime(run.startedAt ?? run.requestedAt ?? run.finishedAt),
      result: run.result ?? "unknown"
    },
    collector: {
      counts: {
        collected: formatCount(run.collector?.collected, "collected"),
        skipped: formatCount(run.collector?.skipped, "skipped"),
        enriched: formatCount(run.collector?.enriched, "enriched")
      },
      failures: run.collector?.failures ?? []
    },
    llm: {
      provider: run.llm?.provider ?? "Unknown provider",
      latency: run.llm?.latencyMs === undefined || run.llm?.latencyMs === null
        ? "Unknown latency"
        : `${run.llm.latencyMs} ms`,
      errors: run.llm?.errors === undefined || run.llm?.errors === null
        ? "Unknown errors"
        : pluralize(run.llm.errors, "error", "errors")
    },
    delivery: {
      slack: formatFailures(run.notifications?.slackFailures, "Slack"),
      email: formatFailures(run.notifications?.emailFailures, "email"),
      webhook: formatFailures(run.notifications?.webhookFailures, "webhook")
    }
  };
}

function createHistory(runs) {
  return {
    dense: true,
    columns: HISTORY_COLUMNS,
    rows: runs.map((run) => ({
      id: run.id,
      cells: {
        status: run.status,
        result: run.result ?? "unknown",
        collector: [
          formatCount(run.collector?.collected, "collected"),
          formatCount(run.collector?.skipped, "skipped"),
          formatCount(run.collector?.enriched, "enriched")
        ].join(" / "),
        llm: `${run.llm?.provider ?? "unknown"} / ${run.llm?.latencyMs ?? "unknown"} ms / ${
          run.llm?.errors ?? "unknown"
        } errors`,
        delivery: [
          formatFailures(run.notifications?.slackFailures, "Slack"),
          formatFailures(run.notifications?.emailFailures, "email"),
          formatFailures(run.notifications?.webhookFailures, "webhook")
        ].join(" / "),
        failures: (run.collector?.failures ?? []).join(", ") || "None",
        finished: formatDateTime(run.finishedAt)
      }
    }))
  };
}

function createRecentFailures(runs) {
  return {
    items: runs.flatMap((run) => run.collector?.failures ?? [])
  };
}

function createLinks(links = {}) {
  const items = [];

  if (links.logs) {
    items.push({ label: "Open logs", href: links.logs });
  }

  if (links.grafana) {
    items.push({ label: "Open Grafana", href: links.grafana });
  }

  return items;
}

function createControls() {
  return CONTROL_DEFINITIONS.map(([name, label, type]) => ({
    name,
    label,
    type,
    ariaLabel: label,
    minTouchTarget: 44,
    token: name === "startRun" ? "button-primary" : "button-secondary"
  }));
}

function createLayout(viewport) {
  if (viewport === "mobile") {
    return {
      viewport,
      mode: "mobile-pipeline-stack",
      regions: ["health", "run-control", "failures", "history"]
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-pipeline-stack",
      regions: ["health", "run-control", "history"]
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-pipeline-monitor",
    regions: ["health", "run-control", "failures", "history"]
  };
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return DATE_TIME_FORMATTER.format(new Date(value));
}

function formatCount(value, label) {
  if (value === undefined || value === null) {
    return `Unknown ${label}`;
  }

  return `${value} ${label}`;
}

function formatFailures(value, channel) {
  if (value === undefined || value === null) {
    return `Unknown ${channel} delivery`;
  }

  return `${value} ${channel} ${value === 1 ? "failure" : "failures"}`;
}

function pluralize(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}
