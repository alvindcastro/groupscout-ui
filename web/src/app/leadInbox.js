import { designTokens } from "../design/tokens.js";

export const LEAD_INBOX_COLUMNS = [
  { key: "score", label: "Score" },
  { key: "title", label: "Title" },
  { key: "segment-project", label: "Segment / Project" },
  { key: "location-property", label: "Location / Property" },
  { key: "source", label: "Source" },
  { key: "crew-duration", label: "Crew / Duration" },
  { key: "outreach-timing", label: "Outreach Timing" },
  { key: "status", label: "Status" },
  { key: "owner", label: "Owner" },
  { key: "created", label: "Created" },
  { key: "evidence-verification", label: "Evidence / Verification" }
];

export const mockLeadInboxLeads = [
  {
    id: "lead_hotel_001",
    score: 96,
    title: "Riverside hotel renovation crew block",
    segment: "commercial",
    projectType: "renovation",
    location: "Portland, OR",
    propertyFit: "hotel",
    source: "permit_feed",
    estimatedCrewSize: 12,
    estimatedDurationDays: 28,
    outreachTiming: "today",
    status: "new",
    owner: null,
    createdAt: "2026-05-07T16:10:00Z",
    evidenceState: "source_linked",
    verificationState: "needs_review"
  },
  {
    id: "lead_school_002",
    score: 82,
    title: "Riverside school roof replacement",
    segment: "institutional",
    projectType: "roofing",
    location: "Bend, OR",
    propertyFit: "extended stay",
    source: "planning_portal",
    estimatedCrewSize: 7,
    estimatedDurationDays: 14,
    outreachTiming: "this week",
    status: "claimed",
    owner: "Sam Rivera",
    createdAt: "2026-05-05T11:00:00Z",
    evidenceState: "source_linked",
    verificationState: "verified"
  },
  {
    id: "lead_multifamily_003",
    score: 74,
    title: "Eastside multifamily exterior paint",
    segment: "residential",
    projectType: "painting",
    location: "Tacoma, WA",
    propertyFit: "multifamily",
    source: "builder_network",
    estimatedCrewSize: 5,
    estimatedDurationDays: 10,
    outreachTiming: "tomorrow",
    status: "notified",
    owner: "Dana Lee",
    createdAt: "2026-05-03T09:30:00Z",
    evidenceState: "partial",
    verificationState: "pending"
  }
];

const CONTROL_DEFINITIONS = [
  ["q", "Search leads", "search"],
  ["status", "Status", "select"],
  ["source", "Source", "select"],
  ["minScore", "Minimum score", "number"],
  ["createdFrom", "Created from", "date"],
  ["createdTo", "Created to", "date"],
  ["property", "Property", "select"],
  ["owner", "Owner", "select"],
  ["verificationState", "Verification", "select"],
  ["clearFilters", "Clear filters", "button"]
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

export function createLeadInboxScreen({
  leads = mockLeadInboxLeads,
  filters = {},
  selectedLeadId = null,
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
  const rows = displayState === "ready"
    ? filteredLeads.map((lead) => createRow(lead, selectedLeadId))
    : [];

  const screen = {
    kind: "lead-inbox-screen",
    heading: "Lead Inbox",
    state: displayState,
    filters: {
      values: normalizedFilters,
      activeCount: Object.keys(normalizedFilters).length
    },
    queryState: normalizedFilters,
    controls: createControls(),
    layout,
    table: {
      dense: true,
      columns: LEAD_INBOX_COLUMNS,
      visibleColumns: layout.visibleColumns,
      hiddenColumns: layout.hiddenColumns,
      rowMinHeight: 44,
      rows
    },
    mobileCards: layout.mode === "mobile-lead-list"
      ? filteredLeads.map(createMobileCard)
      : [],
    detailNavigation: {
      currentLeadId: selectedLeadId,
      basePath: "/leads"
    },
    accessibility: {
      focusOrder: [
        ...CONTROL_DEFINITIONS.map(([name]) => name),
        ...(rows[0] ? [rows[0].id] : [])
      ]
    },
    tokens: {
      input: designTokens.components["text-input"],
      button: designTokens.components["button-secondary"],
      tab: designTokens.components["segmented-tab-active"],
      filter: designTokens.components["search-pill"],
      badge: designTokens.components["badge-tag"],
      typeBadge: designTokens.components["badge-type"],
      tableSurface: designTokens.components["feature-comparison-table"],
      tableRow: designTokens.components["property-row"]
    },
    actions: {
      clearFilters: () => createLeadInboxScreen({ leads, viewport, selectedLeadId }),
      selectLead: (leadId) => ({
        type: "navigate",
        href: `/leads/${leadId}`,
        selectedLeadId: leadId
      })
    }
  };

  if (displayState === "loading") {
    screen.statusRegion = {
      role: "status",
      message: "Loading leads for review."
    };
  }

  if (displayState === "empty") {
    screen.emptyState = {
      title: Object.keys(normalizedFilters).length
        ? "No leads match these filters"
        : "No leads available",
      action: { label: "Clear filters" }
    };
  }

  if (displayState === "error") {
    screen.statusRegion = {
      role: "alert",
      message: errorMessage ?? "Lead inbox could not load."
    };
    screen.errorState = {
      title: "Lead inbox could not load",
      message: errorMessage ?? "Try again after the API recovers."
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
      mode: "mobile-lead-list",
      visibleColumns: [],
      hiddenColumns: LEAD_INBOX_COLUMNS.map((column) => column.key)
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-priority-table",
      visibleColumns: LEAD_INBOX_COLUMNS.filter(
        (column) => !["source", "created"].includes(column.key)
      ),
      hiddenColumns: ["source", "created"]
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-table",
    visibleColumns: LEAD_INBOX_COLUMNS,
    hiddenColumns: []
  };
}

function createRow(lead, selectedLeadId) {
  const cells = createCells(lead);

  return {
    id: lead.id,
    selected: lead.id === selectedLeadId,
    priority: lead.status === "new" && !lead.owner && lead.score >= 90
      ? "urgent-unowned"
      : "standard",
    cells,
    summaryCells: [cells.score, cells.title, cells["location-property"], cells.status],
    href: `/leads/${lead.id}`,
    activationLabel: `Open lead ${lead.title}`,
    tabIndex: 0,
    minTouchTarget: 44
  };
}

function createMobileCard(lead) {
  const cells = createCells(lead);

  return {
    id: lead.id,
    title: lead.title,
    score: cells.score,
    meta: [
      cells["segment-project"],
      cells["location-property"],
      cells["outreach-timing"],
      cells["evidence-verification"]
    ],
    href: `/leads/${lead.id}`,
    touchTarget: { minHeight: 44 }
  };
}

function createCells(lead) {
  return {
    score: String(lead.score),
    title: lead.title,
    "segment-project": `${lead.segment} / ${lead.projectType}`,
    "location-property": `${lead.location} / ${lead.propertyFit}`,
    source: formatValue(lead.source),
    "crew-duration": `${lead.estimatedCrewSize} crew / ${lead.estimatedDurationDays} days`,
    "outreach-timing": lead.outreachTiming,
    status: formatValue(lead.status),
    owner: lead.owner ?? "Unowned",
    created: DATE_FORMATTER.format(new Date(lead.createdAt)),
    "evidence-verification": `${formatValue(lead.evidenceState)} / ${formatValue(
      lead.verificationState
    )}`
  };
}

function filterLeads(leads, filters) {
  return leads.filter((lead) => {
    const haystack = [
      lead.title,
      lead.segment,
      lead.projectType,
      lead.location,
      lead.propertyFit,
      lead.source,
      lead.status,
      lead.owner,
      lead.evidenceState,
      lead.verificationState
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (filters.q && !haystack.includes(String(filters.q).toLowerCase())) return false;
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.minScore && lead.score < Number(filters.minScore)) return false;
    if (filters.createdFrom && lead.createdAt.slice(0, 10) < filters.createdFrom) return false;
    if (filters.createdTo && lead.createdAt.slice(0, 10) > filters.createdTo) return false;
    if (filters.property && lead.propertyFit !== filters.property) return false;
    if (filters.owner === "unowned" && lead.owner) return false;
    if (filters.owner && filters.owner !== "unowned" && lead.owner !== filters.owner) return false;
    if (filters.verificationState && lead.verificationState !== filters.verificationState) {
      return false;
    }

    return true;
  });
}

function inferState(leads, filters) {
  return filterLeads(leads, filters).length ? "ready" : "empty";
}

function compactFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function formatValue(value) {
  return String(value).replaceAll("_", " ");
}
