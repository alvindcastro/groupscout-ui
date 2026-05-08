# Changelog

## Unreleased

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
