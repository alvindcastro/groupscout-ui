import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BROWSER_UX_HARDENING_CONTRACT,
  createBrowserUxHardeningReport
} from "../web/src/renderer/browserUxHardening.js";

test("Phase 15 browser UX hardening contract covers focus, names, responsive variants, loading states, and same-origin APIs", () => {
  assert.equal(BROWSER_UX_HARDENING_CONTRACT.phase, "15");
  assert.equal(BROWSER_UX_HARDENING_CONTRACT.harness, "node-rendered-html-smoke");
  assert.equal(BROWSER_UX_HARDENING_CONTRACT.screenshotPolicy, "blocked-until-deterministic-browser-harness");
  assert.deepEqual(BROWSER_UX_HARDENING_CONTRACT.primaryRoutes, [
    "/",
    "/leads",
    "/leads/lead_hotel_001",
    "/verification",
    "/outreach",
    "/pipeline",
    "/analytics",
    "/alerts"
  ]);
  assert.deepEqual(BROWSER_UX_HARDENING_CONTRACT.requirements, {
    keyboardFocus: true,
    accessibleNames: true,
    responsiveVariants: ["desktop", "tablet", "mobile"],
    noTextOverflowPolicy: true,
    stableLoadingAndErrorStates: true,
    sameOriginApiCalls: true
  });
});

test("Phase 15 hardening report exposes deterministic UX evidence for primary routes", () => {
  const report = createBrowserUxHardeningReport();

  assert.equal(report.api.sameOriginOnly, true);
  assert.equal(report.api.path, "/api/*");
  assert.equal(report.routes.length, BROWSER_UX_HARDENING_CONTRACT.primaryRoutes.length);

  for (const route of report.routes) {
    assert.equal(route.hasPrimaryNavigation, true, route.path);
    assert.equal(route.hasMainLandmark, true, route.path);
    assert.equal(route.focusableLabels.length > 0, true, route.path);
    assert.equal(route.accessibleNamesMissing.length, 0, route.path);
    assert.deepEqual(route.responsiveVariants, ["desktop", "tablet", "mobile"], route.path);
    assert.equal(route.textContainment.maxLineLength <= 96, true, route.path);
    assert.equal(route.textContainment.usesStableControls, true, route.path);
  }

  const leads = report.routes.find((route) => route.path === "/leads");
  assert.ok(leads.focusableLabels.includes("Search leads"));
  assert.ok(leads.focusableLabels.includes("Status"));
  assert.equal(leads.states.loading.hasStatusRole, true);
  assert.equal(leads.states.error.hasAlertRole, true);
  assert.equal(leads.states.empty.isStable, true);
});
