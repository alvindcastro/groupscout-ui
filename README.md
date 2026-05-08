# GroupScout UI

Phase 0 establishes the product contract and test harness for the GroupScout operator workspace. Phase 1 adds the lead inbox API contract/client. Phase 2 adds the first mocked Lead Inbox screen for dense operator triage without write workflows.

## Current Scope

- Design tokens live in `web/src/design/tokens.js` and are mapped from `DESIGN.md`.
- The placeholder route shell lives in `web/src/app/shell.js`.
- Browser API access is isolated in `web/src/api/client.js` and restricted to same-origin `/api/*` paths.
- Lead inbox reads use `createApiClient().listLeads(...)` for `GET /api/leads` query serialization, pagination cursors, default priority ordering, and response field adaptation.
- The Lead Inbox screen model lives in `web/src/app/leadInbox.js` and is mounted by `createRouteShell("/leads")`.
- Phase 2 UI tests cover mocked rows, filters, loading/empty/error states, detail navigation intent, responsive metadata, accessibility metadata, and `DESIGN.md` component-token usage.
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

## Phase 2 Lead Inbox UI

- Screen model: `createLeadInboxScreen(...)`.
- Controls: search, status, source, minimum score, created date range, property, owner, verification, and clear filters.
- Table columns: score, title, segment/project, location/property, source, crew/duration, outreach timing, status, owner, created, and evidence/verification.
- Responsive behavior: desktop table, tablet priority table, and mobile lead cards.
- Out of scope: status mutations, outreach logging, raw audit viewing, lead detail evidence, and analytics.
