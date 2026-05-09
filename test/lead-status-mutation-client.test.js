import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

test("lead status mutation client serializes PATCH /api/leads/{id} status owner notes and snooze date", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ ok: true });
    }
  });

  await client.patchLead("lead_123", {
    status: "snoozed",
    owner: "Sam Rivera",
    notes: "Owner is waiting for the property manager to confirm timing.",
    snoozeDate: "2026-05-15"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/leads/lead_123");
  assert.equal(calls[0].init.method, "PATCH");
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    status: "snoozed",
    owner: "Sam Rivera",
    notes: "Owner is waiting for the property manager to confirm timing.",
    snooze_date: "2026-05-15"
  });
});

test("lead correction mutation preserves original AI and source values with actor and reason", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ ok: true });
    }
  });

  await client.patchLead("lead_123", {
    correctionReason: "Reviewer confirmed the source-backed crew estimate.",
    corrections: [
      {
        field: "estimatedCrewSize",
        correctedValue: 12,
        originalAiValue: 8,
        originalSourceValue: "Permit scope lists two hotel wings and night work.",
        actor: "sam.rivera@groupscout.test",
        reason: "Reviewer confirmed the permit scope is larger than the AI extraction."
      }
    ]
  });

  const payload = JSON.parse(calls[0].init.body);

  assert.equal(Object.hasOwn(payload, "estimated_crew_size"), false);
  assert.deepEqual(payload, {
    correction_reason: "Reviewer confirmed the source-backed crew estimate.",
    corrections: [
      {
        field: "estimated_crew_size",
        corrected_value: 12,
        original_ai_value: 8,
        original_source_value: "Permit scope lists two hotel wings and night work.",
        actor: "sam.rivera@groupscout.test",
        reason: "Reviewer confirmed the permit scope is larger than the AI extraction."
      }
    ]
  });
});

test("lead mutation client encodes lead ids and preserves nullable payload intent", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ ok: true });
    }
  });

  await client.patchLead("lead 123/a", {
    status: undefined,
    owner: null,
    notes: "Owner cleared for reassignment."
  });

  assert.equal(calls[0].url, "/api/leads/lead%20123%2Fa");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    owner: null,
    notes: "Owner cleared for reassignment."
  });
});

test("lead correction mutation requires audit actor, reason, and original values", async () => {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    }
  });

  await assert.rejects(
    () =>
      client.patchLead("lead_123", {
        corrections: [
          {
            field: "projectType",
            correctedValue: "renovation",
            originalAiValue: "new_build"
          }
        ]
      }),
    /correction.*original source value.*actor.*reason/i
  );
  await assert.rejects(
    () => client.patchLead("lead_123", { corrections: { field: "projectType" } }),
    /corrections must be an array/i
  );
  await assert.rejects(
    () =>
      client.patchLead("lead_123", {
        corrections: [
          {
            field: "",
            correctedValue: "renovation",
            originalAiValue: "new_build",
            originalSourceValue: "Permit says renovation.",
            actor: "sam.rivera@groupscout.test",
            reason: "Reviewed source evidence."
          }
        ]
      }),
    /field/i
  );
});
