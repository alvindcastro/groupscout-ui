# UI Dockerization Contract

D0 status: documentation-only. This contract records the path for future Docker work before any image, Compose, proxy, dev server, renderer, or browser runtime is added.

D1 status: UI test container. The first Docker target now runs the current model-level `npm test` suite in a clean Node container without adding browser runtime behavior.

D2 status: browser runtime contract. The future browser runtime shape is now test-covered as contract metadata without adding a runnable server, framework, dev server, proxy, or Compose wiring.

D3 status: development Compose integration. The UI repo now provides a backend Compose override and health harness for development container wiring without adding production proxy/static serving or a product renderer.

D4 status: production same-origin serving. The UI repo now provides a lightweight Node production server that serves `web/dist` assets and proxies `/api/*` server-side to the backend target from one browser origin.

## Decision

The chosen dockerization path is test image first, browser runtime later.

- D1 will add the first Docker target: a deterministic Node image that runs the current `npm test` suite.
- D2 defines the browser runtime contract before selecting or wiring a dev server, renderer, proxy, or static-asset serving model.
- D3 wires development Compose through a UI-repo override that is loaded beside the backend Compose file.
- D4 wires production same-origin serving through the lightweight Node server path defined in D2.
- No Dockerfile, Compose file, reverse proxy, dev server, renderer, or application runtime is added in D0.

## D1 Test Image

The D1 Dockerfile has one target named `test`.

```sh
docker build --target test -t groupscout-ui-test .
docker run --rm groupscout-ui-test
```

The target uses Node, copies the no-install test inputs, and defaults to `npm test`. It does not expose ports, declare healthchecks, start a dev server, run a proxy, or connect to backend services.

The D1 `.dockerignore` excludes VCS metadata, `node_modules`, logs, IDE files, generated outputs, and local `.env` files so the test-image context stays small and does not include local secrets.

## D2 Browser Runtime Contract

The D2 runtime contract lives in `web/src/server/browserRuntimeContract.js`.

- Runtime model: `lightweight-node-server`
- Framework: `not-selected`
- Reserved start command: `npm run start:ui`
- UI container port: `3000`
- Health path: `/healthz`
- Static asset boundary: generated server-owned assets under `web/dist`, with no generated public config in D2.
- Browser route to APIs: same-origin `/api/*` with `credentials: "same-origin"` and the `groupscout_session` cookie.
- API proxy target: `http://groupscout:8080` for future server/proxy-side routing.

No framework, dev server, renderer, Compose service, or runnable UI server is added in D2. D4 now implements the reserved `start:ui` command.

## D3 Development Compose Integration

The D3 Compose override lives in `compose.dev.yml`.

- Compose override: `compose.dev.yml`
- UI service: `groupscout-ui`
- Backend service dependency: `groupscout`
- Shared backend network: `groupscout_net`
- Backend internal target: `http://groupscout:8080`
- Browser API path metadata: `/api/*`
- Health path: `/healthz`
- Host port: `${GROUPSCOUT_UI_HOST_PORT:-3001}` maps to container port `3000`
- Container command: `node web/src/server/devComposeHealthServer.js`

The D3 service builds the existing D1 `test` target and overrides the command with a server-only health harness. It is a development Compose integration point, not the production serving model.

Use the override beside the backend Compose file:

```sh
docker compose -f /mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml -f compose.dev.yml config --quiet
```

The basic D3 smoke path targets `groupscout-ui` and the minimum backend services needed by the current backend `groupscout` dependency chain: `groupscout`, `postgres`, `ollama`, and `ollama-init`. It does not require `alertd`, `n8n`, `grafana`, `prometheus`, `loki`, `promtail`, or a lead pipeline run.

D3 still does not add production same-origin proxying, static asset serving, or a product UI renderer.

## D4 Production Same-Origin Serving

The D4 production server lives in `web/src/server/productionServer.js`.

- Serving model: `node-static-assets-and-api-proxy`
- Production command: `npm run start:ui`
- Production Docker target: `production`
- UI container port: `3000`
- Health path: `/healthz`
- Static asset root: `web/dist`
- Browser route to APIs: same-origin `/api/*`
- Server-side API proxy target: `http://groupscout:8080` by default, overrideable with `UI_API_PROXY_TARGET`

Build the production image:

```sh
docker build --target production -t groupscout-ui-production .
```

Run it with an explicit server-side proxy target:

```sh
docker run --rm -p 3002:3000 -e UI_API_PROXY_TARGET=http://host.docker.internal:8080 groupscout-ui-production
```

Smoke checks:

```sh
curl -i http://localhost:3002/healthz
curl -i http://localhost:3002/
curl -i http://localhost:3002/assets/app.js
curl -i http://localhost:3002/api/system
```

Browser JavaScript still sees only relative `/api/*` paths. `API_TOKEN`, provider keys, Slack tokens, Resend/SendGrid keys, database URLs, and `UI_SESSION_SECRET` remain server-side and must not enter static assets or public config.

## Backend Contract

When future UI containers run with the backend Compose stack, they must use backend service names and internal network URLs rather than browser-visible backend origins.

- Backend service: `groupscout`
- Backend host port: `8080`
- Backend internal URL: `http://groupscout:8080`
- Alert service: `alertd`
- Alert host port: `8081`
- Alert internal URL: `http://alertd:8081`
- Shared backend network: `groupscout_net`

Browser code must not call `http://groupscout:8080` or `http://alertd:8081` directly. Those URLs are for container-to-container server/proxy use in later phases.

## Browser Security Boundary

- Browser API calls stay same-origin through `/api/*`.
- Browser requests remain session-cookie based and must preserve `credentials: "same-origin"` behavior.
- `groupscout_session` remains the browser session cookie name for UI `/api/*` access when the UI is enabled.
- `API_TOKEN` remains reserved for automation clients and must not enter browser JavaScript, static assets, generated public config, or image-baked browser environment.
- Future container config must keep provider keys, Slack tokens, Resend keys, database URLs, and automation credentials out of browser-visible layers and generated assets.
- `CORS_ALLOWED_ORIGINS` stays development-only; production should serve browser assets and `/api/*` from one origin.

## D0 Evidence

- Red run: `node --test test/dockerization-contract.test.js` failed because the D0 contract and documentation links were not present.
- Green run: `node --test test/dockerization-contract.test.js`.
- Full-suite run: `npm test`.

## D1 Evidence

- Red run: `node test/dockerization-contract.test.js` failed because `Dockerfile`, `.dockerignore`, and D1 command documentation were not present.
- Green run: `node test/dockerization-contract.test.js`.
- Docker build: `docker build --target test -t groupscout-ui-test .`.
- Container test run: `docker run --rm groupscout-ui-test`.
- Full-suite run: `npm test`.

## D2 Evidence

- Red run: `node --test test/dockerization-contract.test.js` failed because `web/src/server/browserRuntimeContract.js` and D2 documentation did not exist.
- Green run: `node --test test/dockerization-contract.test.js`.
- Full-suite run: `npm test`.

## D3 Evidence

- Red run: `node test/dockerization-contract.test.js` failed because `compose.dev.yml`, `web/src/server/devComposeHealthServer.js`, and D3 documentation did not exist.
- Green run: `node --test test/dockerization-contract.test.js`.
- Docker Compose config: `docker compose -f /mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml -f compose.dev.yml config --quiet`.
- Full-suite run: `npm test`.
- Docker build: `docker build --target test -t groupscout-ui-test .`.
- Containerized test: `docker run --rm groupscout-ui-test`.

## D4 Evidence

- Red run: `node test/dockerization-contract.test.js` failed because `web/src/server/productionServer.js`, `web/dist`, the production Docker target, and D4 documentation did not exist.
- Green run: `node --test test/dockerization-contract.test.js`.
- Full-suite run: `npm test`.
- Docker test build: `docker build --target test -t groupscout-ui-test .`.
- Containerized test: `docker run --rm groupscout-ui-test`.
- Docker production build: `docker build --target production -t groupscout-ui-production .`.
- Smoke checks: `GET /healthz`, `GET /`, `GET /assets/app.js`, and `GET /api/system`.

## Out Of Scope

- Nginx or Caddy configuration.
- Browser framework, renderer, or dev server implementation.
- Role matrices, production identity-provider UI, and direct database access.
