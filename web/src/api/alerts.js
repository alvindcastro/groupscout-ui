import { appendDefinedQueryParams } from "./shared.js";
import { API_BASE_PATH } from "./transport.js";

export function createAlertsApiMethods() {
  return {
    async listAlerts(filters = {}) {
      const response = await this.request(buildAlertsPath(filters), {
        method: "GET"
      });

      return adaptAlertsResponse(response);
    }
  };
}

function buildAlertsPath(filters) {
  const searchParams = new URLSearchParams();
  appendDefinedQueryParams(searchParams, {
    state: filters.state,
    property: filters.property,
    limit: filters.limit,
    cursor: filters.cursor
  });

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/alerts?${queryString}` : `${API_BASE_PATH}/alerts`;
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
