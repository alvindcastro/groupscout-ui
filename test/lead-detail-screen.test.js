import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createLeadDetailScreen,
  mockLeadDetails
} from "../web/src/app/leadDetail.js";
import { mockLeadInboxLeads } from "../web/src/app/leadInbox.js";
import { designTokens } from "../web/src/design/tokens.js";

test("lead detail renders all Phase 3 evidence workspace sections", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.equal(screen.kind, "lead-detail-screen");
  assert.equal(screen.state, "ready");
  assert.equal(screen.heading, "Riverside hotel renovation crew block");
  assert.deepEqual(
    screen.sections.map((section) => section.title),
    ["Summary", "Source Evidence", "AI Enrichment", "Actions", "Outreach", "Activity"]
  );

  assert.deepEqual(screen.summary.items, [
    ["Title", "Riverside hotel renovation crew block"],
    ["Score", "96"],
    ["Timing", "today"],
    ["Room-night signal", "336 room nights"],
    ["Property fit", "hotel"]
  ]);
});

test("lead detail pairs source evidence with raw audit access without loading raw payloads", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.deepEqual(screen.sourceEvidence, {
    sourceName: "Portland permit feed",
    sourceUrl: "https://permits.example.test/portland/renovation-881",
    rawAuditLink: {
      label: "Open raw audit record",
      href: "/api/leads/lead_hotel_001/raw",
      loadsInline: false
    },
    collectedAt: "May 7, 2026, 4:10 PM UTC"
  });
  assert.equal(screen.rawPayload, undefined);
});

test("lead detail displays AI enrichment rationale, uncertainty, and source-backed claims", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.deepEqual(
    screen.aiEnrichment.claims.map((claim) => [
      claim.field,
      claim.original.value,
      claim.evidence.sourceName,
      claim.evidence.rawAuditHref
    ]),
    [
      [
        "Contractor / applicant",
        "Northwest Build Partners",
        "Portland permit feed",
        "/api/leads/lead_hotel_001/raw"
      ],
      ["Project type", "renovation", "Portland permit feed", "/api/leads/lead_hotel_001/raw"],
      ["Crew size", "12", "Portland permit feed", "/api/leads/lead_hotel_001/raw"],
      ["Duration", "28 days", "Portland permit feed", "/api/leads/lead_hotel_001/raw"]
    ]
  );
  assert.equal(
    screen.aiEnrichment.rationale,
    "Permit scope mentions occupied hotel floor renovation and multi-week subcontractor scheduling."
  );
  assert.equal(screen.aiEnrichment.uncertainty.level, "medium");
  assert.match(screen.aiEnrichment.uncertainty.reason, /crew size/i);
});

test("lead detail keeps original AI extraction and reviewer corrections visually distinct", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });
  const crewSize = screen.aiEnrichment.claims.find((claim) => claim.field === "Crew size");

  assert.deepEqual(crewSize.original, {
    label: "Original AI extraction",
    value: "12",
    visualRole: "source-backed",
    token: "code-inline"
  });
  assert.deepEqual(crewSize.reviewerCorrection, {
    label: "Reviewer correction",
    value: "10-12",
    visualRole: "reviewer-correction",
    token: "badge-tag"
  });
  assert.notEqual(crewSize.original.value, crewSize.reviewerCorrection.value);
  assert.equal(crewSize.displayValue, "12");
  assert.equal(crewSize.correctionPolicy, "show-alongside-original");
});

test("lead detail renders activity history, notes, outreach attempts, and corrections", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.deepEqual(
    screen.activity.entries.map((entry) => [entry.type, entry.label]),
    [
      ["status_history", "Lead created"],
      ["note", "Ops note"],
      ["outreach_attempt", "Initial call queued"],
      ["outreach_attempt", "Email draft copied"],
      ["outreach_outcome", "Outcome captured"],
      ["reviewer_correction", "Crew size corrected"]
    ]
  );
  assert.ok(screen.activity.entries.every((entry) => entry.timestamp));
});

test("lead detail exposes editable outreach draft, contact fields, and manual logging actions", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.equal(screen.outreach.workspace.kind, "outreach-workspace");
  assert.equal(screen.outreach.workspace.autoSendEnabled, false);
  assert.deepEqual(
    screen.outreach.workspace.contactFields.map((field) => [
      field.name,
      field.label,
      field.required,
      field.token
    ]),
    [
      ["channel", "Channel", true, "text-input"],
      ["contact", "Contact", true, "text-input"],
      ["draft", "Draft", true, "text-input"],
      ["notes", "Notes", true, "text-input"],
      ["outcome", "Outcome", true, "text-input"]
    ]
  );
  assert.deepEqual(screen.outreach.workspace.draft.state, "editable");
  assert.match(screen.outreach.workspace.draft.value, /Riverside hotel renovation/i);
  assert.deepEqual(
    screen.outreach.workspace.outcomeOptions.map((option) => option.value),
    ["contacted", "won", "lost", "no_response"]
  );
  assert.deepEqual(
    screen.outreach.workspace.displayStates.map((state) => [state.state, state.sendsMessage]),
    [
      ["drafting", false],
      ["copied", false],
      ["sent_manually", false],
      ["logged", false]
    ]
  );
});

test("lead detail outreach workspace validates contact fields before manual logging", async () => {
  const logCalls = [];
  const screen = createLeadDetailScreen({
    leadId: "lead_hotel_001",
    logLeadOutreach: async (...args) => {
      logCalls.push(args);
      return { ok: true };
    }
  });

  assert.throws(
    () =>
      screen.outreach.workspace.validateLogAttempt({
        channel: "email",
        contact: "",
        notes: "Copied draft into inbox.",
        outcome: "contacted"
      }),
    /contact/i
  );

  await screen.outreach.workspace.logAttempt({
    channel: "email",
    contact: "manager@riverside.example",
    notes: "Copied draft into inbox.",
    outcome: "contacted"
  });

  assert.deepEqual(logCalls, [
    [
      "lead_hotel_001",
      {
        channel: "email",
        contact: "manager@riverside.example",
        notes: "Copied draft into inbox.",
        outcome: "contacted"
      }
    ]
  ]);
});

test("lead detail renders loading, not found, and error states", () => {
  const loading = createLeadDetailScreen({ leadId: "lead_hotel_001", state: "loading" });
  assert.equal(loading.state, "loading");
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading lead evidence/i);

  const notFound = createLeadDetailScreen({ leadId: "missing" });
  assert.equal(notFound.state, "not-found");
  assert.equal(notFound.statusRegion.role, "alert");
  assert.match(notFound.notFoundState.message, /missing/);

  const error = createLeadDetailScreen({
    leadId: "lead_hotel_001",
    state: "error",
    errorMessage: "Evidence service unavailable"
  });
  assert.equal(error.state, "error");
  assert.equal(error.statusRegion.role, "alert");
  assert.match(error.errorState.message, /evidence service unavailable/i);
});

test("lead detail keeps content readable and actions reachable across responsive layouts", () => {
  const desktop = createLeadDetailScreen({ leadId: "lead_hotel_001", viewport: "desktop" });
  assert.equal(desktop.layout.mode, "desktop-evidence-workspace");
  assert.deepEqual(desktop.layout.regions, ["summary", "evidence", "side-panel"]);
  assert.equal(desktop.actions.position, "side-panel");

  const mobile = createLeadDetailScreen({ leadId: "lead_hotel_001", viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-detail-stack");
  assert.deepEqual(mobile.layout.regions, ["summary", "actions", "evidence", "activity"]);
  assert.equal(mobile.actions.position, "sticky-bottom");
  assert.ok(mobile.actions.items.every((item) => item.minTouchTarget >= 44));
});

test("lead detail shows only valid Phase 4 status actions for the current lead", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.equal(screen.actions.readOnly, false);
  assert.deepEqual(
    screen.actions.items.map((item) => [item.action, item.label, item.resultStatus, item.token]),
    [
      ["claim", "Claim lead", "claimed", "button-primary"],
      ["dismiss", "Dismiss", "dismissed", "button-secondary"],
      ["snooze", "Snooze", "snoozed", "button-secondary"],
      ["flag", "Flag for verification", "flagged", "button-secondary"]
    ]
  );
  assert.ok(screen.actions.items.every((item) => item.disabled === false));
  assert.equal(screen.actions.items.some((item) => item.action === "won"), false);
});

test("lead detail action submission blocks invalid transitions before API mutation", async () => {
  const patchCalls = [];
  const screen = createLeadDetailScreen({
    leadId: "lead_hotel_001",
    patchLead: async (...args) => {
      patchCalls.push(args);
      return { ok: true };
    }
  });

  await assert.rejects(
    () => screen.actions.submit({ action: "won", notes: "Closing too early." }),
    /won is not allowed from new/i
  );
  assert.deepEqual(patchCalls, []);

  await screen.actions.submit({ action: "claim", owner: "Sam Rivera" });
  assert.deepEqual(patchCalls, [
    [
      "lead_hotel_001",
      {
        status: "claimed",
        owner: "Sam Rivera"
      }
    ]
  ]);
});

test("lead detail action submission preserves auditable corrections", async () => {
  const patchCalls = [];
  const screen = createLeadDetailScreen({
    leadId: "lead_hotel_001",
    leads: {
      lead_hotel_001: {
        ...mockLeadDetails.lead_hotel_001,
        status: "flagged"
      }
    },
    patchLead: async (...args) => {
      patchCalls.push(args);
      return { ok: true };
    }
  });

  assert.deepEqual(
    screen.actions.items.map((item) => item.action),
    ["verified", "corrected", "dismiss"]
  );

  await screen.actions.submit({
    action: "corrected",
    correctionReason: "Reviewer confirmed source-backed crew range.",
    corrections: [
      {
        field: "estimatedCrewSize",
        originalAiValue: 12,
        originalSourceValue: "Permit scope lists two hotel wings and night work.",
        correctedValue: "10-12",
        correctedBy: "sam.rivera@groupscout.test",
        reason: "Permit scope lists two fewer subcontractors than the AI estimate."
      }
    ]
  });

  assert.deepEqual(patchCalls, [
    [
      "lead_hotel_001",
      {
        status: "flagged",
        corrections: [
          {
            field: "estimatedCrewSize",
            correctedValue: "10-12",
            originalAiValue: 12,
            originalSourceValue: "Permit scope lists two hotel wings and night work.",
            actor: "sam.rivera@groupscout.test",
            reason: "Permit scope lists two fewer subcontractors than the AI estimate."
          }
        ],
        correctionReason: "Reviewer confirmed source-backed crew range."
      }
    ]
  ]);
});

test("lead detail uses documented DESIGN.md component tokens", () => {
  const screen = createLeadDetailScreen({ leadId: "lead_hotel_001" });

  assert.equal(screen.tokens.card, designTokens.components["card-base"]);
  assert.equal(screen.tokens.row, designTokens.components["property-row"]);
  assert.equal(screen.tokens.original, designTokens.components["code-inline"]);
  assert.equal(screen.tokens.correction, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.rawAuditLink, designTokens.components["button-secondary"]);
  assert.equal(screen.tokens.primaryAction, designTokens.components["button-primary"]);
});

test("phase 3 mock detail data stays aligned with the inbox selected lead", () => {
  for (const inboxLead of mockLeadInboxLeads) {
    const detail = mockLeadDetails[inboxLead.id];
    const screen = createLeadDetailScreen({ leadId: inboxLead.id });

    assert.equal(detail.id, inboxLead.id);
    assert.equal(detail.summary.title, inboxLead.title);
    assert.equal(detail.summary.score, inboxLead.score);
    assert.equal(detail.summary.propertyFit, inboxLead.propertyFit);
    assert.equal(screen.state, "ready");
  }
});
