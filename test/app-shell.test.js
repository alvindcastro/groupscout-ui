import assert from "node:assert/strict";
import { test } from "node:test";

import { appNavigation, createMountedRouteShell, createRouteShell } from "../web/src/app/shell.js";

const expectedRoutes = [
  ["Today", "/"],
  ["Leads", "/leads"],
  ["Verification", "/verification"],
  ["Outreach", "/outreach"],
  ["Pipeline", "/pipeline"],
  ["Analytics", "/analytics"],
  ["Alerts", "/alerts"],
  ["Settings", "/settings"]
];

test("route shell hosts the planned Phase 0 information architecture", () => {
  assert.deepEqual(
    appNavigation.map((item) => [item.label, item.path]),
    expectedRoutes
  );
});

test("route shell mounts the Phase 2 lead inbox for the Leads route", () => {
  const shell = createRouteShell("/leads");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Leads");
  assert.equal(shell.sections.length, expectedRoutes.length);
  assert.equal(shell.content.kind, "lead-inbox-screen");
  assert.equal(shell.content.state, "ready");
});

test("route shell mounts the Phase 3 lead detail evidence workspace for lead routes", () => {
  const shell = createRouteShell("/leads/lead_hotel_001");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Leads");
  assert.equal(shell.content.kind, "lead-detail-screen");
  assert.equal(shell.content.state, "ready");
  assert.equal(shell.content.summary.items[0][1], "Riverside hotel renovation crew block");
});

test("route shell mounts the Phase 6 outreach workspace for the Outreach route", () => {
  const shell = createRouteShell("/outreach");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Outreach");
  assert.equal(shell.content.kind, "outreach-workspace-screen");
  assert.equal(shell.content.state, "ready");
  assert.equal(shell.content.sendPolicy.autoSendEmail, false);
});

test("future non-lead routes remain placeholders without feature workflow content", () => {
  const shell = createRouteShell("/settings");

  assert.equal(shell.content.status, "placeholder");
  assert.match(shell.content.description, /future lead-management views/i);
  assert.doesNotMatch(shell.content.description, /claim|dismiss|snooze|contacted|won|lost/i);
});

test("route shell mounts the Phase 8 analytics dashboard for the Analytics route", () => {
  const shell = createRouteShell("/analytics");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Analytics");
  assert.equal(shell.content.kind, "analytics-dashboard-screen");
  assert.equal(shell.content.state, "ready");
  assert.match(shell.content.denominatorLabel, /64 leads collected/i);
});

test("route shell mounts the Phase 10 alertd read-only console for the Alerts route", () => {
  const shell = createRouteShell("/alerts");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Alerts");
  assert.equal(shell.content.kind, "alertd-console-screen");
  assert.equal(shell.content.state, "ready");
  assert.equal(shell.content.actionPolicy.readOnly, true);
});

test("route shell mounts the Phase 5 verification queue for the Verification route", () => {
  const shell = createRouteShell("/verification");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Verification");
  assert.equal(shell.content.kind, "verification-queue-screen");
  assert.equal(shell.content.state, "ready");
  assert.ok(shell.content.table.rows.length > 0);
});

test("route shell can be mounted below UI_BASE_PATH without changing workspace routes", () => {
  const shell = createMountedRouteShell("/ops/analytics", { basePath: "/ops" });

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.basePath, "/ops");
  assert.equal(shell.activeRoute.label, "Analytics");
  assert.equal(shell.sections.find((section) => section.path === "/analytics").href, "/ops/analytics");
  assert.equal(shell.sections.find((section) => section.path === "/").href, "/ops");
  assert.equal(shell.content.kind, "analytics-dashboard-screen");
});
