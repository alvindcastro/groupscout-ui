# GroupScout UI TDD Phase Prompts

> Planning artifact only. Do not implement code from this file in the current planning pass.
> Future implementation prompts must follow strict TDD: write failing tests first, run them, implement the smallest change, rerun tests, then refactor.

## Sources

- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/README.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/UI_STRATEGY.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/DOCKER.md`
- `DESIGN.md`
- `docs/phase-12-ui-dockerization.md`
- `docs/code-smell-transformation-prompts.md`

## Global Rules For Every Phase

- [ ] Start by restating the phase goal, user workflow, and acceptance criteria before editing code.
- [ ] Write or update tests before implementation.
- [ ] Run the targeted test command and confirm the new tests fail for the expected reason.
- [ ] Implement only the smallest code needed to pass the failing tests.
- [ ] Rerun the targeted tests and any nearby regression tests.
- [ ] Refactor only after tests pass.
- [ ] Keep browser code behind explicit `/api/*` contracts. Do not query the database from the browser.
- [ ] Do not expose `API_TOKEN` to browser JavaScript.
- [ ] Preserve auditability: raw source output, AI enrichment, reviewer edits, status history, and outreach activity must remain distinguishable.
- [ ] Use `DESIGN.md` tokens and component names verbatim. Do not approximate the Mintlify-style palette, typography, spacing, or radius system.
- [ ] Use Inter for UI prose and Geist Mono only for code, identifiers, and type-like values.
- [ ] Reserve mint green for accent CTAs, active states, and confirmations. Do not use it for body text or large surfaces.
- [ ] Prefer dense operational UI: tables, tabs, segmented filters, detail drawers, menus, and keyboard-friendly controls.
- [ ] Keep Slack/email as alerting channels; make the UI the durable review and ownership workspace.
- [ ] Do not build CRM replacement features, auto-send outreach email, complex permission matrices, dashboard builders, direct database access, or a full `alertd` console in the first UI sequence.

## Phase 0 - Product Contract And Test Harness

### Prompt

Use this prompt to prepare the UI implementation path without building feature UI.

```text
You are working in the GroupScout UI repo. Strictly follow TDD.

Goal: establish the UI implementation contract and testing harness needed for the lead-management MVP without building product features yet.

Context:
- Read DESIGN.md.
- Read /mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/UI_STRATEGY.md.
- The first UI is an operator workspace for lead triage, review, ownership, evidence, outreach history, and outcomes.
- The browser must use explicit /api/* contracts and must not query storage directly or expose API_TOKEN.

TDD requirements:
1. Write tests first for project-level guardrails: design token availability, route shell existence, API client boundary location, and no direct browser references to API_TOKEN.
2. Run the tests and confirm they fail because the harness or guardrail does not exist yet.
3. Add the minimal test setup and placeholder shell needed to pass.
4. Rerun the targeted tests.

Do not build lead screens, real API calls, analytics, auth, or deployment behavior in this phase.
```

### Tasks

- [x] Decide the UI app structure and test runner from the existing repo conventions.
- [x] Add failing tests for token import or token mapping from `DESIGN.md`.
- [x] Add failing tests for a route shell that can host Today, Leads, Verification, Outreach, Pipeline, Analytics, and Settings later.
- [x] Add failing tests that browser-facing code does not read `API_TOKEN`.
- [x] Add minimal harness code only after tests fail.
- [x] Document the test command in the implementation notes for the phase.

### Acceptance Criteria

- [x] Tests prove there is a stable place for design tokens.
- [x] Tests prove browser API access is isolated behind a client boundary.
- [x] Tests prove the app shell can host the planned IA without implementing feature screens.
- [x] No feature workflow is implemented yet.

### Implementation Notes

- App structure: `web/src/design`, `web/src/app`, and `web/src/api`.
- Test runner: Node's built-in `node:test`, invoked with `npm test`.
- Red run: failed with missing `web/src/*` Phase 0 harness modules.
- Green run: `npm test` passes after adding only placeholder shell, design token exports, and API client boundary.

## Phase 1 - Lead Inbox API Contract And Client

### Prompt

```text
Strictly follow TDD.

Goal: define and consume the lead inbox API contract for GET /api/leads with filtering, pagination, and default priority ordering.

Context:
- Lead Inbox is a dense operational table.
- Default sort should put urgent, unowned, high-score leads first.
- Expected filters: status, source, min_score, created date, property, owner, verification state, and free text query.
- Browser code must use generated or typed API clients, not ad hoc fetch calls spread through components.

TDD requirements:
1. Write contract/client tests before implementation.
2. Assert query serialization for q, status, source, min_score, created date, property, owner, verification state, limit, and cursor.
3. Assert the typed response includes score, title, segment/project type, location/property fit, source, crew/duration estimate, outreach timing, status, owner, created date, and evidence/verification state.
4. Assert default sort semantics are represented in the contract or adapter.
5. Run tests and confirm expected failure.
6. Implement the smallest client/contract surface needed.
7. Rerun tests.

Do not build the visual inbox table yet.
```

### Tasks

- [x] Add tests for `GET /api/leads` query parameters.
- [x] Add tests for pagination cursor handling.
- [x] Add tests for default priority ordering expectations.
- [x] Add tests for lead list item fields required by the inbox.
- [x] Implement only the typed contract/client surface needed for those tests.
- [x] Update OpenAPI or typed schema notes if this repo owns them.

### Acceptance Criteria

- [x] Inbox data requirements are test-covered before UI rendering starts.
- [x] Pagination and filters are represented in one typed boundary.
- [x] Components will not need to know raw endpoint URLs.

### Implementation Notes

- Contract/client facade lives in `web/src/api/client.js`; after H1, lead adapter implementation lives in `web/src/api/leads.js`.
- Tests live in `test/lead-inbox-client.test.js`.
- Typed schema notes live in `docs/phase-1-lead-inbox-contract.md`.
- Red run: `npm test` failed because Phase 1 lead inbox contract exports did not exist yet.
- Green run: `npm test` passes after adding `listLeads`, query serialization, default priority sort metadata, and the response adapter.

## Phase 2 - Lead Inbox UI

### Prompt

```text
Strictly follow TDD.

Goal: build the Lead Inbox screen using mocked client data and DESIGN.md tokens.

Context:
- This is an operations table, not a marketing page.
- Controls: search, status/source/min score/date/property/owner/verification filters, and clear filter behavior.
- Columns: score, title, segment/project type, location/property fit, source, estimated crew/duration, suggested outreach timing, status, owner, created date, evidence/verification state.
- Use dense layout, restrained color, accessible controls, and keyboard-friendly interactions.

TDD requirements:
1. Write failing component tests first for rendering, filtering controls, empty/loading/error states, row selection, and navigation to lead detail.
2. Add responsive tests for desktop table behavior and mobile/tablet collapse behavior.
3. Add accessibility assertions for labels, focus order, and touch targets.
4. Run tests and confirm expected failure.
5. Implement the smallest screen code needed to pass.
6. Rerun tests and any visual checks available in the repo.

Do not implement status mutations, outreach logging, raw audit viewing, or analytics in this phase.
```

### Tasks

- [x] Test table columns and row content from mocked leads.
- [x] Test search and each planned filter control.
- [x] Test loading, empty, and error states.
- [x] Test row activation opens or routes to lead detail.
- [x] Test desktop, tablet, and mobile layout behavior.
- [x] Test design-token usage for buttons, inputs, tabs, badges, and table surfaces.
- [x] Implement after the tests fail.

### Acceptance Criteria

- [x] Operators can scan high-priority unowned leads.
- [x] Filters are usable and reflected in client query state.
- [x] UI follows `DESIGN.md` tokens for typography, spacing, borders, radius, and status accents.
- [x] The screen remains dense and operational at desktop sizes and usable on mobile.

### Implementation Notes

- Screen surface lives in `web/src/app/leadInbox.js`.
- Tests live in `test/lead-inbox-screen.test.js`, with shell integration coverage in `test/app-shell.test.js`.
- Red run: Phase 2 screen tests failed because `web/src/app/leadInbox.js` did not exist yet; stricter follow-up tests failed while `/leads` still returned placeholder content and Phase 2 component tokens were incomplete.
- Green run: `npm test` passes after adding the mocked Lead Inbox screen, documented `DESIGN.md` component tokens, and `/leads` shell mounting.
- The current no-dependency harness verifies view model, token, responsive metadata, accessibility metadata, and navigation intent. It does not perform computed CSS or real browser focus checks yet.

## Phase 3 - Lead Detail Evidence Workspace

### Prompt

```text
Strictly follow TDD.

Goal: build the Lead Detail workspace around reviewable evidence and audit-preserving AI enrichment.

Context:
- Required sections: Summary, Source Evidence, AI Enrichment, Actions, Outreach, Activity.
- Summary: title, score, timing, room-night signal, property fit.
- Source evidence: source name, source URL, raw audit link, collected timestamp.
- AI enrichment: contractor/applicant, project type, crew size, duration, rationale, uncertainty.
- Activity: status history, notes, outreach attempts, reviewer corrections.

TDD requirements:
1. Write failing tests for each required section before implementing layout.
2. Test that original source/AI fields and reviewer corrections are visually distinct.
3. Test raw audit link presence without loading raw payload inline yet.
4. Test loading, not found, and error states.
5. Test responsive layout: detail content is readable and actions remain reachable.
6. Run tests, implement the minimum, rerun tests.

Do not implement mutations beyond read-only detail display in this phase.
```

### Tasks

- [x] Add tests for all required detail sections.
- [x] Add tests for source evidence and raw audit link.
- [x] Add tests for AI rationale and uncertainty display.
- [x] Add tests for activity timeline entries.
- [x] Add tests that reviewer corrections never silently replace source-backed extraction.
- [x] Implement read-only detail UI after tests fail.

### Acceptance Criteria

- [x] Operators can evaluate why a lead exists and whether it is trustworthy.
- [x] Source evidence is paired with every AI claim that needs review.
- [x] Audit trail concepts are visible before write workflows are added.

### Implementation Notes

- Detail workspace surface lives in `web/src/app/leadDetail.js` and is mounted from `/leads/{id}` by `web/src/app/shell.js`.
- Tests live in `test/lead-detail-screen.test.js`, with route coverage in `test/app-shell.test.js` and token coverage in `test/design-tokens.test.js`.
- Red run: `node --test test/lead-detail-screen.test.js test/app-shell.test.js` failed because `web/src/app/leadDetail.js` did not exist yet.
- Green run: `node --test test/lead-detail-screen.test.js test/app-shell.test.js test/design-tokens.test.js` passed after adding the read-only workspace, Phase 3 token exports, and `/leads/{id}` routing.
- The current no-dependency harness verifies screen contracts, state metadata, responsive metadata, token references, and raw audit link intent. It does not perform computed CSS, real browser focus checks, or raw payload rendering.

## Phase 4 - Lead Status Actions And State Model

### Prompt

```text
Strictly follow TDD.

Goal: implement lead status actions from the recommended v1 state model.

Context:
- Recommended states: new, notified, claimed, contacted, snoozed, flagged, verified, dismissed, won, lost, no_response.
- Allowed actions must match the state transition table in UI_STRATEGY.md.
- Verification may later become a separate field, so isolate transition logic from rendering.

TDD requirements:
1. Write failing unit tests for every allowed and disallowed state transition.
2. Write failing component tests showing only valid actions for the current lead state.
3. Write failing mutation tests for PATCH /api/leads/{id} payloads: status, owner, notes, snooze date, and safe field corrections.
4. Write failing tests that corrections preserve original AI/source values plus who changed what and why.
5. Run tests, implement minimum transition logic and UI actions, rerun tests.

Do not add bulk actions until the status model is stable.
```

### Tasks

- [x] Test allowed transitions from each v1 status.
- [x] Test invalid transitions are blocked before API mutation.
- [x] Test claim, dismiss, snooze, flag, contacted, won, lost, no_response, follow_up, reopen, verified, and corrected actions where applicable.
- [x] Test notes and correction reason requirements.
- [x] Implement transition helpers and UI action controls after tests fail.
- [x] Keep mutation payloads typed and isolated in the API client boundary.

### Acceptance Criteria

- [x] Operators only see actions that make sense for the current lead.
- [x] Invalid transitions are impossible from the UI.
- [x] Corrections are auditable and do not overwrite source-backed data silently.

### Implementation Notes

- State model helpers live in `web/src/app/leadStatus.js`.
- Lead Detail action controls are generated from the isolated status model in `web/src/app/leadDetail.js`.
- PATCH mutation serialization enters through the browser API facade at `web/src/api/client.js`; after H1, lead mutation adapter implementation lives in `web/src/api/leads.js`.
- Tests live in `test/lead-status-state-model.test.js`, `test/lead-status-mutation-client.test.js`, and the Phase 4 additions to `test/lead-detail-screen.test.js`.
- Red runs failed first on missing `web/src/app/leadStatus.js`, missing `createApiClient().patchLead(...)`, read-only Phase 3 detail actions, and missing correction reason serialization.
- Green run: `npm test` passes after adding transition helpers, valid action metadata, invalid transition blocking, typed lead PATCH payloads, and auditable correction payloads.

## Phase 5 - Verification Queue And Raw Audit Review

### Prompt

```text
Strictly follow TDD.

Goal: build the Verification Queue and authenticated raw audit review entry point.

Context:
- Queue triggers include missing source URL/raw audit record, high score with weak rationale, contradiction between raw source and enriched fields, low confidence collector parse, and manual operator flag.
- GET /api/leads/{id}/raw should be the UI-safe alias for raw audit payload access.
- Raw payloads may need redaction rules before display.

TDD requirements:
1. Write failing tests for queue inclusion rules.
2. Write failing tests for verification queue filters and row actions.
3. Write failing tests for opening raw audit evidence through /api/leads/{id}/raw, not the older non-UI endpoint directly.
4. Write failing tests for redacted or blocked sensitive raw payload fields once redaction rules are known.
5. Run tests, implement minimal queue and raw evidence access, rerun tests.

If redaction rules are not defined, add a blocked test/TODO documenting the missing decision instead of guessing.
```

### Tasks

- [x] Test queue trigger classification.
- [x] Test verification queue list rendering.
- [x] Test verify, correct, dismiss, and return-to-lead actions.
- [x] Test raw audit link/client path uses `/api/leads/{id}/raw`.
- [x] Test missing-redaction decision is visible if rules are undefined.
- [x] Implement after tests fail.

### Acceptance Criteria

- [x] High-value but low-trust leads have a focused workspace.
- [x] Raw audit access goes through the UI-safe API boundary.
- [x] Undefined redaction policy remains explicit instead of hidden in UI behavior.

### Implementation Notes

- Verification Queue screen surface lives in `web/src/app/verificationQueue.js` and is mounted from `/verification` by `web/src/app/shell.js`.
- Raw audit client access lives in `createApiClient().getLeadRawAudit(...)` and uses `GET /api/leads/{id}/raw`.
- Lead Detail raw audit evidence links now use `/api/leads/{id}/raw`.
- Tests live in `test/verification-queue.test.js`, `test/raw-audit-client.test.js`, plus Phase 5 route/raw-link assertions in `test/app-shell.test.js` and `test/lead-detail-screen.test.js`.
- Red run: `node --test test/verification-queue.test.js test/raw-audit-client.test.js test/app-shell.test.js test/lead-detail-screen.test.js` failed because the queue module, raw audit client method, `/verification` route mounting, and UI-safe Lead Detail raw link did not exist yet.
- Green run: `npm test` passes after adding queue trigger classification, queue filters/actions, raw audit alias client access, `/verification` route mounting, and explicit blocked redaction metadata.
- Redaction rules are still undefined; Phase 5 documents `RAW_AUDIT_REDACTION_POLICY.status = "blocked"` instead of rendering sensitive raw payloads inline.

## Phase 6 - Outreach Workspace And Activity Log

### Prompt

```text
Strictly follow TDD.

Goal: add editable outreach draft, contact fields, outreach attempt logging, and outcome capture.

Context:
- POST /api/leads/{id}/outreach logs outreach attempt, channel, contact, notes, and outcome.
- GET /api/leads/{id}/outreach shows activity history.
- The first UI must not auto-send outreach email.

TDD requirements:
1. Write failing tests for editable draft and contact fields.
2. Write failing tests for copied/sent/logged display states without actually sending email.
3. Write failing API client tests for POST and GET outreach endpoints.
4. Write failing activity timeline tests for outreach attempts and outcomes.
5. Run tests, implement minimum workspace, rerun tests.

Do not implement automated sending or CRM sync in this phase.
```

### Tasks

- [x] Test editable outreach draft behavior.
- [x] Test contact field validation.
- [x] Test manual logging of channel, contact, notes, and outcome.
- [x] Test contacted, won, lost, no-response outcome capture.
- [x] Test activity history renders outreach attempts.
- [x] Implement after tests fail.

### Acceptance Criteria

- [x] Operators can prepare and log outreach without the UI sending messages.
- [x] Outreach history is visible in lead detail activity.
- [x] Outcome data can feed later analytics.

### Implementation Notes

- Outreach Workspace surface lives in `web/src/app/outreachWorkspace.js` and is mounted from `/outreach` by `web/src/app/shell.js`.
- Lead Detail embeds a compact manual outreach workspace in `web/src/app/leadDetail.js`.
- Outreach API reads and writes live in `createApiClient().listLeadOutreach(...)` and `createApiClient().logLeadOutreach(...)`.
- Tests live in `test/outreach-workspace.test.js`, `test/outreach-client.test.js`, plus Phase 6 route/detail assertions in `test/app-shell.test.js` and `test/lead-detail-screen.test.js`.
- Red run: `npm test` failed because outreach client methods and Lead Detail outreach workspace behavior did not exist yet; `node test/app-shell.test.js` failed while `/outreach` still returned a placeholder.
- Green run: `npm test` passes after adding editable outreach drafts, contact validation, manual copied/sent/logged states, outcome capture, outreach history timelines, same-origin `GET/POST /api/leads/{id}/outreach`, and `/outreach` route mounting.
- Automated sending and CRM sync remain out of scope; Phase 6 display states explicitly set send/sync behavior to false.

## Phase 7 - Pipeline Monitor And Run Controls

### Prompt

```text
Strictly follow TDD.

Goal: add compact pipeline health and run controls for operators.

Context:
- Pipeline Monitor answers whether the system is healthy; it does not replace Grafana.
- Show last run time/result, collector collected/skipped/enriched counts, collector failures, LLM provider/latency/errors, Slack/email/webhook delivery failures, and links to logs or Grafana where available.
- POST /api/pipeline/runs should start a run without blocking the browser for the whole pipeline.
- GET /api/pipeline/runs should show recent run history and status.

TDD requirements:
1. Write failing API client tests for pipeline run creation and run history.
2. Write failing component tests for compact health fields.
3. Write failing tests that run creation is asynchronous from the browser perspective.
4. Write failing tests for failure and partial-data states.
5. Run tests, implement minimum pipeline monitor, rerun tests.

Do not expose automation-only endpoints directly in browser components.
```

### Tasks

- [x] Test run history client behavior.
- [x] Test async run creation state.
- [x] Test collector count display.
- [x] Test recent failures display.
- [x] Test LLM and notification delivery health summaries.
- [x] Implement after tests fail.

### Acceptance Criteria

- [x] Operators can see whether the lead pipeline is fresh and healthy.
- [x] Manual run control does not block the UI for long-running pipeline work.
- [x] Browser components do not call automation endpoints directly.

### Implementation Notes

- Pipeline Monitor surface lives in `web/src/app/pipelineMonitor.js` and is mounted from `/pipeline` by `web/src/app/shell.js`.
- Pipeline API reads and writes live in `createApiClient().listPipelineRuns(...)` and `createApiClient().startPipelineRun(...)`.
- Tests live in `test/pipeline-monitor.test.js` and `test/pipeline-client.test.js`, with route and credential-boundary assertions in `test/app-shell.test.js` and `test/api-boundary.test.js`.
- Red run: `npm test` failed because the pipeline client methods and monitor module did not exist yet.
- Targeted green runs: `node --test test/pipeline-client.test.js` and `node --test test/pipeline-monitor.test.js`.
- Green run: `npm test` passes after adding compact health summaries, recent run history, async run-control metadata, same-origin `GET/POST /api/pipeline/runs`, partial-data states, and `/pipeline` route mounting.
- Grafana/log links are optional display links; automation-only endpoints remain out of browser components.

## Phase 8 - Basic Analytics And Demand Signals

### Prompt

```text
Strictly follow TDD.

Goal: add basic explainable analytics for lead operations.

Context:
- Analytics should include counts by status, source, score band, owner, and week.
- Useful views: source yield, claimed/won/lost rates, lead aging, score distribution, verification quality, and upcoming demand by week/segment/property.
- Source hit rate must use explicit outcome definitions.

TDD requirements:
1. Write failing tests for GET /api/stats client shape.
2. Write failing component tests for each summary metric and empty state.
3. Write failing tests documenting the selected source hit-rate definition.
4. Write failing tests that analytics explain their denominator and date range.
5. Run tests, implement minimum analytics, rerun tests.

Do not build a custom dashboard builder in this phase.
```

### Tasks

- [x] Test stats client response.
- [x] Test status, source, score band, owner, and week summaries.
- [x] Test lead aging and verification quality summaries.
- [x] Test demand timing view.
- [x] Test visible denominator/date range labels.
- [x] Implement after tests fail.

### Acceptance Criteria

- [x] Managers can understand pipeline coverage and source quality.
- [x] Metrics are explainable and tied to explicit outcome definitions.
- [x] Analytics remain basic and operational.

### Implementation Notes

- Analytics screen surface lives in `web/src/app/analyticsDashboard.js` and is mounted from `/analytics` by `web/src/app/shell.js`.
- Stats API access lives in `createApiClient().getStats(...)` and uses same-origin `GET /api/stats`.
- Source hit rate is defined as `won leads / total source leads`, with `won` as the only numerator status and all source leads in the selected date range as the denominator.
- Tests live in `test/stats-client.test.js`, `test/analytics-dashboard.test.js`, and `test/analytics-screen.test.js`, with route and credential-boundary assertions in `test/app-shell.test.js` and `test/api-boundary.test.js`.
- Red run: `node --test test/stats-client.test.js test/analytics-dashboard.test.js` failed because the analytics module and stats client method did not exist yet.
- Targeted green run: `node --test test/stats-client.test.js test/analytics-dashboard.test.js test/analytics-screen.test.js test/app-shell.test.js test/api-boundary.test.js`.
- Green run: `npm test` passes after adding stats adaptation, explainable metric definitions, summary sections, lead aging, verification quality, demand rows, and `/analytics` route mounting.
- Custom dashboard builders remain out of scope.

## Phase 9 - Session/Auth Wrapper And Same-Origin Deployment

### Prompt

```text
Strictly follow TDD.

Goal: add the minimum UI session/auth and deployment wrapper needed for safe operator access.

Context:
- Candidate settings: UI_ENABLED, UI_BASE_PATH, UI_SESSION_SECRET, CORS_ALLOWED_ORIGINS.
- Same-origin deployment is preferred where possible.
- API_TOKEN remains for automation clients such as n8n, not end-user browser sessions.

TDD requirements:
1. Write failing tests for session-required UI API access.
2. Write failing tests that browser bundles do not include API_TOKEN.
3. Write failing tests for UI_ENABLED and UI_BASE_PATH behavior if this repo owns deployment behavior.
4. Write failing tests for development-only CORS configuration if applicable.
5. Run tests, implement minimum auth/deployment wrapper, rerun tests.

Do not add complex role matrices unless the backend contract already defines them.
```

### Tasks

- [x] Test session enforcement for `/api/*`.
- [x] Test no `API_TOKEN` in browser runtime/config.
- [x] Test base path mounting.
- [x] Test disabled UI behavior.
- [x] Test dev-only CORS behavior if needed.
- [x] Implement after tests fail.

### Acceptance Criteria

- [x] UI access is safe enough for operator use.
- [x] Automation credentials are not repurposed for browser sessions.
- [x] Deployment settings are explicit and test-covered.

### Implementation Notes

- Added `web/src/server/uiDeployment.js` for `UI_ENABLED`, `UI_BASE_PATH`, `UI_SESSION_SECRET`, development-only `CORS_ALLOWED_ORIGINS`, base-path mount resolution, and session-cookie `/api/*` authorization.
- Added `createMountedRouteShell(...)` for `UI_BASE_PATH` route mapping and base-path-aware navigation hrefs.
- Expanded browser credential tests to recursively scan browser-facing `web/src` modules while keeping server-only deployment helpers out of the bundle scan.
- Red run: `node --test test/session-deployment.test.js test/api-boundary.test.js test/app-shell.test.js` failed with missing Phase 9 exports.
- Green runs: `node --test test/session-deployment.test.js test/api-boundary.test.js test/app-shell.test.js` and `npm test`.

## Phase 10 - Later Alertd Read-Only Console

### Prompt

```text
Strictly follow TDD.

Goal: optionally add a read-only disruption alert console after the lead workflow is stable.

Context:
- alertd remains Slack-first for the lead-management MVP.
- A later UI can show current SPS, evidence, room inventory, alert state, and action history.

TDD requirements:
1. Write failing tests for read-only alert state rendering.
2. Write failing tests for evidence and action history display.
3. Write failing tests that alert actions remain disabled or out of scope unless contracts exist.
4. Run tests, implement minimum read-only view, rerun tests.

Do not let this phase block or expand the lead-management MVP.
```

### Tasks

- [x] Confirm lead workflow phases are stable before starting.
- [x] Test read-only alert summary.
- [x] Test evidence display.
- [x] Test room inventory display if data contract exists.
- [x] Test action history display.
- [x] Keep mutations out of scope.

### Acceptance Criteria

- [x] Disruption monitoring is visible without replacing Slack as the interrupt channel.
- [x] The console remains read-only unless future contracts justify actions.

### Implementation Notes

- Alertd console surface lives in `web/src/app/alertdConsole.js` and is mounted from `/alerts` by `web/src/app/shell.js`.
- Read-only alert API access lives in `createApiClient().listAlerts(...)` and uses `GET /api/alerts`.
- The console shows current alert state, SPS, source evidence, room inventory, and action history while documenting Slack as the interrupt channel.
- Alert mutations remain disabled and out of scope; the client exposes no create, patch, acknowledge, resolve, or suppress methods.
- Tests live in `test/alert-console.test.js` and `test/alert-client.test.js`, with route and credential-boundary assertions in `test/app-shell.test.js` and `test/api-boundary.test.js`.
- Lead-workflow stability check: `npm test` passed before Phase 10 implementation.
- Red run: `node --test test/alert-console.test.js test/alert-client.test.js test/app-shell.test.js test/api-boundary.test.js` failed because the alert console module, `/alerts` route mounting, and `listAlerts(...)` client did not exist yet.
- Green runs: `node --test test/alert-console.test.js test/alert-client.test.js test/app-shell.test.js test/api-boundary.test.js` and `npm test`.

## Phase 11 - Today Command Center And System Health Summary

### Prompt

```text
Strictly follow TDD.

Goal: replace the reserved Today placeholder with a dense command center that shows the operator what needs attention now.

Context:
- Today is the first workspace route and should summarize existing lead, verification, outreach, pipeline, analytics, and alert surfaces.
- The command center should show high-score new leads, aging claimed leads, active disruption alerts, failed jobs, and system health.
- System health must use a UI-friendly /api/system contract, not browser calls to raw health/metrics/automation endpoints.
- Today is an orientation and routing surface. Mutations remain in the owning workspaces.

TDD requirements:
1. Write failing tests for the Today command center before implementing the screen.
2. Test priority leads, aging claimed work, active alerts, failed jobs, system health, read-only action policy, loading/empty/error states, responsive metadata, token usage, and root route mounting.
3. Write failing client tests for read-only GET /api/system.
4. Run tests and confirm expected failure.
5. Implement the smallest screen and client surface needed.
6. Rerun targeted tests and then the full suite.

Do not build Settings, custom dashboards, system mutations, alert mutations, pipeline internals, or direct browser access to automation endpoints.
```

### Tasks

- [x] Test the Today summary counts and generated timestamp.
- [x] Test high-score new lead rows and aging claimed lead rows.
- [x] Test active alert, failed job, and system-health summaries.
- [x] Test read-only route/action policy.
- [x] Test loading, empty, error, desktop, tablet, and mobile state metadata.
- [x] Test `GET /api/system` client access and response adaptation.
- [x] Mount Today from the root route after tests fail.

### Acceptance Criteria

- [x] Operators can scan the day’s highest-priority work from `/`.
- [x] Every Today action links to an owning workspace instead of introducing duplicate mutations.
- [x] System health is exposed through same-origin `/api/system`.
- [x] Settings remains out of scope.

### Implementation Notes

- Today command center surface lives in `web/src/app/todayCommandCenter.js` and is mounted from `/` by `web/src/app/shell.js`.
- Read-only system summary API access lives in `createApiClient().getSystem()` and uses `GET /api/system`.
- Today shows high-score new leads, aging claimed leads, active alerts, failed jobs, and API/database/collector/LLM health.
- Tests live in `test/today-command-center.test.js` and `test/system-client.test.js`, with root route coverage in `test/app-shell.test.js`.
- Red run: `node --test test/today-command-center.test.js test/system-client.test.js test/app-shell.test.js` failed because the Today module, `/` route mounting, and `getSystem()` client did not exist yet.
- Green runs: `node --test test/today-command-center.test.js test/system-client.test.js test/app-shell.test.js` and `npm test`.

## Phase 12 - UI Dockerization

> Planning status: D0 contract documented. The detailed prompt pack lives in `docs/phase-12-ui-dockerization.md`, and the D0 decision record lives in `docs/ui-dockerization-contract.md`.

### Prompt

```text
Strictly follow TDD. Do not skip the red step.

Goal: dockerize the UI in phases without inventing a browser runtime before the repo has one.

Context:
- The backend Docker stack is in /mnt/c/Users/alvin/GolandProjects/groupscout.
- Backend Compose runs groupscout on 8080, alertd on 8081, Postgres, n8n, observability, Ollama, and ollama-init on groupscout_net.
- The UI repo currently has no Dockerfile, .dockerignore, Compose file, renderer, dev server, build tool, lockfile, or browser runtime.
- The UI repo currently runs model-level JavaScript tests with npm test -> node --test.
- Browser code must use same-origin /api/* contracts.
- API_TOKEN and provider secrets must not be exposed to browser JavaScript, static assets, generated config, or public image layers.

TDD requirements:
1. Start with a dockerization contract and decision record before adding Docker files.
2. Add the smallest failing test or validation for each Docker behavior before implementing it.
3. Confirm the red failure is caused by missing Docker/runtime behavior, not an unrelated test break.
4. Implement the smallest change needed to pass.
5. Rerun the focused check, then npm test.
6. Run Docker validation only after Docker files exist: docker build, docker compose config, and smoke checks as appropriate.

Do not add Dockerfile, Compose, nginx/proxy config, browser framework, dev server, or production runtime in the planning-only pass.
```

### Phase Tasks

- [x] D0 - Dockerization Contract And Decision Record
- [ ] D1 - UI Test Container
- [ ] D2 - Browser Runtime Contract
- [ ] D3 - Development Compose Integration
- [ ] D4 - Same-Origin Proxy Or Static Serving
- [ ] D5 - Docker Operations Docs And CI Hooks

### Acceptance Criteria

- [ ] The first Docker implementation target is a deterministic UI test image.
- [ ] A browser runtime is added only after its contract is test-covered.
- [ ] Development Compose reaches the backend by service name, `http://groupscout:8080`, from inside the Docker network.
- [ ] Browser-visible code and config never contain `API_TOKEN`, provider keys, Slack tokens, Resend keys, or database URLs.
- [ ] Production serves browser assets and `/api/*` from one origin.
- [ ] README, developer, testing, and troubleshooting docs are updated only when real commands exist.

### Implementation Notes

- Current pass created the D0 documentation-only contract and guardrail test only.
- D0 evidence: `node --test test/dockerization-contract.test.js` failed before `docs/ui-dockerization-contract.md` and its links existed, then passed after the contract and Markdown references were added.
- Do not mark Phase 12 complete until Docker files or runtime code are added through strict TDD and verified.
- Backend constraints inspected: `/mnt/c/Users/alvin/GolandProjects/groupscout/Dockerfile`, `/mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml`, `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/DOCKER.md`, `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/TESTING.md`, and `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/API_CONFIG.md`.

## Open Decisions To Resolve Before Coding

- [ ] Is verification a lead status or a separate source-review status?
- [ ] Who can claim, verify, correct, dismiss, reopen, and mark won/lost?
- [ ] Should corrected fields overwrite lead columns, live in a corrections table, or both?
- [ ] Is built-in cookie auth required, or will the UI sit behind an auth proxy?
- [ ] Is GroupScout or a future CRM the source of truth for outreach outcomes?
- [ ] What exactly counts as source hit rate: claimed/total, won/claimed, won/total, or another metric?
- [ ] What raw audit payloads can operators view, and what must be redacted before display? Phase 5 keeps this blocked explicitly before inline raw payload rendering.
- [ ] Should v1 ship Slack quick actions, the admin UI, or both together?
- [ ] Should the first real UI runtime be static assets, a lightweight Node server, or backend-served assets?
- [ ] Should UI Compose live in the UI repo, the backend repo, or as a cross-repo override?
- [ ] Should production same-origin behavior use a proxy container or Go static-file serving?

## Suggested Phase Order

- [x] Phase 0 - Product Contract And Test Harness
- [x] Phase 1 - Lead Inbox API Contract And Client
- [x] Phase 2 - Lead Inbox UI
- [x] Phase 3 - Lead Detail Evidence Workspace
- [x] Phase 4 - Lead Status Actions And State Model
- [x] Phase 5 - Verification Queue And Raw Audit Review
- [x] Phase 6 - Outreach Workspace And Activity Log
- [x] Phase 7 - Pipeline Monitor And Run Controls
- [x] Phase 8 - Basic Analytics And Demand Signals
- [x] Phase 9 - Session/Auth Wrapper And Same-Origin Deployment
- [x] Phase 10 - Later Alertd Read-Only Console
- [x] Phase 11 - Today Command Center And System Health Summary
- [ ] Phase 12 - UI Dockerization

## Related Refactor Prompt Pack

- [ ] Use `docs/code-smell-transformation-prompts.md` for future code-smell transformation work. Those phases are not product phases; they are housekeeping refactor phases and must also follow strict TDD.
