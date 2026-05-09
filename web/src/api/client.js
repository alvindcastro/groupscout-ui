import { createAlertsApiMethods } from "./alerts.js";
import { createAuthApiMethods } from "./auth.js";
import { createLeadApiMethods, DEFAULT_LEAD_INBOX_SORT, LEAD_INBOX_ITEM_FIELDS } from "./leads.js";
import { createOutreachApiMethods } from "./outreach.js";
import { createPipelineApiMethods } from "./pipeline.js";
import { createRawAuditApiMethods } from "./rawAudit.js";
import { createStatsApiMethods } from "./stats.js";
import { createSystemApiMethods } from "./system.js";
import { API_BASE_PATH, createRequest } from "./transport.js";

export { API_BASE_PATH, DEFAULT_LEAD_INBOX_SORT, LEAD_INBOX_ITEM_FIELDS };

export function createApiClient({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("createApiClient requires a fetch implementation");
  }

  return {
    ...createAuthApiMethods(),
    ...createLeadApiMethods(),
    ...createRawAuditApiMethods(),
    ...createOutreachApiMethods(),
    ...createPipelineApiMethods(),
    ...createStatsApiMethods(),
    ...createAlertsApiMethods(),
    ...createSystemApiMethods(),
    request: createRequest(fetchImpl)
  };
}
