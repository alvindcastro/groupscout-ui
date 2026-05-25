# GroupScout UI

GroupScout UI is the operator workspace for the GroupScout lead intelligence system. It provides the browser surfaces for daily triage, lead review, source-evidence inspection, verification, outreach tracking, pipeline monitoring, analytics, alerts, and admin session flows.

Long-form project documentation lives in the coordination repo:

- Coordination repo: `/mnt/c/Users/alvin/groupscout-site`
- Frontend docs: `/mnt/c/Users/alvin/groupscout-site/frontend`
- Backend docs: `/mnt/c/Users/alvin/groupscout-site/backend`
- Backend app repo: `/mnt/c/Users/alvin/GolandProjects/groupscout`

Keep this repository focused on UI source, tests, runtime configuration, and this README. Add durable planning docs, phase notes, design writeups, and implementation prompts to `groupscout-site`.

## Product Surface

The UI is a dependency-light Node and vanilla DOM application. It is intentionally built around explicit screen models, same-origin API contracts, and testable runtime metadata rather than a framework-heavy client.

Current operator routes include:

- `/`: Today command center.
- `/leads`: lead inbox.
- `/leads/{id}`: lead detail and evidence workspace.
- `/verification`: verification queue.
- `/outreach`: outreach workspace.
- `/pipeline`: pipeline monitor and run controls.
- `/analytics`: basic analytics and demand signals.
- `/alerts`: read-only alertd console.
- `/settings`: settings placeholder and admin-facing controls.

## Repository Map

- `web/src/app`: route-level screen models and interaction logic.
- `web/src/api`: browser API adapters for same-origin `/api/*` routes.
- `web/src/design`: product design tokens.
- `web/src/renderer`: static app rendering, DOM renderer, browser runtime metadata, and CSS.
- `web/src/server`: development server, production static/proxy server, deployment/session rules, and compatibility smoke helpers.
- `test`: Node `node:test` coverage for API contracts, screen models, routing, runtime behavior, Docker contracts, and browser UX hardening.
- `compose.dev.yml`: development Compose overlay used with the backend stack.
- `Dockerfile`: test and production image targets.

## Prerequisites

- Node.js 22 or newer.
- Docker and Docker Compose for containerized test and backend integration runs.
- A running backend from `/mnt/c/Users/alvin/GolandProjects/groupscout` for live API smoke testing.

The test harness uses Node's built-in test runner, so there is no package-install step for the current dependency-free setup.

## Local Development

Run the test suite:

```sh
npm test
```

Build the static product assets:

```sh
npm run build
```

Run the production static/proxy server:

```sh
npm run start:ui
```

By default, the production server listens on port `3000`. Set `UI_PORT` to override it.

## Runtime Configuration

The browser must use same-origin `/api/*` routes. Backend automation credentials such as `API_TOKEN`, provider keys, Slack tokens, Resend keys, database URLs, and Ollama endpoints must never be exposed in browser-visible configuration or static assets.

Common server-side settings:

```sh
UI_PORT=3000
UI_API_PROXY_TARGET=http://127.0.0.1:8080
UI_BASE_PATH=/
UI_ENABLED=true
UI_SESSION_SECRET=
```

When `UI_SESSION_SECRET` is set, unauthenticated `/api/*` requests are rejected before proxying to the backend. Docker smoke paths may intentionally leave it unset to verify backend reachability without browser credentials.

## Docker And Backend Integration

Run the UI tests in Docker:

```sh
docker build --target test -t groupscout-ui-test .
docker run --rm groupscout-ui-test
```

Run with the backend Compose stack:

```sh
docker compose -p groupscout \
  -f /mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml \
  -f compose.dev.yml \
  up --build groupscout-ui groupscout
```

The development UI service publishes to host port `3001` by default because the backend stack uses `3000` for Grafana. Override it with `GROUPSCOUT_UI_HOST_PORT`.

Smoke checks:

```sh
curl -i http://localhost:3001/healthz
curl -i http://localhost:3001/
curl -i http://localhost:3001/api/system
```

## Testing Focus

The test suite covers:

- same-origin API transport and credential boundaries
- lead list, detail, raw audit, outreach, pipeline, stats, alerts, system, and auth clients
- route shell and screen model behavior
- status transition rules and auditable correction payloads
- responsive and accessibility metadata
- production static/proxy server behavior
- Docker runtime contracts
- browser UX hardening checks

Run `npm test` before pushing UI changes.

## Documentation Policy

This repo should contain only source-adjacent files needed to build, test, and run the frontend. Keep durable documentation in `/mnt/c/Users/alvin/groupscout-site/frontend`, including design system notes, phase contracts, troubleshooting, testing guides, and prompt packs.

If a UI change needs documentation, update this README only for developer-critical runbook information. Put deeper explanations and planning material in the coordination repo.
