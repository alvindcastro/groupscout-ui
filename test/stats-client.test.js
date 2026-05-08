import assert from "node:assert/strict";
import { test } from "node:test";

import { createApiClient } from "../web/src/api/client.js";

const apiStats = {
  date_range: {
    from: "2026-04-01",
    to: "2026-05-08",
    label: "Apr 1-May 8, 2026"
  },
  denominator: {
    label: "All leads collected in the selected date range",
    total: 64
  },
  summaries: {
    status: [
      { key: "new", label: "New", count: 14 },
      { key: "claimed", label: "Claimed", count: 22 },
      { key: "won", label: "Won", count: 8 }
    ],
    source: [
      { key: "permit_feed", label: "Permit Feed", count: 28 },
      { key: "builder_network", label: "Builder Network", count: 18 }
    ],
    score_band: [
      { key: "80_100", label: "80-100", count: 19 },
      { key: "60_79", label: "60-79", count: 31 }
    ],
    owner: [
      { key: "dana", label: "Dana Lee", count: 24 },
      { key: "unowned", label: "Unowned", count: 11 }
    ],
    week: [
      { key: "2026-W18", label: "Week of Apr 27", count: 17 },
      { key: "2026-W19", label: "Week of May 4", count: 21 }
    ]
  },
  source_yield: [
    {
      source: "permit_feed",
      total: 28,
      claimed: 15,
      won: 6,
      lost: 3,
      no_response: 2
    }
  ],
  lead_aging: [
    { bucket: "0_2_days", label: "0-2 days", count: 23 },
    { bucket: "8_plus_days", label: "8+ days", count: 7 }
  ],
  verification_quality: [
    {
      key: "verified_clean",
      label: "Verified without correction",
      count: 18,
      denominator: 27
    },
    {
      key: "corrected",
      label: "Corrected after review",
      count: 9,
      denominator: 27
    }
  ],
  demand: [
    {
      week_start: "2026-05-11",
      segment: "Hotel renovation",
      property: "Riverside Hotel",
      lead_count: 9,
      estimated_room_nights: 144
    }
  ]
};

test("stats client reads GET /api/stats with filters and adapts explainable analytics shape", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return Response.json(apiStats);
    }
  });

  const stats = await client.getStats({
    from: "2026-04-01",
    to: "2026-05-08",
    segment: "hotel",
    property: "Riverside Hotel"
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "/api/stats?from=2026-04-01&to=2026-05-08&segment=hotel&property=Riverside+Hotel"
  );
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.deepEqual(stats.dateRange, {
    from: "2026-04-01",
    to: "2026-05-08",
    label: "Apr 1-May 8, 2026"
  });
  assert.deepEqual(stats.denominator, {
    label: "All leads collected in the selected date range",
    total: 64
  });
  assert.deepEqual(stats.summaries.status[0], {
    key: "new",
    label: "New",
    count: 14
  });
  assert.deepEqual(stats.summaries.scoreBand[0], {
    key: "80_100",
    label: "80-100",
    count: 19
  });
  assert.deepEqual(stats.sourceYield[0], {
    source: "permit_feed",
    total: 28,
    claimed: 15,
    won: 6,
    lost: 3,
    noResponse: 2
  });
  assert.deepEqual(stats.demand[0], {
    weekStart: "2026-05-11",
    segment: "Hotel renovation",
    property: "Riverside Hotel",
    leadCount: 9,
    estimatedRoomNights: 144
  });
});

test("stats client documents source hit-rate inputs without hiding denominator semantics", async () => {
  const client = createApiClient({
    fetchImpl: async () => Response.json(apiStats)
  });

  const stats = await client.getStats();

  assert.equal(stats.hitRateDefinition.label, "Won leads / total source leads");
  assert.deepEqual(stats.hitRateDefinition.numeratorStatuses, ["won"]);
  assert.equal(
    stats.hitRateDefinition.denominator,
    "All leads from the source collected in the selected date range"
  );
  assert.ok(stats.hitRateDefinition.excludedFromNumerator.includes("claimed"));
  assert.ok(stats.hitRateDefinition.excludedFromNumerator.includes("lost"));
});

test("stats client validates required response sections", async () => {
  const missingSummariesClient = createApiClient({
    fetchImpl: async () => Response.json({ ...apiStats, summaries: undefined })
  });

  await assert.rejects(() => missingSummariesClient.getStats(), /summaries/);

  const missingDateRangeClient = createApiClient({
    fetchImpl: async () => Response.json({ ...apiStats, date_range: undefined })
  });

  await assert.rejects(() => missingDateRangeClient.getStats(), /date_range/);
});
