import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAnalyticsDashboardScreen,
  mockAnalyticsStats
} from "../web/src/app/analyticsDashboard.js";
import { createRouteShell } from "../web/src/app/shell.js";

test("analytics screen keeps denominators tied to the selected date range", () => {
  const screen = createAnalyticsDashboardScreen({
    stats: {
      ...mockAnalyticsStats,
      dateRange: {
        from: "2026-05-01",
        to: "2026-05-08",
        label: "May 1-8, 2026"
      },
      denominator: {
        label: "All leads created in date range",
        total: 16
      },
      summaries: {
        ...mockAnalyticsStats.summaries,
        status: [
          { key: "new", label: "New", count: 5 },
          { key: "claimed", label: "Claimed", count: 4 },
          { key: "won", label: "Won", count: 3 },
          { key: "lost", label: "Lost", count: 2 }
        ]
      }
    }
  });

  assert.equal(screen.denominatorLabel, "16 leads collected in May 1-8, 2026");
  assert.equal(
    screen.metricDefinitions.sourceHitRate.visibleExplanation,
    "Source hit rate is won leads divided by total leads from that source for May 1-8, 2026."
  );
  assert.deepEqual(screen.summaries.status.items.map((item) => [item.label, item.value, item.percent]), [
    ["New", "5 leads", 31],
    ["Claimed", "4 leads", 25],
    ["Won", "3 leads", 19],
    ["Lost", "2 leads", 13]
  ]);
});

test("analytics screen source hit rate uses won leads and total source leads", () => {
  const screen = createAnalyticsDashboardScreen();

  assert.deepEqual(
    screen.sourceYield.rows.map((row) => [row.source, row.cells.hitRate, row.cells.denominator]),
    [
      ["Permit Feed", "21% hit rate", "28 source leads"],
      ["Builder Network", "11% hit rate", "18 source leads"],
      ["Manual Review", "0% hit rate", "9 source leads"]
    ]
  );
});

test("analytics route mounts the analytics dashboard with mock stats", () => {
  const shell = createRouteShell("/analytics");

  assert.equal(shell.activeRoute.label, "Analytics");
  assert.equal(shell.content.kind, "analytics-dashboard-screen");
  assert.equal(shell.content.rawStats, mockAnalyticsStats);
});
