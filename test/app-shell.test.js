import assert from "node:assert/strict";
import { test } from "node:test";

import { appNavigation, createRouteShell } from "../web/src/app/shell.js";

const expectedRoutes = [
  ["Today", "/"],
  ["Leads", "/leads"],
  ["Verification", "/verification"],
  ["Outreach", "/outreach"],
  ["Pipeline", "/pipeline"],
  ["Analytics", "/analytics"],
  ["Settings", "/settings"]
];

test("route shell hosts the planned Phase 0 information architecture", () => {
  assert.deepEqual(
    appNavigation.map((item) => [item.label, item.path]),
    expectedRoutes
  );
});

test("route shell is a placeholder workspace without feature workflow content", () => {
  const shell = createRouteShell("/leads");

  assert.equal(shell.kind, "operator-workspace-shell");
  assert.equal(shell.activeRoute.label, "Leads");
  assert.equal(shell.sections.length, expectedRoutes.length);
  assert.equal(shell.content.status, "placeholder");
  assert.match(shell.content.description, /future lead-management views/i);
  assert.doesNotMatch(shell.content.description, /claim|dismiss|snooze|contacted|won|lost/i);
});
