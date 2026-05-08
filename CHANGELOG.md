# Changelog

## Unreleased

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
