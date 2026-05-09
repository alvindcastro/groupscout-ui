import { appendDefinedQueryParams, assertLeadId, hasOwn, isBlankValue } from "./shared.js";
import { API_BASE_PATH } from "./transport.js";

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

export function createLeadApiMethods() {
  return {
    async listLeads(filters = {}) {
      const response = await this.request(buildLeadInboxPath(filters), {
        method: "GET"
      });

      return adaptLeadInboxResponse(response);
    },

    async getLead(leadId) {
      const response = await this.request(buildLeadDetailPath(leadId), {
        method: "GET"
      });

      return adaptLeadDetailResponse(response);
    },

    async patchLead(leadId, patch = {}) {
      return this.request(buildLeadPatchPath(leadId), {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(buildLeadPatchPayload(patch))
      });
    }
  };
}

function buildLeadInboxPath(filters) {
  const searchParams = new URLSearchParams();
  appendDefinedQueryParams(searchParams, {
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
  });

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/leads?${queryString}` : `${API_BASE_PATH}/leads`;
}

function buildLeadPatchPath(leadId) {
  assertLeadId(leadId);
  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}`;
}

function buildLeadDetailPath(leadId) {
  assertLeadId(leadId);
  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}`;
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
  const missingFields = requiredFields.filter(([field]) => isBlankValue(correction?.[field]));

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

function adaptLeadDetailResponse(response) {
  if (!response || !response.lead || typeof response.lead !== "object") {
    throw new Error("GET /api/leads/{id} response must include a lead object");
  }

  return {
    lead: adaptLeadDetail(response.lead)
  };
}

function adaptLeadDetail(lead) {
  const detail = {
    ...adaptLeadInboxItem(lead),
    sourceEvidence: {
      url: lead.source_url,
      name: lead.source_name,
      rawAuditPath: lead.raw_audit_path,
      collectedAt: lead.collected_at
    },
    aiEnrichment: {
      rationale: lead.ai?.rationale,
      uncertainty: lead.ai?.uncertainty,
      crewSize: lead.ai?.crew_size,
      durationDays: lead.ai?.duration_days,
      projectType: lead.ai?.project_type,
      evidenceRefs: lead.ai?.evidence_refs
    },
    reviewerCorrections: Array.isArray(lead.reviewer_corrections)
      ? lead.reviewer_corrections.map(adaptReviewerCorrection)
      : [],
    activity: Array.isArray(lead.activity) ? lead.activity : []
  };

  assertDefinedDetailFields(detail, [
    ["sourceEvidence.url", detail.sourceEvidence.url],
    ["sourceEvidence.name", detail.sourceEvidence.name],
    ["sourceEvidence.rawAuditPath", detail.sourceEvidence.rawAuditPath],
    ["sourceEvidence.collectedAt", detail.sourceEvidence.collectedAt],
    ["aiEnrichment.rationale", detail.aiEnrichment.rationale],
    ["aiEnrichment.uncertainty", detail.aiEnrichment.uncertainty],
    ["aiEnrichment.crewSize", detail.aiEnrichment.crewSize],
    ["aiEnrichment.durationDays", detail.aiEnrichment.durationDays],
    ["aiEnrichment.projectType", detail.aiEnrichment.projectType],
    ["aiEnrichment.evidenceRefs", detail.aiEnrichment.evidenceRefs]
  ]);

  if (!Array.isArray(detail.aiEnrichment.evidenceRefs)) {
    throw new Error("GET /api/leads/{id} response field aiEnrichment.evidenceRefs must be an array");
  }

  return detail;
}

function adaptReviewerCorrection(correction) {
  return {
    field: correction.field,
    correctedValue: correction.corrected_value,
    originalAiValue: correction.original_ai_value,
    originalSourceValue: correction.original_source_value,
    actor: correction.actor,
    reason: correction.reason
  };
}

function assertDefinedDetailFields(detail, fields) {
  for (const [name, value] of fields) {
    if (value === undefined) {
      throw new Error(`GET /api/leads/{id} response is missing required field: ${name}`);
    }
  }
}
