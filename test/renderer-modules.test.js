import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { renderLeadDetail } from "../web/src/renderer/leadDetailRenderer.js";
import { renderVerificationQueue } from "../web/src/renderer/verificationRenderer.js";
import {
  detailSummaryMap,
  escapeHtml,
  formatCellValue,
  normalizeClassToken,
  scoreBand
} from "../web/src/renderer/renderUtils.js";

test("renderer utilities normalize classes, score bands, cells, and HTML safely", () => {
  assert.equal(normalizeClassToken("Needs Review!"), "needs-review");
  assert.equal(normalizeClassToken("***"), "unknown");
  assert.equal(scoreBand(90), "high");
  assert.equal(scoreBand(75), "medium");
  assert.equal(scoreBand(12), "low");
  assert.equal(formatCellValue(["A", { nested: ["B", null, "C"] }]), "A B  C");
  assert.equal(escapeHtml('<script data-x="1">&'), "&lt;script data-x=&quot;1&quot;&gt;&amp;");
  assert.deepEqual(detailSummaryMap({ items: [["Score", "91"], ["Timing", "This week"]] }), {
    Score: "91",
    Timing: "This week"
  });
});

test("lead detail renderer keeps rich sections while escaping untrusted model text", () => {
  const html = renderLeadDetail({
    layout: { mode: "desktop-detail" },
    heading: "Hotel <Tower> & Crew",
    state: "needs review",
    summary: {
      items: [
        ["Score", "91"],
        ["Timing", "This week"],
        ["Property fit", "Airport hotel"],
        ["Room-night signal", "High"]
      ]
    },
    sourceEvidence: {
      sourceName: "Richmond <Permits>",
      collectedAt: "2026-05-25",
      sourceUrl: "https://example.test/source?q=<permit>",
      rawAuditLink: { href: "/api/leads/lead_123/raw", label: "Open raw <audit>" }
    },
    aiEnrichment: {
      rationale: "Crew lodging <likely>",
      uncertainty: { level: "medium", reason: "Permit text incomplete" },
      claims: [{ field: "Crew", displayValue: "24", reviewerCorrection: { value: "20" } }]
    },
    actions: { items: [{ label: "Claim <lead>" }] },
    outreach: {
      recommendedTiming: "This week",
      workspace: {
        defaultContact: { channel: "Email", value: "gc@example.test" },
        draft: { value: "Hello <GC>" },
        actions: [{ label: "Copy draft" }]
      },
      attempts: [{ label: "Call", timestamp: "Today", notes: "Left voicemail" }]
    },
    activity: { entries: [{ label: "Created", timestamp: "Today", detail: "Imported" }] }
  });

  assert.match(html, /class="lead-detail-workspace"/);
  assert.match(html, /Hotel &lt;Tower&gt; &amp; Crew/);
  assert.match(html, /data-score-band="high">91/);
  assert.match(html, /status-chip status-needs-review/);
  assert.match(html, /Source Evidence/);
  assert.match(html, /Open raw &lt;audit&gt;/);
  assert.match(html, /Correction: 20/);
  assert.doesNotMatch(html, /Hotel <Tower>|Richmond <Permits>|Hello <GC>/);
});

test("verification renderer covers desktop metrics, action limits, and mobile raw-audit cards", () => {
  const desktopHtml = renderVerificationQueue({
    layout: { mode: "desktop-verification-table" },
    state: "ready",
    heading: "Verification Queue",
    controls: [
      { type: "input", label: "Trigger", ariaLabel: "Trigger", name: "trigger" },
      { type: "button", label: "Refresh" }
    ],
    table: {
      rows: [{
        id: "lead_weak",
        href: "/leads/lead_weak",
        priority: "high",
        cells: {
          score: "94",
          lead: "Hotel wing <review>",
          trigger: "High score with weak rationale",
          "raw-audit": "Missing",
          source: "richmond_permits",
          owner: "Unowned",
          updated: "Today"
        },
        rawAuditLink: { href: "/api/leads/lead_weak/raw" },
        actions: [
          { action: "verify", label: "Verify" },
          { action: "correct", label: "Correct" },
          { action: "dismiss", label: "Dismiss" },
          { action: "extra", label: "Extra" }
        ]
      }]
    }
  });

  assert.match(desktopHtml, /1 leads need review/);
  assert.match(desktopHtml, /High severity<\/span><strong>1/);
  assert.match(desktopHtml, /Missing raw audit<\/span><strong>1/);
  assert.match(desktopHtml, /Unowned<\/span><strong>1/);
  assert.match(desktopHtml, /Hotel wing &lt;review&gt;/);
  assert.match(desktopHtml, /raw-audit-missing/);
  assert.match(desktopHtml, />Verify</);
  assert.doesNotMatch(desktopHtml, />Extra</);

  const mobileHtml = renderVerificationQueue({
    layout: { mode: "mobile-verification-cards" },
    state: "ready",
    heading: "Verification Queue",
    table: { rows: [] },
    mobileCards: [{
      id: "lead_mobile",
      href: "/leads/lead_mobile",
      title: "Mobile <lead>",
      score: "72",
      trigger: "Missing source or raw audit",
      meta: ["Missing", "Unowned"],
      rawAuditLink: { href: "/api/leads/lead_mobile/raw", label: "Open raw audit evidence" },
      actions: [{ action: "return", label: "Return to lead", href: "/leads/lead_mobile" }]
    }]
  });

  assert.match(mobileHtml, /verification-card-list/);
  assert.match(mobileHtml, /Mobile &lt;lead&gt;/);
  assert.match(mobileHtml, /data-score-band="low">72/);
  assert.match(mobileHtml, /raw-audit-missing/);
  assert.match(mobileHtml, /href="\/leads\/lead_mobile"/);
});

test("split renderer modules are served from static build output", async () => {
  const { createStaticAssetResponsePlan } = await import("../web/src/server/productionServer.js");
  const publicRoot = new URL("../web/dist/", import.meta.url);

  for (const module of [
    { path: "/src/renderer/leadDetailRenderer.js", file: "leadDetailRenderer.js", exportName: "renderLeadDetail" },
    { path: "/src/renderer/verificationRenderer.js", file: "verificationRenderer.js", exportName: "renderVerificationQueue" },
    { path: "/src/renderer/renderUtils.js", file: "renderUtils.js", exportName: "escapeHtml" }
  ]) {
    const plan = await createStaticAssetResponsePlan({ requestPath: module.path, publicRoot });
    assert.equal(plan.statusCode, 200, module.path);
    assert.equal(plan.cacheControl, "no-store", module.path);

    const source = await readFile(new URL(`../web/dist/src/renderer/${module.file}`, import.meta.url), "utf8");
    assert.match(source, new RegExp(`export function ${module.exportName}`), module.file);
  }
});
