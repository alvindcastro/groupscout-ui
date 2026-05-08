import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createPipelineMonitorScreen,
  createPipelineRunRequest,
  mockPipelineRuns
} from "../web/src/app/pipelineMonitor.js";
import { createRouteShell } from "../web/src/app/shell.js";
import { designTokens } from "../web/src/design/tokens.js";

test("pipeline monitor renders compact freshness collector LLM and delivery health", () => {
  const screen = createPipelineMonitorScreen();

  assert.equal(screen.kind, "pipeline-monitor-screen");
  assert.equal(screen.heading, "Pipeline Monitor");
  assert.equal(screen.state, "ready");
  assert.deepEqual(screen.health.freshness, {
    status: "healthy",
    lastRun: "May 8, 2026, 3:00 PM UTC",
    result: "healthy"
  });
  assert.deepEqual(screen.health.collector.counts, {
    collected: "42 collected",
    skipped: "5 skipped",
    enriched: "36 enriched"
  });
  assert.deepEqual(screen.health.llm, {
    provider: "openai",
    latency: "820 ms",
    errors: "0 errors"
  });
  assert.deepEqual(screen.health.delivery, {
    slack: "0 Slack failures",
    email: "1 email failure",
    webhook: "0 webhook failures"
  });
  assert.deepEqual(
    screen.links.map((link) => [link.label, link.href]),
    [
      ["Open logs", "https://logs.groupscout.test/runs/run_20260508_001"],
      ["Open Grafana", "https://grafana.groupscout.test/d/pipeline"]
    ]
  );
});

test("pipeline monitor shows run history and recent collector failures", () => {
  const screen = createPipelineMonitorScreen();

  assert.deepEqual(
    screen.history.rows.map((row) => [
      row.id,
      row.cells.status,
      row.cells.result,
      row.cells.collector,
      row.cells.failures
    ]),
    [
      [
        "run_20260508_001",
        "succeeded",
        "healthy",
        "42 collected / 5 skipped / 36 enriched",
        "permit_feed timeout"
      ],
      [
        "run_20260508_000",
        "partial",
        "degraded",
        "21 collected / 9 skipped / 18 enriched",
        "email delivery rejected, webhook 500"
      ]
    ]
  );
  assert.deepEqual(screen.recentFailures.items, [
    "permit_feed timeout",
    "email delivery rejected",
    "webhook 500"
  ]);
});

test("pipeline monitor starts manual runs through an injected async action only", async () => {
  const calls = [];
  const screen = createPipelineMonitorScreen({
    startRun: async (payload) => {
      calls.push(payload);
      return {
        id: "run_20260508_002",
        status: "queued",
        requestedAt: "2026-05-08T16:00:00Z",
        async: true
      };
    }
  });

  assert.deepEqual(createPipelineRunRequest({ reason: "manual_operator_run" }), {
    method: "POST",
    path: "/api/pipeline/runs",
    body: { reason: "manual_operator_run" },
    browserAsync: true
  });
  assert.equal(screen.runControl.blocksBrowserUntilFinished, false);
  assert.equal(screen.runControl.automationEndpointExposed, false);

  const started = await screen.actions.startRun({ reason: "manual_operator_run" });

  assert.deepEqual(calls, [{ reason: "manual_operator_run" }]);
  assert.deepEqual(started, {
    state: "starting",
    run: {
      id: "run_20260508_002",
      status: "queued",
      requestedAt: "2026-05-08T16:00:00Z",
      async: true
    }
  });
});

test("pipeline monitor handles loading empty error and partial-data states", () => {
  const loading = createPipelineMonitorScreen({ state: "loading" });
  assert.equal(loading.statusRegion.role, "status");
  assert.match(loading.statusRegion.message, /loading pipeline health/i);

  const empty = createPipelineMonitorScreen({ runs: [] });
  assert.equal(empty.state, "empty");
  assert.match(empty.emptyState.title, /no pipeline runs/i);

  const error = createPipelineMonitorScreen({
    state: "error",
    errorMessage: "Pipeline API unavailable"
  });
  assert.equal(error.statusRegion.role, "alert");
  assert.match(error.errorState.message, /pipeline api unavailable/i);

  const partial = createPipelineMonitorScreen({
    runs: [{ ...mockPipelineRuns[0], llm: null, notifications: null }]
  });
  assert.equal(partial.state, "partial");
  assert.equal(partial.health.llm.provider, "Unknown provider");
  assert.equal(partial.health.delivery.email, "Unknown email delivery");
});

test("pipeline monitor uses DESIGN tokens and is mounted from the Pipeline route", () => {
  const screen = createPipelineMonitorScreen({ viewport: "mobile" });
  assert.equal(screen.layout.mode, "mobile-pipeline-stack");
  assert.ok(screen.controls.every((control) => control.minTouchTarget >= 44));
  assert.equal(screen.tokens.card, designTokens.components["card-base"]);
  assert.equal(screen.tokens.primaryAction, designTokens.components["button-primary"]);
  assert.equal(screen.tokens.secondaryAction, designTokens.components["button-secondary"]);
  assert.equal(screen.tokens.badge, designTokens.components["badge-tag"]);
  assert.equal(screen.tokens.row, designTokens.components["property-row"]);

  const shell = createRouteShell("/pipeline");
  assert.equal(shell.activeRoute.label, "Pipeline");
  assert.equal(shell.content.kind, "pipeline-monitor-screen");
  assert.equal(shell.content.state, "ready");
});
