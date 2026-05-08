import assert from "node:assert/strict";
import { test } from "node:test";

import {
  RAW_AUDIT_REDACTION_POLICY,
  classifyVerificationTriggers,
  createVerificationQueueScreen,
  mockVerificationQueueLeads
} from "../web/src/app/verificationQueue.js";
import { designTokens } from "../web/src/design/tokens.js";

test("verification queue classifies every Phase 5 trigger", () => {
  const classified = Object.fromEntries(
    mockVerificationQueueLeads.map((lead) => [
      lead.id,
      classifyVerificationTriggers(lead).map((trigger) => trigger.key)
    ])
  );

  assert.deepEqual(classified.lead_missing_raw, ["missing_raw_audit"]);
  assert.deepEqual(classified.lead_weak_rationale, ["high_score_weak_rationale"]);
  assert.deepEqual(classified.lead_contradiction, ["raw_enrichment_contradiction"]);
  assert.deepEqual(classified.lead_low_confidence, ["low_confidence_parse"]);
  assert.deepEqual(classified.lead_manual_flag, ["manual_operator_flag"]);
});

test("verification queue renders filtered operational rows", () => {
  const screen = createVerificationQueueScreen({
    filters: {
      trigger: "high_score_weak_rationale",
      owner: "unowned"
    }
  });

  assert.equal(screen.kind, "verification-queue-screen");
  assert.equal(screen.heading, "Verification Queue");
  assert.equal(screen.state, "ready");
  assert.deepEqual(
    screen.controls.map((control) => [control.name, control.label, control.type]),
    [
      ["trigger", "Trigger", "select"],
      ["source", "Source", "select"],
      ["owner", "Owner", "select"],
      ["minScore", "Minimum score", "number"],
      ["clearFilters", "Clear filters", "button"]
    ]
  );
  assert.deepEqual(
    screen.table.columns.map((column) => column.key),
    ["score", "lead", "trigger", "source", "owner", "raw-audit", "updated"]
  );
  assert.deepEqual(
    screen.table.rows.map((row) => [row.id, row.cells.lead, row.cells.trigger]),
    [
      [
        "lead_weak_rationale",
        "Hotel wing renovation with inferred crew need",
        "High score with weak rationale"
      ]
    ]
  );
  assert.equal(screen.filters.activeCount, 2);
});

test("verification queue exposes verify correct dismiss and return-to-lead actions", () => {
  const screen = createVerificationQueueScreen();
  const firstRow = screen.table.rows[0];

  assert.deepEqual(
    firstRow.actions.map((action) => [action.action, action.label, action.intent]),
    [
      ["verify", "Verify", "patch-status"],
      ["correct", "Correct", "open-correction"],
      ["dismiss", "Dismiss", "patch-status"],
      ["return_to_lead", "Return to lead", "navigate"]
    ]
  );
  assert.ok(firstRow.actions.every((action) => action.minTouchTarget >= 44));
  assert.deepEqual(screen.actions.returnToLead("lead_weak_rationale"), {
    type: "navigate",
    href: "/leads/lead_weak_rationale"
  });
});

test("verification queue opens raw audit evidence only through the UI-safe alias", () => {
  const screen = createVerificationQueueScreen();
  const row = screen.table.rows.find((item) => item.id === "lead_weak_rationale");

  assert.deepEqual(row.rawAuditLink, {
    label: "Open raw audit evidence",
    href: "/api/leads/lead_weak_rationale/raw",
    endpoint: "GET /api/leads/{id}/raw",
    loadsInline: false
  });
  assert.equal(row.rawAuditLink.href.includes("/audit/raw"), false);
});

test("verification queue keeps missing redaction policy explicit", () => {
  const screen = createVerificationQueueScreen();

  assert.deepEqual(RAW_AUDIT_REDACTION_POLICY, {
    status: "blocked",
    todo: "Define raw audit payload redaction rules before rendering sensitive fields inline."
  });
  assert.equal(screen.rawAuditReview.redaction.status, "blocked");
  assert.equal(screen.rawAuditReview.inlinePayloadRendering, false);
  assert.match(screen.rawAuditReview.redaction.todo, /redaction rules/i);
});

test("verification queue renders loading empty error and responsive states", () => {
  const loading = createVerificationQueueScreen({ state: "loading" });
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading verification queue/i);

  const empty = createVerificationQueueScreen({ leads: [] });
  assert.equal(empty.state, "empty");
  assert.match(empty.emptyState.title, /no leads require verification/i);

  const error = createVerificationQueueScreen({
    state: "error",
    errorMessage: "Verification API unavailable"
  });
  assert.equal(error.statusRegion.role, "alert");
  assert.match(error.errorState.message, /verification api unavailable/i);

  const mobile = createVerificationQueueScreen({ viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-verification-cards");
  assert.equal(mobile.table.rows.length, 0);
  assert.ok(mobile.mobileCards.length > 0);
});

test("verification queue uses documented DESIGN.md component tokens", () => {
  const screen = createVerificationQueueScreen();

  assert.equal(screen.tokens.filter, designTokens.components["search-pill"]);
  assert.equal(screen.tokens.input, designTokens.components["text-input"]);
  assert.equal(screen.tokens.tableSurface, designTokens.components["feature-comparison-table"]);
  assert.equal(screen.tokens.row, designTokens.components["property-row"]);
  assert.equal(screen.tokens.primaryAction, designTokens.components["button-primary"]);
  assert.equal(screen.tokens.secondaryAction, designTokens.components["button-secondary"]);
  assert.equal(screen.tokens.triggerBadge, designTokens.components["badge-tag"]);
});
