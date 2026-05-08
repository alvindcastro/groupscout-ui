import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ANALYTICS_HIT_RATE_DEFINITION,
  createAnalyticsDashboardScreen,
  createStatsRequest
} from "../web/src/app/analyticsDashboard.js";
import { createRouteShell } from "../web/src/app/shell.js";
import { designTokens } from "../web/src/design/tokens.js";

test("analytics dashboard renders status source score owner and week summaries", () => {
  const screen = createAnalyticsDashboardScreen();

  assert.equal(screen.kind, "analytics-dashboard-screen");
  assert.equal(screen.heading, "Analytics");
  assert.equal(screen.state, "ready");
  assert.equal(screen.dateRange.label, "Apr 1-May 8, 2026");
  assert.equal(screen.denominatorLabel, "64 leads collected in Apr 1-May 8, 2026");
  assert.deepEqual(screen.summaries.status.items.map((item) => [item.label, item.value]), [
    ["New", "14 leads"],
    ["Claimed", "22 leads"],
    ["Won", "8 leads"],
    ["Lost", "5 leads"]
  ]);
  assert.deepEqual(screen.summaries.source.items.map((item) => [item.label, item.value]), [
    ["Permit Feed", "28 leads"],
    ["Builder Network", "18 leads"],
    ["Manual Review", "9 leads"]
  ]);
  assert.deepEqual(screen.summaries.scoreBand.items.map((item) => [item.label, item.value]), [
    ["80-100", "19 leads"],
    ["60-79", "31 leads"],
    ["0-59", "14 leads"]
  ]);
  assert.deepEqual(screen.summaries.owner.items.map((item) => [item.label, item.value]), [
    ["Dana Lee", "24 leads"],
    ["Sam Rivera", "18 leads"],
    ["Unowned", "11 leads"]
  ]);
  assert.deepEqual(screen.summaries.week.items.map((item) => [item.label, item.value]), [
    ["Week of Apr 27", "17 leads"],
    ["Week of May 4", "21 leads"]
  ]);
});

test("analytics dashboard explains source yield hit rate denominator and date range", () => {
  const screen = createAnalyticsDashboardScreen();

  assert.deepEqual(ANALYTICS_HIT_RATE_DEFINITION, {
    label: "Won leads / total source leads",
    numeratorStatuses: ["won"],
    denominator: "All leads from the source collected in the selected date range",
    excludedFromNumerator: ["claimed", "contacted", "lost", "no_response", "dismissed"]
  });
  assert.equal(screen.metricDefinitions.sourceHitRate.label, ANALYTICS_HIT_RATE_DEFINITION.label);
  assert.match(screen.metricDefinitions.sourceHitRate.visibleExplanation, /won leads divided by total leads/i);
  assert.match(screen.metricDefinitions.sourceHitRate.visibleExplanation, /Apr 1-May 8, 2026/i);
  assert.deepEqual(
    screen.sourceYield.rows.map((row) => [
      row.source,
      row.cells.total,
      row.cells.claimedRate,
      row.cells.wonRate,
      row.cells.lostRate,
      row.cells.hitRate,
      row.cells.denominator
    ]),
    [
      ["Permit Feed", "28 leads", "54% claimed", "21% won", "11% lost", "21% hit rate", "28 source leads"],
      [
        "Builder Network",
        "18 leads",
        "39% claimed",
        "11% won",
        "17% lost",
        "11% hit rate",
        "18 source leads"
      ],
      ["Manual Review", "9 leads", "33% claimed", "0% won", "11% lost", "0% hit rate", "9 source leads"]
    ]
  );
});

test("analytics dashboard renders lead aging verification quality and upcoming demand", () => {
  const screen = createAnalyticsDashboardScreen();

  assert.deepEqual(screen.leadAging.buckets.map((bucket) => [bucket.label, bucket.value]), [
    ["0-2 days", "23 leads"],
    ["3-7 days", "18 leads"],
    ["8+ days", "7 leads"]
  ]);
  assert.deepEqual(
    screen.verificationQuality.rows.map((row) => [row.label, row.cells.count, row.cells.rate, row.cells.denominator]),
    [
      ["Verified without correction", "18 leads", "67%", "27 reviewed leads"],
      ["Corrected after review", "9 leads", "33%", "27 reviewed leads"],
      ["Returned to queue", "3 leads", "11%", "27 reviewed leads"]
    ]
  );
  assert.deepEqual(
    screen.demand.rows.map((row) => [
      row.weekStart,
      row.cells.segment,
      row.cells.property,
      row.cells.leads,
      row.cells.roomNights
    ]),
    [
      ["2026-05-11", "Hotel renovation", "Riverside Hotel", "9 leads", "144 room nights"],
      ["2026-05-18", "Multifamily repair", "Northbank Apartments", "6 leads", "72 room nights"]
    ]
  );
});

test("analytics dashboard handles loading empty error and responsive states", () => {
  const loading = createAnalyticsDashboardScreen({ state: "loading" });
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading analytics/i);

  const empty = createAnalyticsDashboardScreen({ stats: { ...createAnalyticsDashboardScreen().rawStats, denominator: { label: "No leads", total: 0 } } });
  assert.equal(empty.state, "empty");
  assert.match(empty.emptyState.title, /no analytics data/i);

  const error = createAnalyticsDashboardScreen({
    state: "error",
    errorMessage: "Stats API unavailable"
  });
  assert.equal(error.statusRegion.role, "alert");
  assert.match(error.errorState.message, /stats api unavailable/i);

  const mobile = createAnalyticsDashboardScreen({ viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-analytics-stack");
  assert.ok(mobile.controls.every((control) => control.minTouchTarget >= 44));
});

test("analytics dashboard uses DESIGN tokens and is mounted from the Analytics route", () => {
  const screen = createAnalyticsDashboardScreen();

  assert.equal(screen.tokens.card, designTokens.components["card-base"]);
  assert.equal(screen.tokens.tableSurface, designTokens.components["feature-comparison-table"]);
  assert.equal(screen.tokens.row, designTokens.components["property-row"]);
  assert.equal(screen.tokens.badge, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.filter, designTokens.components["search-pill"]);
  assert.deepEqual(createStatsRequest({ from: "2026-04-01", to: "2026-05-08" }), {
    method: "GET",
    path: "/api/stats",
    query: { from: "2026-04-01", to: "2026-05-08" }
  });

  const shell = createRouteShell("/analytics");
  assert.equal(shell.activeRoute.label, "Analytics");
  assert.equal(shell.content.kind, "analytics-dashboard-screen");
  assert.equal(shell.content.state, "ready");
});
