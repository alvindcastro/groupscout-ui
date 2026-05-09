import { appendDefinedQueryParams, hasOwn } from "./shared.js";
import { API_BASE_PATH } from "./transport.js";

export function createPipelineApiMethods() {
  return {
    async listPipelineRuns(filters = {}) {
      const response = await this.request(buildPipelineRunsPath(filters), {
        method: "GET"
      });

      return adaptPipelineRunsResponse(response);
    },

    async startPipelineRun(request = {}) {
      const response = await this.request(`${API_BASE_PATH}/pipeline/runs`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(buildPipelineRunPayload(request))
      });

      return adaptStartedPipelineRun(response);
    }
  };
}

function buildPipelineRunsPath(filters) {
  const searchParams = new URLSearchParams();
  appendDefinedQueryParams(searchParams, {
    limit: filters.limit,
    cursor: filters.cursor
  });

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/pipeline/runs?${queryString}` : `${API_BASE_PATH}/pipeline/runs`;
}

function buildPipelineRunPayload(request) {
  const payload = {};
  const fields = [
    ["reason", "reason"],
    ["actor", "actor"]
  ];

  for (const [clientField, apiField] of fields) {
    if (hasOwn(request, clientField) && request[clientField] !== undefined) {
      payload[apiField] = request[clientField];
    }
  }

  if (!hasOwn(payload, "reason")) {
    payload.reason = "manual_operator_run";
  }

  return payload;
}

function adaptPipelineRunsResponse(response) {
  if (!response || !Array.isArray(response.runs)) {
    throw new Error("GET /api/pipeline/runs response must include a runs array");
  }

  return {
    runs: response.runs.map(adaptPipelineRun),
    nextCursor: response.next_cursor ?? null
  };
}

function adaptStartedPipelineRun(run) {
  const adapted = adaptPipelineRun(run);

  return {
    id: adapted.id,
    status: adapted.status,
    requestedAt: adapted.requestedAt,
    links: adapted.links,
    async: true
  };
}

function adaptPipelineRun(run) {
  if (!run || typeof run.id !== "string" || run.id.length === 0) {
    throw new Error("Pipeline run response must include id");
  }

  if (typeof run.status !== "string" || run.status.length === 0) {
    throw new Error("Pipeline run response must include status");
  }

  return {
    id: run.id,
    status: run.status,
    requestedAt: run.requested_at ?? null,
    startedAt: run.started_at ?? null,
    finishedAt: run.finished_at ?? null,
    result: run.result ?? null,
    collector: adaptPipelineCollector(run.collector),
    llm: adaptPipelineLlm(run.llm),
    notifications: adaptPipelineNotifications(run.notifications),
    links: run.links ?? {}
  };
}

function adaptPipelineCollector(collector = {}) {
  return {
    collected: collector?.collected ?? null,
    skipped: collector?.skipped ?? null,
    enriched: collector?.enriched ?? null,
    failures: Array.isArray(collector?.failures) ? collector.failures : []
  };
}

function adaptPipelineLlm(llm = {}) {
  return {
    provider: llm?.provider ?? null,
    latencyMs: llm?.latency_ms ?? null,
    errors: llm?.errors ?? null
  };
}

function adaptPipelineNotifications(notifications = {}) {
  return {
    slackFailures: notifications?.slack_failures ?? null,
    emailFailures: notifications?.email_failures ?? null,
    webhookFailures: notifications?.webhook_failures ?? null
  };
}
