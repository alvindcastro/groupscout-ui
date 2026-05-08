import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LEAD_STATUS_ACTIONS,
  LEAD_STATUS_TRANSITIONS,
  LEAD_STATUSES,
  canApplyLeadStatusAction,
  createLeadFieldCorrection,
  createLeadStatusMutation,
  getLeadStatusActions,
  isLeadStatus,
  validateLeadStatusAction
} from "../web/src/app/leadStatus.js";

const expectedStatuses = [
  "new",
  "notified",
  "claimed",
  "contacted",
  "snoozed",
  "flagged",
  "verified",
  "dismissed",
  "won",
  "lost",
  "no_response"
];

const expectedTransitions = {
  new: ["claim", "dismiss", "snooze", "flag"],
  notified: ["claim", "dismiss", "snooze", "flag"],
  claimed: ["contacted", "won", "lost", "no_response", "snooze"],
  contacted: ["won", "lost", "no_response", "follow_up"],
  snoozed: ["reopen", "dismiss"],
  flagged: ["verified", "corrected", "dismiss"],
  verified: ["claim", "dismiss"],
  dismissed: ["reopen"],
  won: ["reopen"],
  lost: ["reopen"],
  no_response: ["follow_up", "lost", "snooze"]
};

const allActions = [
  "claim",
  "dismiss",
  "snooze",
  "flag",
  "contacted",
  "won",
  "lost",
  "no_response",
  "follow_up",
  "reopen",
  "verified",
  "corrected"
];

test("lead status model exposes the recommended v1 status constants", () => {
  assert.deepEqual(LEAD_STATUSES, expectedStatuses);
  assert.ok(expectedStatuses.every((status) => isLeadStatus(status)));
  assert.equal(isLeadStatus("corrected"), false, "corrected is an action, not a v1 status");
  assert.equal(isLeadStatus("follow_up"), false, "follow_up is an action, not a v1 status");
});

test("lead status model matches the recommended v1 action transition table", () => {
  assert.deepEqual(LEAD_STATUS_TRANSITIONS, expectedTransitions);

  for (const [status, actions] of Object.entries(expectedTransitions)) {
    for (const action of actions) {
      assert.equal(canApplyLeadStatusAction(status, action), true, `${status} should allow ${action}`);
    }
  }
});

test("lead status model blocks every action not allowed by the current status", () => {
  for (const status of expectedStatuses) {
    const allowed = new Set(expectedTransitions[status]);

    for (const action of allActions) {
      if (!allowed.has(action)) {
        assert.equal(canApplyLeadStatusAction(status, action), false, `${status} should block ${action}`);
      }
    }
  }

  assert.equal(canApplyLeadStatusAction("unknown", "claim"), false);
  assert.equal(canApplyLeadStatusAction("new", "unknown"), false);
});

test("lead status actions expose UI-safe metadata without mixing verification into rendering", () => {
  assert.deepEqual(
    getLeadStatusActions({ status: "new" }).map((action) => [
      action.action,
      action.label,
      action.resultStatus,
      action.requires,
      action.mutationFields,
      action.token
    ]),
    [
      ["claim", "Claim lead", "claimed", ["owner"], ["status", "owner"], "button-primary"],
      ["dismiss", "Dismiss", "dismissed", ["notes"], ["status", "notes"], "button-secondary"],
      ["snooze", "Snooze", "snoozed", ["snoozeUntil"], ["status", "snoozeDate"], "button-secondary"],
      ["flag", "Flag for verification", "flagged", ["notes"], ["status", "notes"], "button-secondary"]
    ]
  );

  assert.deepEqual(
    getLeadStatusActions({ status: "flagged" }).map((action) => [
      action.action,
      action.label,
      action.resultStatus,
      action.requires,
      action.mutationFields
    ]),
    [
      ["verified", "Mark verified", "verified", ["notes"], ["status", "notes"]],
      ["corrected", "Record correction", "current", ["corrections", "correctionReason"], ["status", "corrections"]],
      ["dismiss", "Dismiss", "dismissed", ["notes"], ["status", "notes"]]
    ]
  );

  assert.equal(LEAD_STATUS_ACTIONS.follow_up.resultStatus, "current");
  assert.equal(LEAD_STATUS_ACTIONS.corrected.resultStatus, "current");
});

test("lead status mutation builder emits PATCH payloads for valid status actions only", () => {
  assert.deepEqual(
    createLeadStatusMutation({
      leadId: "lead_123",
      currentStatus: "new",
      action: "claim",
      owner: "Dana Lee"
    }),
    {
      method: "PATCH",
      path: "/api/leads/lead_123",
      body: {
        status: "claimed",
        owner: "Dana Lee"
      }
    }
  );

  assert.deepEqual(
    createLeadStatusMutation({
      leadId: "lead_123",
      currentStatus: "claimed",
      action: "contacted",
      notes: "Left voicemail with property manager."
    }).body,
    {
      status: "contacted",
      notes: "Left voicemail with property manager."
    }
  );

  assert.throws(
    () => createLeadStatusMutation({ leadId: "lead_123", currentStatus: "new", action: "won" }),
    /not allowed/i
  );
});

test("lead status validation requires notes, correction reasons, and snooze dates where applicable", () => {
  assert.deepEqual(
    validateLeadStatusAction({ currentStatus: "new", action: "dismiss" }),
    {
      valid: false,
      errors: ["notes is required for dismiss"]
    }
  );

  assert.deepEqual(
    validateLeadStatusAction({ currentStatus: "claimed", action: "snooze" }),
    {
      valid: false,
      errors: ["snoozeUntil is required for snooze"]
    }
  );

  assert.deepEqual(
    validateLeadStatusAction({
      currentStatus: "claimed",
      action: "snooze",
      snoozeUntil: "2026-05-15"
    }),
    {
      valid: true,
      errors: []
    }
  );

  assert.deepEqual(
    validateLeadStatusAction({
      currentStatus: "flagged",
      action: "corrected",
      correctionReason: "Source permit lists smaller crew."
    }),
    {
      valid: false,
      errors: ["corrections is required for corrected"]
    }
  );
});

test("snooze mutations include the required future visibility date", () => {
  const mutation = createLeadStatusMutation({
    leadId: "lead_123",
    currentStatus: "claimed",
    action: "snooze",
    snoozeUntil: "2026-05-15",
    notes: "Wait until permit inspection is scheduled."
  });

  assert.deepEqual(mutation.body, {
    status: "snoozed",
    snoozeDate: "2026-05-15",
    notes: "Wait until permit inspection is scheduled."
  });
});

test("safe field corrections preserve original AI/source values and record who changed what and why", () => {
  const correction = createLeadFieldCorrection({
    field: "estimatedCrewSize",
    originalAiValue: 12,
    originalSourceValue: "Permit scope lists two hotel wings and night work.",
    correctedValue: "10-12",
    correctedBy: "reviewer@example.test",
    reason: "Permit scope lists two fewer subcontractors than the AI estimate."
  });

  assert.deepEqual(correction, {
    field: "estimatedCrewSize",
    correctedValue: "10-12",
    originalAiValue: 12,
    originalSourceValue: "Permit scope lists two hotel wings and night work.",
    actor: "reviewer@example.test",
    reason: "Permit scope lists two fewer subcontractors than the AI estimate."
  });

  assert.deepEqual(
    createLeadStatusMutation({
      leadId: "lead_123",
      currentStatus: "flagged",
      action: "corrected",
      correctionReason: "Reviewer confirmed the source-backed crew range.",
      corrections: [correction]
    }).body,
    {
      status: "flagged",
      corrections: [
        {
          field: "estimatedCrewSize",
          correctedValue: "10-12",
          originalAiValue: 12,
          originalSourceValue: "Permit scope lists two hotel wings and night work.",
          actor: "reviewer@example.test",
          reason: "Permit scope lists two fewer subcontractors than the AI estimate."
        }
      ],
      correctionReason: "Reviewer confirmed the source-backed crew range."
    }
  );
});
