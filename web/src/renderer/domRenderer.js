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
  const { focusableLabels, routeFocusableLabels } = collectFocusableLabels(shell);
  const html = [
    '<div class="app-shell" data-renderer="vanilla-dom">',
    renderNavigation(shell),
    `<main aria-label="GroupScout operator workspace">${renderScreen(shell.content)}</main>`,
    "</div>"
  ].join("");

  return {
    html,
    props: shell,
    focusableLabels,
    routeFocusableLabels,
    responsiveMode: shell.content.layout?.mode ?? "unknown"
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
  const shell = createRouteShell(pathname, { viewport: options.viewport ?? "desktop" });

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
          status: lead.status,
          owner: lead.owner ?? "Unowned"
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

  return `<nav aria-label="Primary">${links.join("")}</nav>`;
}

function renderScreen(screen) {
  if (screen.statusRegion) {
    return [
      `<section role="${screen.statusRegion.role}">${escapeHtml(screen.statusRegion.message)}</section>`,
      renderState(screen)
    ].join("");
  }

  return renderState(screen);
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

  return renderGenericScreen(screen);
}

function renderToday(screen) {
  const items = screen.summary?.items ?? [];

  return [
    `<section data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<h1>${escapeHtml(screen.heading)}</h1>`,
    ...items.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)} ${escapeHtml(item.value)}</a>`),
    ...((screen.priorityLeads?.rows ?? []).map((row) => `<p>${escapeHtml(row.title)} ${escapeHtml(row.timing)}</p>`)),
    "</section>"
  ].join("");
}

function renderLeadInbox(screen) {
  if (screen.state === "empty") {
    return `<section data-layout="${escapeHtml(screen.layout.mode)}"><h1>${escapeHtml(screen.heading)}</h1><p>${escapeHtml(screen.emptyState?.title ?? "No leads available")}</p></section>`;
  }

  if (screen.state === "error") {
    return `<section data-layout="${escapeHtml(screen.layout.mode)}"><h1>${escapeHtml(screen.heading)}</h1><p>${escapeHtml(screen.errorState?.message ?? "Lead inbox could not load.")}</p></section>`;
  }

  const controls = screen.controls.map((control) =>
    `<label>${escapeHtml(control.label)}<input aria-label="${escapeHtml(control.ariaLabel)}" name="${escapeHtml(control.name)}"></label>`
  );
  const headers = screen.table.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`);
  const rows = screen.table.rows.map((row) => `<tr><td><a href="/leads/${escapeHtml(row.id)}">${escapeHtml(row.cells.title)}</a></td><td>${escapeHtml(row.cells.score)}</td><td>${escapeHtml(row.cells.status)}</td></tr>`);

  return [
    `<section data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<h1>${escapeHtml(screen.heading)}</h1>`,
    ...controls,
    `<table><thead><tr>${headers.join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`,
    "</section>"
  ].join("");
}

function renderLeadDetail(screen) {
  const sections = screen.sections.map((section) => `<section><h2>${escapeHtml(section.title)}</h2></section>`);
  const summary = screen.summary?.items?.map(([label, value]) => `<p>${escapeHtml(label)} ${escapeHtml(value)}</p>`) ?? [];

  return [
    `<article data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<h1>${escapeHtml(screen.heading)}</h1>`,
    ...summary,
    ...sections,
    "</article>"
  ].join("");
}

function renderGenericScreen(screen) {
  return [
    `<section data-layout="${escapeHtml(screen.layout?.mode ?? "generic")}">`,
    `<h1>${escapeHtml(screen.heading ?? "GroupScout")}</h1>`,
    ...renderControls(screen.controls ?? []),
    ...renderSummaryItems(screen.summary?.items ?? []),
    ...renderGenericTables(screen),
    ...renderGenericActions(screen),
    renderStatusFallback(screen),
    "</section>"
  ].join("");
}

function renderControls(controls) {
  return controls.map((control) => {
    if (control.type === "button") {
      return `<button type="button" aria-label="${escapeHtml(control.ariaLabel ?? control.label)}">${escapeHtml(control.label)}</button>`;
    }

    return `<label>${escapeHtml(control.label)}<input aria-label="${escapeHtml(control.ariaLabel ?? control.label)}" name="${escapeHtml(control.name)}"></label>`;
  });
}

function renderSummaryItems(items) {
  return items.map((item) => {
    if (Array.isArray(item)) {
      return `<p>${escapeHtml(item[0])} ${escapeHtml(item[1])}</p>`;
    }

    return `<p>${escapeHtml(item.label)} ${escapeHtml(item.value)}</p>`;
  });
}

function renderGenericTables(screen) {
  return Object.values(screen)
    .filter((value) => value && typeof value === "object" && Array.isArray(value.columns) && Array.isArray(value.rows))
    .map(renderTableModel);
}

function renderTableModel(table) {
  const headers = table.columns.map((column) => `<th>${escapeHtml(column.label ?? column.key)}</th>`);
  const rows = table.rows.map((row) => {
    const cells = row.cells
      ? Object.values(row.cells)
      : Object.entries(row)
        .filter(([key]) => !["id", "href", "actions"].includes(key))
        .map(([, value]) => value);

    return `<tr>${cells.map((value) => `<td>${escapeHtml(formatCellValue(value))}</td>`).join("")}</tr>`;
  });

  return `<table><thead><tr>${headers.join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function renderGenericActions(screen) {
  const labels = collectActionLabels(screen);

  return labels.map((label) => `<button type="button" aria-label="${escapeHtml(label)}">${escapeHtml(label)}</button>`);
}

function renderStatusFallback(screen) {
  if (screen.emptyState?.title) {
    return `<p>${escapeHtml(screen.emptyState.title)}</p>`;
  }

  if (screen.errorState?.message) {
    return `<p>${escapeHtml(screen.errorState.message)}</p>`;
  }

  if (screen.notFoundState?.message) {
    return `<p>${escapeHtml(screen.notFoundState.message)}</p>`;
  }

  return "";
}

function collectFocusableLabels(shell) {
  const controls = shell.content.controls?.map((control) => control.ariaLabel ?? control.label) ?? [];
  const routeActions = collectActionLabels(shell.content);
  const links = shell.sections.map((section) => section.label);

  const routeFocusableLabels = [...controls, ...routeActions].filter(Boolean);

  return {
    routeFocusableLabels,
    focusableLabels: [...routeFocusableLabels, ...links]
  };
}

function collectActionLabels(screen) {
  const labels = [];

  if (screen.runControl?.label) {
    labels.push(screen.runControl.label);
  }

  if (screen.sourceEvidence?.rawAuditLink?.label) {
    labels.push(screen.sourceEvidence.rawAuditLink.label);
  }

  for (const action of screen.actions?.items ?? []) {
    labels.push(action.label);
  }

  for (const action of screen.outreach?.actions ?? []) {
    labels.push(action.label);
  }

  for (const action of screen.actionPolicy?.disabledActions ?? []) {
    labels.push(action.label);
  }

  return labels.filter(Boolean);
}

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(formatCellValue).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(formatCellValue).join(" ");
  }

  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
