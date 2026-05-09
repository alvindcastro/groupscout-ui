import { appendDefinedQueryParams } from "./shared.js";
import { API_BASE_PATH } from "./transport.js";

const STATS_HIT_RATE_DEFINITION = {
  label: "Won leads / total source leads",
  numeratorStatuses: ["won"],
  denominator: "All leads from the source collected in the selected date range",
  excludedFromNumerator: ["claimed", "contacted", "lost", "no_response", "dismissed"]
};

export function createStatsApiMethods() {
  return {
    async getStats(filters = {}) {
      const response = await this.request(buildStatsPath(filters), {
        method: "GET"
      });

      return adaptStatsResponse(response);
    }
  };
}

function buildStatsPath(filters) {
  const searchParams = new URLSearchParams();
  appendDefinedQueryParams(searchParams, {
    from: filters.from,
    to: filters.to,
    segment: filters.segment,
    property: filters.property
  });

  let queryString = searchParams.toString();
  return queryString ? `${API_BASE_PATH}/stats?${queryString}` : `${API_BASE_PATH}/stats`;
}

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
