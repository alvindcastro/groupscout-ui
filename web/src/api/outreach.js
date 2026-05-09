import { assertLeadId, hasOwn, isBlankValue } from "./shared.js";
import { API_BASE_PATH } from "./transport.js";

export function createOutreachApiMethods() {
  return {
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
    }
  };
}

function buildLeadOutreachPath(leadId) {
  assertLeadId(leadId);
  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}/outreach`;
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
    isBlankValue(attempt?.[field])
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
