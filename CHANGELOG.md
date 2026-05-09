# Changelog

## Unreleased

### Phase 12 - UI Dockerization Planning

- Added a planning-only strict-TDD prompt pack for future UI dockerization in `docs/phase-12-ui-dockerization.md`.
- Captured backend Docker/Compose constraints from the sibling Go repo and current UI gaps: no Dockerfile, Compose file, renderer, dev server, build tool, lockfile, or browser runtime yet.
- Updated `UI_TDD_PHASE_PROMPTS.md`, `README.md`, `docs/developer-guide.md`, and `docs/testing.md` so future implementation starts with a Docker contract and test image before adding runtime or Compose behavior.

### Smell Phase H1 - Split The Growing API Client

- What: Split the browser API client into focused adapter modules while preserving the stable `createApiClient(...)` facade, public constants, endpoint paths, payload normalization, response adaptation, and centralized same-origin transport guard.
- Where: Updated `web/src/api/client.js`, added `web/src/api/transport.js`, `web/src/api/shared.js`, `web/src/api/leads.js`, `web/src/api/rawAudit.js`, `web/src/api/outreach.js`, `web/src/api/pipeline.js`, `web/src/api/stats.js`, `web/src/api/alerts.js`, `web/src/api/system.js`, and tightened `test/api-boundary.test.js`.
- When: Completed on 2026-05-09 after the H0 API-client characterization baseline.
- Why: Reduced review risk in the growing API client module without changing the browser-facing import path or weakening the security-sensitive `/api/*` same-origin boundary.
- How: Added split-module ownership coverage, moved feature-specific route builders/payload builders/adapters behind focused modules, kept transport validation in `transport.js`, documented the module map in `docs/smell-h1-api-client-split.md`, marked H1 complete in `docs/code-smell-transformation-prompts.md`, and reran the focused API-client suite plus `npm test`.

### Smell Phase H0 - API Client Baseline Characterization

- What: Added H0 characterization coverage for the browser API client public exports, `createApiClient(...)` method surface, same-origin transport defaults, invalid-route pre-fetch rejection, encoded lead-scoped routes, payload defaults, adapter defaults, and read-only policy metadata.
- Where: Updated `test/api-boundary.test.js`, `test/lead-inbox-client.test.js`, `test/lead-status-mutation-client.test.js`, `test/raw-audit-client.test.js`, `test/outreach-client.test.js`, `test/pipeline-client.test.js`, `test/stats-client.test.js`, `test/alert-client.test.js`, and `test/system-client.test.js`.
- When: Completed on 2026-05-09 before starting the H1 API-client split.
- Why: Created a stable baseline so the H1 refactor fails on real contract drift instead of import-path or file-layout movement.
- How: Tightened model-level `node:test` assertions, documented the affected H1 behavior map in `docs/smell-h0-api-client-characterization.md`, marked H0 complete in `docs/code-smell-transformation-prompts.md`, and refreshed README/testing/developer docs with the focused baseline command.

### Phase 11 - Today Command Center And System Health Summary

- Added failing-first Phase 11 tests for the Today command center, priority lead and aging-work summaries, active alerts, failed jobs, system health, read-only action policy, responsive metadata, `DESIGN.md` token usage, `/` route mounting, and `GET /api/system`.
- Added `web/src/app/todayCommandCenter.js` with mocked command-center data, summary cards, dense work rows, cross-workspace navigation intents, loading/empty/error states, responsive layouts, and read-only policy metadata.
- Added `createApiClient().getSystem()` for same-origin read-only `GET /api/system` access.
- Mounted the Today command center from `createRouteShell("/")` while keeping Settings as a placeholder.
- Added Phase 11 implementation notes in `docs/phase-11-today-command-center-system-health.md`, `README.md`, `docs/testing.md`, `docs/developer-guide.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 10 - Later Alertd Read-Only Console

- Added failing-first Phase 10 tests for read-only alert state rendering, SPS summaries, evidence display, room inventory, action history, disabled mutation actions, `/alerts` route mounting, responsive metadata, `DESIGN.md` token usage, and `GET /api/alerts`.
- Added `web/src/app/alertdConsole.js` with mocked Alertd data, Slack-first policy metadata, dense alert rows, evidence rows, room inventory details, action-history rows, loading/empty/error states, responsive layouts, and disabled acknowledge/resolve/suppress actions.
- Added `createApiClient().listAlerts(...)` for read-only same-origin `GET /api/alerts` access.
- Mounted the Alertd console from `createRouteShell("/alerts")`.
- Added Phase 10 implementation notes in `docs/phase-10-later-alertd-read-only-console.md`, `README.md`, `docs/testing.md`, `docs/developer-guide.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 9 - Session/Auth Wrapper And Same-Origin Deployment

- Added failing-first Phase 9 tests for session-required `/api/*` access, recursive browser-source `API_TOKEN` exclusion, base-path mounting, disabled UI behavior, deployment readiness, and development-only CORS configuration.
- Added `web/src/server/uiDeployment.js` with `UI_ENABLED`, `UI_BASE_PATH`, `UI_SESSION_SECRET`, and `CORS_ALLOWED_ORIGINS` config parsing plus session-cookie API authorization.
- Added `createMountedRouteShell(...)` so deployed UI routes under `UI_BASE_PATH` map back to workspace routes and expose base-path-aware navigation hrefs.
- Kept browser API requests same-origin with session credentials and no automation-token headers.
- Added Phase 9 implementation notes in `docs/phase-9-session-auth-wrapper-same-origin-deployment.md`, `README.md`, `docs/testing.md`, `docs/developer-guide.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 8 - Basic Analytics And Demand Signals

- Added failing-first Phase 8 tests for `GET /api/stats`, status/source/score-band/owner/week summaries, source-yield hit-rate definitions, lead aging, verification quality, upcoming demand, denominator/date-range labels, `/analytics` route mounting, responsive metadata, and `DESIGN.md` token usage.
- Added `web/src/app/analyticsDashboard.js` with mocked analytics stats, explainable source-yield calculations, lead aging, verification quality, demand rows, empty/loading/error states, and responsive layout metadata.
- Added `createApiClient().getStats(...)` for same-origin `GET /api/stats` with date range, segment, and property filters.
- Mounted the Analytics screen from `createRouteShell("/analytics")`.
- Added Phase 8 implementation notes in `docs/phase-8-basic-analytics-demand-signals.md`, `README.md`, `docs/testing.md`, `docs/developer-guide.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 7 - Pipeline Monitor And Run Controls

- Added failing-first Phase 7 tests for pipeline run history, async run creation, compact collector/LLM/delivery health fields, recent failures, partial-data states, `/pipeline` route mounting, same-origin API boundaries, and `DESIGN.md` token usage.
- Added `web/src/app/pipelineMonitor.js` with mocked pipeline run data, compact health summaries, recent failure summaries, optional log/Grafana links, responsive layouts, and browser-async run-control metadata.
- Added `createApiClient().listPipelineRuns(...)` and `createApiClient().startPipelineRun(...)` for same-origin `GET/POST /api/pipeline/runs`.
- Mounted the Pipeline Monitor from `createRouteShell("/pipeline")`.
- Added Phase 7 implementation notes in `docs/phase-7-pipeline-monitor-run-controls.md`, `README.md`, `docs/testing.md`, `docs/developer-guide.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 6 - Outreach Workspace And Activity Log

- Added failing-first Phase 6 tests for editable outreach drafts, contact validation, manual copied/sent/logged states, same-origin outreach API reads/writes, outcome capture, Lead Detail activity rows, `/outreach` route mounting, responsive metadata, and `DESIGN.md` token usage.
- Added `web/src/app/outreachWorkspace.js` with mocked outreach lead data, editable draft/contact field models, manual display states, outcome options, timeline rendering, responsive layouts, and no-auto-send/no-CRM-sync policy metadata.
- Added `createApiClient().listLeadOutreach(...)` and `createApiClient().logLeadOutreach(...)` for same-origin `GET/POST /api/leads/{id}/outreach`.
- Embedded a compact manual outreach workspace in Lead Detail and extended the activity log with outreach attempt and outcome entries.
- Mounted the Outreach Workspace from `createRouteShell("/outreach")`.
- Added Phase 6 implementation notes in `docs/phase-6-outreach-workspace-activity-log.md`, `README.md`, `docs/testing.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 5 - Verification Queue And Raw Audit Review

- Added failing-first Phase 5 tests for verification trigger classification, queue filters/actions, `/verification` route integration, raw audit API alias use, responsive metadata, and `DESIGN.md` token usage.
- Added `web/src/app/verificationQueue.js` with trigger classification, mocked queue data, dense row models, mobile card metadata, row actions, raw audit link intent, and an explicit blocked redaction-policy TODO.
- Added `createApiClient().getLeadRawAudit(...)` for same-origin `GET /api/leads/{id}/raw` access and updated Lead Detail raw audit links to use the UI-safe alias.
- Mounted the Verification Queue from `createRouteShell("/verification")`.
- Added Phase 5 implementation notes in `docs/phase-5-verification-queue-raw-audit-review.md`, `README.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Housekeeping Docs

- Added UI developer, testing, troubleshooting, nice-to-know, backend spin-up, and code-smell housekeeping docs under `docs/`.
- Documented backend startup paths from the sibling Go repo without changing backend code.
- Captured current UI test-coverage limits and known doc/config drift to guide future cleanup.
- Refreshed housekeeping docs with recursive credential-guard behavior, current phase links, focused test commands, optional design linting, and the latest code-smell watchlist.
- Added strict-TDD code-smell transformation prompts with tickable housekeeping phases and tasks for future refactor work.

### Phase 4 - Lead Status Actions And State Model

- Added failing-first Phase 4 state model tests for every recommended v1 status, allowed action, and disallowed transition.
- Added `web/src/app/leadStatus.js` with status constants, transition helpers, action metadata, validation, PATCH mutation intent building, and auditable field correction helpers.
- Added Lead Detail action controls that show only valid actions for the current lead status and reject invalid transitions before calling the API mutation boundary.
- Added `createApiClient().patchLead(...)` for same-origin `PATCH /api/leads/{id}` payloads covering status, owner, notes, snooze date, correction reason, and safe field corrections.
- Updated Phase 4 docs in `docs/phase-4-lead-status-actions-state-model.md`, `README.md`, and `UI_TDD_PHASE_PROMPTS.md`.

### Phase 3 - Lead Detail Evidence Workspace

- Added failing-first Phase 3 Lead Detail screen tests for required evidence sections, source evidence, raw audit link intent, AI enrichment rationale/uncertainty, activity timeline entries, reviewer correction distinction, state handling, responsive metadata, and `DESIGN.md` token usage.
- Added `createLeadDetailScreen(...)` and mocked lead detail evidence under `web/src/app/leadDetail.js`.
- Mounted read-only lead detail workspaces from `/leads/{id}` while keeping the Leads navigation section active.
- Expanded design token exports with documented `DESIGN.md` component names needed by the Lead Detail workspace: `card-base` and `code-inline`.
- Added Phase 3 implementation notes in `docs/phase-3-lead-detail-evidence-workspace.md`.

### Phase 2 - Lead Inbox UI

- Added failing-first Phase 2 Lead Inbox screen tests for dense table rendering, mocked lead rows, filters, loading/empty/error states, row detail navigation, responsive layout metadata, accessibility metadata, and `DESIGN.md` token usage.
- Added `createLeadInboxScreen(...)`, Lead Inbox columns, and mocked lead data under `web/src/app/leadInbox.js`.
- Mounted the Lead Inbox screen from the `/leads` route shell while keeping non-lead routes as placeholders.
- Expanded design token exports with documented `DESIGN.md` component names needed by the Lead Inbox: `button-secondary`, `search-pill`, `badge-tag`, `badge-type`, `feature-comparison-table`, and `property-row`.
- Added Phase 2 implementation notes in `docs/phase-2-lead-inbox-ui.md`.

### Phase 1 - Lead Inbox API Contract And Client

- Added Phase 1 lead inbox API contract tests for `GET /api/leads` query serialization, pagination, default priority ordering, response field adaptation, and missing-field validation.
- Added `createApiClient().listLeads(...)` as the typed browser boundary for the future lead inbox UI.
- Added default lead inbox priority sort metadata for urgent, unowned, high-score leads.
- Added Phase 1 contract documentation in `docs/phase-1-lead-inbox-contract.md`.

### Phase 0 - Product Contract And Test Harness

- Added a no-dependency Node test harness with `npm test`.
- Added Phase 0 guardrail tests for `DESIGN.md` token mapping, route shell IA, `/api/*` client isolation, and browser credential safety.
- Added minimal design token exports under `web/src/design/tokens.js`.
- Added a placeholder operator workspace shell under `web/src/app/shell.js`.
- Added a same-origin `/api/*` browser client boundary under `web/src/api/client.js`.
- Added Phase 0 implementation notes in `docs/phase-0-product-contract.md`.
