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

## Focused UI Tests

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
```

## What The Current UI Tests Cover

- Same-origin `/api/*` browser request boundary.
- Lead inbox query serialization and response adaptation.
- Lead inbox mocked table, filters, states, responsive metadata, and accessibility metadata.
- Lead detail sections, source evidence, raw audit link intent, AI enrichment metadata, corrections, timeline, and states.
- Lead status transition rules, invalid transition blocking, validation, and PATCH mutation intent.
- Verification queue trigger classification, filters, row actions, raw audit alias links, responsive metadata, and blocked redaction-policy metadata.
- Raw audit client access through same-origin `GET /api/leads/{id}/raw`.
- Outreach client access through same-origin `GET/POST /api/leads/{id}/outreach`.
- Outreach workspace editable drafts, contact validation, manual copied/sent/logged states, outcome capture, activity timelines, responsive metadata, and route mounting.
- Pipeline client access through same-origin `GET/POST /api/pipeline/runs`.
- Pipeline monitor compact health fields, async run creation state, collector counts/failures, LLM health, notification delivery health, partial-data/error states, responsive metadata, and route mounting.
- Selected design token exports used by the current screen models.

## What The Current UI Tests Do Not Cover

- Browser rendering.
- DOM focus behavior.
- Real keyboard navigation.
- Visual regression.
- CSS layout.
- Live backend compatibility.
- Raw audit payload redaction behavior beyond the explicit blocked TODO.
- Real email sending, clipboard behavior, or CRM sync for outreach.
- Real pipeline execution, worker polling, Grafana rendering, or log viewer integration.
- Full `DESIGN.md` token-reference resolution.

Before treating a UI feature as production-ready, add browser or component-level coverage once a renderer/framework exists.

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
