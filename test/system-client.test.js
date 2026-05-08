import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

const apiSystemSummary = {
  generated_at: "2026-05-08T16:30:00Z",
  health: {
    status: "degraded",
    api: "ok",
    database: "ok",
    collector_freshness: "stale",
    llm_enrichment: "degraded"
  },
  pipeline: {
    last_run_at: "2026-05-08T15:30:00Z",
    last_result: "failed",
    failed_jobs: 1
  },
  counts: {
    high_score_new_leads: 3,
    aging_claimed_leads: 2,
    active_alerts: 2,
    failed_jobs: 1,
    verification_queue: 4,
    outreach_due: 3
  }
};

test("system client reads GET /api/system and adapts UI-friendly health fields", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json(apiSystemSummary);
    }
  });

  const response = await client.getSystem();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/system");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(response, {
    generatedAt: "2026-05-08T16:30:00Z",
    health: {
      status: "degraded",
      api: "ok",
      database: "ok",
      collectorFreshness: "stale",
      llmEnrichment: "degraded"
    },
    pipeline: {
      lastRunAt: "2026-05-08T15:30:00Z",
      lastResult: "failed",
      failedJobs: 1
    },
    counts: {
      highScoreNewLeads: 3,
      agingClaimedLeads: 2,
      activeAlerts: 2,
      failedJobs: 1,
      verificationQueue: 4,
      outreachDue: 3
    },
    readOnly: true
  });
});

test("system client validates response shape and does not expose system mutations", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ generated_at: "2026-05-08T16:30:00Z" })
  });

  await assert.rejects(() => client.getSystem(), /health/);
  assert.equal(client.patchSystem, undefined);
  assert.equal(client.restartSystem, undefined);
  assert.equal(client.updateSettings, undefined);
});
