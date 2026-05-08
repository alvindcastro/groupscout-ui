import { designTokens } from "../design/tokens.js";

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
      rawAuditHref: "/api/leads/lead_hotel_001/audit/raw",
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
      attempts: [
        {
          channel: "phone",
          label: "Initial call queued",
          timestamp: "2026-05-07T17:05:00Z"
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
  viewport = "desktop"
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
    actions: createActions(lead, layout),
    outreach: createOutreach(lead),
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

function createActions(lead, layout) {
  return {
    readOnly: true,
    position: layout.actionPosition,
    items: lead.actions.map((label) => ({
      label,
      disabled: true,
      minTouchTarget: 44,
      reason: "Read-only during Phase 3"
    }))
  };
}

function createOutreach(lead) {
  return {
    recommendedTiming: lead.outreach.recommendedTiming,
    attempts: lead.outreach.attempts.map((attempt) => ({
      ...attempt,
      timestamp: DATE_TIME_FORMATTER.format(new Date(attempt.timestamp))
    }))
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
