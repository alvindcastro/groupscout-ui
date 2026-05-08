import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_LEAD_INBOX_SORT,
  LEAD_INBOX_ITEM_FIELDS,
  createApiClient
} from "../web/src/api/client.js";

const apiLead = {
  id: "lead_123",
  score: 94,
  title: "Downtown hotel tower renovation",
  segment: "commercial",
  project_type: "renovation",
  location: "Austin, TX",
  property_fit: "hotel",
  source: "permit_feed",
  estimated_crew_size: 8,
  estimated_duration_days: 21,
  outreach_timing: "today",
  status: "new",
  owner: null,
  created_at: "2026-05-01T15:20:00Z",
  evidence_state: "source_linked",
  verification_state: "needs_review"
};

test("lead inbox client serializes GET /api/leads filters, pagination, and default priority sort", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ leads: [apiLead], next_cursor: "cursor_2" });
    }
  });

  await client.listLeads({
    q: "hotel retrofit",
    status: "new",
    source: "permit_feed",
    minScore: 80,
    createdFrom: "2026-05-01",
    createdTo: "2026-05-08",
    property: "hotel",
    owner: "unowned",
    verificationState: "needs_review",
    limit: 25,
    cursor: "cursor_1"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "GET");

  const url = new URL(calls[0].url, "https://groupscout.test");
  assert.equal(url.pathname, "/api/leads");
  assert.equal(url.searchParams.get("q"), "hotel retrofit");
  assert.equal(url.searchParams.get("status"), "new");
  assert.equal(url.searchParams.get("source"), "permit_feed");
  assert.equal(url.searchParams.get("min_score"), "80");
  assert.equal(url.searchParams.get("created_from"), "2026-05-01");
  assert.equal(url.searchParams.get("created_to"), "2026-05-08");
  assert.equal(url.searchParams.get("property"), "hotel");
  assert.equal(url.searchParams.get("owner"), "unowned");
  assert.equal(url.searchParams.get("verification_state"), "needs_review");
  assert.equal(url.searchParams.get("limit"), "25");
  assert.equal(url.searchParams.get("cursor"), "cursor_1");
  assert.equal(url.searchParams.get("sort"), DEFAULT_LEAD_INBOX_SORT.queryValue);
});

test("lead inbox contract represents urgent unowned high-score default ordering", () => {
  assert.equal(DEFAULT_LEAD_INBOX_SORT.queryValue, "priority");
  assert.deepEqual(DEFAULT_LEAD_INBOX_SORT.priority, [
    ["urgency", "desc"],
    ["owner", "unowned_first"],
    ["score", "desc"],
    ["created_at", "desc"]
  ]);
});

test("lead inbox response adapter exposes the fields needed by the future dense inbox table", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ leads: [apiLead], next_cursor: "cursor_2" })
  });

  const response = await client.listLeads();

  assert.deepEqual(LEAD_INBOX_ITEM_FIELDS, [
    "id",
    "score",
    "title",
    "segment",
    "projectType",
    "location",
    "propertyFit",
    "source",
    "estimatedCrewSize",
    "estimatedDurationDays",
    "outreachTiming",
    "status",
    "owner",
    "createdAt",
    "evidenceState",
    "verificationState"
  ]);
  assert.deepEqual(response, {
    leads: [
      {
        id: "lead_123",
        score: 94,
        title: "Downtown hotel tower renovation",
        segment: "commercial",
        projectType: "renovation",
        location: "Austin, TX",
        propertyFit: "hotel",
        source: "permit_feed",
        estimatedCrewSize: 8,
        estimatedDurationDays: 21,
        outreachTiming: "today",
        status: "new",
        owner: null,
        createdAt: "2026-05-01T15:20:00Z",
        evidenceState: "source_linked",
        verificationState: "needs_review"
      }
    ],
    nextCursor: "cursor_2",
    sort: DEFAULT_LEAD_INBOX_SORT
  });
});

test("lead inbox response adapter fails at the API boundary when required fields are missing", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ leads: [{ ...apiLead, score: undefined }] })
  });

  await assert.rejects(() => client.listLeads(), /score/);
});
