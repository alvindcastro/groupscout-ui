# GroupScout Web App Phase Prompt Pack

> Copy one phase prompt at a time into a coding session. Each phase is intentionally narrow and must begin with failing tests.

## Red-Green-Refactor Checklist

- [ ] Read the relevant docs and current code before editing.
- [ ] Create or claim a beads issue.
- [ ] Write the smallest failing test first.
- [ ] Run the focused command and capture the expected red failure.
- [ ] Implement only enough to pass.
- [ ] Rerun the focused command.
- [ ] Run the relevant broader suite.
- [ ] Update the phase notes with red evidence, green evidence, changed files, and residual risk.
- [ ] Close or update beads issue status.

## Parallel Agent Starters

Use these read-only prompts when a phase needs investigation before the main implementation.

### Backend/API Agent

```text
Read-only. Inspect /mnt/c/Users/alvin/GolandProjects/groupscout Markdown, Docker, and API route files relevant to the requested phase. Identify current backend contracts, live route drift, required env vars, Docker service names, and tests that should fail first. Do not edit files. Return concise findings with file paths and line references.
```

### UI Baseline Agent

```text
Read-only. Inspect /mnt/c/Users/alvin/WebstormProjects/groupscout-ui current worktree and origin/main for the requested phase. Identify existing implementation, deleted/local changes, package scripts, tests, runtime files, docs, and likely conflicts. Do not edit files. Return concise findings with file paths and line references.
```

### UX Agent

```text
Read-only. Inspect DESIGN.md and the requested phase. Translate the design system into concrete UI constraints: layout, typography, controls, color usage, state badges, responsive behavior, accessibility, and tests that should fail before implementation. Do not edit files.
```

### Docker/Ops Agent

```text
Read-only. Inspect backend Docker files, UI Docker files if present, Compose ports, networks, env vars, healthchecks, and smoke docs. Identify the smallest Docker/runtime contract tests for the requested phase and any secret exposure risks. Do not edit files.
```

## Phase Prompts

### 0. Baseline Reconciliation

- [ ] Prompt: reconcile current checkout with Phase 13 UI baseline without product changes.
- [ ] Red tests: package scripts, test runner, renderer/runtime metadata, route shell metadata, secret scan.
- [ ] Green target: runnable minimal harness or explicitly documented docs-only baseline.
- [ ] Verification: focused baseline test plus `git status`.

### 1. Product Contract And UX Guardrails

- [ ] Prompt: add tested IA, token, and UX guardrails.
- [ ] Red tests: navigation routes, token map, component token names, no browser secrets.
- [ ] Green target: shell placeholders, token exports, UX contract docs.
- [ ] Verification: focused shell/design tests.

### 2. Backend Compatibility Smoke

- [ ] Prompt: classify live `/api/*` compatibility before wiring screens.
- [ ] Red tests: `/api/system`, `/api/leads`, `/api/pipeline/runs`, `/api/stats`, `/api/alerts`, `/api/leads/{id}/raw`.
- [ ] Green target: compatibility classifier and docs, not backend fixes.
- [ ] Verification: classifier tests with live backend or documented stub.

### 3. API Client Contracts

- [ ] Prompt: centralize typed client contracts.
- [ ] Red tests: query serialization, response adaptation, pagination, mutation validation, error classification, no secret headers.
- [ ] Green target: single browser API boundary with feature adapters.
- [ ] Verification: API client tests.

### 4. Today Command Center

- [ ] Prompt: build read-only priority command center.
- [ ] Red tests: priority leads, aging work, verification problems, active alerts, failed jobs, health, route links.
- [ ] Green target: Today screen model/component.
- [ ] Verification: screen tests and route shell tests.

### 5. Lead Inbox

- [ ] Prompt: build dense lead triage.
- [ ] Red tests: filters, columns, states, keyboard row activation, responsive modes.
- [ ] Green target: inbox screen with mocked client data and query state.
- [ ] Verification: inbox tests and token/accessibility assertions.

### 6. Lead Detail Evidence

- [ ] Prompt: build evidence-first lead detail.
- [ ] Red tests: summary, source evidence, AI enrichment, raw audit link, corrections, activity, responsive layout.
- [ ] Green target: read-only detail workspace.
- [ ] Verification: detail tests.

### 7. Status, Ownership, Corrections

- [ ] Prompt: add state transition model and auditable mutations.
- [ ] Red tests: allowed/disallowed transitions, visible actions, mutation payloads, required reasons.
- [ ] Green target: transition helpers, action controls, API mutation adapter.
- [ ] Verification: state model, detail action, and client mutation tests.

### 8. Verification Queue

- [ ] Prompt: add focused source/AI review queue.
- [ ] Red tests: trigger classification, filters, actions, raw audit alias, redaction blocked state.
- [ ] Green target: verification queue and raw audit client link.
- [ ] Verification: queue and raw audit tests.

### 9. Outreach Workspace

- [ ] Prompt: add manual outreach draft/log/outcome workflow.
- [ ] Red tests: editable fields, validation, copied/sent/logged states, history, no auto-send.
- [ ] Green target: outreach workspace and activity integration.
- [ ] Verification: outreach screen/client tests.

### 10. Pipeline Monitor

- [ ] Prompt: expose pipeline health and queued manual run controls.
- [ ] Red tests: run history, collector health, LLM health, delivery failures, queued start.
- [ ] Green target: pipeline monitor and client endpoints.
- [ ] Verification: pipeline tests.

### 11. Analytics

- [ ] Prompt: add explainable demand and lead quality analytics.
- [ ] Red tests: distributions, denominators, date ranges, source yield, aging, verification quality.
- [ ] Green target: analytics dashboard.
- [ ] Verification: stats client and analytics tests.

### 12. Alertd Console

- [ ] Prompt: add read-only disruption alert visibility.
- [ ] Red tests: alert state, SPS, evidence, room inventory, action history, disabled mutations.
- [ ] Green target: read-only alert console.
- [ ] Verification: alert tests.

### 13. Auth And Runtime

- [ ] Prompt: add same-origin session-safe runtime.
- [ ] Red tests: session cookies, base path, dev CORS, deployment readiness, browser secret scan.
- [ ] Green target: runtime/session helpers and same-origin API enforcement.
- [ ] Verification: deployment/session tests.

### 14. Docker E2E

- [ ] Prompt: validate UI with backend Docker stack.
- [ ] Red tests: Docker targets, Compose override, healthchecks, ports, backend target, secret-free assets/config.
- [ ] Green target: test image, dev server, production static/proxy smoke.
- [ ] Verification: Docker config, container tests, `/healthz`, `/`, `/assets/app.js`, `/api/*` classifier.

### 15. Browser UX Hardening

- [ ] Prompt: prove the app works in a browser, not just models.
- [ ] Red tests: focus, labels, keyboard flows, responsive screenshots, text overflow, no overlapping UI, same-origin API calls.
- [ ] Green target: browser-tested primary routes and UX fixes.
- [ ] Verification: browser/component tests and screenshot checks.

