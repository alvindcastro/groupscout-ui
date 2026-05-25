import { detailSummaryMap, escapeHtml, normalizeClassToken, scoreBand } from "./renderUtils.js";

export function renderLeadDetail(screen) {
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
