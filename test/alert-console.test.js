import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAlertConsoleRequest,
  createAlertdConsoleScreen,
  mockAlertdAlerts
} from "../web/src/app/alertdConsole.js";
import { createRouteShell } from "../web/src/app/shell.js";
import { designTokens } from "../web/src/design/tokens.js";

test("alertd console renders current read-only alert state and SPS summary", () => {
  const screen = createAlertdConsoleScreen();

  assert.equal(screen.kind, "alertd-console-screen");
  assert.equal(screen.heading, "Alerts");
  assert.equal(screen.state, "ready");
  assert.equal(screen.channelPolicy.slackFirst, true);
  assert.match(screen.channelPolicy.description, /Slack remains the interrupt channel/i);
  assert.deepEqual(screen.summary.items.map((item) => [item.label, item.value]), [
    ["Active alerts", "2 alerts"],
    ["Highest SPS", "91"],
    ["Critical rooms unavailable", "38 rooms"],
    ["Last update", "May 8, 2026, 3:15 PM UTC"]
  ]);
  assert.deepEqual(
    screen.table.rows.map((row) => [row.id, row.cells.property, row.cells.sps, row.cells.state, row.cells.impact]),
    [
      ["alert_riverside_001", "Riverside Hotel", "91", "active", "38 rooms unavailable"],
      ["alert_northbank_002", "Northbank Apartments", "74", "watching", "12 rooms at risk"]
    ]
  );
});

test("alertd console displays source evidence without inline mutations", () => {
  const screen = createAlertdConsoleScreen();
  const firstAlert = screen.alertDetails[0];

  assert.equal(firstAlert.id, "alert_riverside_001");
  assert.deepEqual(
    firstAlert.evidence.rows.map((row) => [row.type, row.label, row.value, row.sourceUrl]),
    [
      [
        "weather",
        "Flood watch",
        "County flood watch overlaps Riverside Hotel district",
        "https://alerts.example.test/weather/flood-watch"
      ],
      [
        "maintenance",
        "Elevator outage",
        "Service log reports two elevators unavailable",
        "https://ops.example.test/riverside/elevators"
      ]
    ]
  );
  assert.equal(firstAlert.evidence.rows[0].token, "code-inline");
  assert.equal(screen.actionPolicy.readOnly, true);
  assert.equal(screen.actionPolicy.mutationsAllowed, false);
  assert.ok(screen.actionPolicy.disabledActions.every((action) => action.disabled));
});

test("alertd console displays room inventory and action history when supplied by contract data", () => {
  const screen = createAlertdConsoleScreen();
  const firstAlert = screen.alertDetails[0];

  assert.deepEqual(firstAlert.roomInventory.items.map((item) => [item.label, item.value]), [
    ["Total rooms", "140"],
    ["Unavailable", "38"],
    ["Available", "102"],
    ["Out of service", "11"],
    ["Last updated", "May 8, 2026, 3:12 PM UTC"]
  ]);
  assert.deepEqual(
    firstAlert.actionHistory.rows.map((row) => [row.actor, row.action, row.channel, row.note]),
    [
      ["alertd", "created", "slack", "Posted disruption alert to #ops-alerts."],
      ["Dana Lee", "investigated", "phone", "Confirmed inventory with property manager."]
    ]
  );
});

test("alertd console handles loading empty error and responsive states", () => {
  const loading = createAlertdConsoleScreen({ state: "loading" });
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading alerts/i);

  const empty = createAlertdConsoleScreen({ alerts: [] });
  assert.equal(empty.state, "empty");
  assert.match(empty.emptyState.title, /no active disruption alerts/i);

  const error = createAlertdConsoleScreen({
    state: "error",
    errorMessage: "Alert API unavailable"
  });
  assert.equal(error.statusRegion.role, "alert");
  assert.match(error.errorState.message, /alert api unavailable/i);

  const mobile = createAlertdConsoleScreen({ viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-alert-stack");
  assert.ok(mobile.controls.every((control) => control.minTouchTarget >= 44));
});

test("alertd console uses DESIGN tokens and is mounted from the Alerts route", () => {
  const screen = createAlertdConsoleScreen();

  assert.equal(screen.tokens.card, designTokens.components["card-base"]);
  assert.equal(screen.tokens.tableSurface, designTokens.components["feature-comparison-table"]);
  assert.equal(screen.tokens.row, designTokens.components["property-row"]);
  assert.equal(screen.tokens.badge, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.typeBadge, designTokens.components["badge-type"]);
  assert.equal(screen.tokens.filter, designTokens.components["search-pill"]);
  assert.equal(screen.tokens.secondaryAction, designTokens.components["button-secondary"]);
  assert.deepEqual(createAlertConsoleRequest({ state: "active", property: "Riverside Hotel" }), {
    method: "GET",
    path: "/api/alerts",
    query: { state: "active", property: "Riverside Hotel" },
    readOnly: true
  });

  const shell = createRouteShell("/alerts");
  assert.equal(shell.activeRoute.label, "Alerts");
  assert.equal(shell.content.kind, "alertd-console-screen");
  assert.equal(shell.content.state, "ready");
  assert.equal(mockAlertdAlerts.length, 2);
});
