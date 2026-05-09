# Troubleshooting

## UI Tests Fail Immediately

Confirm the Node runtime is modern enough:

```sh
node --version
```

Use Node `18+` or newer. The test suite uses built-in `node:test` and modern web API objects.

## Browser API Boundary Test Fails

The UI intentionally blocks browser-facing code from hard-coding external API URLs or credentials.

Check:

- New app files under `web/src` should route API calls through `createApiClient(...)` from `web/src/api/client.js`; feature-specific API logic belongs in the focused modules under `web/src/api/`.
- Same-origin paths must start with `/api/`.
- The credential guard in `test/api-boundary.test.js` recursively scans browser-facing `web/src/**/*.js` files and skips `web/src/server`.
- Browser API calls intentionally use `credentials: "same-origin"` and do not inject `Authorization`, `x-api-key`, or `x-api-token` headers.

Common causes:

- A browser module calls an absolute `http` or `https` URL.
- A browser module calls a backend path outside `/api/`.
- A new browser-facing file was placed under `web/src/server`, which is treated as server-only by the credential scan.

## API Adapter Test Fails

The client adapters intentionally fail loudly when backend response shapes drift from the UI contract.

Check the required response sections named in the error. Common required sections include:

- `leads` for `GET /api/leads`.
- `date_range`, `denominator`, `summaries`, `source_yield`, `verification_quality`, and `demand` for `GET /api/stats`.
- `alerts`, `evidence`, `room_inventory`, and `action_history` for `GET /api/alerts`.
- `generated_at`, `health`, `pipeline`, and `counts` for `GET /api/system`.

Non-2xx fetch responses throw `Request failed with status N` before adapter logic runs.

## Lead Inbox Data Looks Missing In Tests

Current lead data is mocked in `web/src/app/leadInbox.js`. Filtering is model-level and in-memory.

Common causes:

- `minScore` is higher than the mocked row score.
- `owner: "unowned"` only returns rows with no owner.
- Date filters compare the `YYYY-MM-DD` slice of `createdAt`.
- `verificationState`, `source`, `status`, and `property` must match the mocked values exactly.

## Lead Detail Shows Not Found

Current detail data is mocked in `web/src/app/leadDetail.js`.

The shell extracts `/leads/{id}` using a raw string slice. Query strings, encoded IDs, and trailing slashes are not normalized yet because the route shell is still a phase mock.

When real routing is introduced, normalize and decode route params before lookup.

## Status Action Is Hidden Or Rejected

Allowed status actions come from `LEAD_STATUS_TRANSITIONS` in `web/src/app/leadStatus.js`.

If an action is missing:

- Confirm the lead status is one of the v1 statuses.
- Confirm the action is allowed from that status.
- Confirm required fields are present, such as `owner`, `notes`, `snoozeUntil`, `corrections`, or `correctionReason`.

Note: `follow_up` and `corrected` are actions, not statuses. They preserve the current status.

## UI Deployment Readiness Fails

Check `web/src/server/uiDeployment.js` behavior through `test/session-deployment.test.js`.

Common causes:

- `UI_ENABLED` is true but `UI_SESSION_SECRET` is missing or shorter than 32 characters.
- `CORS_ALLOWED_ORIGINS` is configured for a production environment. CORS allow lists are development-only in the current deployment model.
- Browser `/api/*` requests lack the `groupscout_session` cookie or present an invalid session value.

## Browser Runtime Contract Fails

Check `web/src/server/browserRuntimeContract.js` behavior through `test/dockerization-contract.test.js`.

Common causes:

- The D2 contract was changed away from the lightweight Node server model before a later phase added runtime implementation.
- The reserved UI port, health path, or same-origin `/api/*` routing target no longer matches `docs/ui-dockerization-contract.md`.
- Browser public config includes automation credentials, provider keys, database URLs, or `UI_SESSION_SECRET`.

Note: D2 reserves `npm run start:ui`, port `3000`, and `/healthz` as contract metadata only. There is not a runnable UI server for those values yet.

## UI Development Compose Fails

D3 adds `compose.dev.yml` as a UI-repo override for the backend Compose file. Validate the merged config from the UI repo:

```sh
docker compose -f /mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml -f compose.dev.yml config --quiet
```

Common causes:

- The backend Compose file path is wrong or the sibling backend repo is not present at `/mnt/c/Users/alvin/GolandProjects/groupscout`.
- Docker Desktop or WSL integration is not running, so `docker compose` cannot inspect or build services.
- Host port `3001` is already in use. Set `GROUPSCOUT_UI_HOST_PORT` to another host port; the container still listens on `3000`.
- The UI service cannot resolve `groupscout` because the override was run without the backend Compose file or without the `groupscout_net` network definition.
- The `groupscout` backend service is not started. A targeted D3 smoke run should include `groupscout-ui` and `groupscout`; backend Compose also starts `postgres`, `ollama`, and `ollama-init` because `groupscout` depends on them.

D3 healthchecks only `/healthz` on the development health harness. It does not prove production static serving, rendered UI behavior, or `/api/*` proxy forwarding yet.

## Backend Health Check Fails

Run backend commands from:

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
```

Check server health:

```sh
curl -i http://localhost:8080/health
```

For Docker:

```sh
docker compose ps
docker compose logs groupscout --tail=50
docker compose logs postgres --tail=50
```

Some backend docs still mention `docker compose logs app`; the current compose service is `groupscout`.

## Backend Returns Few Or No Leads

The backend filters data at multiple stages:

- Collector-level relevance filters.
- Database deduplication.
- Pre-scoring and `ENRICHMENT_THRESHOLD`.

Useful backend knobs:

- `MIN_PERMIT_VALUE_CAD`
- `ENRICHMENT_THRESHOLD`
- `PRIORITY_ALERT_THRESHOLD`

Inspect backend logs after a run:

```sh
docker compose logs groupscout --tail=50
```

## Backend Environment Looks Inconsistent

Known backend documentation drift observed during housekeeping:

- Some docs reference `docs/API_TESTING.md`, but that file was not present during inspection.
- Some docs use `SENDGRID_API_KEY`, while `.env.example` and config use `RESEND_API_KEY`.
- Some Postgres examples reference a generated container name, while compose sets `container_name: groupscout_postgres`.

Prefer the current backend `.env.example`, `config/config.go`, `docker-compose.yml`, and `Makefile` when commands disagree.
