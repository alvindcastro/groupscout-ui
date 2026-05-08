# GroupScout UI

Phase 0 establishes the product contract and test harness for the future GroupScout operator workspace. Phase 1 adds the lead inbox API contract/client needed by the future dense inbox table. It does not implement lead-management visual workflows yet.

## Current Scope

- Design tokens live in `web/src/design/tokens.js` and are mapped from `DESIGN.md`.
- The placeholder route shell lives in `web/src/app/shell.js`.
- Browser API access is isolated in `web/src/api/client.js` and restricted to same-origin `/api/*` paths.
- Lead inbox reads use `createApiClient().listLeads(...)` for `GET /api/leads` query serialization, pagination cursors, default priority ordering, and response field adaptation.
- Tests use Node's built-in `node:test` runner so the harness has no package-install requirement yet.

## Test Command

```sh
npm test
```

## Phase 0 Guardrails

- Browser-facing source must not reference automation credentials.
- Browser requests must stay behind explicit `/api/*` contracts.
- The shell reserves navigation for Today, Leads, Verification, Outreach, Pipeline, Analytics, and Settings.
- Feature screens, real API calls, auth, analytics, and deployment behavior remain out of scope until later phases.

## Phase 1 Lead Inbox Contract

- Endpoint: `GET /api/leads`.
- Filters: `q`, `status`, `source`, `min_score`, `created_from`, `created_to`, `property`, `owner`, `verification_state`, `limit`, and `cursor`.
- Default sort: `priority`, representing urgent, unowned, high-score leads first with newest leads as the final tiebreaker.
- Response adapter fields: score, title, segment/project type, location/property fit, source, crew/duration estimate, outreach timing, status, owner, created date, evidence state, and verification state.
