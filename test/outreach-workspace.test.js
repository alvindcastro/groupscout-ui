import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OUTREACH_OUTCOMES,
  createOutreachActivityTimeline,
  createOutreachAttemptMutation,
  createOutreachHistoryRequest,
  createOutreachWorkspaceScreen,
  mockOutreachLeads
} from "../web/src/app/outreachWorkspace.js";
import { designTokens } from "../web/src/design/tokens.js";

test("outreach workspace renders editable draft and contact fields", () => {
  const screen = createOutreachWorkspaceScreen({ leadId: "lead_hotel_001" });

  assert.equal(screen.kind, "outreach-workspace-screen");
  assert.equal(screen.heading, "Outreach Workspace");
  assert.equal(screen.state, "ready");
  assert.equal(screen.lead.title, "Riverside hotel renovation crew block");
  assert.deepEqual(
    screen.draft.fields.map((field) => [field.name, field.label, field.type, field.editable]),
    [
      ["channel", "Channel", "select", true],
      ["contactName", "Contact name", "text", true],
      ["contactRole", "Contact role", "text", true],
      ["contactEmail", "Contact email", "email", true],
      ["contactPhone", "Contact phone", "tel", true],
      ["subject", "Subject", "text", true],
      ["message", "Message draft", "textarea", true]
    ]
  );
  assert.match(screen.draft.values.message, /hotel renovation/i);
  assert.equal(screen.draft.autoSendEnabled, false);
});

test("outreach workspace validates contact fields before logging", async () => {
  const screen = createOutreachWorkspaceScreen({ leadId: "lead_hotel_001" });

  await assert.rejects(
    () =>
      screen.actions.logAttempt({
        channel: "email",
        contactName: "Riley Chen",
        contactEmail: "",
        notes: "Prepared email for manual send.",
        outcome: "contacted"
      }),
    /contact email is required/i
  );

  await assert.rejects(
    () =>
      screen.actions.logAttempt({
        channel: "phone",
        contactName: "",
        contactPhone: "503-555-0140",
        notes: "Left voicemail.",
        outcome: "no_response"
      }),
    /contact name is required/i
  );
});

test("outreach workspace exposes copied sent and logged display states without auto sending email", () => {
  const copied = createOutreachWorkspaceScreen({
    leadId: "lead_hotel_001",
    displayState: "copied"
  });
  const sent = createOutreachWorkspaceScreen({
    leadId: "lead_hotel_001",
    displayState: "sent"
  });
  const logged = createOutreachWorkspaceScreen({
    leadId: "lead_hotel_001",
    displayState: "logged"
  });

  assert.deepEqual(
    copied.displayState,
    {
      key: "copied",
      label: "Draft copied",
      description: "Message copied for manual outreach.",
      sendsEmail: false
    }
  );
  assert.equal(sent.displayState.sendsEmail, false);
  assert.match(sent.displayState.description, /operator reported/i);
  assert.equal(logged.displayState.label, "Attempt logged");
  assert.equal(copied.actions.copyDraft().sendsEmail, false);
  assert.equal(copied.actions.markSent().sendsEmail, false);
  assert.equal(copied.actions.logOnly().sendsEmail, false);
  assert.equal(copied.sendPolicy.autoSendEmail, false);
  assert.equal(copied.sendPolicy.crmSync, false);
});

test("outreach API helpers serialize POST attempt and GET history requests", () => {
  const mutation = createOutreachAttemptMutation({
    leadId: "lead_hotel_001",
    channel: "email",
    contactName: "Riley Chen",
    contactRole: "Property manager",
    contactEmail: "riley@example.test",
    contactPhone: "503-555-0140",
    notes: "Copied draft into operator email client.",
    outcome: "contacted"
  });

  assert.deepEqual(mutation, {
    method: "POST",
    path: "/api/leads/lead_hotel_001/outreach",
    body: {
      channel: "email",
      contact: {
        name: "Riley Chen",
        role: "Property manager",
        email: "riley@example.test",
        phone: "503-555-0140"
      },
      notes: "Copied draft into operator email client.",
      outcome: "contacted"
    }
  });
  assert.deepEqual(createOutreachHistoryRequest("lead_hotel_001"), {
    method: "GET",
    path: "/api/leads/lead_hotel_001/outreach"
  });
});

test("outreach workspace captures contacted won lost and no response outcomes", () => {
  assert.deepEqual(
    OUTREACH_OUTCOMES.map((outcome) => [outcome.key, outcome.label]),
    [
      ["contacted", "Contacted"],
      ["won", "Won"],
      ["lost", "Lost"],
      ["no_response", "No response"]
    ]
  );

  const screen = createOutreachWorkspaceScreen({ leadId: "lead_hotel_001" });
  assert.deepEqual(
    screen.outcomeOptions.map((outcome) => outcome.key),
    ["contacted", "won", "lost", "no_response"]
  );
});

test("outreach activity timeline renders attempts and outcomes", () => {
  const timeline = createOutreachActivityTimeline(mockOutreachLeads.lead_hotel_001.outreachHistory);

  assert.deepEqual(
    timeline.entries.map((entry) => [
      entry.type,
      entry.channel,
      entry.contact,
      entry.outcome.label,
      entry.timestamp
    ]),
    [
      [
        "outreach_attempt",
        "email",
        "Riley Chen, Property manager",
        "Contacted",
        "May 7, 2026, 6:05 PM UTC"
      ],
      [
        "outreach_attempt",
        "phone",
        "Riley Chen, Property manager",
        "No response",
        "May 8, 2026, 4:00 PM UTC"
      ]
    ]
  );
  assert.ok(timeline.entries.every((entry) => entry.notes && entry.manualOnly));
});

test("outreach workspace renders loading empty error responsive states and DESIGN tokens", () => {
  const loading = createOutreachWorkspaceScreen({ state: "loading" });
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading outreach workspace/i);

  const missing = createOutreachWorkspaceScreen({ leadId: "missing" });
  assert.equal(missing.state, "not-found");
  assert.equal(missing.statusRegion.role, "alert");

  const error = createOutreachWorkspaceScreen({ state: "error", errorMessage: "Outreach API unavailable" });
  assert.equal(error.errorState.title, "Outreach workspace could not load");
  assert.match(error.errorState.message, /api unavailable/i);

  const mobile = createOutreachWorkspaceScreen({ leadId: "lead_hotel_001", viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-outreach-stack");
  assert.deepEqual(mobile.layout.regions, ["lead", "draft", "log", "activity"]);
  assert.ok(mobile.controls.every((control) => control.minTouchTarget >= 44));

  const screen = createOutreachWorkspaceScreen({ leadId: "lead_hotel_001" });
  assert.equal(screen.tokens.card, designTokens.components["card-base"]);
  assert.equal(screen.tokens.input, designTokens.components["text-input"]);
  assert.equal(screen.tokens.primaryAction, designTokens.components["button-primary"]);
  assert.equal(screen.tokens.secondaryAction, designTokens.components["button-secondary"]);
  assert.equal(screen.tokens.outcomeBadge, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.timelineRow, designTokens.components["property-row"]);
});
