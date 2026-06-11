# GroupScout Frontend

GroupScout frontend is the dependency-light operator UI source for reviewing leads, evidence, pipeline health, analytics, alerts, and outreach workflows. It builds static browser assets and provides local/product server paths for same-origin `/api/*` development against the backend.

Long-lived frontend documentation is centralized in the coordination docs repository. This source repo intentionally keeps only this README as Markdown so implementation work stays close to code while design notes, phase docs, and runbooks stay in one place.

## Where To Find The Docs

- Coordination repo: `/mnt/c/Users/alvin/groupscout-site`
- Frontend docs home: `/mnt/c/Users/alvin/groupscout-site/frontend/README.md`
- Developer guide: `/mnt/c/Users/alvin/groupscout-site/frontend/docs/developer-guide.md`
- Testing guide: `/mnt/c/Users/alvin/groupscout-site/frontend/docs/testing.md`
- Docker/runtime matrix: `/mnt/c/Users/alvin/groupscout-site/frontend/docs/docker-runtime-matrix.md`
- Design reference: `/mnt/c/Users/alvin/groupscout-site/frontend/DESIGN.md`
- Phase implementation status: `/mnt/c/Users/alvin/groupscout-site/frontend/docs/ui-tdd-phase-0-15-implementation.md`

Start in `/mnt/c/Users/alvin/groupscout-site` for planning, Beads issues, and cross-repo coordination. Make frontend code changes here only after the owning task is clear.

## What Runs Here

- App shell and screen models under `web/src/app/`
- Browser API clients under `web/src/api/`
- Static renderer and asset builder under `web/src/renderer/`
- Product and production Node servers under `web/src/server/`
- Node built-in test suite under `test/`
- Docker test/production targets in `Dockerfile`
- Development Compose overlay in `compose.dev.yml`

The project currently uses Node's built-in `node:test` runner and has no package-install requirement for the committed scripts.

## Quick Start

Prerequisites:

- Node 22 or compatible modern Node runtime. The Dockerfile uses `node:22-bookworm-slim`.
- Backend running locally when testing proxied `/api/*` behavior.
- No package install is currently required for the committed scripts.

```sh
npm test
npm run build
```

`npm run build` generates static browser output under `web/dist`.

Run the product dev server after building assets:

```sh
npm run build
UI_PORT=3001 UI_API_PROXY_TARGET=http://127.0.0.1:8080 node web/src/server/productDevServer.js
```

Run the production static/proxy server locally:

```sh
npm run build
UI_PORT=3002 UI_API_PROXY_TARGET=http://127.0.0.1:8080 npm run start:ui
```

Health check:

```sh
curl -i --max-time 5 http://localhost:3001/healthz
```

## Common Developer Commands

```sh
npm test        # run all node:test suites
npm run build   # generate web/dist static assets
npm run start:ui # serve web/dist and proxy same-origin /api/*
```

Focused examples:

```sh
node --test test/api-boundary.test.js
node --test test/phase-13-renderer-runtime.test.js
node --test test/dockerization-contract.test.js
```

Docker test image:

```sh
docker build --target test -t groupscout-ui-test .
docker run --rm groupscout-ui-test
```

Development Compose overlay, run from this repo while the backend repo is available:

```sh
docker compose -f /mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml -f compose.dev.yml config --quiet
```

## Runtime Notes

- Browser code must call same-origin `/api/*`, never a direct backend container URL.
- Server-side proxy defaults to `http://groupscout:8080` unless `UI_API_PROXY_TARGET` is set.
- `UI_PORT` controls the product and production server port.
- `UI_PUBLIC_API_PATH` must remain `/api/*` for browser-visible runtime config.
- `GROUPSCOUT_UI_HOST_PORT` controls the host port in `compose.dev.yml`; the overlay expects the backend Compose file/network to be present.
- Do not expose `API_TOKEN`, provider keys, Slack tokens, database URLs, `UI_SESSION_SECRET`, or bearer tokens in browser-visible config or static assets.
- The backend compatibility smoke classifies route drift, auth failures, schema drift, proxy failures, and backend errors; see centralized docs for the expected matrix.

## Documentation Policy

Keep this repository focused on frontend source, tests, static build/runtime files, Docker files, and this README. Add or update long-lived Markdown in `/mnt/c/Users/alvin/groupscout-site/frontend/` unless the file is generated or must live beside runtime output.
