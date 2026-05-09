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

test("lead detail client serializes GET /api/leads/{id} and adapts evidence workspace fields", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json({
        lead: {
          ...apiLead,
          source_url: "https://permits.example/lead_123",
          source_name: "Austin permit feed",
          raw_audit_path: "/api/leads/lead_123/raw",
          collected_at: "2026-05-01T15:00:00Z",
          ai: {
            rationale: "Permit text requests a multi-week crew block.",
            uncertainty: "medium",
            crew_size: 8,
            duration_days: 21,
            project_type: "renovation",
            evidence_refs: ["permit-line-7"]
          },
          reviewer_corrections: [
            {
              field: "duration_days",
              corrected_value: 18,
              original_ai_value: 21,
              original_source_value: "three weeks",
              actor: "Dana",
              reason: "Follow-up call clarified end date"
            }
          ],
          activity: [
            { type: "source_collected", at: "2026-05-01T15:00:00Z", label: "Source collected" }
          ]
        }
      });
    }
  });

  const detail = await client.getLead("lead/123");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].url, "/api/leads/lead%2F123");
  assert.deepEqual(detail, {
    lead: {
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
      verificationState: "needs_review",
      sourceEvidence: {
        url: "https://permits.example/lead_123",
        name: "Austin permit feed",
        rawAuditPath: "/api/leads/lead_123/raw",
        collectedAt: "2026-05-01T15:00:00Z"
      },
      aiEnrichment: {
        rationale: "Permit text requests a multi-week crew block.",
        uncertainty: "medium",
        crewSize: 8,
        durationDays: 21,
        projectType: "renovation",
        evidenceRefs: ["permit-line-7"]
      },
      reviewerCorrections: [
        {
          field: "duration_days",
          correctedValue: 18,
          originalAiValue: 21,
          originalSourceValue: "three weeks",
          actor: "Dana",
          reason: "Follow-up call clarified end date"
        }
      ],
      activity: [
        { type: "source_collected", at: "2026-05-01T15:00:00Z", label: "Source collected" }
      ]
    }
  });
});

test("lead detail client rejects missing evidence workspace fields at the boundary", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json({ lead: { ...apiLead, source_url: undefined } })
  });

  await assert.rejects(() => client.getLead("lead_123"), /sourceEvidence.url/);
});
