# Testing

## UI Repo

Run the full UI test suite:

```sh
npm test
```

The command maps to:

```sh
node --test
```

There is no package install requirement yet.

Housekeeping run on 2026-05-08: `npm test` passed all 22 test files.

Smell H0 baseline run on 2026-05-09: focused API-client characterization passed 9 test files, and `npm test` passed all 22 test files.

Smell H1 split run on 2026-05-09: focused API-client split coverage passed 9 test files, and `npm test` passed all 22 test files.

Phase 12 D0 run on 2026-05-09: `node --test test/dockerization-contract.test.js` covered the documentation-only Dockerization contract before any Docker files were added, and `npm test` passed all 23 test files.

Phase 12 D1 run on 2026-05-09: `node test/dockerization-contract.test.js` covered the UI test-container Dockerfile, `.dockerignore`, no-runtime scope, and D1 docs; `docker build --target test -t groupscout-ui-test .`, `docker run --rm groupscout-ui-test`, and `npm test` passed.

Optional design-doc lint. This is not an npm script and may use the network through `npx`:

```sh
npx @google/design.md lint DESIGN.md
```

The D1 Docker target runs the current UI test suite in a clean Node container:

```sh
docker build --target test -t groupscout-ui-test .
docker run --rm groupscout-ui-test
```

Compose, proxy/static serving, and browser runtime behavior remain future strict-TDD phases. See [Phase 12 UI Dockerization Prompt Pack](./phase-12-ui-dockerization.md) and [UI Dockerization Contract](./ui-dockerization-contract.md).

## Focused UI Tests

```sh
node --test test/api-boundary.test.js
node --test test/app-shell.test.js
node --test test/session-deployment.test.js
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
node --test test/dockerization-contract.test.js
```

API-client focused run for smell phases:

```sh
node --test test/api-boundary.test.js test/lead-inbox-client.test.js test/lead-status-mutation-client.test.js test/raw-audit-client.test.js test/outreach-client.test.js test/pipeline-client.test.js test/stats-client.test.js test/alert-client.test.js test/system-client.test.js
```

## What The Current UI Tests Cover

- Same-origin `/api/*` browser request boundary, public API-client facade shape, split adapter module ownership, request defaults, and invalid-route pre-fetch rejection.
- Session-cookie enforcement metadata for UI `/api/*` access.
- `UI_ENABLED`, `UI_BASE_PATH`, `UI_SESSION_SECRET`, and development-only `CORS_ALLOWED_ORIGINS` deployment behavior.
- Recursive browser-source checks that `API_TOKEN` is not referenced in browser-facing `web/src/**/*.js` modules outside `web/src/server`.
- Lead inbox query serialization, blank-filter elision, sort overrides, and response adaptation.
- Lead inbox mocked table, filters, states, responsive metadata, and accessibility metadata.
- Lead detail sections, source evidence, raw audit link intent, AI enrichment metadata, corrections, timeline, and states.
- Lead status transition rules, invalid transition blocking, validation, and PATCH mutation intent.
- Verification queue trigger classification, filters, row actions, raw audit alias links, responsive metadata, and blocked redaction-policy metadata.
- Raw audit client access through same-origin `GET /api/leads/{id}/raw`, encoded lead IDs, and raw policy defaults.
- Outreach client access through same-origin `GET/POST /api/leads/{id}/outreach`, encoded lead IDs, optional draft logging, and manual logging validation.
- Outreach workspace editable drafts, contact validation, manual copied/sent/logged states, outcome capture, activity timelines, responsive metadata, and route mounting.
- Pipeline client access through same-origin `GET/POST /api/pipeline/runs`, async run metadata, default manual run payloads, and compact health defaults.
- Pipeline monitor compact health fields, async run creation state, collector counts/failures, LLM health, notification delivery health, partial-data/error states, responsive metadata, and route mounting.
- Stats client access through same-origin `GET /api/stats`, full summary adaptation, and source-yield hit-rate policy metadata.
- Analytics dashboard status/source/score/owner/week summaries, source-yield hit-rate definition, lead aging, verification quality, upcoming demand, denominator/date-range labels, responsive metadata, and route mounting.
- Alert client access through read-only same-origin `GET /api/alerts`, cursor routing, and required evidence/inventory/history sections.
- Alertd console current alert state, SPS summaries, evidence, room inventory, action history, disabled mutation actions, Slack-first policy metadata, responsive metadata, and route mounting.
- System client access through read-only same-origin `GET /api/system` and required generated/pipeline/count sections.
- Today command center summary counts, priority lead rows, aging claimed work, active alerts, failed jobs, system health, read-only action policy, responsive metadata, and root route mounting.
- Selected design token exports used by the current screen models.

## What The Current UI Tests Do Not Cover

- Browser rendering.
- DOM focus behavior.
- Real keyboard navigation.
- Visual regression.
- CSS layout.
- Live backend compatibility.
- Real cookie signing, browser session issuance, reverse-proxy behavior, and production CORS headers.
- Compose integration, proxy/static serving behavior, and browser runtime container smoke tests.
- Raw audit payload redaction behavior beyond the explicit blocked TODO.
- Real email sending, clipboard behavior, or CRM sync for outreach.
- Real pipeline execution, worker polling, Grafana rendering, or log viewer integration.
- Live analytics aggregation accuracy against backend storage.
- Custom dashboard/chart rendering behavior.
- Live alertd contract compatibility, Slack delivery behavior, and alert acknowledgement/resolution workflows.
- Live `/api/system` compatibility or real system-health aggregation accuracy.
- Full `DESIGN.md` token-reference resolution.

Before treating a UI feature as production-ready, add browser or component-level coverage once a renderer/framework exists.

## Interpreting API Boundary Failures

- Absolute `http` or `https` browser requests fail before fetch because UI calls must stay same-origin.
- Non-`/api/` paths fail before fetch because `web/src/api/transport.js` owns the browser API transport boundary behind the `web/src/api/client.js` facade.
- Non-2xx responses throw `Request failed with status N`.
- API adapter errors usually mean the backend response shape drifted from the model contract. Check required sections such as `leads`, `date_range`, `summaries`, `pipeline`, `counts`, `alerts`, `evidence`, `room_inventory`, and `action_history`.
- Session/deployment failures usually come from a missing or short `UI_SESSION_SECRET`, missing `groupscout_session`, or production `CORS_ALLOWED_ORIGINS` configuration.

## Backend Tests

Backend tests run from:

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
```

Main backend suite:

```sh
make test
```

Equivalent command:

```sh
go test -v ./...
```

Package example:

```sh
go test -v ./internal/enrichment/...
```

Alertd tests:

```sh
go test ./cmd/alertd/... ./internal/alert/...
```

Postgres integration tests:

```sh
TEST_POSTGRES_URL="postgres://groupscout:groupscout@localhost:5432/groupscout?sslmode=disable" \
  go test -v -tags integration ./internal/storage/...
```

EvalOps:

```sh
make eval-quality
make eval-gate
make eval-target
```

## Manual API Checks

With the backend running on `localhost:8080`:

```sh
curl -i http://localhost:8080/health
```

```sh
curl -i -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  http://localhost:8080/run
```

After a Docker-triggered run:

```sh
docker compose logs groupscout --tail=50
```
