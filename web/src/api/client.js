export const API_BASE_PATH = "/api";

export const DEFAULT_LEAD_INBOX_SORT = {
  queryValue: "priority",
  priority: [
    ["urgency", "desc"],
    ["owner", "unowned_first"],
    ["score", "desc"],
    ["created_at", "desc"]
  ]
};

export const LEAD_INBOX_ITEM_FIELDS = [
  "id",
  "score",
  "title",
  "segment",
  "projectType",
  "location",
  "propertyFit",
  "source",
  "estimatedCrewSize",
  "estimatedDurationDays",
  "outreachTiming",
  "status",
  "owner",
  "createdAt",
  "evidenceState",
  "verificationState"
];

export function createApiClient({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("createApiClient requires a fetch implementation");
  }

  return {
    async listLeads(filters = {}) {
      const response = await this.request(buildLeadInboxPath(filters), {
        method: "GET"
      });

      return adaptLeadInboxResponse(response);
    },

    async patchLead(leadId, patch = {}) {
      return this.request(buildLeadPatchPath(leadId), {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(buildLeadPatchPayload(patch))
      });
    },

    async getLeadRawAudit(leadId) {
      const response = await this.request(buildLeadRawAuditPath(leadId), {
        method: "GET"
      });

      return adaptLeadRawAuditResponse(response);
    },

    async listLeadOutreach(leadId) {
      const response = await this.request(buildLeadOutreachPath(leadId), {
        method: "GET"
      });

      return adaptLeadOutreachHistoryResponse(response);
    },

    async logLeadOutreach(leadId, attempt = {}) {
      const response = await this.request(buildLeadOutreachPath(leadId), {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(buildLeadOutreachPayload(attempt))
      });

      return adaptLeadOutreachAttempt(response);
    },

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
    },

    async getStats(filters = {}) {
      const response = await this.request(buildStatsPath(filters), {
        method: "GET"
      });

      return adaptStatsResponse(response);
    },

    async listAlerts(filters = {}) {
      const response = await this.request(buildAlertsPath(filters), {
        method: "GET"
      });

      return adaptAlertsResponse(response);
    },

    async request(path, init = {}) {
      assertSameOriginApiPath(path);

      const response = await fetchImpl(path, {
        ...init,
        credentials: "same-origin",
        headers: {
          accept: "application/json",
          ...init.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      let contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return undefined;
      }

      return response.json();
    }
  };
}

function buildLeadInboxPath(filters) {
  const searchParams = new URLSearchParams();
  const query = {
    q: filters.q,
    status: filters.status,
    source: filters.source,
    min_score: filters.minScore,
    created_from: filters.createdFrom,
    created_to: filters.createdTo,
    property: filters.property,
    owner: filters.owner,
    verification_state: filters.verificationState,
    limit: filters.limit,
    cursor: filters.cursor,
    sort: filters.sort ?? DEFAULT_LEAD_INBOX_SORT.queryValue
  };

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/leads?${queryString}` : `${API_BASE_PATH}/leads`;
}

function buildLeadPatchPath(leadId) {
  if (typeof leadId !== "string" || leadId.length === 0) {
    throw new TypeError("Lead id must be a non-empty string");
  }

  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}`;
}

function buildLeadRawAuditPath(leadId) {
  if (typeof leadId !== "string" || leadId.length === 0) {
    throw new TypeError("Lead id must be a non-empty string");
  }

  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}/raw`;
}

function buildLeadOutreachPath(leadId) {
  if (typeof leadId !== "string" || leadId.length === 0) {
    throw new TypeError("Lead id must be a non-empty string");
  }

  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}/outreach`;
}

function buildPipelineRunsPath(filters) {
  const searchParams = new URLSearchParams();
  const query = {
    limit: filters.limit,
    cursor: filters.cursor
  };

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/pipeline/runs?${queryString}` : `${API_BASE_PATH}/pipeline/runs`;
}

function buildStatsPath(filters) {
  const searchParams = new URLSearchParams();
  const query = {
    from: filters.from,
    to: filters.to,
    segment: filters.segment,
    property: filters.property
  };

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/stats?${queryString}` : `${API_BASE_PATH}/stats`;
}

function buildAlertsPath(filters) {
  const searchParams = new URLSearchParams();
  const query = {
    state: filters.state,
    property: filters.property,
    limit: filters.limit,
    cursor: filters.cursor
  };

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/alerts?${queryString}` : `${API_BASE_PATH}/alerts`;
}

function buildLeadPatchPayload(patch) {
  const payload = {};
  const fields = [
    ["status", "status"],
    ["owner", "owner"],
    ["notes", "notes"],
    ["snoozeDate", "snooze_date"],
    ["correctionReason", "correction_reason"]
  ];

  for (const [clientField, apiField] of fields) {
    if (hasOwn(patch, clientField) && patch[clientField] !== undefined) {
      payload[apiField] = patch[clientField];
    }
  }

  if (hasOwn(patch, "corrections") && patch.corrections !== undefined) {
    if (!Array.isArray(patch.corrections)) {
      throw new TypeError("Lead corrections must be an array");
    }

    payload.corrections = patch.corrections.map(normalizeLeadCorrection);
  }

  return payload;
}

function normalizeLeadCorrection(correction) {
  const requiredFields = [
    ["field", "field"],
    ["correctedValue", "corrected value"],
    ["originalAiValue", "original AI value"],
    ["originalSourceValue", "original source value"],
    ["actor", "actor"],
    ["reason", "reason"]
  ];
  const missingFields = requiredFields.filter(([field]) => isBlankCorrectionValue(correction?.[field]));

  if (missingFields.length > 0) {
    const names = missingFields.map(([, name]) => name).join(", ");
    throw new Error(`Lead correction requires ${names}`);
  }

  return {
    field: toApiFieldName(correction.field),
    corrected_value: correction.correctedValue,
    original_ai_value: correction.originalAiValue,
    original_source_value: correction.originalSourceValue,
    actor: correction.actor,
    reason: correction.reason
  };
}

function buildLeadOutreachPayload(attempt) {
  const payload = {};
  const fields = [
    ["channel", "channel"],
    ["contact", "contact"],
    ["notes", "notes"],
    ["outcome", "outcome"],
    ["draft", "draft"]
  ];
  const missingFields = ["channel", "contact", "notes", "outcome"].filter((field) =>
    isBlankCorrectionValue(attempt?.[field])
  );

  if (missingFields.length > 0) {
    throw new Error(`Outreach attempt requires ${missingFields.join(", ")}`);
  }

  if (!["contacted", "won", "lost", "no_response"].includes(attempt.outcome)) {
    throw new Error("Outreach outcome must be contacted, won, lost, or no_response");
  }

  for (const [clientField, apiField] of fields) {
    if (hasOwn(attempt, clientField) && attempt[clientField] !== undefined) {
      payload[apiField] = attempt[clientField];
    }
  }

  return payload;
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

function isBlankCorrectionValue(value) {
  return value === undefined || value === null || value === "";
}

function toApiFieldName(field) {
  if (typeof field !== "string" || field.length === 0) {
    throw new TypeError("Correction field must be a non-empty string");
  }

  return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function adaptLeadInboxResponse(response) {
  if (!response || !Array.isArray(response.leads)) {
    throw new Error("GET /api/leads response must include a leads array");
  }

  return {
    leads: response.leads.map(adaptLeadInboxItem),
    nextCursor: response.next_cursor ?? null,
    sort: DEFAULT_LEAD_INBOX_SORT
  };
}

function adaptLeadInboxItem(lead) {
  const item = {
    id: lead.id,
    score: lead.score,
    title: lead.title,
    segment: lead.segment,
    projectType: lead.project_type,
    location: lead.location,
    propertyFit: lead.property_fit,
    source: lead.source,
    estimatedCrewSize: lead.estimated_crew_size,
    estimatedDurationDays: lead.estimated_duration_days,
    outreachTiming: lead.outreach_timing,
    status: lead.status,
    owner: lead.owner,
    createdAt: lead.created_at,
    evidenceState: lead.evidence_state,
    verificationState: lead.verification_state
  };

  for (const field of LEAD_INBOX_ITEM_FIELDS) {
    if (item[field] === undefined) {
      throw new Error(`GET /api/leads item is missing required field: ${field}`);
    }
  }

  return item;
}

function adaptLeadRawAuditResponse(response) {
  if (!response || typeof response.lead_id !== "string") {
    throw new Error("GET /api/leads/{id}/raw response must include lead_id");
  }

  return {
    leadId: response.lead_id,
    redaction: response.redaction ?? null,
    payload: response.payload ?? null
  };
}

function adaptLeadOutreachHistoryResponse(response) {
  if (!response || typeof response.lead_id !== "string" || !Array.isArray(response.attempts)) {
    throw new Error("GET /api/leads/{id}/outreach response must include lead_id and attempts");
  }

  return {
    leadId: response.lead_id,
    attempts: response.attempts.map(adaptLeadOutreachAttempt)
  };
}

function adaptLeadOutreachAttempt(attempt) {
  if (!attempt || typeof attempt.id !== "string") {
    throw new Error("Outreach attempt response must include id");
  }

  const adapted = {
    id: attempt.id,
    channel: attempt.channel,
    contact: attempt.contact,
    notes: attempt.notes,
    outcome: attempt.outcome,
    createdAt: attempt.created_at,
    actor: attempt.actor
  };

  if (attempt.lead_id !== undefined) {
    adapted.leadId = attempt.lead_id;
  }

  return adapted;
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

  const adapted = {
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

  return adapted;
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

const STATS_HIT_RATE_DEFINITION = {
  label: "Won leads / total source leads",
  numeratorStatuses: ["won"],
  denominator: "All leads from the source collected in the selected date range",
  excludedFromNumerator: ["claimed", "contacted", "lost", "no_response", "dismissed"]
};

function adaptStatsResponse(response) {
  if (!response || typeof response.date_range !== "object" || response.date_range === null) {
    throw new Error("GET /api/stats response must include date_range");
  }

  if (!response.denominator || typeof response.denominator.total !== "number") {
    throw new Error("GET /api/stats response must include denominator total");
  }

  if (!response.summaries || typeof response.summaries !== "object") {
    throw new Error("GET /api/stats response must include summaries");
  }

  return {
    dateRange: {
      from: response.date_range.from,
      to: response.date_range.to,
      label: response.date_range.label
    },
    denominator: {
      label: response.denominator.label,
      total: response.denominator.total
    },
    summaries: {
      status: adaptStatsItems(response.summaries.status, "summaries.status"),
      source: adaptStatsItems(response.summaries.source, "summaries.source"),
      scoreBand: adaptStatsItems(response.summaries.score_band, "summaries.score_band"),
      owner: adaptStatsItems(response.summaries.owner, "summaries.owner"),
      week: adaptStatsItems(response.summaries.week, "summaries.week")
    },
    sourceYield: adaptSourceYield(response.source_yield),
    leadAging: adaptStatsItems(response.lead_aging, "lead_aging", "bucket"),
    verificationQuality: adaptVerificationQuality(response.verification_quality),
    demand: adaptDemand(response.demand),
    hitRateDefinition: STATS_HIT_RATE_DEFINITION
  };
}

function adaptStatsItems(items, sectionName, keyField = "key") {
  if (!Array.isArray(items)) {
    throw new Error(`GET /api/stats response must include ${sectionName}`);
  }

  return items.map((item) => ({
    key: item[keyField],
    label: item.label,
    count: item.count
  }));
}

function adaptSourceYield(items) {
  if (!Array.isArray(items)) {
    throw new Error("GET /api/stats response must include source_yield");
  }

  return items.map((item) => ({
    source: item.source,
    total: item.total,
    claimed: item.claimed,
    won: item.won,
    lost: item.lost,
    noResponse: item.no_response
  }));
}

function adaptVerificationQuality(items) {
  if (!Array.isArray(items)) {
    throw new Error("GET /api/stats response must include verification_quality");
  }

  return items.map((item) => ({
    key: item.key,
    label: item.label,
    count: item.count,
    denominator: item.denominator
  }));
}

function adaptDemand(items) {
  if (!Array.isArray(items)) {
    throw new Error("GET /api/stats response must include demand");
  }

  return items.map((item) => ({
    weekStart: item.week_start,
    segment: item.segment,
    property: item.property,
    leadCount: item.lead_count,
    estimatedRoomNights: item.estimated_room_nights
  }));
}

function adaptAlertsResponse(response) {
  if (!response || !Array.isArray(response.alerts)) {
    throw new Error("GET /api/alerts response must include an alerts array");
  }

  return {
    alerts: response.alerts.map(adaptAlert),
    nextCursor: response.next_cursor ?? null,
    readOnly: true
  };
}

function adaptAlert(alert) {
  if (!alert || typeof alert.id !== "string" || alert.id.length === 0) {
    throw new Error("Alert response must include id");
  }

  return {
    id: alert.id,
    property: alert.property,
    sps: alert.sps,
    state: alert.state,
    impact: alert.impact,
    updatedAt: alert.updated_at,
    evidence: adaptAlertEvidence(alert.evidence),
    roomInventory: adaptRoomInventory(alert.room_inventory),
    actionHistory: adaptAlertActionHistory(alert.action_history)
  };
}

function adaptAlertEvidence(evidence) {
  if (!Array.isArray(evidence)) {
    throw new Error("Alert response must include evidence");
  }

  return evidence.map((item) => ({
    type: item.type,
    label: item.label,
    value: item.value,
    sourceUrl: item.source_url,
    observedAt: item.observed_at
  }));
}

function adaptRoomInventory(inventory) {
  if (!inventory || typeof inventory !== "object") {
    throw new Error("Alert response must include room_inventory");
  }

  return {
    total: inventory.total,
    unavailable: inventory.unavailable,
    available: inventory.available,
    outOfService: inventory.out_of_service,
    updatedAt: inventory.updated_at
  };
}

function adaptAlertActionHistory(history) {
  if (!Array.isArray(history)) {
    throw new Error("Alert response must include action_history");
  }

  return history.map((item) => ({
    actor: item.actor,
    action: item.action,
    channel: item.channel,
    note: item.note,
    createdAt: item.created_at
  }));
}

function assertSameOriginApiPath(path) {
  if (typeof path !== "string" || path.length === 0) {
    throw new TypeError("API path must be a non-empty string");
  }

  if (/^https?:\/\//i.test(path)) {
    throw new Error("Browser API requests must stay same-origin");
  }

  if (!path.startsWith(`${API_BASE_PATH}/`)) {
    throw new Error("Browser API requests must use the /api boundary");
  }
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}
