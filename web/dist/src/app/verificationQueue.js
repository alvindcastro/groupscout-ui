import { designTokens } from "../design/tokens.js";

export const VERIFICATION_TRIGGERS = {
  missing_raw_audit: {
    key: "missing_raw_audit",
    label: "Missing source or raw audit",
    severity: "high"
  },
  high_score_weak_rationale: {
    key: "high_score_weak_rationale",
    label: "High score with weak rationale",
    severity: "high"
  },
  raw_enrichment_contradiction: {
    key: "raw_enrichment_contradiction",
    label: "Raw/enrichment contradiction",
    severity: "medium"
  },
  low_confidence_parse: {
    key: "low_confidence_parse",
    label: "Low confidence collector parse",
    severity: "medium"
  },
  manual_operator_flag: {
    key: "manual_operator_flag",
    label: "Manual operator flag",
    severity: "medium"
  }
};

export const VERIFICATION_QUEUE_COLUMNS = [
  { key: "score", label: "Score" },
  { key: "lead", label: "Lead" },
  { key: "trigger", label: "Trigger" },
  { key: "source", label: "Source" },
  { key: "owner", label: "Owner" },
  { key: "raw-audit", label: "Raw audit" },
  { key: "updated", label: "Updated" }
];

export const RAW_AUDIT_REDACTION_POLICY = {
  status: "blocked",
  todo: "Define raw audit payload redaction rules before rendering sensitive fields inline."
};

export const mockVerificationQueueLeads = [
  {
    id: "lead_missing_raw",
    title: "Permit lead missing raw audit record",
    score: 88,
    source: "permit_feed",
    owner: "Dana Lee",
    updatedAt: "2026-05-07T18:00:00Z",
    sourceUrl: "https://permits.example.test/portland/missing-raw",
    rawAuditRecordId: null,
    aiRationale: "Permit indicates possible lodging demand.",
    aiConfidence: 0.74,
    collectorParseConfidence: 0.82,
    rawFields: { projectType: "renovation" },
    enrichedFields: { projectType: "renovation" },
    manuallyFlagged: false
  },
  {
    id: "lead_weak_rationale",
    title: "Hotel wing renovation with inferred crew need",
    score: 96,
    source: "permit_feed",
    owner: null,
    updatedAt: "2026-05-07T17:30:00Z",
    sourceUrl: "https://permits.example.test/portland/renovation-881",
    rawAuditRecordId: "audit_881",
    aiRationale: "Likely needs rooms.",
    aiConfidence: 0.51,
    collectorParseConfidence: 0.84,
    rawFields: { projectType: "renovation", crewSize: "12" },
    enrichedFields: { projectType: "renovation", crewSize: "12" },
    manuallyFlagged: false
  },
  {
    id: "lead_contradiction",
    title: "School roof repair marked as hotel renovation",
    score: 81,
    source: "planning_portal",
    owner: "Sam Rivera",
    updatedAt: "2026-05-06T15:00:00Z",
    sourceUrl: "https://planning.example.test/school-roof-42",
    rawAuditRecordId: "audit_42",
    aiRationale: "Planning record mentions roofing work.",
    aiConfidence: 0.7,
    collectorParseConfidence: 0.77,
    rawFields: { projectType: "roofing", propertyFit: "school" },
    enrichedFields: { projectType: "renovation", propertyFit: "hotel" },
    manuallyFlagged: false
  },
  {
    id: "lead_low_confidence",
    title: "Collector parse confidence below review threshold",
    score: 73,
    source: "builder_network",
    owner: null,
    updatedAt: "2026-05-05T12:00:00Z",
    sourceUrl: "https://builders.example.test/projects/low-confidence",
    rawAuditRecordId: "audit_low_confidence",
    aiRationale: "Builder post references temporary crew lodging.",
    aiConfidence: 0.69,
    collectorParseConfidence: 0.42,
    rawFields: { projectType: "painting" },
    enrichedFields: { projectType: "painting" },
    manuallyFlagged: false
  },
  {
    id: "lead_manual_flag",
    title: "Operator flagged lead with suspicious source detail",
    score: 67,
    source: "manual_review",
    owner: "Mina Park",
    updatedAt: "2026-05-05T10:15:00Z",
    sourceUrl: "https://review.example.test/leads/manual-flag",
    rawAuditRecordId: "audit_manual",
    aiRationale: "Reviewer requested a second look at the source details.",
    aiConfidence: 0.76,
    collectorParseConfidence: 0.86,
    rawFields: { projectType: "renovation" },
    enrichedFields: { projectType: "renovation" },
    manuallyFlagged: true
  }
];

const CONTROL_DEFINITIONS = [
  ["trigger", "Trigger", "select"],
  ["source", "Source", "select"],
  ["owner", "Owner", "select"],
  ["minScore", "Minimum score", "number"],
  ["clearFilters", "Clear filters", "button"]
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

export function classifyVerificationTriggers(lead) {
  const triggers = [];

  if (!lead?.sourceUrl || !lead?.rawAuditRecordId) {
    triggers.push(VERIFICATION_TRIGGERS.missing_raw_audit);
  }

  if (lead?.score >= 90 && (lead?.aiConfidence < 0.6 || isWeakRationale(lead.aiRationale))) {
    triggers.push(VERIFICATION_TRIGGERS.high_score_weak_rationale);
  }

  if (hasRawEnrichmentContradiction(lead)) {
    triggers.push(VERIFICATION_TRIGGERS.raw_enrichment_contradiction);
  }

  if (lead?.collectorParseConfidence < 0.5) {
    triggers.push(VERIFICATION_TRIGGERS.low_confidence_parse);
  }

  if (lead?.manuallyFlagged === true) {
    triggers.push(VERIFICATION_TRIGGERS.manual_operator_flag);
  }

  return triggers;
}

export function createVerificationQueueScreen({
  leads = mockVerificationQueueLeads,
  filters = {},
  state,
  errorMessage,
  viewport = "desktop"
} = {}) {
  const normalizedFilters = compactFilters(filters);
  const displayState = state ?? inferState(leads, normalizedFilters);
  const filteredLeads =
    displayState === "ready" || displayState === "empty"
      ? filterLeads(leads, normalizedFilters)
      : [];
  const layout = createLayout(viewport);
  const rows = layout.mode === "mobile-verification-cards" || displayState !== "ready"
    ? []
    : filteredLeads.map(createRow);

  const screen = {
    kind: "verification-queue-screen",
    heading: "Verification Queue",
    state: displayState,
    filters: {
      values: normalizedFilters,
      activeCount: Object.keys(normalizedFilters).length
    },
    controls: createControls(),
    layout,
    table: {
      dense: true,
      columns: VERIFICATION_QUEUE_COLUMNS,
      visibleColumns: layout.visibleColumns,
      hiddenColumns: layout.hiddenColumns,
      rowMinHeight: 44,
      rows
    },
    mobileCards:
      layout.mode === "mobile-verification-cards" && displayState === "ready"
        ? filteredLeads.map(createMobileCard)
        : [],
    rawAuditReview: {
      endpoint: "GET /api/leads/{id}/raw",
      inlinePayloadRendering: false,
      redaction: RAW_AUDIT_REDACTION_POLICY
    },
    tokens: {
      filter: designTokens.components["search-pill"],
      input: designTokens.components["text-input"],
      tableSurface: designTokens.components["feature-comparison-table"],
      row: designTokens.components["property-row"],
      primaryAction: designTokens.components["button-primary"],
      secondaryAction: designTokens.components["button-secondary"],
      triggerBadge: designTokens.components["badge-tag"],
      typeBadge: designTokens.components["badge-type"]
    },
    actions: {
      clearFilters: () => createVerificationQueueScreen({ leads, viewport }),
      returnToLead: (leadId) => ({
        type: "navigate",
        href: `/leads/${leadId}`
      })
    }
  };

  if (displayState === "loading") {
    screen.statusRegion = {
      role: "status",
      message: "Loading verification queue."
    };
  }

  if (displayState === "empty") {
    screen.emptyState = {
      title: Object.keys(normalizedFilters).length
        ? "No leads match these verification filters"
        : "No leads require verification",
      action: { label: "Clear filters" }
    };
  }

  if (displayState === "error") {
    screen.statusRegion = {
      role: "alert",
      message: errorMessage ?? "Verification queue could not load."
    };
    screen.errorState = {
      title: "Verification queue could not load",
      message: errorMessage ?? "Try again after the verification API recovers."
    };
  }

  return screen;
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
      mode: "mobile-verification-cards",
      visibleColumns: [],
      hiddenColumns: VERIFICATION_QUEUE_COLUMNS.map((column) => column.key)
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-verification-table",
      visibleColumns: VERIFICATION_QUEUE_COLUMNS.filter(
        (column) => !["source", "updated"].includes(column.key)
      ),
      hiddenColumns: ["source", "updated"]
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-verification-table",
    visibleColumns: VERIFICATION_QUEUE_COLUMNS,
    hiddenColumns: []
  };
}

function createRow(lead) {
  const triggers = classifyVerificationTriggers(lead);
  const primaryTrigger = triggers[0];
  const cells = {
    score: String(lead.score),
    lead: lead.title,
    trigger: primaryTrigger.label,
    source: formatValue(lead.source),
    owner: lead.owner ?? "Unowned",
    "raw-audit": lead.rawAuditRecordId ? "Available" : "Missing",
    updated: DATE_TIME_FORMATTER.format(new Date(lead.updatedAt))
  };

  return {
    id: lead.id,
    priority: primaryTrigger.severity,
    cells,
    triggers,
    rawAuditLink: createRawAuditLink(lead.id),
    href: `/leads/${lead.id}`,
    actions: createRowActions(lead.id),
    tabIndex: 0,
    minTouchTarget: 44
  };
}

function createMobileCard(lead) {
  const row = createRow(lead);

  return {
    id: lead.id,
    title: lead.title,
    score: row.cells.score,
    trigger: row.cells.trigger,
    meta: [row.cells.source, row.cells.owner, row.cells["raw-audit"]],
    rawAuditLink: row.rawAuditLink,
    actions: row.actions,
    href: row.href,
    touchTarget: { minHeight: 44 }
  };
}

function createRawAuditLink(leadId) {
  return {
    label: "Open raw audit evidence",
    href: `/api/leads/${encodeURIComponent(leadId)}/raw`,
    endpoint: "GET /api/leads/{id}/raw",
    loadsInline: false
  };
}

function createRowActions(leadId) {
  return [
    {
      action: "verify",
      label: "Verify",
      intent: "patch-status",
      resultStatus: "verified",
      token: "button-primary",
      minTouchTarget: 44
    },
    {
      action: "correct",
      label: "Correct",
      intent: "open-correction",
      href: `/leads/${leadId}`,
      token: "button-secondary",
      minTouchTarget: 44
    },
    {
      action: "dismiss",
      label: "Dismiss",
      intent: "patch-status",
      resultStatus: "dismissed",
      token: "button-secondary",
      minTouchTarget: 44
    },
    {
      action: "return_to_lead",
      label: "Return to lead",
      intent: "navigate",
      href: `/leads/${leadId}`,
      token: "button-secondary",
      minTouchTarget: 44
    }
  ];
}

function filterLeads(leads, filters) {
  return leads.filter((lead) => {
    const triggers = classifyVerificationTriggers(lead);
    const triggerKeys = triggers.map((trigger) => trigger.key);

    if (triggerKeys.length === 0) return false;
    if (filters.trigger && !triggerKeys.includes(filters.trigger)) return false;
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.owner === "unowned" && lead.owner) return false;
    if (filters.owner && filters.owner !== "unowned" && lead.owner !== filters.owner) return false;
    if (filters.minScore && lead.score < Number(filters.minScore)) return false;

    return true;
  });
}

function inferState(leads, filters) {
  return filterLeads(leads, filters).length > 0 ? "ready" : "empty";
}

function compactFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function isWeakRationale(rationale) {
  return typeof rationale !== "string" || rationale.trim().split(/\s+/).length < 5;
}

function hasRawEnrichmentContradiction(lead) {
  if (!lead?.rawFields || !lead?.enrichedFields) return false;

  return Object.entries(lead.rawFields).some(
    ([field, value]) =>
      lead.enrichedFields[field] !== undefined && String(lead.enrichedFields[field]) !== String(value)
  );
}

function formatValue(value) {
  return String(value).replaceAll("_", " ");
}
