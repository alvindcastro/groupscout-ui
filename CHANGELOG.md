# Changelog

## Unreleased

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
