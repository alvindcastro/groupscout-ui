import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

const apiRun = {
  id: "run_20260508_001",
  status: "succeeded",
  requested_at: "2026-05-08T15:00:00Z",
  started_at: "2026-05-08T15:00:02Z",
  finished_at: "2026-05-08T15:01:10Z",
  result: "healthy",
  collector: {
    collected: 42,
    skipped: 5,
    enriched: 36,
    failures: ["permit_feed timeout"]
  },
  llm: {
    provider: "openai",
    latency_ms: 820,
    errors: 0
  },
  notifications: {
    slack_failures: 0,
    email_failures: 1,
    webhook_failures: 0
  },
  links: {
    logs: "https://logs.groupscout.test/runs/run_20260508_001",
    grafana: "https://grafana.groupscout.test/d/pipeline"
  }
};

test("pipeline client reads GET /api/pipeline/runs history and adapts compact health fields", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ runs: [apiRun], next_cursor: "cursor_2" });
    }
  });

  const history = await client.listPipelineRuns({ limit: 10, cursor: "cursor_1" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/pipeline/runs?limit=10&cursor=cursor_1");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(history, {
    runs: [
      {
        id: "run_20260508_001",
        status: "succeeded",
        requestedAt: "2026-05-08T15:00:00Z",
        startedAt: "2026-05-08T15:00:02Z",
        finishedAt: "2026-05-08T15:01:10Z",
        result: "healthy",
        collector: {
          collected: 42,
          skipped: 5,
          enriched: 36,
          failures: ["permit_feed timeout"]
        },
        llm: {
          provider: "openai",
          latencyMs: 820,
          errors: 0
        },
        notifications: {
          slackFailures: 0,
          emailFailures: 1,
          webhookFailures: 0
        },
        links: {
          logs: "https://logs.groupscout.test/runs/run_20260508_001",
          grafana: "https://grafana.groupscout.test/d/pipeline"
        }
      }
    ],
    nextCursor: "cursor_2"
  });
});

test("pipeline client starts POST /api/pipeline/runs asynchronously without polling for completion", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json(
        {
          id: "run_20260508_002",
          status: "queued",
          requested_at: "2026-05-08T16:00:00Z",
          links: { status: "/api/pipeline/runs/run_20260508_002" }
        },
        { status: 202 }
      );
    }
  });

  const run = await client.startPipelineRun({ reason: "manual_operator_run" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/pipeline/runs");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), { reason: "manual_operator_run" });
  assert.deepEqual(run, {
    id: "run_20260508_002",
    status: "queued",
    requestedAt: "2026-05-08T16:00:00Z",
    links: { status: "/api/pipeline/runs/run_20260508_002" },
    async: true
  });
});

test("pipeline client adapts omitted compact health sections to stable empty values", async () => {
  const client = createApiClient({
    fetchImpl: async () =>
      Response.json({
        runs: [
          {
            id: "run_20260508_004",
            status: "queued"
          }
        ]
      })
  });

  const history = await client.listPipelineRuns();

  assert.deepEqual(history.runs[0], {
    id: "run_20260508_004",
    status: "queued",
    requestedAt: null,
    startedAt: null,
    finishedAt: null,
    result: null,
    collector: {
      collected: null,
      skipped: null,
      enriched: null,
      failures: []
    },
    llm: {
      provider: null,
      latencyMs: null,
      errors: null
    },
    notifications: {
      slackFailures: null,
      emailFailures: null,
      webhookFailures: null
    },
    links: {}
  });
});

test("pipeline client default start payload keeps the manual reason and optional actor shape", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json(
        {
          id: "run_20260508_003",
          status: "queued",
          requested_at: "2026-05-08T17:00:00Z",
          links: { status: "/api/pipeline/runs/run_20260508_003" }
        },
        { status: 202 }
      );
    }
  });

  await client.startPipelineRun();
  await client.startPipelineRun({ actor: "sam.rivera@groupscout.test" });

  assert.equal(calls[0].url, "/api/pipeline/runs");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    reason: "manual_operator_run"
  });
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor: "sam.rivera@groupscout.test",
    reason: "manual_operator_run"
  });
});

test("pipeline client validates response shape and keeps browser endpoints under /api", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ runs: [{ status: "missing_id" }] })
  });

  await assert.rejects(() => client.listPipelineRuns(), /id/);

  const startClient = createApiClient({
    fetchImpl: async () => Response.json({ status: "queued" }, { status: 202 })
  });

  await assert.rejects(() => startClient.startPipelineRun(), /id/);
});
