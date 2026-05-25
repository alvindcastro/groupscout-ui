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

const apiLeadDetail = {
  id: "lead_123",
  status: "new",
  summary: {
    title: "Downtown hotel tower renovation",
    score: 94,
    timing: "today",
    room_night_signal: "210 room nights",
    property_fit: "hotel"
  },
  source_evidence: {
    source_name: "Austin permit feed",
    source_url: "https://permits.example.test/austin/123",
    raw_audit_href: "/api/leads/lead_123/raw",
    collected_at: "2026-05-01T15:20:00Z"
  },
  ai_enrichment: {
    rationale: "Permit scope includes occupied hotel floor renovation.",
    uncertainty: {
      level: "medium",
      reason: "Crew duration is inferred from permit scope."
    },
    claims: [
      {
        field: "Project type",
        value: "renovation"
      },
      {
        field: "Crew size",
        value: "8",
        reviewer_correction: "8-10"
      }
    ]
  },
  actions: ["Claim lead", "Dismiss"],
  outreach: {
    recommended_timing: "Call today before 4 PM local time.",
    contact: {
      channel: "email",
      value: "manager@example.test"
    },
    draft: "Can GroupScout help reserve rooms for your renovation crew?",
    attempts: [
      {
        channel: "email",
        label: "Draft copied",
        contact: "manager@example.test",
        notes: "Operator copied the draft.",
        outcome: "contacted",
        timestamp: "2026-05-01T16:00:00Z"
      }
    ]
  },
  activity: [
    {
      type: "status_history",
      label: "Lead created",
      detail: "New lead created from permit ingestion.",
      timestamp: "2026-05-01T15:20:00Z"
    }
  ]
};

test("lead detail client serializes GET /api/leads/{id} with encoded lead ids", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json(apiLeadDetail);
    }
  });

  await client.getLead("lead 123/a");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/leads/lead%20123%2Fa");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
});

test("lead detail client adapts source evidence, AI enrichment, outreach, and activity sections", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json(apiLeadDetail)
  });

  const detail = await client.getLead("lead_123");

  assert.deepEqual(detail, {
    id: "lead_123",
    status: "new",
    summary: {
      title: "Downtown hotel tower renovation",
      score: 94,
      timing: "today",
      roomNightSignal: "210 room nights",
      propertyFit: "hotel"
    },
    sourceEvidence: {
      sourceName: "Austin permit feed",
      sourceUrl: "https://permits.example.test/austin/123",
      rawAuditHref: "/api/leads/lead_123/raw",
      collectedAt: "2026-05-01T15:20:00Z"
    },
    aiEnrichment: {
      rationale: "Permit scope includes occupied hotel floor renovation.",
      uncertainty: {
        level: "medium",
        reason: "Crew duration is inferred from permit scope."
      },
      claims: [
        {
          field: "Project type",
          value: "renovation",
          reviewerCorrection: undefined
        },
        {
          field: "Crew size",
          value: "8",
          reviewerCorrection: "8-10"
        }
      ]
    },
    actions: ["Claim lead", "Dismiss"],
    outreach: {
      recommendedTiming: "Call today before 4 PM local time.",
      contact: {
        channel: "email",
        value: "manager@example.test"
      },
      draft: "Can GroupScout help reserve rooms for your renovation crew?",
      attempts: [
        {
          channel: "email",
          label: "Draft copied",
          contact: "manager@example.test",
          notes: "Operator copied the draft.",
          outcome: "contacted",
          timestamp: "2026-05-01T16:00:00Z"
        }
      ]
    },
    activity: [
      {
        type: "status_history",
        label: "Lead created",
        detail: "New lead created from permit ingestion.",
        timestamp: "2026-05-01T15:20:00Z"
      }
    ]
  });
});

test("lead detail client fails at the API boundary when required sections are missing", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ ...apiLeadDetail, source_evidence: undefined })
  });

  await assert.rejects(() => client.getLead("lead_123"), /source_evidence/);
  await assert.rejects(() => client.getLead(""), /lead id/i);
});

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

test("lead inbox client omits blank filters and preserves explicit sort overrides", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ leads: [apiLead] });
    }
  });

  await client.listLeads({
    q: "",
    status: null,
    source: undefined,
    minScore: "",
    owner: "dana",
    sort: "created_at_desc"
  });

  const url = new URL(calls[0].url, "https://groupscout.test");
  assert.equal(url.pathname, "/api/leads");
  assert.equal(url.searchParams.has("q"), false);
  assert.equal(url.searchParams.has("status"), false);
  assert.equal(url.searchParams.has("source"), false);
  assert.equal(url.searchParams.has("min_score"), false);
  assert.equal(url.searchParams.get("owner"), "dana");
  assert.equal(url.searchParams.get("sort"), "created_at_desc");
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
