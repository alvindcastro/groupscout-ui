# Phase 12 UI Dockerization Prompt Pack

Phase D0 and D1 are complete. Future phases in this prompt pack still require strict TDD before adding Compose, proxy, framework, browser runtime, or application runtime code.

## Sources Inspected

- `/mnt/c/Users/alvin/GolandProjects/groupscout/Dockerfile`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docker-compose.yml`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/DOCKER.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/TESTING.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/TDD_AI_QUALITY.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/API_CONFIG.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/README.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/UI_STRATEGY.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/planning/ui/BACKEND_FOR_UI_TESTING.md`
- `package.json`
- `README.md`
- `docs/developer-guide.md`
- `docs/testing.md`
- `docs/ui-dockerization-contract.md`

## Current Findings

- The backend repo already has a full Docker Compose stack with `groupscout` on `8080`, `alertd` on `8081`, Postgres, n8n, Prometheus, Grafana, Loki, Promtail, Ollama, and `ollama-init`.
- Backend containers communicate on `groupscout_net`; UI containers should reach the backend as `http://groupscout:8080` when running in the same Compose project or network.
- The UI repo now has a D1 `Dockerfile` test target and `.dockerignore`; it still has no Compose file, framework, renderer, browser build, lockfile, or dev server.
- The UI repo is currently a model-level plain JavaScript workspace with Node's built-in `node:test` runner and `npm test`.
- Browser UI code must use same-origin `/api/*` contracts.
- `API_TOKEN` is reserved for automation clients and must not be exposed to browser JavaScript.

## Recommended Direction

The current UI test workspace is containerized. Next, add a browser runtime only after the runtime contract is test-covered. This avoids inventing a runtime target around a UI app that does not exist yet.

Preferred end state:

- A UI test image that runs `npm test` deterministically.
- A development Compose service for the UI once a dev server exists.
- A same-origin browser path for `/api/*`, either through a UI proxy container or by serving built assets from the backend.
- No browser access to automation tokens.
- Smoke checks that prove the UI container, API proxy, and backend health path work together.

## Global TDD Rules

- [ ] Read the relevant UI docs, backend Docker docs, and current tests before editing files.
- [ ] Write or update the smallest failing test before adding Docker or runtime behavior.
- [ ] Run the narrow command and record the expected red failure.
- [ ] Implement only enough Docker/runtime/config to pass the failing test.
- [ ] Rerun the narrow command and record the green result.
- [ ] Run `npm test` after UI source or contract changes.
- [ ] Run Docker validation commands only after a Docker file or Compose file exists.
- [ ] Keep `/api/*` browser calls same-origin.
- [ ] Keep `API_TOKEN` out of browser code, images, static assets, and generated config.
- [ ] Update Markdown docs only when behavior, commands, ports, or acceptance criteria change.

## Phase D0 - Dockerization Contract And Decision Record

Canonical D0 output: [UI Dockerization Contract](./ui-dockerization-contract.md).

### Prompt

```text
Strictly follow TDD. Do not add Docker files yet.

Goal: define the UI dockerization contract before implementation.

Context:
- The UI repo currently has no renderer, no build tool, no lockfile, and no Docker files.
- The backend Docker stack lives in /mnt/c/Users/alvin/GolandProjects/groupscout.
- Backend Compose exposes groupscout on 8080 and alertd on 8081.
- Browser API calls must stay behind same-origin /api/* paths.
- API_TOKEN must never enter browser JavaScript, static assets, or public container config.

TDD requirements:
1. Add or update documentation tests, guardrail tests, or lint-style tests that describe required Docker docs and security boundaries.
2. Confirm the new test fails because the contract is not documented or exported yet.
3. Add the minimum Markdown/process metadata needed to pass.
4. Rerun the narrow test and npm test.

Do not create Dockerfile, Compose, nginx, dev-server, or app-renderer code in this phase.
```

### Tasks

- [x] Capture the chosen dockerization path: test image first, browser runtime later.
- [x] Document backend service names, ports, and internal URLs.
- [x] Document same-origin `/api/*` and no-`API_TOKEN` browser constraints.
- [x] Add a testable guardrail for Docker docs if the repo has a docs test pattern.
- [x] Record red and green evidence.

### Acceptance Criteria

- [x] Future Docker work has a written contract.
- [x] Security boundaries are explicit before any image or Compose file exists.
- [x] The current pass remains documentation-only.

### Implementation Notes

- The D0 guardrail test lives in `test/dockerization-contract.test.js`.
- Red run: `node --test test/dockerization-contract.test.js` failed because the contract file and documentation links were not present.
- Green run: `node --test test/dockerization-contract.test.js`.
- Full-suite run: `npm test`.
- D0 did not add `Dockerfile`, `.dockerignore`, Compose, proxy, dev-server, renderer, or application runtime files.

## Phase D1 - UI Test Container

### Prompt

```text
Strictly follow TDD.

Goal: add a deterministic Docker target that runs the current UI test suite without introducing a browser runtime.

Context:
- package.json has only "test": "node --test".
- There is no package install requirement or lockfile yet.
- The first Docker target should prove the existing model-level workspace can run in a clean Node container.

TDD requirements:
1. Write a failing test or script assertion for required Docker test-image behavior.
2. Confirm it fails because Dockerfile/.dockerignore or the documented command does not exist yet.
3. Add the smallest Dockerfile/.dockerignore needed for `npm test`.
4. Rerun the narrow assertion.
5. Run `docker build` and the containerized `npm test`.
6. Run local `npm test`.

Do not add a dev server, production web server, reverse proxy, or backend Compose wiring in this phase.
```

### Tasks

- [x] Add failing coverage for Dockerfile existence and expected test command.
- [x] Add failing coverage for `.dockerignore` excluding `.git`, `node_modules`, logs, and local IDE files.
- [x] Add the minimal Node image target for `npm test`.
- [x] Verify no secret env vars are baked into the image.
- [x] Document `docker build` and containerized test commands.

### Acceptance Criteria

- [x] The UI test suite runs inside a container.
- [x] The image does not require backend services.
- [x] The image does not expose browser runtime behavior.

### Implementation Notes

#### D1 Evidence

- The D1 guardrail coverage lives in `test/dockerization-contract.test.js`.
- Added `Dockerfile` with a single `test` target that runs `npm test` in Node without an install step.
- Added `.dockerignore` for `.git`, `node_modules`, logs, IDE files, generated outputs, and local `.env` files.
- Red run: `node test/dockerization-contract.test.js` failed because `Dockerfile`, `.dockerignore`, and D1 command documentation did not exist yet.
- Green run: `node test/dockerization-contract.test.js`.
- Docker build: `docker build --target test -t groupscout-ui-test .`.
- Containerized test: `docker run --rm groupscout-ui-test`.
- Full-suite run: `npm test`.
- D1 did not add a dev server, production web server, reverse proxy, backend Compose wiring, exposed port, healthcheck, or browser runtime.

## Phase D2 - Browser Runtime Contract

### Prompt

```text
Strictly follow TDD.

Goal: choose and test the minimal browser runtime contract before adding a dev server or renderer.

Context:
- The UI is still model-level JavaScript.
- A real operator UI needs a browser-rendered app, but the framework/runtime is not selected in this repo yet.
- Same-origin /api/* calls and session-cookie behavior from Phase 9 must remain intact.

TDD requirements:
1. Write failing tests for the intended runtime contract: start command, port, health path, static asset boundary, and /api/* routing expectation.
2. Confirm the tests fail because no runtime contract exists.
3. Add only the smallest runtime metadata or placeholder needed to pass the contract tests.
4. Rerun focused tests and npm test.

Do not build product UI screens beyond the existing phase scope. Do not choose a framework unless the tests and docs require it.
```

### Tasks

- [x] Decide whether the UI runtime is static assets, a lightweight Node server, or backend-served assets.
- [x] Define the UI container port.
- [x] Define the health check path for the UI service.
- [x] Define how `/api/*` reaches `groupscout:8080` without exposing `API_TOKEN`.
- [x] Add tests for runtime config and forbidden browser env leaks.

### Acceptance Criteria

- [x] A future UI server has a tested contract before Docker Compose wiring.
- [x] `/api/*` remains same-origin from the browser perspective.
- [x] The selected runtime does not weaken Phase 9 auth/session boundaries.

### Implementation Notes

#### D2 Evidence

- The D2 runtime contract lives in `web/src/server/browserRuntimeContract.js`.
- Selected runtime contract: lightweight Node server, no framework selected, reserved `npm run start:ui`, container port `3000`, and health path `/healthz`.
- Static assets are contractually server-owned generated assets under `web/dist`; generated public config remains disabled in D2.
- Future server/proxy-side `/api/*` traffic targets `http://groupscout:8080`, while browser code keeps same-origin `/api/*` and `credentials: "same-origin"` with the `groupscout_session` cookie.
- Red run: `node --test test/dockerization-contract.test.js` failed because the runtime contract module and D2 documentation did not exist.
- Green run: `node --test test/dockerization-contract.test.js`.
- Full-suite run: `npm test`.
- D2 did not add a dev server, production web server, reverse proxy, renderer, framework, Compose wiring, package start script, exposed Docker port, or Docker healthcheck.

## Phase D3 - Development Compose Integration

### Prompt

```text
Strictly follow TDD.

Goal: add development Compose wiring for the UI service and backend stack.

Context:
- The backend Compose file already defines groupscout_net and service name groupscout.
- UI containers should call the backend by service name when inside Compose.
- Host development should continue to support local `npm test`.

TDD requirements:
1. Write failing validation for the Compose service name, network attachment, port mapping, healthcheck, and backend URL/proxy target.
2. Confirm the validation fails before adding Compose config.
3. Add the smallest Compose file or override needed for UI development.
4. Run `docker compose config`.
5. Start only the minimum services required for a smoke check.
6. Rerun focused tests and npm test.

Do not require Ollama, n8n, Grafana, or the full observability stack for basic UI container startup unless the smoke test explicitly needs them.
```

### Tasks

- [ ] Decide whether UI Compose lives in this repo or as an override beside the backend Compose file.
- [ ] Attach the UI service to the backend Docker network.
- [ ] Point internal API/proxy traffic at `http://groupscout:8080`.
- [ ] Add a healthcheck for the UI service.
- [ ] Add `docker compose config` validation to docs or scripts.
- [ ] Document which backend services are required for UI smoke tests.

### Acceptance Criteria

- [ ] Developers can run the UI container alongside the backend.
- [ ] Compose config validates without requiring secrets in the UI image.
- [ ] The basic UI path does not require the full lead pipeline to run.

## Phase D4 - Same-Origin Proxy Or Static Serving

### Prompt

```text
Strictly follow TDD.

Goal: implement the production same-origin serving model for browser assets and /api/*.

Context:
- Same-origin deployment is preferred.
- Browser code should call `/api/*`, not `http://groupscout:8080`.
- API_TOKEN remains server-side and automation-only.

TDD requirements:
1. Write failing tests for same-origin asset serving and /api/* forwarding behavior.
2. Write failing tests that production config rejects public automation-token injection.
3. Confirm expected red failures.
4. Add the smallest proxy/static-serving config needed.
5. Run focused tests, npm test, Docker build, and a smoke check against the running container.

Do not add role matrices, production identity-provider UI, or direct database access in this phase.
```

### Tasks

- [ ] Choose proxy container versus backend-served static assets.
- [ ] Test browser-visible config excludes `API_TOKEN`, `CLAUDE_API_KEY`, Slack tokens, Resend keys, and database URLs.
- [ ] Test `/api/*` remains a relative browser path.
- [ ] Add production container or backend static-asset serving config.
- [ ] Add smoke checks for `/`, a static asset, and an `/api/*` route.

### Acceptance Criteria

- [ ] Browser users see one origin for UI and `/api/*`.
- [ ] Secrets stay server-side.
- [ ] Production container behavior is covered by tests and smoke commands.

## Phase D5 - Docker Operations Docs And CI Hooks

### Prompt

```text
Strictly follow TDD.

Goal: make UI Docker usage repeatable for local development and CI.

Context:
- Backend docs already cover Docker Compose for the full stack.
- UI docs should be explicit about what can be run without the full backend and what requires Compose.

TDD requirements:
1. Add failing docs/checklist coverage for the documented Docker commands.
2. Confirm expected failure before editing docs.
3. Update README, developer docs, testing docs, and troubleshooting docs with the minimum accurate commands.
4. Rerun docs checks, npm test, and Docker smoke checks.

Do not add new runtime behavior in this phase unless a failing operations test requires it.
```

### Tasks

- [ ] Document local UI tests.
- [ ] Document containerized UI tests.
- [ ] Document dev Compose startup and teardown.
- [ ] Document backend dependency expectations and required env vars.
- [ ] Document troubleshooting for port conflicts, missing Docker Desktop/WSL integration, and proxy failures.
- [ ] Add CI job notes for container build and smoke tests.

### Acceptance Criteria

- [ ] A new developer can run local tests, container tests, and dev Compose from docs.
- [ ] CI has a clear future path for UI image build and smoke checks.
- [ ] Troubleshooting docs distinguish UI container failures from backend stack failures.

## Suggested Parallel Agent Prompts

Use these only when explicitly running parallel agents for a future implementation pass.

### Agent A - Backend Docker Compatibility

```text
Inspect /mnt/c/Users/alvin/GolandProjects/groupscout Docker and docs only. Do not edit files. Return the exact service names, ports, networks, healthchecks, env vars, and smoke-test endpoints the UI Docker plan must respect. Call out any Compose changes that would be risky.
```

### Agent B - UI Runtime And Test Contract

```text
Inspect /mnt/c/Users/alvin/WebstormProjects/groupscout-ui package.json, tests, web/src, and docs only. Do not edit files. Return the smallest TDD path for a UI Docker test image and the gaps that block a browser runtime image.
```

### Agent C - Security Boundary Review

```text
Inspect browser-facing UI modules and deployment/session docs. Do not edit files. Identify every place Docker, Compose, generated config, or static assets could accidentally expose API_TOKEN, provider keys, Slack tokens, Resend keys, or database URLs. Propose tests first.
```

### Agent D - Docs Integration

```text
Inspect README.md, docs/developer-guide.md, docs/testing.md, docs/troubleshooting.md, and UI_TDD_PHASE_PROMPTS.md. Do not edit files. Recommend the smallest Markdown updates needed after each Dockerization phase, keeping all task lists tickable and strict-TDD aligned.
```

## Open Decisions

- [ ] Should the first real browser runtime be static assets, a lightweight Node server, or backend-served assets?
- [ ] Should UI Compose live in the UI repo, the backend repo, or as a documented override file across both?
- [ ] Should production same-origin behavior use nginx/Caddy, a Node server, or Go static-file serving?
- [ ] What route should the UI healthcheck use?
- [ ] What exact `/api/*` endpoints are live enough for smoke tests before the backend implements every planned UI endpoint?
- [ ] Should CI build the UI test image before or after local `npm test`?
- [ ] Should Dockerized UI tests run without network access by default?
