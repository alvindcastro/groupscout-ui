import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LEAD_INBOX_COLUMNS,
  createLeadInboxScreen,
  mockLeadInboxLeads
} from "../web/src/app/leadInbox.js";
import { designTokens } from "../web/src/design/tokens.js";

const expectedColumnLabels = [
  "Score",
  "Title",
  "Segment / Project",
  "Location / Property",
  "Source",
  "Crew / Duration",
  "Outreach Timing",
  "Status",
  "Owner",
  "Created",
  "Evidence / Verification"
];

test("lead inbox renders the dense operations table columns and mocked lead rows", () => {
  const screen = createLeadInboxScreen();

  assert.equal(screen.kind, "lead-inbox-screen");
  assert.equal(screen.state, "ready");
  assert.equal(screen.heading, "Lead Inbox");
  assert.deepEqual(
    LEAD_INBOX_COLUMNS.map((column) => column.label),
    expectedColumnLabels
  );
  assert.deepEqual(
    screen.table.columns.map((column) => column.label),
    expectedColumnLabels
  );
  assert.ok(screen.table.dense, "lead inbox should default to dense scanning");
  assert.equal(screen.table.rows.length, mockLeadInboxLeads.length);

  const firstRow = screen.table.rows[0];
  assert.deepEqual(firstRow.cells, {
    score: "96",
    title: "Riverside hotel renovation crew block",
    "segment-project": "commercial / renovation",
    "location-property": "Portland, OR / hotel",
    source: "permit feed",
    "crew-duration": "12 crew / 28 days",
    "outreach-timing": "today",
    status: "new",
    owner: "Unowned",
    created: "May 7, 2026",
    "evidence-verification": "source linked / needs review"
  });
  assert.equal(firstRow.priority, "urgent-unowned");
});

test("lead inbox exposes search and all Phase 2 filters with clear behavior", () => {
  const filters = {
    q: "school",
    status: "claimed",
    source: "planning_portal",
    minScore: 70,
    createdFrom: "2026-05-01",
    createdTo: "2026-05-08",
    property: "extended stay",
    owner: "Sam Rivera",
    verificationState: "verified"
  };
  const screen = createLeadInboxScreen({ filters });

  assert.deepEqual(
    screen.controls.map((control) => [control.name, control.label, control.type]),
    [
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
    ]
  );
  assert.equal(screen.filters.activeCount, 9);
  assert.deepEqual(screen.queryState, filters);
  assert.equal(screen.table.rows.length, 1);
  assert.equal(screen.table.rows[0].id, "lead_school_002");

  const cleared = screen.actions.clearFilters();
  assert.deepEqual(cleared.queryState, {});
  assert.equal(cleared.filters.activeCount, 0);
  assert.equal(cleared.table.rows.length, mockLeadInboxLeads.length);
});

test("lead inbox renders loading, empty, and error states", () => {
  const loading = createLeadInboxScreen({ state: "loading" });
  assert.equal(loading.state, "loading");
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading leads/i);
  assert.equal(loading.table.rows.length, 0);

  const empty = createLeadInboxScreen({ leads: [], filters: { status: "dismissed" } });
  assert.equal(empty.state, "empty");
  assert.equal(empty.emptyState.title, "No leads match these filters");
  assert.equal(empty.emptyState.action.label, "Clear filters");

  const error = createLeadInboxScreen({ state: "error", errorMessage: "API unavailable" });
  assert.equal(error.state, "error");
  assert.equal(error.statusRegion.role, "alert");
  assert.equal(error.errorState.title, "Lead inbox could not load");
  assert.match(error.errorState.message, /api unavailable/i);
});

test("lead inbox supports row selection and detail navigation without mutations", () => {
  const screen = createLeadInboxScreen({ selectedLeadId: "lead_school_002" });
  const selected = screen.table.rows.find((row) => row.id === "lead_school_002");

  assert.ok(selected.selected);
  assert.equal(screen.detailNavigation.currentLeadId, "lead_school_002");
  assert.deepEqual(screen.actions.selectLead("lead_hotel_001"), {
    type: "navigate",
    href: "/leads/lead_hotel_001",
    selectedLeadId: "lead_hotel_001"
  });
  assert.equal(selected.activationLabel, "Open lead Riverside school roof replacement");
});

test("lead inbox defines desktop table and tablet/mobile collapsed behavior", () => {
  const desktop = createLeadInboxScreen({ viewport: "desktop" });
  assert.equal(desktop.layout.mode, "desktop-table");
  assert.equal(desktop.table.visibleColumns.length, expectedColumnLabels.length);
  assert.equal(desktop.table.rowMinHeight, 44);

  const tablet = createLeadInboxScreen({ viewport: "tablet" });
  assert.equal(tablet.layout.mode, "tablet-priority-table");
  assert.deepEqual(tablet.table.hiddenColumns, ["source", "created"]);
  assert.ok(tablet.table.rows.every((row) => row.summaryCells.length >= 4));

  const mobile = createLeadInboxScreen({ viewport: "mobile" });
  assert.equal(mobile.layout.mode, "mobile-lead-list");
  assert.equal(mobile.table.visibleColumns.length, 0);
  assert.ok(mobile.mobileCards.every((card) => card.touchTarget.minHeight >= 44));
});

test("lead inbox uses accessible labels, focus order, touch targets, and design tokens", () => {
  const screen = createLeadInboxScreen();

  assert.deepEqual(screen.accessibility.focusOrder, [
    "q",
    "status",
    "source",
    "minScore",
    "createdFrom",
    "createdTo",
    "property",
    "owner",
    "verificationState",
    "clearFilters",
    "lead_hotel_001"
  ]);
  assert.ok(screen.controls.every((control) => control.ariaLabel && control.minTouchTarget >= 44));
  assert.ok(screen.table.rows.every((row) => row.tabIndex === 0));

  assert.equal(screen.tokens.input, designTokens.components["text-input"]);
  assert.equal(screen.tokens.button, designTokens.components["button-secondary"]);
  assert.equal(screen.tokens.tab, designTokens.components["segmented-tab-active"]);
  assert.equal(screen.tokens.filter, designTokens.components["search-pill"]);
  assert.equal(screen.tokens.badge, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.typeBadge, designTokens.components["badge-type"]);
  assert.equal(screen.tokens.tableSurface, designTokens.components["feature-comparison-table"]);
  assert.equal(screen.tokens.tableRow, designTokens.components["property-row"]);
});
