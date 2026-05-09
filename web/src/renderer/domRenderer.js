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
    `<main aria-label="GroupScout operator workspace">${renderAppTopbar(shell)}${renderScreen(shell.content)}</main>`,
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

function renderAppTopbar(shell) {
  const active = shell.sections.find((section) => section.active);
  const logout = shell.chrome?.logoutControl;

  return [
    `<header class="workspace-topbar">`,
    `<div><span class="eyebrow">Operator Console</span><strong>${escapeHtml(active?.label ?? "Workspace")}</strong></div>`,
    `<div class="topbar-status">`,
    `<span class="status-pill status-live"><span class="status-dot"></span>Live Docker</span>`,
    `<span class="status-pill status-ok"><span class="status-dot"></span>Backend proxy</span>`,
    `<span class="status-pill status-watch"><span class="status-dot"></span>Run watch</span>`,
    logout
      ? `<button class="topbar-logout" type="button" data-admin-logout aria-label="${escapeHtml(logout.ariaLabel)}">${escapeHtml(logout.label)}</button>`
      : "",
    `</div>`,
    `</header>`
  ].join("");
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

  if (screen.kind === "pipeline-monitor-screen") {
    return renderPipelineMonitor(screen);
  }

  if (screen.kind === "outreach-workspace-screen") {
    return renderOutreachWorkspace(screen);
  }

  if (screen.kind === "verification-queue-screen") {
    return renderVerificationQueue(screen);
  }

  if (screen.kind === "admin-login-screen") {
    return renderAdminLogin(screen);
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
  const columns = screen.table.visibleColumns?.length ? screen.table.visibleColumns : screen.table.columns;
  const colgroup = columns
    .map((column) => `<col style="width: ${escapeHtml(leadInboxColumnWidth(column.key))}">`)
    .join("");
  const headers = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`);
  const rows = screen.table.rows.map((row) => {
    const cells = columns.map((column) => renderLeadInboxCell(row, column.key));
    const status = normalizeClassToken(row.cells.status);

    return `<tr data-status="${escapeHtml(status)}" data-priority="${escapeHtml(row.priority ?? "standard")}">${cells.join("")}</tr>`;
  });

  return [
    `<section data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<header class="screen-heading"><div><span class="eyebrow">Lead Operations</span><h1>${escapeHtml(screen.heading)}</h1></div><p>${screen.table.rows.length} active leads</p></header>`,
    `<div class="lead-filters">${controls.join("")}</div>`,
    `<div class="table-scroll"><table class="lead-inbox-table"><colgroup>${colgroup}</colgroup><thead><tr>${headers.join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`,
    "</section>"
  ].join("");
}

function renderLeadInboxCell(row, columnKey) {
  const value = row.cells[columnKey] ?? "";

  if (columnKey === "score") {
    const score = Number(value);
    return [
      `<td data-column="${escapeHtml(columnKey)}">`,
      `<span class="score-badge" data-score-band="${escapeHtml(scoreBand(score))}">${escapeHtml(value)}</span>`,
      `<span class="score-meter"><span style="width: ${Math.max(0, Math.min(100, score))}%"></span></span>`,
      `</td>`
    ].join("");
  }

  if (columnKey === "title") {
    return [
      `<td data-column="${escapeHtml(columnKey)}">`,
      `<a href="/leads/${escapeHtml(row.id)}">${escapeHtml(value)}</a>`,
      `<small>${escapeHtml(row.activationLabel ?? "Open lead workspace")}</small>`,
      `</td>`
    ].join("");
  }

  if (columnKey === "status") {
    return `<td data-column="${escapeHtml(columnKey)}"><span class="status-chip status-${escapeHtml(normalizeClassToken(value))}">${escapeHtml(value)}</span></td>`;
  }

  if (columnKey === "evidence-verification") {
    return `<td data-column="${escapeHtml(columnKey)}"><span class="evidence-chip">${escapeHtml(value)}</span></td>`;
  }

  return `<td data-column="${escapeHtml(columnKey)}">${escapeHtml(value)}</td>`;
}

function leadInboxColumnWidth(columnKey) {
  switch (columnKey) {
    case "score":
      return "72px";
    case "title":
      return "220px";
    case "segment-project":
    case "location-property":
      return "150px";
    case "source":
    case "status":
    case "owner":
    case "created":
      return "110px";
    case "crew-duration":
    case "outreach-timing":
      return "130px";
    case "evidence-verification":
      return "170px";
    default:
      return "120px";
  }
}

function renderLeadDetail(screen) {
  return [
    `<article class="lead-detail-workspace" data-layout="${escapeHtml(screen.layout.mode)}">`,
    renderLeadDetailHero(screen),
    renderDetailSummary(screen.summary),
    renderSourceEvidence(screen.sourceEvidence),
    renderAiEnrichment(screen.aiEnrichment),
    renderDetailActions(screen.actions),
    renderOutreach(screen.outreach),
    renderActivity(screen.activity),
    "</article>"
  ].join("");
}

function renderLeadDetailHero(screen) {
  const summary = detailSummaryMap(screen.summary);
  const score = Number(summary.Score ?? 0);
  const actions = (screen.actions?.items ?? []).slice(0, 3);

  return [
    `<header class="detail-hero">`,
    `<a class="back-link" href="/leads"><span class="icon icon-back" aria-hidden="true"></span>Back to leads</a>`,
    `<div class="detail-hero-main">`,
    `<div><span class="eyebrow">Lead Workspace</span><h1>${escapeHtml(screen.heading)}</h1></div>`,
    `<span class="score-badge detail-score" data-score-band="${escapeHtml(scoreBand(score))}">${escapeHtml(summary.Score ?? "")}</span>`,
    `</div>`,
    `<div class="detail-hero-meta">`,
    `<span class="status-chip status-${escapeHtml(normalizeClassToken(screen.state))}">${escapeHtml(screen.state)}</span>`,
    `<span>${escapeHtml(summary.Timing ?? "Timing unknown")}</span>`,
    `<span>${escapeHtml(summary["Property fit"] ?? "Property fit unknown")}</span>`,
    `<span>${escapeHtml(summary["Room-night signal"] ?? "Room-night signal unknown")}</span>`,
    `</div>`,
    actions.length
      ? `<div class="action-row hero-actions">${actions.map((action) => `<button type="button">${escapeHtml(action.label)}</button>`).join("")}</div>`
      : "",
    `</header>`
  ].join("");
}

function renderDetailSummary(summary) {
  const items = summary?.items ?? [];

  return [
    `<section class="detail-card detail-summary"><h2>Summary</h2><dl>`,
    ...items.map(([label, value]) =>
      `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
    ),
    "</dl></section>"
  ].join("");
}

function renderSourceEvidence(sourceEvidence) {
  if (!sourceEvidence) {
    return "";
  }

  return [
    `<section class="detail-card evidence-card"><h2><span class="section-icon section-icon-evidence" aria-hidden="true"></span>Source Evidence</h2>`,
    `<p><strong>Source</strong> ${escapeHtml(sourceEvidence.sourceName)}</p>`,
    `<p><strong>Collected</strong> ${escapeHtml(sourceEvidence.collectedAt)}</p>`,
    `<p><a href="${escapeHtml(sourceEvidence.sourceUrl)}">Open source record</a></p>`,
    `<p><a href="${escapeHtml(sourceEvidence.rawAuditLink.href)}">${escapeHtml(sourceEvidence.rawAuditLink.label)}</a></p>`,
    "</section>"
  ].join("");
}

function renderAiEnrichment(aiEnrichment) {
  if (!aiEnrichment) {
    return "";
  }

  const claims = (aiEnrichment.claims ?? []).map((claim) => [
    `<li>`,
    `<strong>${escapeHtml(claim.field)}</strong>`,
    `<span>${escapeHtml(claim.displayValue)}</span>`,
    claim.reviewerCorrection
      ? `<em>Correction: ${escapeHtml(claim.reviewerCorrection.value)}</em>`
      : "",
    `</li>`
  ].join(""));

  return [
    `<section class="detail-card enrichment-card"><h2><span class="section-icon section-icon-ai" aria-hidden="true"></span>AI Enrichment</h2>`,
    `<p>${escapeHtml(aiEnrichment.rationale)}</p>`,
    `<p><strong>Uncertainty</strong> ${escapeHtml(aiEnrichment.uncertainty?.level)}: ${escapeHtml(aiEnrichment.uncertainty?.reason)}</p>`,
    `<ul class="claim-list">${claims.join("")}</ul>`,
    "</section>"
  ].join("");
}

function renderDetailActions(actions) {
  const items = actions?.items ?? [];

  return [
    `<section class="detail-card actions-card"><h2><span class="section-icon section-icon-action" aria-hidden="true"></span>Actions</h2><div class="action-row">`,
    ...items.map((action) => `<button type="button">${escapeHtml(action.label)}</button>`),
    "</div></section>"
  ].join("");
}

function renderOutreach(outreach) {
  if (!outreach) {
    return "";
  }

  const attempts = (outreach.attempts ?? []).map((attempt) =>
    `<li><strong>${escapeHtml(attempt.label)}</strong><span>${escapeHtml(attempt.timestamp)}</span><p>${escapeHtml(attempt.notes)}</p></li>`
  );
  const actions = (outreach.workspace?.actions ?? []).map((action) =>
    `<button type="button">${escapeHtml(action.label)}</button>`
  );

  return [
    `<section class="detail-card outreach-card"><h2><span class="section-icon section-icon-outreach" aria-hidden="true"></span>Outreach</h2>`,
    `<p><strong>Recommended timing</strong> ${escapeHtml(outreach.recommendedTiming)}</p>`,
    `<p><strong>Contact</strong> ${escapeHtml(outreach.workspace?.defaultContact?.channel)}: ${escapeHtml(outreach.workspace?.defaultContact?.value)}</p>`,
    `<textarea readonly>${escapeHtml(outreach.workspace?.draft?.value ?? "")}</textarea>`,
    `<div class="action-row">${actions.join("")}</div>`,
    `<ul class="timeline-list">${attempts.join("")}</ul>`,
    "</section>"
  ].join("");
}

function renderActivity(activity) {
  const entries = activity?.entries ?? [];

  return [
    `<section class="detail-card activity-card"><h2><span class="section-icon section-icon-activity" aria-hidden="true"></span>Activity</h2><ol class="timeline-list">`,
    ...entries.map((entry) =>
      `<li><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.timestamp)}</span><p>${escapeHtml(entry.detail)}</p></li>`
    ),
    "</ol></section>"
  ].join("");
}

function renderPipelineMonitor(screen) {
  return [
    `<section class="pipeline-monitor" data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<header class="screen-heading pipeline-heading"><div><span class="eyebrow">Automation</span><h1>${escapeHtml(screen.heading)}</h1></div>`,
    `<div class="pipeline-toolbar">`,
    `<button type="button" data-pipeline-action="start"><span class="icon icon-play" aria-hidden="true"></span>Start run</button>`,
    `<button type="button" data-pipeline-action="refresh"><span class="icon icon-refresh" aria-hidden="true"></span>Refresh history</button>`,
    `</div></header>`,
    renderPipelineFeedback(),
    renderPipelineOutput(),
    renderPipelineHealth(screen.health),
    renderPipelineFailures(screen.recentFailures),
    renderPipelineHistory(screen.history),
    "</section>"
  ].join("");
}

function renderPipelineFeedback() {
  return [
    `<section class="run-feedback" id="pipeline-run-feedback" hidden aria-live="polite">`,
    `<div class="run-feedback-header"><strong id="pipeline-run-status">Pipeline run queued</strong><span id="pipeline-run-id"></span></div>`,
    `<div class="pipeline-steps"><span data-step="collectors">Collectors</span><span data-step="enrichment">Enrichment</span><span data-step="delivery">Slack and UI output</span></div>`,
    `<div class="progress-track" aria-label="Pipeline run progress"><div id="pipeline-run-progress" class="progress-bar"></div></div>`,
    `<ol id="pipeline-run-log" class="run-log"></ol>`,
    `</section>`
  ].join("");
}

function renderPipelineOutput() {
  return [
    `<section class="pipeline-output detail-card" id="pipeline-output" hidden>`,
    `<div class="run-feedback-header"><h2 id="pipeline-output-title">Slack output preview</h2><span id="pipeline-output-count"></span></div>`,
    `<div id="pipeline-output-list" class="slack-output-list"></div>`,
    `</section>`
  ].join("");
}

function renderPipelineHealth(health) {
  if (!health) {
    return "";
  }

  const cards = [
    ["Freshness", `${health.freshness.status} / ${health.freshness.lastRun}`],
    ["Collector", Object.values(health.collector.counts).join(" / ")],
    ["LLM", `${health.llm.provider} / ${health.llm.latency} / ${health.llm.errors}`],
    ["Delivery", `${health.delivery.slack} / ${health.delivery.email} / ${health.delivery.webhook}`]
  ];

  return `<div class="pipeline-health">${cards.map(([label, value]) => `<p><strong><span class="section-icon section-icon-${escapeHtml(normalizeClassToken(label))}" aria-hidden="true"></span>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></p>`).join("")}</div>`;
}

function renderPipelineFailures(recentFailures) {
  const items = recentFailures?.items ?? [];

  if (items.length === 0) {
    return `<section class="detail-card"><h2>Recent Failures</h2><p>No recent collector failures.</p></section>`;
  }

  return `<section class="detail-card"><h2>Recent Failures</h2><ul class="timeline-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
}

function renderPipelineHistory(history) {
  if (!history) {
    return "";
  }

  return `<div class="table-scroll pipeline-history">${renderTableModel(history)}</div>`;
}

function renderOutreachWorkspace(screen) {
  const lead = screen.lead ?? {};
  const draft = screen.draft ?? { values: {}, fields: [] };
  const controls = screen.controls ?? [];
  const activity = screen.activity?.entries ?? [];
  const score = Number(lead.score ?? 0);

  return [
    `<article class="outreach-workspace" data-layout="${escapeHtml(screen.layout?.mode ?? "outreach")}">`,
    `<header class="screen-heading outreach-heading"><div><span class="eyebrow">Manual Outreach</span><h1>${escapeHtml(screen.heading)}</h1></div><span class="status-chip status-${escapeHtml(normalizeClassToken(screen.displayState?.key ?? screen.state))}">${escapeHtml(screen.displayState?.label ?? screen.state)}</span></header>`,
    `<section class="detail-card outreach-lead-card"><h2><span class="section-icon section-icon-outreach" aria-hidden="true"></span>${escapeHtml(lead.title ?? "Lead")}</h2>`,
    `<div class="outreach-lead-summary"><span class="score-badge" data-score-band="${escapeHtml(scoreBand(score))}">${escapeHtml(lead.score ?? "")}</span><p><strong>${escapeHtml(lead.company ?? "Company unknown")}</strong><span>${escapeHtml(lead.propertyFit ?? "Property fit unknown")}</span></p></div>`,
    `<p>${escapeHtml(lead.outreachTiming ?? "")}</p></section>`,
    `<section class="detail-card outreach-draft-card"><h2><span class="section-icon section-icon-ai" aria-hidden="true"></span>Draft</h2>`,
    `<dl class="outreach-draft-fields">${renderOutreachDraftFields(draft).join("")}</dl>`,
    `<textarea readonly>${escapeHtml(draft.values?.message ?? "")}</textarea></section>`,
    `<section class="detail-card outreach-controls-card"><h2><span class="section-icon section-icon-action" aria-hidden="true"></span>Actions</h2>`,
    `<div class="action-row">${controls.filter((control) => control.type === "button").map((control) => `<button type="button">${escapeHtml(control.label)}</button>`).join("")}</div>`,
    `<label>Outcome<input aria-label="Outcome" name="outcome"></label></section>`,
    `<section class="detail-card outreach-activity-card"><h2><span class="section-icon section-icon-activity" aria-hidden="true"></span>Activity</h2><ol class="timeline-list">${activity.map((entry) => `<li><strong>${escapeHtml(entry.outcome?.label ?? entry.channel)}</strong><span>${escapeHtml(entry.timestamp)}</span><p>${escapeHtml(entry.notes)}</p></li>`).join("")}</ol></section>`,
    `</article>`
  ].join("");
}

function renderOutreachDraftFields(draft) {
  const hidden = new Set(["message"]);

  return (draft.fields ?? [])
    .filter((field) => !hidden.has(field.name))
    .map((field) => `<div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(draft.values?.[field.name] ?? "")}</dd></div>`);
}

function renderVerificationQueue(screen) {
  const rows = screen.table?.rows ?? [];
  const mobileCards = screen.mobileCards ?? [];
  const reviewItems = rows.length ? rows : mobileCards;
  const controls = screen.controls ?? [];
  const highCount = reviewItems.filter(isHighPriorityVerificationItem).length;
  const missingRaw = reviewItems.filter(hasMissingRawAudit).length;
  const unowned = reviewItems.filter(isUnownedVerificationItem).length;

  if (screen.state === "empty") {
    return `<section class="verification-queue" data-layout="${escapeHtml(screen.layout.mode)}"><header class="screen-heading"><div><span class="eyebrow">Evidence Review</span><h1>${escapeHtml(screen.heading)}</h1></div></header><p>${escapeHtml(screen.emptyState?.title ?? "No leads require verification")}</p></section>`;
  }

  if (screen.state === "error") {
    return `<section class="verification-queue" data-layout="${escapeHtml(screen.layout.mode)}"><header class="screen-heading"><div><span class="eyebrow">Evidence Review</span><h1>${escapeHtml(screen.heading)}</h1></div></header><p>${escapeHtml(screen.errorState?.message ?? "Verification queue could not load.")}</p></section>`;
  }

  return [
    `<section class="verification-queue" data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<header class="screen-heading verification-heading"><div><span class="eyebrow">Evidence Review</span><h1>${escapeHtml(screen.heading)}</h1></div><p>${reviewItems.length} leads need review</p></header>`,
    `<div class="queue-metrics">`,
    renderQueueMetric("High severity", highCount, "high"),
    renderQueueMetric("Missing raw audit", missingRaw, "missing"),
    renderQueueMetric("Unowned", unowned, "unowned"),
    `</div>`,
    `<div class="verification-filters">${controls.map(renderVerificationControl).join("")}</div>`,
    mobileCards.length
      ? `<div class="verification-card-list">${mobileCards.map(renderVerificationMobileCard).join("")}</div>`
      : `<div class="table-scroll verification-table"><table><thead><tr><th>Score</th><th>Lead</th><th>Trigger</th><th>Evidence</th><th>Owner</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows.map(renderVerificationRow).join("")}</tbody></table></div>`,
    `</section>`
  ].join("");
}

function isHighPriorityVerificationItem(item) {
  return item.priority === "high" || [
    "Missing source or raw audit",
    "High score with weak rationale"
  ].includes(item.trigger);
}

function hasMissingRawAudit(item) {
  return item.cells?.["raw-audit"] === "Missing" || item.meta?.includes("Missing");
}

function isUnownedVerificationItem(item) {
  return item.cells?.owner === "Unowned" || item.meta?.includes("Unowned");
}

function renderQueueMetric(label, value, tone) {
  return `<p class="queue-metric queue-metric-${escapeHtml(tone)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></p>`;
}

function renderVerificationControl(control) {
  if (control.type === "button") {
    return `<button type="button">${escapeHtml(control.label)}</button>`;
  }

  return `<label>${escapeHtml(control.label)}<input aria-label="${escapeHtml(control.ariaLabel)}" name="${escapeHtml(control.name)}"></label>`;
}

function renderVerificationRow(row) {
  const score = Number(row.cells.score);
  const rawAudit = row.cells["raw-audit"];
  const rawTone = rawAudit === "Missing" ? "missing" : "available";
  const actions = (row.actions ?? []).slice(0, 3).map((action) => {
    const tag = action.href
      ? "a"
      : "button";
    const attrs = action.href
      ? ` href="${escapeHtml(action.href)}"`
      : ` type="button"`;

    return `<${tag}${attrs} class="row-action row-action-${escapeHtml(normalizeClassToken(action.action))}">${escapeHtml(action.label)}</${tag}>`;
  });

  return [
    `<tr data-priority="${escapeHtml(row.priority)}">`,
    `<td><span class="score-badge" data-score-band="${escapeHtml(scoreBand(score))}">${escapeHtml(row.cells.score)}</span></td>`,
    `<td class="verification-lead"><a href="${escapeHtml(row.href)}">${escapeHtml(row.cells.lead)}</a><small>${escapeHtml(row.id)}</small></td>`,
    `<td><span class="trigger-badge trigger-${escapeHtml(row.priority)}">${escapeHtml(row.cells.trigger)}</span></td>`,
    `<td><a class="raw-audit-chip raw-audit-${escapeHtml(rawTone)}" href="${escapeHtml(row.rawAuditLink.href)}">${escapeHtml(rawAudit)}</a><small>${escapeHtml(row.cells.source)}</small></td>`,
    `<td><span class="status-chip ${row.cells.owner === "Unowned" ? "status-watch" : "status-ok"}">${escapeHtml(row.cells.owner)}</span></td>`,
    `<td>${escapeHtml(row.cells.updated)}</td>`,
    `<td><div class="row-actions">${actions.join("")}</div></td>`,
    `</tr>`
  ].join("");
}

function renderVerificationMobileCard(card) {
  const score = Number(card.score);
  const rawAudit = card.meta?.includes("Missing") ? "Missing" : "Available";
  const rawTone = rawAudit === "Missing" ? "missing" : "available";
  const meta = (card.meta ?? []).filter((item) => item !== rawAudit);
  const actions = (card.actions ?? []).map((action) => {
    const tag = action.href
      ? "a"
      : "button";
    const attrs = action.href
      ? ` href="${escapeHtml(action.href)}"`
      : ` type="button"`;

    return `<${tag}${attrs} class="row-action row-action-${escapeHtml(normalizeClassToken(action.action))}">${escapeHtml(action.label)}</${tag}>`;
  });

  return [
    `<article class="verification-card" data-lead-id="${escapeHtml(card.id)}">`,
    `<header><a class="verification-card-title" href="${escapeHtml(card.href)}">${escapeHtml(card.title)}</a><span class="score-badge" data-score-band="${escapeHtml(scoreBand(score))}">${escapeHtml(card.score)}</span></header>`,
    `<p><span class="trigger-badge trigger-${escapeHtml(normalizeClassToken(card.trigger))}">${escapeHtml(card.trigger)}</span></p>`,
    `<p>${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</p>`,
    `<p><a class="raw-audit-chip raw-audit-${escapeHtml(rawTone)}" href="${escapeHtml(card.rawAuditLink.href)}">${escapeHtml(card.rawAuditLink.label)}</a><small>${escapeHtml(rawAudit)}</small></p>`,
    `<div class="row-actions">${actions.join("")}</div>`,
    `</article>`
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

function renderAdminLogin(screen) {
  const field = screen.form.fields[0];

  return [
    `<section class="admin-login" data-layout="${escapeHtml(screen.layout.mode)}">`,
    `<form class="admin-login-window" data-admin-login-form action="${escapeHtml(screen.form.action)}" method="${escapeHtml(screen.form.method)}">`,
    `<h1>${escapeHtml(screen.heading)}</h1>`,
    `<label>${escapeHtml(field.label)}<input required type="password" name="${escapeHtml(field.name)}" aria-label="${escapeHtml(field.ariaLabel)}" inputmode="${escapeHtml(field.inputMode)}" autocomplete="${escapeHtml(field.autocomplete)}"></label>`,
    `<button type="submit">${escapeHtml(screen.form.submitLabel)}</button>`,
    `<p id="admin-login-feedback" data-admin-login-feedback role="status" aria-live="polite"></p>`,
    `</form>`,
    `</section>`
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

function detailSummaryMap(summary) {
  return Object.fromEntries((summary?.items ?? []).map(([label, value]) => [label, value]));
}

function normalizeClassToken(value) {
  return String(value ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function scoreBand(score) {
  if (score >= 90) return "high";
  if (score >= 75) return "medium";
  return "low";
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
