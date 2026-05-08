# GroupScout UI TDD Phase Prompts

> Planning artifact only. Do not implement code from this file in the current planning pass.
> Future implementation prompts must follow strict TDD: write failing tests first, run them, implement the smallest change, rerun tests, then refactor.

## Sources

- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/README.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/UI_STRATEGY.md`
- `DESIGN.md`

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

- Contract/client surface lives in `web/src/api/client.js`.
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

- [ ] Test table columns and row content from mocked leads.
- [ ] Test search and each planned filter control.
- [ ] Test loading, empty, and error states.
- [ ] Test row activation opens or routes to lead detail.
- [ ] Test desktop, tablet, and mobile layout behavior.
- [ ] Test design-token usage for buttons, inputs, tabs, badges, and table surfaces.
- [ ] Implement after the tests fail.

### Acceptance Criteria

- [ ] Operators can scan high-priority unowned leads.
- [ ] Filters are usable and reflected in client query state.
- [ ] UI follows `DESIGN.md` tokens for typography, spacing, borders, radius, and status accents.
- [ ] The screen remains dense and operational at desktop sizes and usable on mobile.

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

- [ ] Add tests for all required detail sections.
- [ ] Add tests for source evidence and raw audit link.
- [ ] Add tests for AI rationale and uncertainty display.
- [ ] Add tests for activity timeline entries.
- [ ] Add tests that reviewer corrections never silently replace source-backed extraction.
- [ ] Implement read-only detail UI after tests fail.

### Acceptance Criteria

- [ ] Operators can evaluate why a lead exists and whether it is trustworthy.
- [ ] Source evidence is paired with every AI claim that needs review.
- [ ] Audit trail concepts are visible before write workflows are added.

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

- [ ] Test allowed transitions from each v1 status.
- [ ] Test invalid transitions are blocked before API mutation.
- [ ] Test claim, dismiss, snooze, flag, contacted, won, lost, no_response, follow_up, reopen, verified, and corrected actions where applicable.
- [ ] Test notes and correction reason requirements.
- [ ] Implement transition helpers and UI action controls after tests fail.
- [ ] Keep mutation payloads typed and isolated in the API client boundary.

### Acceptance Criteria

- [ ] Operators only see actions that make sense for the current lead.
- [ ] Invalid transitions are impossible from the UI.
- [ ] Corrections are auditable and do not overwrite source-backed data silently.

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

- [ ] Test queue trigger classification.
- [ ] Test verification queue list rendering.
- [ ] Test verify, correct, dismiss, and return-to-lead actions.
- [ ] Test raw audit link/client path uses `/api/leads/{id}/raw`.
- [ ] Test missing-redaction decision is visible if rules are undefined.
- [ ] Implement after tests fail.

### Acceptance Criteria

- [ ] High-value but low-trust leads have a focused workspace.
- [ ] Raw audit access goes through the UI-safe API boundary.
- [ ] Undefined redaction policy remains explicit instead of hidden in UI behavior.

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

- [ ] Test editable outreach draft behavior.
- [ ] Test contact field validation.
- [ ] Test manual logging of channel, contact, notes, and outcome.
- [ ] Test contacted, won, lost, no-response outcome capture.
- [ ] Test activity history renders outreach attempts.
- [ ] Implement after tests fail.

### Acceptance Criteria

- [ ] Operators can prepare and log outreach without the UI sending messages.
- [ ] Outreach history is visible in lead detail activity.
- [ ] Outcome data can feed later analytics.

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

- [ ] Test run history client behavior.
- [ ] Test async run creation state.
- [ ] Test collector count display.
- [ ] Test recent failures display.
- [ ] Test LLM and notification delivery health summaries.
- [ ] Implement after tests fail.

### Acceptance Criteria

- [ ] Operators can see whether the lead pipeline is fresh and healthy.
- [ ] Manual run control does not block the UI for long-running pipeline work.
- [ ] Browser components do not call automation endpoints directly.

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

- [ ] Test stats client response.
- [ ] Test status, source, score band, owner, and week summaries.
- [ ] Test lead aging and verification quality summaries.
- [ ] Test demand timing view.
- [ ] Test visible denominator/date range labels.
- [ ] Implement after tests fail.

### Acceptance Criteria

- [ ] Managers can understand pipeline coverage and source quality.
- [ ] Metrics are explainable and tied to explicit outcome definitions.
- [ ] Analytics remain basic and operational.

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

- [ ] Test session enforcement for `/api/*`.
- [ ] Test no `API_TOKEN` in browser runtime/config.
- [ ] Test base path mounting.
- [ ] Test disabled UI behavior.
- [ ] Test dev-only CORS behavior if needed.
- [ ] Implement after tests fail.

### Acceptance Criteria

- [ ] UI access is safe enough for operator use.
- [ ] Automation credentials are not repurposed for browser sessions.
- [ ] Deployment settings are explicit and test-covered.

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

- [ ] Confirm lead workflow phases are stable before starting.
- [ ] Test read-only alert summary.
- [ ] Test evidence display.
- [ ] Test room inventory display if data contract exists.
- [ ] Test action history display.
- [ ] Keep mutations out of scope.

### Acceptance Criteria

- [ ] Disruption monitoring is visible without replacing Slack as the interrupt channel.
- [ ] The console remains read-only unless future contracts justify actions.

## Open Decisions To Resolve Before Coding

- [ ] Is verification a lead status or a separate source-review status?
- [ ] Who can claim, verify, correct, dismiss, reopen, and mark won/lost?
- [ ] Should corrected fields overwrite lead columns, live in a corrections table, or both?
- [ ] Is built-in cookie auth required, or will the UI sit behind an auth proxy?
- [ ] Is GroupScout or a future CRM the source of truth for outreach outcomes?
- [ ] What exactly counts as source hit rate: claimed/total, won/claimed, won/total, or another metric?
- [ ] What raw audit payloads can operators view, and what must be redacted before display?
- [ ] Should v1 ship Slack quick actions, the admin UI, or both together?

## Suggested Phase Order

- [ ] Phase 0 - Product Contract And Test Harness
- [ ] Phase 1 - Lead Inbox API Contract And Client
- [ ] Phase 2 - Lead Inbox UI
- [ ] Phase 3 - Lead Detail Evidence Workspace
- [ ] Phase 4 - Lead Status Actions And State Model
- [ ] Phase 5 - Verification Queue And Raw Audit Review
- [ ] Phase 6 - Outreach Workspace And Activity Log
- [ ] Phase 7 - Pipeline Monitor And Run Controls
- [ ] Phase 8 - Basic Analytics And Demand Signals
- [ ] Phase 9 - Session/Auth Wrapper And Same-Origin Deployment
- [ ] Phase 10 - Later Alertd Read-Only Console
