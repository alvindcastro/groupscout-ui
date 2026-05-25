import { escapeHtml, normalizeClassToken, scoreBand } from "./renderUtils.js";

export function renderVerificationQueue(screen) {
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
