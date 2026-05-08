# GroupScout UI

Phase 0 establishes the product contract and test harness for the GroupScout operator workspace. Phase 1 adds the lead inbox API contract/client. Phase 2 adds the first mocked Lead Inbox screen for dense operator triage. Phase 3 adds the Lead Detail Evidence Workspace for source-backed review. Phase 4 adds the v1 lead status action model and typed mutation boundary.

## Current Scope

- Design tokens live in `web/src/design/tokens.js` and are mapped from `DESIGN.md`.
- The placeholder route shell lives in `web/src/app/shell.js`.
- Browser API access is isolated in `web/src/api/client.js` and restricted to same-origin `/api/*` paths.
- Lead inbox reads use `createApiClient().listLeads(...)` for `GET /api/leads` query serialization, pagination cursors, default priority ordering, and response field adaptation.
- Lead status writes use `createApiClient().patchLead(...)` for `PATCH /api/leads/{id}` payloads covering status, owner, notes, snooze date, correction reason, and safe field corrections.
- The Lead Inbox screen model lives in `web/src/app/leadInbox.js` and is mounted by `createRouteShell("/leads")`.
- The Lead Detail Evidence Workspace lives in `web/src/app/leadDetail.js` and is mounted by `createRouteShell("/leads/{id}")`.
- The lead status transition model lives in `web/src/app/leadStatus.js` and keeps valid actions isolated from detail rendering.
- Phase 2 UI tests cover mocked rows, filters, loading/empty/error states, detail navigation intent, responsive metadata, accessibility metadata, and `DESIGN.md` component-token usage.
- Phase 3 UI tests cover required detail sections, source evidence, raw audit link intent, AI enrichment, reviewer correction distinction, activity timeline entries, loading/not-found/error states, responsive metadata, and `DESIGN.md` component-token usage.
- Phase 4 tests cover the v1 transition table, disallowed action blocking, Lead Detail action visibility, PATCH serialization, required notes/snooze/correction reason validation, and auditable correction payloads.
- Tests use Node's built-in `node:test` runner so the harness has no package-install requirement yet.

## Test Command

```sh
npm test
```

## Developer Docs

- [Developer Guide](./docs/developer-guide.md)
- [How To Run The Backend](./docs/how-to-run-backend.md)
- [Testing](./docs/testing.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Nice To Knows](./docs/nice-to-knows.md)
- [Code Smells And Housekeeping Notes](./docs/code-smells.md)

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

## Phase 3 Lead Detail Evidence Workspace

- Screen model: `createLeadDetailScreen(...)`.
- Required sections: Summary, Source Evidence, AI Enrichment, Actions, Outreach, and Activity.
- Summary fields: title, score, timing, room-night signal, and property fit.
- Source Evidence fields: source name, source URL, raw audit link intent, and collected timestamp.
- AI Enrichment fields: contractor/applicant, project type, crew size, duration, rationale, uncertainty, and per-claim source evidence.
- Reviewer corrections are shown alongside original AI extraction values and never silently replace source-backed values.
- Responsive behavior: desktop evidence workspace, tablet evidence stack, and mobile detail stack with actions reachable.
- Out of scope: outreach logging and inline raw audit payload rendering.

## Phase 4 Lead Status Actions

- Statuses: `new`, `notified`, `claimed`, `contacted`, `snoozed`, `flagged`, `verified`, `dismissed`, `won`, `lost`, and `no_response`.
- Actions are generated from the transition table so operators only see valid actions for the current status.
- Invalid actions are rejected before `patchLead(...)` is called.
- `follow_up` and `corrected` are modeled as actions, not statuses, and preserve the current status.
- Corrections preserve original AI/source values and include actor plus reason metadata before API serialization.
