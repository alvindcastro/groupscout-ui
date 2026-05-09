import { assertLeadId } from "./shared.js";
import { API_BASE_PATH } from "./transport.js";

export function createRawAuditApiMethods() {
  return {
    async getLeadRawAudit(leadId) {
      const response = await this.request(buildLeadRawAuditPath(leadId), {
        method: "GET"
      });

      return adaptLeadRawAuditResponse(response);
    }
  };
}

function buildLeadRawAuditPath(leadId) {
  assertLeadId(leadId);
  return `${API_BASE_PATH}/leads/${encodeURIComponent(leadId)}/raw`;
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
