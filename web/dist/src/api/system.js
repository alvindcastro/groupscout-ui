import { API_BASE_PATH } from "./transport.js";

export function createSystemApiMethods() {
  return {
    async getSystem() {
      const response = await this.request(`${API_BASE_PATH}/system`, {
        method: "GET"
      });

      return adaptSystemResponse(response);
    }
  };
}

function adaptSystemResponse(response) {
  if (!response || typeof response.generated_at !== "string") {
    throw new Error("GET /api/system response must include generated_at");
  }

  if (!response.health || typeof response.health !== "object") {
    throw new Error("GET /api/system response must include health");
  }

  if (!response.pipeline || typeof response.pipeline !== "object") {
    throw new Error("GET /api/system response must include pipeline");
  }

  if (!response.counts || typeof response.counts !== "object") {
    throw new Error("GET /api/system response must include counts");
  }

  return {
    generatedAt: response.generated_at,
    health: {
      status: response.health.status,
      api: response.health.api,
      database: response.health.database,
      collectorFreshness: response.health.collector_freshness,
      llmEnrichment: response.health.llm_enrichment
    },
    pipeline: {
      lastRunAt: response.pipeline.last_run_at,
      lastResult: response.pipeline.last_result,
      failedJobs: response.pipeline.failed_jobs
    },
    counts: {
      highScoreNewLeads: response.counts.high_score_new_leads,
      agingClaimedLeads: response.counts.aging_claimed_leads,
      activeAlerts: response.counts.active_alerts,
      failedJobs: response.counts.failed_jobs,
      verificationQueue: response.counts.verification_queue,
      outreachDue: response.counts.outreach_due
    },
    readOnly: true
  };
}
