# Developer Guide

This repo is currently a no-build, model-level UI workspace for GroupScout operator screens. The source is plain JavaScript modules plus Node's built-in test runner.

## Current Shape

- `web/src/api/client.js` is the stable browser API facade. Focused adapters live under `web/src/api/*`, and `web/src/api/transport.js` owns the shared same-origin `/api/*` request guard.
- `web/src/app/shell.js` owns route-shell selection.
- `web/src/server/uiDeployment.js` owns model-level UI deployment settings, base-path mounting, session-cookie API authorization, and development-only CORS metadata.
- `web/src/app/todayCommandCenter.js` owns the mocked Today command center, operational priority summaries, system health metadata, and read-only routing policy.
- `web/src/app/leadInbox.js` owns the mocked Lead Inbox screen model.
- `web/src/app/leadDetail.js` owns the mocked Lead Detail Evidence Workspace.
- `web/src/app/leadStatus.js` owns status/action transition rules and mutation intent construction.
- `web/src/app/verificationQueue.js` owns the mocked Verification Queue screen model and raw audit review metadata.
- `web/src/app/outreachWorkspace.js` owns the mocked Outreach Workspace screen model and manual outreach logging metadata.
- `web/src/app/pipelineMonitor.js` owns the mocked Pipeline Monitor screen model, health summaries, and async run-control metadata.
- `web/src/app/analyticsDashboard.js` owns the mocked Analytics screen model, source-yield definitions, and demand-signal metadata.
- `web/src/app/alertdConsole.js` owns the mocked Alertd read-only console model, SPS summaries, evidence, room inventory, action-history metadata, and disabled alert action policy.
- `web/src/design/tokens.js` exports the subset of `DESIGN.md` tokens needed by tests.
- `test/*.test.js` contains contract and screen-model tests using `node:test`.

There is no bundler, DOM renderer, framework runtime, lockfile, or package-install step yet.

## Runtime

Use Node `18+` or newer. Tests rely on modern built-in web APIs such as `Response.json`.

## Daily Commands

```sh
npm test
```

Optional design-doc lint. This uses `npx` and may fetch the package if it is not already cached:

```sh
npx @google/design.md lint DESIGN.md
```

Useful focused runs:

```sh
node --test test/api-boundary.test.js
node --test test/app-shell.test.js
node --test test/design-tokens.test.js
node --test test/lead-inbox-client.test.js
node --test test/lead-inbox-screen.test.js
node --test test/lead-detail-screen.test.js
node --test test/lead-status-state-model.test.js
node --test test/lead-status-mutation-client.test.js
node --test test/verification-queue.test.js
node --test test/raw-audit-client.test.js
node --test test/outreach-client.test.js
node --test test/outreach-workspace.test.js
node --test test/pipeline-client.test.js
node --test test/pipeline-monitor.test.js
node --test test/stats-client.test.js
node --test test/analytics-dashboard.test.js
node --test test/analytics-screen.test.js
node --test test/alert-client.test.js
node --test test/alert-console.test.js
node --test test/system-client.test.js
node --test test/today-command-center.test.js
node --test test/session-deployment.test.js
node --test test/dockerization-contract.test.js
```

API-client smell-phase baseline:

```sh
node --test test/api-boundary.test.js test/lead-inbox-client.test.js test/lead-status-mutation-client.test.js test/raw-audit-client.test.js test/outreach-client.test.js test/pipeline-client.test.js test/stats-client.test.js test/alert-client.test.js test/system-client.test.js
```

## Development Rules

- Keep browser requests behind same-origin `/api/*` paths.
- Keep browser auth session-based. Do not repurpose automation credentials for operator browser sessions.
- Keep `API_TOKEN` out of browser runtime/config modules.
- Use `UI_ENABLED` to disable the UI, `UI_BASE_PATH` for subpath mounting, and `UI_SESSION_SECRET` for session readiness.
- Keep `CORS_ALLOWED_ORIGINS` development-only; same-origin deployment is the default production posture.
- Add API access through `createApiClient(...)`; do not fetch backend URLs directly from app modules.
- Use `GET /api/leads/{id}/raw` for browser-facing raw audit access; do not link older raw audit endpoints from UI screens.
- Use `GET/POST /api/pipeline/runs` for pipeline history and manual run creation; do not call worker, scheduler, or one-shot automation endpoints directly from app modules.
- Use `GET /api/stats` for browser-facing analytics; keep denominators, date ranges, and outcome definitions visible when adding metrics.
- Use `GET /api/alerts` for the read-only Alertd console; keep Slack as the interrupt channel and keep alert mutations disabled unless a future contract explicitly adds them.
- Use `GET /api/system` for Today/system-health summaries; keep Today as a read-only routing surface and leave mutations in the owning workspaces.
- Keep status transitions in `leadStatus.js`; UI surfaces should consume action metadata instead of duplicating the transition table.
- Keep mocked screen data aligned across inbox and detail models when a mocked lead appears in both places.
- Treat `DESIGN.md` as the source design contract; `web/src/design/tokens.js` is a partial implementation used by tests.
- Update phase docs and README when behavior or scope changes.

## Backend Integration Boundary

The backend repo is separate:

```sh
/mnt/c/Users/alvin/GolandProjects/groupscout
```

For backend startup and API checks, see [how-to-run-backend.md](./how-to-run-backend.md).

Current UI client contracts:

- `GET /api/leads`
- `PATCH /api/leads/{id}`
- `GET /api/leads/{id}/raw`
- `GET /api/leads/{id}/outreach`
- `POST /api/leads/{id}/outreach`
- `GET /api/pipeline/runs`
- `POST /api/pipeline/runs`
- `GET /api/stats`
- `GET /api/alerts`
- `GET /api/system`

## API Module Map

- `web/src/api/client.js`: public facade for `createApiClient(...)` and exported constants.
- `web/src/api/transport.js`: centralized same-origin `/api/*` request validation, JSON defaults, session credentials, non-2xx errors, and non-JSON success behavior.
- `web/src/api/shared.js`: small helpers shared by adapters.
- `web/src/api/leads.js`: lead inbox reads and lead PATCH writes.
- `web/src/api/rawAudit.js`: raw audit reads.
- `web/src/api/outreach.js`: outreach history reads and manual outreach attempt logging.
- `web/src/api/pipeline.js`: pipeline run history and manual run creation.
- `web/src/api/stats.js`: analytics stats reads and hit-rate metadata adaptation.
- `web/src/api/alerts.js`: read-only alert list reads.
- `web/src/api/system.js`: read-only system summary reads.

## Adding A New UI Phase

1. Write a focused test that describes the contract or screen-model behavior first.
2. Keep the first implementation narrow and model-level unless the phase explicitly introduces rendering.
3. Update the relevant `docs/phase-*` file or create a new phase doc.
4. Update `README.md` current scope.
5. Update `CHANGELOG.md` under `Unreleased`.
6. Run `npm test`.

## Transforming Code Smells

Use [code-smell-transformation-prompts.md](./code-smell-transformation-prompts.md) for future housekeeping refactors. Treat each smell phase like a product phase: characterize behavior first, prove the red state, make the smallest change, rerun focused tests plus `npm test`, then update docs.

The H0 baseline is [smell-h0-api-client-characterization.md](./smell-h0-api-client-characterization.md), and H1 completion is documented in [smell-h1-api-client-split.md](./smell-h1-api-client-split.md). H2, isolating mock fixtures from runtime factories, is the next active smell phase.

## Dockerization Planning

Use [phase-12-ui-dockerization.md](./phase-12-ui-dockerization.md) for the phased prompt pack and [UI Dockerization Contract](./ui-dockerization-contract.md) for the D0 decision record. The current repo has no Dockerfile, Compose file, browser runtime, dev server, framework, lockfile, or static build target yet, so the first Docker implementation phase remains a strict-TDD test-container plan rather than runtime implementation.

## Current Limitations

- Tests prove JavaScript model contracts, not rendered UI behavior in a browser.
- Accessibility checks are metadata-level only.
- Responsive behavior is represented as layout metadata, not measured DOM layout.
- Design token tests check selected exports; they do not resolve every nested token reference from `DESIGN.md`.
- The browser credential guard recursively scans browser-facing `web/src/**/*.js` files while excluding `web/src/server`; keep server-only code in that excluded subtree and keep browser modules free of automation credentials.
- UI Docker images, Compose integration, static asset serving, and browser runtime behavior are not implemented yet.
