import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createSystemSummaryRequest,
  createTodayCommandCenterScreen,
  mockTodayCommandCenter
} from "../web/src/app/todayCommandCenter.js";
import { createRouteShell } from "../web/src/app/shell.js";
import { designTokens } from "../web/src/design/tokens.js";

test("today command center renders the daily operator summary", () => {
  const screen = createTodayCommandCenterScreen();

  assert.equal(screen.kind, "today-command-center-screen");
  assert.equal(screen.heading, "Today");
  assert.equal(screen.state, "ready");
  assert.deepEqual(screen.summary.items.map((item) => [item.label, item.value]), [
    ["High-score new leads", "3"],
    ["Aging claimed leads", "2"],
    ["Active alerts", "2"],
    ["Failed jobs", "1"],
    ["System health", "degraded"]
  ]);
  assert.equal(screen.summary.generatedAt, "May 8, 2026, 4:30 PM UTC");
});

test("today command center highlights priority leads and aging claimed work", () => {
  const screen = createTodayCommandCenterScreen();

  assert.deepEqual(
    screen.priorityLeads.rows.map((row) => [
      row.id,
      row.title,
      row.score,
      row.owner,
      row.status,
      row.nextAction.href
    ]),
    [
      ["lead_hotel_001", "Riverside hotel renovation crew block", "94", "Unowned", "new", "/leads/lead_hotel_001"],
      ["lead_hotel_014", "Airport hotel overflow crew", "91", "Unowned", "notified", "/leads/lead_hotel_014"],
      ["lead_hotel_021", "Northbank apartment repair team", "87", "Unowned", "flagged", "/leads/lead_hotel_021"]
    ]
  );
  assert.deepEqual(
    screen.agingClaimed.rows.map((row) => [row.id, row.title, row.owner, row.age, row.nextAction.href]),
    [
      ["lead_hotel_009", "Convention center electrical crew", "Dana Lee", "9 days", "/leads/lead_hotel_009"],
      ["lead_hotel_017", "South terminal concrete team", "Sam Rivera", "6 days", "/leads/lead_hotel_017"]
    ]
  );
});

test("today command center shows active alerts failed jobs and system health without mutations", () => {
  const screen = createTodayCommandCenterScreen();

  assert.deepEqual(
    screen.activeAlerts.rows.map((row) => [row.id, row.property, row.sps, row.state, row.href]),
    [
      ["alert_riverside_001", "Riverside Hotel", "91", "active", "/alerts"],
      ["alert_northbank_002", "Northbank Apartments", "74", "watching", "/alerts"]
    ]
  );
  assert.deepEqual(
    screen.failedJobs.rows.map((row) => [row.id, row.collector, row.status, row.href]),
    [["run_2026_05_08_1530", "permit_feed", "failed", "/pipeline"]]
  );
  assert.deepEqual(screen.systemHealth.items.map((item) => [item.label, item.value, item.state]), [
    ["API", "ok", "ok"],
    ["Database", "ok", "ok"],
    ["Collector freshness", "stale", "warn"],
    ["LLM enrichment", "degraded", "warn"]
  ]);
  assert.equal(screen.actionPolicy.mutationsAllowed, false);
  assert.ok(screen.actions.every((action) => action.href.startsWith("/")));
});

test("today command center handles loading empty error and responsive states", () => {
  const loading = createTodayCommandCenterScreen({ state: "loading" });
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading today/i);

  const empty = createTodayCommandCenterScreen({
    overview: {
      ...mockTodayCommandCenter,
      priorityLeads: [],
      agingClaimed: [],
      activeAlerts: [],
      failedJobs: []
    }
  });
  assert.equal(empty.state, "empty");
  assert.match(empty.emptyState.title, /nothing urgent/i);

  const error = createTodayCommandCenterScreen({
    state: "error",
    errorMessage: "System summary unavailable"
  });
  assert.equal(error.statusRegion.role, "alert");
  assert.match(error.errorState.message, /system summary unavailable/i);

  const mobile = createTodayCommandCenterScreen({ viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-today-stack");
  assert.ok(mobile.controls.every((control) => control.minTouchTarget >= 44));
});

test("today command center uses DESIGN tokens and is mounted from the root route", () => {
  const screen = createTodayCommandCenterScreen();

  assert.equal(screen.tokens.card, designTokens.components["card-base"]);
  assert.equal(screen.tokens.tableSurface, designTokens.components["feature-comparison-table"]);
  assert.equal(screen.tokens.row, designTokens.components["property-row"]);
  assert.equal(screen.tokens.badge, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.typeBadge, designTokens.components["badge-type"]);
  assert.equal(screen.tokens.filter, designTokens.components["search-pill"]);
  assert.equal(screen.tokens.secondaryAction, designTokens.components["button-secondary"]);
  assert.deepEqual(createSystemSummaryRequest(), {
    method: "GET",
    path: "/api/system",
    readOnly: true
  });

  const shell = createRouteShell("/");
  assert.equal(shell.activeRoute.label, "Today");
  assert.equal(shell.content.kind, "today-command-center-screen");
  assert.equal(shell.content.state, "ready");
});
