import { designTokens } from "../design/tokens.js";

export const TODAY_ACTION_POLICY = {
  readOnly: true,
  mutationsAllowed: false,
  description: "Today links operators to the owning workspace; status, outreach, alert, and run actions stay there."
};

export const mockTodayCommandCenter = {
  generatedAt: "2026-05-08T16:30:00Z",
  systemHealth: {
    status: "degraded",
    api: "ok",
    database: "ok",
    collectorFreshness: "stale",
    llmEnrichment: "degraded"
  },
  counts: {
    highScoreNewLeads: 3,
    agingClaimedLeads: 2,
    activeAlerts: 2,
    failedJobs: 1
  },
  priorityLeads: [
    {
      id: "lead_hotel_001",
      title: "Riverside hotel renovation crew block",
      score: 94,
      owner: null,
      status: "new",
      source: "Permit Feed",
      timing: "Today before 4 PM"
    },
    {
      id: "lead_hotel_014",
      title: "Airport hotel overflow crew",
      score: 91,
      owner: null,
      status: "notified",
      source: "Slack referral",
      timing: "Today"
    },
    {
      id: "lead_hotel_021",
      title: "Northbank apartment repair team",
      score: 87,
      owner: null,
      status: "flagged",
      source: "Builder Network",
      timing: "Needs source review"
    }
  ],
  agingClaimed: [
    {
      id: "lead_hotel_009",
      title: "Convention center electrical crew",
      owner: "Dana Lee",
      ageDays: 9,
      status: "claimed",
      nextStep: "Log follow-up"
    },
    {
      id: "lead_hotel_017",
      title: "South terminal concrete team",
      owner: "Sam Rivera",
      ageDays: 6,
      status: "contacted",
      nextStep: "Mark outcome"
    }
  ],
  activeAlerts: [
    {
      id: "alert_riverside_001",
      property: "Riverside Hotel",
      sps: 91,
      state: "active",
      impact: "38 rooms unavailable"
    },
    {
      id: "alert_northbank_002",
      property: "Northbank Apartments",
      sps: 74,
      state: "watching",
      impact: "12 rooms at risk"
    }
  ],
  failedJobs: [
    {
      id: "run_2026_05_08_1530",
      collector: "permit_feed",
      status: "failed",
      failedAt: "2026-05-08T15:30:00Z",
      reason: "Source timeout"
    }
  ]
};

const CONTROL_DEFINITIONS = [
  ["dateScope", "Today", "chip"],
  ["ownerScope", "All owners", "select"],
  ["refresh", "Refresh today", "button"]
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

export function createTodayCommandCenterScreen({
  overview = mockTodayCommandCenter,
  state,
  errorMessage,
  viewport = "desktop"
} = {}) {
  const displayState = state ?? inferState(overview);
  const baseScreen = {
    kind: "today-command-center-screen",
    heading: "Today",
    state: displayState,
    layout: createLayout(viewport),
    controls: createControls(),
    actionPolicy: TODAY_ACTION_POLICY,
    actions: createActions(),
    tokens: {
      card: designTokens.components["card-base"],
      tableSurface: designTokens.components["feature-comparison-table"],
      row: designTokens.components["property-row"],
      badge: designTokens.components["badge-tag"],
      typeBadge: designTokens.components["badge-type"],
      filter: designTokens.components["search-pill"],
      secondaryAction: designTokens.components["button-secondary"]
    }
  };

  if (displayState === "loading") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "status",
        message: "Loading today."
      }
    };
  }

  if (displayState === "error") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: errorMessage ?? "Today could not load."
      },
      errorState: {
        title: "Today could not load",
        message: errorMessage ?? "Try again after the system summary API recovers."
      }
    };
  }

  if (displayState === "empty") {
    return {
      ...baseScreen,
      summary: createSummary(overview),
      systemHealth: createSystemHealth(overview),
      priorityLeads: createPriorityLeads(overview),
      agingClaimed: createAgingClaimed(overview),
      activeAlerts: createActiveAlerts(overview),
      failedJobs: createFailedJobs(overview),
      emptyState: {
        title: "Nothing urgent for today",
        message: "New high-score leads, aging owned work, active alerts, and failed jobs will appear here."
      }
    };
  }

  return {
    ...baseScreen,
    summary: createSummary(overview),
    systemHealth: createSystemHealth(overview),
    priorityLeads: createPriorityLeads(overview),
    agingClaimed: createAgingClaimed(overview),
    activeAlerts: createActiveAlerts(overview),
    failedJobs: createFailedJobs(overview)
  };
}

export function createSystemSummaryRequest() {
  return {
    method: "GET",
    path: "/api/system",
    readOnly: true
  };
}

function inferState(overview) {
  const hasWork =
    overview.priorityLeads.length > 0 ||
    overview.agingClaimed.length > 0 ||
    overview.activeAlerts.length > 0 ||
    overview.failedJobs.length > 0;

  return hasWork ? "ready" : "empty";
}

function createControls() {
  return CONTROL_DEFINITIONS.map(([name, label, type]) => ({
    name,
    label,
    type,
    ariaLabel: label,
    minTouchTarget: 44,
    token: type === "button" ? "button-secondary" : "search-pill"
  }));
}

function createLayout(viewport) {
  if (viewport === "mobile") {
    return {
      viewport,
      mode: "mobile-today-stack",
      regions: ["summary", "priority-leads", "aging-claimed", "alerts", "failed-jobs", "system-health"]
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-today-stack",
      regions: ["summary", "priority-leads", "aging-claimed", "alerts", "failed-jobs", "system-health"]
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-command-center",
    regions: ["summary", "priority-leads", "aging-claimed", "alerts", "failed-jobs", "system-health"]
  };
}

function createActions() {
  return [
    { label: "Open leads", href: "/leads", token: "button-secondary" },
    { label: "Open verification", href: "/verification", token: "button-secondary" },
    { label: "Open outreach", href: "/outreach", token: "button-secondary" },
    { label: "Open pipeline", href: "/pipeline", token: "button-secondary" },
    { label: "Open alerts", href: "/alerts", token: "button-secondary" }
  ];
}

function createSummary(overview) {
  return {
    generatedAt: formatDateTime(overview.generatedAt),
    items: [
      { label: "High-score new leads", value: String(overview.counts.highScoreNewLeads), href: "/leads" },
      { label: "Aging claimed leads", value: String(overview.counts.agingClaimedLeads), href: "/outreach" },
      { label: "Active alerts", value: String(overview.counts.activeAlerts), href: "/alerts" },
      { label: "Failed jobs", value: String(overview.counts.failedJobs), href: "/pipeline" },
      { label: "System health", value: overview.systemHealth.status, href: "/pipeline" }
    ]
  };
}

function createPriorityLeads(overview) {
  return {
    title: "High-score new leads",
    columns: ["Lead", "Score", "Owner", "Status", "Timing"],
    rows: overview.priorityLeads.map((lead) => ({
      id: lead.id,
      title: lead.title,
      score: String(lead.score),
      owner: lead.owner ?? "Unowned",
      status: lead.status,
      source: lead.source,
      timing: lead.timing,
      badges: [lead.status, lead.source],
      nextAction: { label: "Review lead", href: `/leads/${lead.id}` }
    }))
  };
}

function createAgingClaimed(overview) {
  return {
    title: "Aging claimed leads",
    columns: ["Lead", "Owner", "Age", "Next step"],
    rows: overview.agingClaimed.map((lead) => ({
      id: lead.id,
      title: lead.title,
      owner: lead.owner,
      age: `${lead.ageDays} days`,
      status: lead.status,
      nextStep: lead.nextStep,
      nextAction: { label: lead.nextStep, href: `/leads/${lead.id}` }
    }))
  };
}

function createActiveAlerts(overview) {
  return {
    title: "Active disruption alerts",
    rows: overview.activeAlerts.map((alert) => ({
      id: alert.id,
      property: alert.property,
      sps: String(alert.sps),
      state: alert.state,
      impact: alert.impact,
      href: "/alerts"
    }))
  };
}

function createFailedJobs(overview) {
  return {
    title: "Failed jobs",
    rows: overview.failedJobs.map((job) => ({
      id: job.id,
      collector: job.collector,
      status: job.status,
      failedAt: formatDateTime(job.failedAt),
      reason: job.reason,
      href: "/pipeline"
    }))
  };
}

function createSystemHealth(overview) {
  const health = overview.systemHealth;

  return {
    status: health.status,
    items: [
      { label: "API", value: health.api, state: stateForHealthValue(health.api) },
      { label: "Database", value: health.database, state: stateForHealthValue(health.database) },
      {
        label: "Collector freshness",
        value: health.collectorFreshness,
        state: stateForHealthValue(health.collectorFreshness)
      },
      {
        label: "LLM enrichment",
        value: health.llmEnrichment,
        state: stateForHealthValue(health.llmEnrichment)
      }
    ]
  };
}

function stateForHealthValue(value) {
  return value === "ok" ? "ok" : "warn";
}

function formatDateTime(value) {
  return value ? DATE_TIME_FORMATTER.format(new Date(value)) : "Not available";
}
