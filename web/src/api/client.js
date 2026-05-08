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
