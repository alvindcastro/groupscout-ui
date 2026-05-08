import { designTokens } from "../design/tokens.js";
import {
  createLeadFieldCorrection,
  createLeadStatusMutation,
  getLeadStatusActions
} from "./leadStatus.js";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short"
});

const SECTION_TITLES = [
  "Summary",
  "Source Evidence",
  "AI Enrichment",
  "Actions",
  "Outreach",
  "Activity"
];

export const mockLeadDetails = {
  lead_hotel_001: {
    id: "lead_hotel_001",
    status: "new",
    summary: {
      title: "Riverside hotel renovation crew block",
      score: 96,
      timing: "today",
      roomNightSignal: "336 room nights",
      propertyFit: "hotel"
    },
    sourceEvidence: {
      sourceName: "Portland permit feed",
      sourceUrl: "https://permits.example.test/portland/renovation-881",
      rawAuditHref: "/api/leads/lead_hotel_001/raw",
      collectedAt: "2026-05-07T16:10:00Z"
    },
    aiEnrichment: {
      rationale:
        "Permit scope mentions occupied hotel floor renovation and multi-week subcontractor scheduling.",
      uncertainty: {
        level: "medium",
        reason: "Crew size is inferred from subcontractor count and may need reviewer confirmation."
      },
      claims: [
        {
          field: "Contractor / applicant",
          value: "Northwest Build Partners"
        },
        {
          field: "Project type",
          value: "renovation"
        },
        {
          field: "Crew size",
          value: "12",
          reviewerCorrection: "10-12"
        },
        {
          field: "Duration",
          value: "28 days"
        }
      ]
    },
    actions: [
      "Claim lead",
      "Mark reviewed",
      "Dismiss",
      "Request correction"
    ],
    outreach: {
      recommendedTiming: "Call property manager today before 4 PM local time.",
      contact: {
        channel: "email",
        value: "manager@riverside.example"
      },
      draft:
        "Riverside hotel renovation crew block: GroupScout can hold rooms for your renovation crew near the property this week.",
      attempts: [
        {
          channel: "phone",
          label: "Initial call queued",
          contact: "+1-555-0100",
          notes: "Call task prepared for the assigned operator.",
          outcome: "contacted",
          timestamp: "2026-05-07T17:05:00Z"
        },
        {
          channel: "email",
          label: "Email draft copied",
          contact: "manager@riverside.example",
          notes: "Operator copied the draft into their inbox for manual sending.",
          outcome: "contacted",
          timestamp: "2026-05-07T18:10:00Z"
        }
      ]
    },
    activity: [
      {
        type: "status_history",
        label: "Lead created",
        detail: "New lead created from permit ingestion.",
        timestamp: "2026-05-07T16:10:00Z"
      },
      {
        type: "note",
        label: "Ops note",
        detail: "Property has historically accepted crew blocks during remodels.",
        timestamp: "2026-05-07T16:20:00Z"
      },
      {
        type: "outreach_attempt",
        label: "Initial call queued",
        detail: "Call task prepared for the assigned operator.",
        timestamp: "2026-05-07T17:05:00Z"
      },
      {
        type: "outreach_attempt",
        label: "Email draft copied",
        detail: "Operator copied the draft into their inbox for manual sending.",
        timestamp: "2026-05-07T18:10:00Z"
      },
      {
        type: "outreach_outcome",
        label: "Outcome captured",
        detail: "Manual outreach outcome recorded as contacted.",
        timestamp: "2026-05-07T18:20:00Z"
      },
      {
        type: "reviewer_correction",
        label: "Crew size corrected",
        detail: "Reviewer suggested keeping 10-12 alongside the original extracted value.",
        timestamp: "2026-05-07T17:22:00Z"
      }
    ]
  }
};

export function createLeadDetailScreen({
  leadId,
  leads = mockLeadDetails,
  state,
  errorMessage,
  viewport = "desktop",
  patchLead = async () => {
    throw new Error("Lead status mutation client is not configured");
  },
  logLeadOutreach = async () => {
    throw new Error("Lead outreach logging client is not configured");
  }
} = {}) {
  const lead = leadId ? leads[leadId] : undefined;
  const displayState = state ?? (lead ? "ready" : "not-found");
  const layout = createLayout(viewport);
  const baseScreen = {
    kind: "lead-detail-screen",
    leadId,
    state: displayState,
    heading: lead?.summary.title ?? "Lead Detail",
    layout,
    sections: SECTION_TITLES.map((title) => ({
      title,
      token: "card-base"
    })),
    tokens: {
      card: designTokens.components["card-base"],
      row: designTokens.components["property-row"],
      original: designTokens.components["code-inline"],
      correction: designTokens.components["badge-tag"],
      rawAuditLink: designTokens.components["button-secondary"],
      primaryAction: designTokens.components["button-primary"],
      typeBadge: designTokens.components["badge-type"]
    }
  };

  if (displayState === "loading") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "status",
        message: "Loading lead evidence workspace."
      }
    };
  }

  if (displayState === "error") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: errorMessage ?? "Lead detail could not load."
      },
      errorState: {
        title: "Lead detail could not load",
        message: errorMessage ?? "Try again after the evidence API recovers."
      }
    };
  }

  if (!lead) {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: `Lead ${leadId} was not found.`
      },
      notFoundState: {
        title: "Lead not found",
        message: `No lead evidence workspace exists for ${leadId}.`
      }
    };
  }

  const sourceEvidence = createSourceEvidence(lead);

  return {
    ...baseScreen,
    summary: createSummary(lead),
    sourceEvidence,
    aiEnrichment: createAiEnrichment(lead, sourceEvidence),
    actions: createActions(lead, layout, patchLead),
    outreach: createOutreach(lead, logLeadOutreach),
    activity: createActivity(lead)
  };
}

function createSummary(lead) {
  return {
    items: [
      ["Title", lead.summary.title],
      ["Score", String(lead.summary.score)],
      ["Timing", lead.summary.timing],
      ["Room-night signal", lead.summary.roomNightSignal],
      ["Property fit", lead.summary.propertyFit]
    ]
  };
}

function createSourceEvidence(lead) {
  return {
    sourceName: lead.sourceEvidence.sourceName,
    sourceUrl: lead.sourceEvidence.sourceUrl,
    rawAuditLink: {
      label: "Open raw audit record",
      href: lead.sourceEvidence.rawAuditHref,
      loadsInline: false
    },
    collectedAt: DATE_TIME_FORMATTER.format(new Date(lead.sourceEvidence.collectedAt))
  };
}

function createAiEnrichment(lead, sourceEvidence) {
  return {
    rationale: lead.aiEnrichment.rationale,
    uncertainty: lead.aiEnrichment.uncertainty,
    claims: lead.aiEnrichment.claims.map((claim) => createClaim(claim, sourceEvidence))
  };
}

function createClaim(claim, sourceEvidence) {
  const original = {
    label: "Original AI extraction",
    value: claim.value,
    visualRole: "source-backed",
    token: "code-inline"
  };
  const reviewerCorrection = claim.reviewerCorrection
    ? {
        label: "Reviewer correction",
        value: claim.reviewerCorrection,
        visualRole: "reviewer-correction",
        token: "badge-tag"
      }
    : null;

  return {
    field: claim.field,
    displayValue: claim.value,
    correctionPolicy: reviewerCorrection ? "show-alongside-original" : "none",
    original,
    reviewerCorrection,
    evidence: {
      sourceName: sourceEvidence.sourceName,
      sourceUrl: sourceEvidence.sourceUrl,
      rawAuditHref: sourceEvidence.rawAuditLink.href
    }
  };
}

function createActions(lead, layout, patchLead) {
  return {
    readOnly: false,
    position: layout.actionPosition,
    items: getLeadStatusActions(lead).map((action) => ({
      ...action,
      disabled: false,
      minTouchTarget: 44,
      reason: null
    })),
    submit: async ({ action, corrections, ...fields } = {}) => {
      const normalizedCorrections = Array.isArray(corrections)
        ? corrections.map(createLeadFieldCorrection)
        : corrections;
      const mutation = createLeadStatusMutation({
        ...fields,
        leadId: lead.id,
        currentStatus: lead.status,
        action,
        corrections: normalizedCorrections
      });

      return patchLead(lead.id, mutation.body);
    }
  };
}

function createOutreach(lead, logLeadOutreach) {
  return {
    recommendedTiming: lead.outreach.recommendedTiming,
    workspace: createOutreachWorkspace(lead, logLeadOutreach),
    attempts: lead.outreach.attempts.map((attempt) => ({
      ...attempt,
      timestamp: DATE_TIME_FORMATTER.format(new Date(attempt.timestamp))
    }))
  };
}

function createOutreachWorkspace(lead, logLeadOutreach) {
  return {
    kind: "outreach-workspace",
    autoSendEnabled: false,
    contactFields: [
      createContactField("channel", "Channel"),
      createContactField("contact", "Contact"),
      createContactField("draft", "Draft"),
      createContactField("notes", "Notes"),
      createContactField("outcome", "Outcome")
    ],
    draft: {
      state: "editable",
      value: lead.outreach.draft,
      token: "text-input"
    },
    defaultContact: {
      channel: lead.outreach.contact.channel,
      value: lead.outreach.contact.value
    },
    outcomeOptions: [
      { value: "contacted", label: "Contacted" },
      { value: "won", label: "Won" },
      { value: "lost", label: "Lost" },
      { value: "no_response", label: "No response" }
    ],
    displayStates: [
      { state: "drafting", label: "Drafting", sendsMessage: false },
      { state: "copied", label: "Copied", sendsMessage: false },
      { state: "sent_manually", label: "Sent manually", sendsMessage: false },
      { state: "logged", label: "Logged", sendsMessage: false }
    ],
    actions: [
      { action: "copy_draft", label: "Copy draft", token: "button-secondary", sendsMessage: false },
      {
        action: "mark_sent_manually",
        label: "Mark sent manually",
        token: "button-secondary",
        sendsMessage: false
      },
      { action: "log_attempt", label: "Log attempt", token: "button-primary", sendsMessage: false }
    ],
    validateLogAttempt,
    logAttempt: async (attempt) => {
      const payload = validateLogAttempt(attempt);
      return logLeadOutreach(lead.id, payload);
    }
  };
}

function createContactField(name, label) {
  return {
    name,
    label,
    required: true,
    token: "text-input",
    minTouchTarget: 44
  };
}

function validateLogAttempt(attempt = {}) {
  const missingFields = ["channel", "contact", "notes", "outcome"].filter(
    (field) => attempt[field] === undefined || attempt[field] === null || attempt[field] === ""
  );

  if (missingFields.length > 0) {
    throw new Error(`Outreach attempt requires ${missingFields.join(", ")}`);
  }

  if (!["contacted", "won", "lost", "no_response"].includes(attempt.outcome)) {
    throw new Error("Outreach outcome must be contacted, won, lost, or no_response");
  }

  return {
    channel: attempt.channel,
    contact: attempt.contact,
    notes: attempt.notes,
    outcome: attempt.outcome
  };
}

function createActivity(lead) {
  return {
    entries: lead.activity.map((entry) => ({
      ...entry,
      timestamp: DATE_TIME_FORMATTER.format(new Date(entry.timestamp))
    }))
  };
}

function createLayout(viewport) {
  if (viewport === "mobile") {
    return {
      viewport,
      mode: "mobile-detail-stack",
      regions: ["summary", "actions", "evidence", "activity"],
      actionPosition: "sticky-bottom",
      contentMaxWidth: "100%"
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-evidence-stack",
      regions: ["summary", "actions", "evidence", "activity"],
      actionPosition: "top-bar",
      contentMaxWidth: "720px"
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-evidence-workspace",
    regions: ["summary", "evidence", "side-panel"],
    actionPosition: "side-panel",
    contentMaxWidth: "1120px"
  };
}
