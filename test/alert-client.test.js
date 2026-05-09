import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

const apiAlert = {
  id: "alert_riverside_001",
  property: "Riverside Hotel",
  sps: 91,
  state: "active",
  impact: "38 rooms unavailable",
  updated_at: "2026-05-08T15:15:00Z",
  evidence: [
    {
      type: "weather",
      label: "Flood watch",
      value: "County flood watch overlaps Riverside Hotel district",
      source_url: "https://alerts.example.test/weather/flood-watch",
      observed_at: "2026-05-08T14:52:00Z"
    }
  ],
  room_inventory: {
    total: 140,
    unavailable: 38,
    available: 102,
    out_of_service: 11,
    updated_at: "2026-05-08T15:12:00Z"
  },
  action_history: [
    {
      actor: "alertd",
      action: "created",
      channel: "slack",
      note: "Posted disruption alert to #ops-alerts.",
      created_at: "2026-05-08T15:15:00Z"
    }
  ]
};

test("alert client reads GET /api/alerts and adapts read-only alert fields", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ alerts: [apiAlert], next_cursor: "cursor_2" });
    }
  });

  const response = await client.listAlerts({
    state: "active",
    property: "Riverside Hotel",
    limit: 20,
    cursor: "cursor_1"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/alerts?state=active&property=Riverside+Hotel&limit=20&cursor=cursor_1");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(response, {
    alerts: [
      {
        id: "alert_riverside_001",
        property: "Riverside Hotel",
        sps: 91,
        state: "active",
        impact: "38 rooms unavailable",
        updatedAt: "2026-05-08T15:15:00Z",
        evidence: [
          {
            type: "weather",
            label: "Flood watch",
            value: "County flood watch overlaps Riverside Hotel district",
            sourceUrl: "https://alerts.example.test/weather/flood-watch",
            observedAt: "2026-05-08T14:52:00Z"
          }
        ],
        roomInventory: {
          total: 140,
          unavailable: 38,
          available: 102,
          outOfService: 11,
          updatedAt: "2026-05-08T15:12:00Z"
        },
        actionHistory: [
          {
            actor: "alertd",
            action: "created",
            channel: "slack",
            note: "Posted disruption alert to #ops-alerts.",
            createdAt: "2026-05-08T15:15:00Z"
          }
        ]
      }
    ],
    nextCursor: "cursor_2",
    readOnly: true
  });
});

test("alert client validates alert response shape and does not expose mutations", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ alerts: [{ property: "Missing id" }] })
  });

  await assert.rejects(() => client.listAlerts(), /id/);

  const missingEvidenceClient = createApiClient({
    fetchImpl: async () => Response.json({ alerts: [{ ...apiAlert, evidence: undefined }] })
  });
  await assert.rejects(() => missingEvidenceClient.listAlerts(), /evidence/);

  const missingInventoryClient = createApiClient({
    fetchImpl: async () => Response.json({ alerts: [{ ...apiAlert, room_inventory: undefined }] })
  });
  await assert.rejects(() => missingInventoryClient.listAlerts(), /room_inventory/);

  const missingHistoryClient = createApiClient({
    fetchImpl: async () => Response.json({ alerts: [{ ...apiAlert, action_history: undefined }] })
  });
  await assert.rejects(() => missingHistoryClient.listAlerts(), /action_history/);

  assert.equal(client.createAlert, undefined);
  assert.equal(client.patchAlert, undefined);
  assert.equal(client.acknowledgeAlert, undefined);
});
