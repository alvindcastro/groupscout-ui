import { createRouteShell } from "../app/shell.js";
import { mockLeadInboxLeads } from "../app/leadInbox.js";
import { createApiClient } from "../api/client.js";

export const RENDERER_BROWSER_ENTRY_CONTRACT = Object.freeze({
  renderer: "vanilla-dom",
  apiClientFactory: "createApiClient",
  apiPath: "/api/*",
  sameOriginOnly: true
});

export function renderRouteToHtml(pathname = "/", options = {}) {
  const shell = createRenderableShell(pathname, options);
  const focusableLabels = collectFocusableLabels(shell);
  const routeFocusableLabels = collectRouteFocusableLabels(shell);
  const html = [
    '<div class="app-shell soft-shell" data-renderer="vanilla-dom">',
    renderNavigation(shell),
    `<main class="soft-main" aria-label="GroupScout operator workspace">${renderScreen(shell.content)}</main>`,
    "</div>"
  ].join("");

  return {
    html,
    props: shell,
    focusableLabels,
    routeFocusableLabels,
    responsiveMode: responsiveModeForViewport(options.viewport, shell.content.layout?.mode)
  };
}

export function mountRoute(root, {
  pathname = globalThis.location?.pathname ?? "/",
  apiClient = createApiClient()
} = {}) {
  if (!root) {
    return undefined;
  }

  root.innerHTML = renderRouteToHtml(pathname, { apiClient }).html;

  return root;
}

function createRenderableShell(pathname, options) {
  const shell = createRouteShell(pathname);

  if (pathname === "/leads" && hasLeadInboxOverrides(options)) {
    return {
      ...shell,
      content: createLeadInboxOverride(shell.content, options)
    };
  }

  return shell;
}

function hasLeadInboxOverrides(options) {
  return "screenState" in options || "leads" in options || "errorMessage" in options;
}

function createLeadInboxOverride(screen, options) {
  const sourceLeads = options.leads ?? mockLeadInboxLeads;

  return {
    ...screen,
    state: options.screenState ?? (sourceLeads.length > 0 ? "ready" : "empty"),
    table: {
      ...screen.table,
      rows: options.screenState ? [] : sourceLeads.map((lead) => ({
        id: lead.id,
        href: `/leads/${lead.id}`,
        cells: {
          score: String(lead.score),
          title: lead.title,
          "segment-project": `${lead.segment} / ${lead.projectType}`,
          "location-property": `${lead.location} / ${lead.propertyFit}`,
          source: formatValue(lead.source),
          "crew-duration": `${lead.estimatedCrewSize} crew / ${lead.estimatedDurationDays} days`,
          "outreach-timing": lead.outreachTiming,
          status: formatValue(lead.status),
          owner: lead.owner ?? "Unowned",
          created: lead.createdAt.slice(0, 10),
          "evidence-verification": `${formatValue(lead.evidenceState)} / ${formatValue(lead.verificationState)}`
        }
      }))
    },
    statusRegion: options.screenState === "loading"
      ? { role: "status", message: "Loading leads for review." }
      : options.screenState === "error"
        ? { role: "alert", message: options.errorMessage ?? "Lead inbox could not load." }
        : undefined,
    emptyState: sourceLeads.length === 0 && !options.screenState
      ? { title: "No leads available" }
      : undefined,
    errorState: options.screenState === "error"
      ? { title: "Lead inbox could not load", message: options.errorMessage ?? "Lead inbox could not load." }
      : undefined
  };
}

function renderNavigation(shell) {
  const links = shell.sections.map((section) => {
    const ariaCurrent = section.active ? ' aria-current="page"' : "";

    return `<a href="${escapeHtml(section.href ?? section.path)}"${ariaCurrent}>${escapeHtml(section.label)}</a>`;
  });

  return [
    '<nav class="soft-nav" aria-label="Primary">',
    '<div class="soft-brand">GroupScout<small>operator console</small></div>',
    `<div class="soft-nav-links">${links.join("")}</div>`,
    "</nav>"
  ].join("");
}

function renderScreen(screen) {
  const status = screen.statusRegion
    ? `<section class="soft-status${screen.statusRegion.role === "alert" ? " soft-alert" : ""}" role="${screen.statusRegion.role}">${escapeHtml(screen.statusRegion.message)}</section>`
    : "";

  return `${status}${renderState(screen)}`;
}

function renderState(screen) {
  if (screen.kind === "today-command-center-screen") {
    return renderToday(screen);
  }

  if (screen.kind === "lead-inbox-screen") {
    return renderLeadInbox(screen);
  }

  if (screen.kind === "lead-detail-screen") {
    return renderLeadDetail(screen);
  }

  return [
    '<section class="soft-screen soft-terminal">',
    renderHero(screen.heading ?? "GroupScout", "Reserved route", "Phase channel awaiting workflow activation."),
    "</section>"
  ].join("");
}

function renderToday(screen) {
  const items = screen.summary?.items ?? [];
  const priorityRows = screen.priorityLeads?.rows ?? [];
  const alertRows = screen.activeAlerts?.rows ?? [];
  const failedRows = screen.failedJobs?.rows ?? [];

  return [
    `<section class="soft-screen" data-layout="${escapeHtml(screen.layout.mode)}">`,
    renderHero(screen.heading, "Command feed", "High-score leads, stale ownership, alerts, and failed jobs in one operator surface."),
    `<div class="soft-grid">${items.map(renderMetric).join("")}</div>`,
    '<section class="soft-terminal">',
    '<div class="soft-label">Priority leads</div>',
    renderList(priorityRows.map((row) => ({
      title: row.title,
      detail: `${row.score ?? ""} ${row.status ?? ""} ${row.timing ?? ""}`.trim(),
      href: row.href ?? `/leads/${row.id}`
    }))),
    "</section>",
    '<div class="soft-card-grid">',
    renderMiniPanel("Active alerts", alertRows),
    renderMiniPanel("Failed jobs", failedRows),
    "</div>",
    "</section>"
  ].join("");
}

function renderMetric(item) {
  return [
    `<a class="soft-card soft-metric" href="${escapeHtml(item.href ?? "#")}">`,
    `<span class="soft-label">${escapeHtml(item.label)}</span>`,
    `<span class="soft-metric-value">${escapeHtml(item.value)}</span>`,
    "</a>"
  ].join("");
}

function renderMiniPanel(title, rows) {
  return [
    '<section class="soft-panel">',
    `<h2 class="soft-label">${escapeHtml(title)}</h2>`,
    renderList(rows.map((row) => ({
      title: row.title ?? row.property ?? row.collector ?? row.id,
      detail: row.impact ?? row.reason ?? row.status ?? row.nextStep ?? ""
    }))),
    "</section>"
  ].join("");
}

function renderLeadInbox(screen) {
  if (screen.state === "empty") {
    return renderEmptyState(screen, screen.emptyState?.title ?? "No leads available");
  }

  if (screen.state === "error") {
    return renderEmptyState(screen, screen.errorState?.message ?? "Lead inbox could not load.");
  }

  const controls = screen.controls.map(renderControl).join("");
  const visibleColumns = screen.table.visibleColumns?.length
    ? screen.table.visibleColumns
    : screen.table.columns;
  const headers = visibleColumns.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`);
  const rows = screen.table.rows.map((row) => {
    const cells = visibleColumns.map((column) => {
      const value = row.cells[column.key] ?? "";
      const content = column.key === "title"
        ? `<a href="${escapeHtml(row.href ?? `/leads/${row.id}`)}">${escapeHtml(value)}</a>`
        : escapeHtml(value);

      return `<td>${content}</td>`;
    });

    return `<tr>${cells.join("")}</tr>`;
  });

  return [
    `<section class="soft-screen" data-layout="${escapeHtml(screen.layout.mode)}">`,
    renderHero(screen.heading, "Lead acquisition", "Filter high-intent crew lodging demand before the window closes."),
    `<form class="soft-controls" aria-label="Lead filters">${controls}</form>`,
    '<div class="soft-table-wrap">',
    `<table class="soft-table"><caption>Lead Inbox leads</caption><thead><tr>${headers.join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`,
    "</div>",
    "</section>"
  ].join("");
}

function renderEmptyState(screen, message) {
  return [
    `<section class="soft-screen" data-layout="${escapeHtml(screen.layout.mode)}">`,
    renderHero(screen.heading, "Lead acquisition", message),
    `<div class="soft-terminal"><p >${escapeHtml(message)}</p></div>`,
    "</section>"
  ].join("");
}

function renderControl(control) {
  if (control.type === "button") {
    return `<button class="soft-button soft-button-secondary" type="button" aria-label="${escapeHtml(control.ariaLabel)}">${escapeHtml(control.label)}</button>`;
  }

  if (control.type === "select") {
    return [
      `<label class="soft-field">${escapeHtml(control.label)}<span class="soft-field-inner">`,
      `<select class="soft-select" aria-label="${escapeHtml(control.ariaLabel)}" name="${escapeHtml(control.name)}">`,
      `<option value="">All ${escapeHtml(control.label.toLowerCase())}</option>`,
      "</select>",
      "</span></label>"
    ].join("");
  }

  const inputType = control.type === "search" || control.type === "number" || control.type === "date"
    ? control.type
    : "text";
  const placeholder = control.type === "search" ? "Scan lead signal" : control.label;

  return [
    `<label class="soft-field">${escapeHtml(control.label)}<span class="soft-field-inner">`,
    `<input class="soft-input" type="${inputType}" aria-label="${escapeHtml(control.ariaLabel)}" name="${escapeHtml(control.name)}" placeholder="${escapeHtml(placeholder)}">`,
    "</span></label>"
  ].join("");
}

function renderLeadDetail(screen) {
  const summary = screen.summary?.items ?? [];
  const actions = screen.actions?.items ?? [];
  const claims = screen.aiEnrichment?.claims ?? [];
  const activity = screen.activity?.entries ?? [];

  return [
    `<article class="soft-detail" data-layout="${escapeHtml(screen.layout.mode)}">`,
    renderHero(screen.heading, "Evidence workspace", "Keep the original source, the model inference, and the reviewer correction visible together."),
    '<section class="soft-card-grid">',
    renderSummaryPanel(summary),
    renderActionPanel(actions),
    "</section>",
    '<section class="soft-terminal">',
    '<h2 class="soft-label">Source Evidence</h2>',
    renderSourceEvidence(screen.sourceEvidence),
    "</section>",
    '<section class="soft-panel">',
    '<h2 class="soft-label">AI Enrichment</h2>',
    screen.aiEnrichment?.rationale ? `<p>${escapeHtml(screen.aiEnrichment.rationale)}</p>` : "",
    renderClaims(claims),
    "</section>",
    '<section class="soft-panel">',
    '<h2 class="soft-label">Outreach</h2>',
    `<p>${escapeHtml(screen.outreach?.recommendedTiming ?? "")}</p>`,
    "</section>",
    '<section class="soft-panel">',
    '<h2 class="soft-label">Activity</h2>',
    renderList(activity.map((entry) => ({ title: entry.label, detail: `${entry.detail} ${entry.timestamp}` }))),
    "</section>",
    "</article>"
  ].join("");
}

function renderHero(title, kicker, subtitle) {
  return [
    '<header class="soft-hero">',
    `<div class="soft-kicker">${escapeHtml(kicker)}</div>`,
    `<h1 class="soft-title">${escapeHtml(title)}</h1>`,
    `<p class="soft-subtitle">${escapeHtml(subtitle)}</p>`,
    "</header>"
  ].join("");
}

function renderSummaryPanel(items) {
  return [
    '<section class="soft-panel">',
    '<h2 class="soft-label">Summary</h2>',
    renderList(items.map(([label, value]) => ({ title: label, detail: value }))),
    "</section>"
  ].join("");
}

function renderActionPanel(actions) {
  return [
    '<section class="soft-panel">',
    '<h2 class="soft-label">Actions</h2>',
    `<div class="soft-controls">${actions.map((action) => `<button class="soft-button" type="button">${escapeHtml(action.label)}</button>`).join("")}</div>`,
    "</section>"
  ].join("");
}

function renderSourceEvidence(sourceEvidence) {
  if (!sourceEvidence) {
    return '<p >Source record unavailable.</p>';
  }

  return renderList([
    { title: "Source", detail: sourceEvidence.sourceName },
    { title: "Collected", detail: sourceEvidence.collectedAt },
    { title: "Raw audit", detail: sourceEvidence.rawAuditLink?.label, href: sourceEvidence.rawAuditLink?.href }
  ]);
}

function renderClaims(claims) {
  return [
    '<div class="soft-grid">',
    ...claims.map((claim) => [
      '<div class="soft-card">',
      `<strong>${escapeHtml(claim.field)}</strong>`,
      `<p><span class="soft-chip">${escapeHtml(claim.original.label)}</span> ${escapeHtml(claim.original.value)}</p>`,
      claim.reviewerCorrection
        ? `<p><span class="soft-chip">${escapeHtml(claim.reviewerCorrection.label)}</span> ${escapeHtml(claim.reviewerCorrection.value)}</p>`
        : "",
      "</div>"
    ].join("")),
    "</div>"
  ].join("");
}

function renderList(items) {
  return [
    '<ul class="soft-list">',
    ...items.map((item) => [
      '<li class="soft-row">',
      item.href
        ? `<a href="${escapeHtml(item.href)}"><strong>${escapeHtml(item.title)}</strong></a>`
        : `<strong>${escapeHtml(item.title)}</strong>`,
      item.detail ? `<span>${escapeHtml(item.detail)}</span>` : "",
      "</li>"
    ].join("")),
    "</ul>"
  ].join("");
}

function collectFocusableLabels(shell) {
  const controls = shell.content.controls?.map((control) => control.ariaLabel ?? control.label) ?? [];
  const links = shell.sections.map((section) => section.label);

  return [...controls, ...links];
}

function collectRouteFocusableLabels(shell) {
  const controls = shell.content.controls?.map((control) => control.ariaLabel ?? control.label) ?? [];
  const tableActions = shell.content.table?.rows
    ?.flatMap((row) => row.actions?.map((action) => action.label ?? action.ariaLabel) ?? []) ?? [];
  const actionItems = flattenActions(shell.content.actions).map((action) => action.label ?? action.ariaLabel);
  const tabs = shell.content.tabs?.map((tab) => tab.label) ?? [];

  return [...controls, ...tableActions, ...actionItems, ...tabs].filter(Boolean);
}

function flattenActions(actions) {
  if (Array.isArray(actions)) {
    return actions;
  }

  if (actions && typeof actions === "object") {
    return Object.values(actions).flatMap(flattenActions);
  }

  return [];
}

function responsiveModeForViewport(viewport, fallback = "unknown") {
  if (["desktop", "tablet", "mobile"].includes(viewport)) {
    return viewport;
  }

  return fallback;
}

function formatValue(value) {
  return String(value ?? "").replaceAll("_", " ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
