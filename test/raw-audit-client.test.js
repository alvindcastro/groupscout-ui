import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

test("raw audit client reads through GET /api/leads/{id}/raw", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({
        lead_id: "lead_123",
        redaction: "blocked_until_policy_defined",
        payload: null
      });
    }
  });

  const raw = await client.getLeadRawAudit("lead_123");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/leads/lead_123/raw");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(raw, {
    leadId: "lead_123",
    redaction: "blocked_until_policy_defined",
    payload: null
  });
});

test("raw audit client rejects legacy or direct raw endpoints", async () => {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    }
  });

  await assert.rejects(() => client.getLeadRawAudit(""), /lead id/i);
  await assert.rejects(
    () => client.request("/internal/audit/raw/lead_123", { method: "GET" }),
    /\/api boundary/i
  );
  await assert.rejects(
    () => client.request("https://api.groupscout.test/leads/lead_123/raw"),
    /same-origin/i
  );
});
