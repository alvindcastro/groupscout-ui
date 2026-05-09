import { designTokens } from "../design/tokens.js";

export const OUTREACH_OUTCOMES = [
  { key: "contacted", label: "Contacted" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "no_response", label: "No response" }
];

export const OUTREACH_DISPLAY_STATES = {
  draft: {
    key: "draft",
    label: "Draft ready",
    description: "Outreach draft is ready for operator review.",
    sendsEmail: false
  },
  copied: {
    key: "copied",
    label: "Draft copied",
    description: "Message copied for manual outreach.",
    sendsEmail: false
  },
  sent: {
    key: "sent",
    label: "Marked sent",
    description: "Operator reported this outreach was sent outside GroupScout.",
    sendsEmail: false
  },
  logged: {
    key: "logged",
    label: "Attempt logged",
    description: "Outreach attempt and outcome were added to the activity log.",
    sendsEmail: false
  }
};

export const mockOutreachLeads = {
  lead_hotel_001: {
    id: "lead_hotel_001",
    title: "Riverside hotel renovation crew block",
    score: 96,
    company: "Riverside Hotel",
    propertyFit: "hotel",
    outreachTiming: "Call property manager today before 4 PM local time.",
    contact: {
      name: "Riley Chen",
      role: "Property manager",
      email: "riley@example.test",
      phone: "503-555-0140"
    },
    draft: {
      channel: "email",
      subject: "Crew lodging support for Riverside Hotel renovation",
      message:
        "Hi Riley, I saw the Riverside Hotel renovation permit and wanted to check whether your team needs a crew lodging block for the hotel renovation timeline."
    },
    outreachHistory: [
      {
        id: "outreach_001",
        channel: "email",
        contact: {
          name: "Riley Chen",
          role: "Property manager",
          email: "riley@example.test"
        },
        notes: "Copied draft into operator email client.",
        outcome: "contacted",
        timestamp: "2026-05-07T18:05:00Z"
      },
      {
        id: "outreach_002",
        channel: "phone",
        contact: {
          name: "Riley Chen",
          role: "Property manager",
          phone: "503-555-0140"
        },
        notes: "Called front desk and left a voicemail for the property manager.",
        outcome: "no_response",
        timestamp: "2026-05-08T16:00:00Z"
      }
    ]
  }
};

const DRAFT_FIELDS = [
  ["channel", "Channel", "select"],
  ["contactName", "Contact name", "text"],
  ["contactRole", "Contact role", "text"],
  ["contactEmail", "Contact email", "email"],
  ["contactPhone", "Contact phone", "tel"],
  ["subject", "Subject", "text"],
  ["message", "Message draft", "textarea"]
];

const CONTROL_DEFINITIONS = [
  ["copyDraft", "Copy draft", "button"],
  ["markSent", "Mark sent", "button"],
  ["logAttempt", "Log attempt", "button"],
  ["outcome", "Outcome", "select"]
];

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short"
});

export function createOutreachWorkspaceScreen({
  leadId,
  leads = mockOutreachLeads,
  state,
  errorMessage,
  viewport = "desktop",
  displayState = "draft",
  postOutreach = async () => {
    throw new Error("Outreach mutation client is not configured");
  }
} = {}) {
  const lead = leadId ? leads[leadId] : undefined;
  const resolvedState = state ?? (lead ? "ready" : "not-found");
  const baseScreen = {
    kind: "outreach-workspace-screen",
    heading: "Outreach Workspace",
    leadId,
    state: resolvedState,
    layout: createLayout(viewport),
    controls: createControls(),
    tokens: {
      card: designTokens.components["card-base"],
      input: designTokens.components["text-input"],
      primaryAction: designTokens.components["button-primary"],
      secondaryAction: designTokens.components["button-secondary"],
      outcomeBadge: designTokens.components["badge-tag"],
      timelineRow: designTokens.components["property-row"],
      typeBadge: designTokens.components["badge-type"]
    },
    sendPolicy: {
      autoSendEmail: false,
      crmSync: false
    }
  };

  if (resolvedState === "loading") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "status",
        message: "Loading outreach workspace."
      }
    };
  }

  if (resolvedState === "error") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: errorMessage ?? "Outreach workspace could not load."
      },
      errorState: {
        title: "Outreach workspace could not load",
        message: errorMessage ?? "Try again after the outreach API recovers."
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
        message: `No outreach workspace exists for ${leadId}.`
      }
    };
  }

  return {
    ...baseScreen,
    lead: createLeadSummary(lead),
    displayState: OUTREACH_DISPLAY_STATES[displayState] ?? OUTREACH_DISPLAY_STATES.draft,
    draft: createDraft(lead),
    outcomeOptions: OUTREACH_OUTCOMES,
    activity: createOutreachActivityTimeline(lead.outreachHistory),
    actions: createActions(lead, postOutreach)
  };
}

export function createOutreachAttemptMutation({
  leadId,
  channel,
  contactName,
  contactRole,
  contactEmail,
  contactPhone,
  notes,
  outcome
} = {}) {
  validateOutreachAttempt({
    channel,
    contactName,
    contactEmail,
    contactPhone,
    notes,
    outcome
  });

  return {
    method: "POST",
    path: `/api/leads/${encodeURIComponent(leadId)}/outreach`,
    body: {
      channel,
      contact: {
        name: contactName,
        role: contactRole ?? "",
        email: contactEmail ?? "",
        phone: contactPhone ?? ""
      },
      notes,
      outcome
    }
  };
}

export function createOutreachHistoryRequest(leadId) {
  return {
    method: "GET",
    path: `/api/leads/${encodeURIComponent(leadId)}/outreach`
  };
}

export function createOutreachActivityTimeline(history = []) {
  return {
    entries: history.map((attempt) => ({
      id: attempt.id,
      type: "outreach_attempt",
      channel: attempt.channel,
      contact: formatContact(attempt.contact),
      notes: attempt.notes,
      outcome: findOutcome(attempt.outcome),
      timestamp: DATE_TIME_FORMATTER.format(new Date(attempt.timestamp)),
      manualOnly: true
    }))
  };
}

function createLeadSummary(lead) {
  return {
    id: lead.id,
    title: lead.title,
    score: String(lead.score),
    company: lead.company,
    propertyFit: lead.propertyFit,
    outreachTiming: lead.outreachTiming
  };
}

function createDraft(lead) {
  return {
    fields: DRAFT_FIELDS.map(([name, label, type]) => ({
      name,
      label,
      type,
      editable: true,
      ariaLabel: label,
      token: "text-input",
      minTouchTarget: 44
    })),
    values: {
      channel: lead.draft.channel,
      contactName: lead.contact.name,
      contactRole: lead.contact.role,
      contactEmail: lead.contact.email,
      contactPhone: lead.contact.phone,
      subject: lead.draft.subject,
      message: lead.draft.message
    },
    autoSendEnabled: false
  };
}

function createActions(lead, postOutreach) {
  return {
    copyDraft: () => ({
      type: "clipboard",
      leadId: lead.id,
      displayState: "copied",
      sendsEmail: false
    }),
    markSent: () => ({
      type: "manual-status",
      leadId: lead.id,
      displayState: "sent",
      sendsEmail: false
    }),
    logOnly: () => ({
      type: "manual-log",
      leadId: lead.id,
      displayState: "logged",
      sendsEmail: false
    }),
    logAttempt: async (attempt) => {
      const mutation = createOutreachAttemptMutation({
        ...attempt,
        leadId: lead.id
      });

      return postOutreach(mutation.path, mutation.body);
    }
  };
}

function createControls() {
  return CONTROL_DEFINITIONS.map(([name, label, type]) => ({
    name,
    label,
    type,
    ariaLabel: label,
    minTouchTarget: 44,
    token: type === "button" ? "button-secondary" : "text-input"
  }));
}

function createLayout(viewport) {
  if (viewport === "mobile") {
    return {
      viewport,
      mode: "mobile-outreach-stack",
      regions: ["lead", "draft", "log", "activity"],
      contentMaxWidth: "100%"
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-outreach-stack",
      regions: ["lead", "draft", "log", "activity"],
      contentMaxWidth: "720px"
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-outreach-workspace",
    regions: ["lead", "draft", "activity"],
    contentMaxWidth: "1120px"
  };
}

function validateOutreachAttempt({ channel, contactName, contactEmail, contactPhone, notes, outcome }) {
  if (!channel) throw new Error("Channel is required.");
  if (!contactName) throw new Error("Contact name is required.");
  if (channel === "email" && !contactEmail) throw new Error("Contact email is required.");
  if (channel === "phone" && !contactPhone) throw new Error("Contact phone is required.");
  if (!notes) throw new Error("Notes are required.");
  if (!OUTREACH_OUTCOMES.some((item) => item.key === outcome)) {
    throw new Error("Outcome is required.");
  }
}

function findOutcome(key) {
  return OUTREACH_OUTCOMES.find((outcome) => outcome.key === key) ?? {
    key,
    label: formatValue(key)
  };
}

function formatContact(contact = {}) {
  return [contact.name, contact.role].filter(Boolean).join(", ");
}

function formatValue(value) {
  return String(value).replaceAll("_", " ");
}
