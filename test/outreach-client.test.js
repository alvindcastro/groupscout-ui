import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

test("outreach client reads GET /api/leads/{id}/outreach activity history", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({
        lead_id: "lead_123",
        attempts: [
          {
            id: "outreach_1",
            channel: "email",
            contact: "manager@hotel.test",
            notes: "Shared crew block availability.",
            outcome: "contacted",
            created_at: "2026-05-08T15:30:00Z",
            actor: "sam.rivera@groupscout.test"
          }
        ]
      });
    }
  });

  const history = await client.listLeadOutreach("lead_123");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/leads/lead_123/outreach");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(history, {
    leadId: "lead_123",
    attempts: [
      {
        id: "outreach_1",
        channel: "email",
        contact: "manager@hotel.test",
        notes: "Shared crew block availability.",
        outcome: "contacted",
        createdAt: "2026-05-08T15:30:00Z",
        actor: "sam.rivera@groupscout.test"
      }
    ]
  });
});

test("outreach client logs POST /api/leads/{id}/outreach attempts without send behavior", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({
        id: "outreach_2",
        lead_id: "lead_123",
        channel: "phone",
        contact: "+1-555-0100",
        notes: "Reached the front desk and requested the manager.",
        outcome: "contacted",
        created_at: "2026-05-08T16:00:00Z",
        actor: "dana.lee@groupscout.test"
      });
    }
  });

  const attempt = await client.logLeadOutreach("lead_123", {
    channel: "phone",
    contact: "+1-555-0100",
    notes: "Reached the front desk and requested the manager.",
    outcome: "contacted"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/leads/lead_123/outreach");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    channel: "phone",
    contact: "+1-555-0100",
    notes: "Reached the front desk and requested the manager.",
    outcome: "contacted"
  });
  assert.equal(Object.hasOwn(JSON.parse(calls[0].init.body), "send"), false);
  assert.equal(Object.hasOwn(JSON.parse(calls[0].init.body), "auto_send"), false);
  assert.deepEqual(attempt, {
    id: "outreach_2",
    leadId: "lead_123",
    channel: "phone",
    contact: "+1-555-0100",
    notes: "Reached the front desk and requested the manager.",
    outcome: "contacted",
    createdAt: "2026-05-08T16:00:00Z",
    actor: "dana.lee@groupscout.test"
  });
});

test("outreach client encodes lead ids and preserves optional draft text in manual logs", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({
        id: "outreach_3",
        lead_id: "lead 123/a",
        channel: "email",
        contact: "manager@hotel.test",
        notes: "Manual follow-up logged.",
        outcome: "no_response",
        created_at: "2026-05-08T16:15:00Z",
        actor: "dana.lee@groupscout.test"
      });
    }
  });

  await client.logLeadOutreach("lead 123/a", {
    channel: "email",
    contact: "manager@hotel.test",
    notes: "Manual follow-up logged.",
    outcome: "no_response",
    draft: "Checking whether your team needs crews next week."
  });

  assert.equal(calls[0].url, "/api/leads/lead%20123%2Fa/outreach");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    channel: "email",
    contact: "manager@hotel.test",
    notes: "Manual follow-up logged.",
    outcome: "no_response",
    draft: "Checking whether your team needs crews next week."
  });
});

test("outreach client validates required manual logging fields", async () => {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    }
  });

  await assert.rejects(() => client.listLeadOutreach(""), /lead id/i);
  await assert.rejects(() => client.logLeadOutreach("", {}), /lead id/i);
  await assert.rejects(
    () =>
      client.logLeadOutreach("lead_123", {
        channel: "email",
        contact: "manager@hotel.test",
        outcome: "contacted"
      }),
    /notes/i
  );
  await assert.rejects(
    () =>
      client.logLeadOutreach("lead_123", {
        channel: "",
        contact: "manager@hotel.test",
        notes: "Manual follow-up logged.",
        outcome: "contacted"
      }),
    /channel/i
  );
  await assert.rejects(
    () =>
      client.logLeadOutreach("lead_123", {
        channel: "email",
        contact: "",
        notes: "Manual follow-up logged.",
        outcome: "contacted"
      }),
    /contact/i
  );
  await assert.rejects(
    () =>
      client.logLeadOutreach("lead_123", {
        channel: "email",
        contact: "manager@hotel.test",
        notes: "Manual follow-up logged.",
        outcome: "sent"
      }),
    /outcome/i
  );
});
