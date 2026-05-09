# Phase 13 Product Renderer Runtime Brainstorm

This is a docs-only brainstorm for the next UI runtime step after Phase 12 D0-D5. No product renderer, framework, package install step, lockfile, dev server, Dockerfile change, Compose change, or browser test harness is implemented here.

Detailed copy-paste prompts and tickable future tasks live in [Phase 13 Product Renderer Runtime Prompt Pack](./phase-13-product-renderer-runtime-prompts.md).

## Current Baseline

- The repo is still primarily a model-level plain JavaScript UI workspace tested with Node's built-in `node:test`.
- The D1 Docker `test` target runs `npm test` without installing dependencies or contacting backend services.
- The D3 `compose.dev.yml` service is a development health harness on `groupscout_net`, not a product UI dev server.
- The D4 production server runs with `npm run start:ui`, serves `web/dist`, exposes `/healthz`, and forwards `/api/*` server-side to `UI_API_PROXY_TARGET` or `http://groupscout:8080`.
- Browser-facing API code must keep relative same-origin `/api/*` paths and `credentials: "same-origin"`.
- Automation credentials, provider keys, Slack tokens, Resend/SendGrid keys, database URLs, `OLLAMA_BASE_URL`, and `UI_SESSION_SECRET` must stay out of browser-visible config and static assets.

## Recommended Direction

Treat Phase 13 as a renderer/runtime contract phase before selecting tooling. The decision should be made against concrete tests and operational constraints, not against framework preference alone.

Recommended shape:

1. Keep the D4 Node static/proxy server as the production same-origin boundary.
2. Add browser/component coverage before replacing mocked model-only confidence with rendered UI confidence.
3. Choose the smallest renderer stack that can mount the existing screen models, preserve dense operator workflows, and produce static assets under `web/dist`.
4. Add a package manager lockfile only when the renderer or browser test harness actually introduces dependencies.
5. Extend `compose.dev.yml` only after a real product development server exists, and keep `${GROUPSCOUT_UI_HOST_PORT:-3001}` as the host default unless the backend stack changes.

## Candidate Runtime Options

### Static Build Plus D4 Node Server

The product app compiles to `web/dist`, and D4 continues to serve static files plus server-side `/api/*` proxying.

Why it fits:

- Preserves one production browser origin.
- Keeps backend service names and secrets server-side.
- Fits the current Docker production target with the smallest conceptual change.

Watchouts:

- Needs a build step, dependency lockfile, and generated-asset policy.
- Needs browser tests that prove routes, assets, and `/api/*` calls still use relative paths.

### Lightweight Dev Server Plus Static Production Build

Development uses a renderer dev server, while production remains the D4 static/proxy server.

Why it fits:

- Gives fast local UI iteration once real browser screens exist.
- Keeps production deployment independent from the dev server.

Watchouts:

- Compose must distinguish product dev server health from the existing D3 health harness.
- Development CORS must remain development-only; production should still be same-origin.

### Backend-Served Product Assets

The backend serves built UI assets directly in production.

Why it may fit later:

- Can reduce one deployable artifact if the backend owns production serving.

Watchouts:

- Moves UI deployment coupling into the Go backend.
- Requires a stronger cross-repo contract and backend tests before replacing D4.

## Proposed Phase 13 Acceptance Criteria

- A written renderer/runtime contract names the chosen dev and production serving model.
- The first failing test proves the chosen contract before adding dependencies or framework code.
- Browser-facing code still cannot call absolute backend URLs.
- Generated public config remains whitelist-only and cannot include secret-like keys.
- The production smoke path still covers `GET /healthz`, `GET /`, `GET /assets/app.js`, and one same-origin `/api/*` request when a backend or stub is reachable.
- Documentation states whether `compose.dev.yml` still runs the D3 health harness or a real product dev server.
- README, developer guide, testing docs, troubleshooting docs, and changelog are updated when behavior changes.

## Prompt Pack Summary

- Phase 13-A: renderer/runtime contract before dependencies.
- Phase 13-B: browser and component test harness decision.
- Phase 13-C: minimal renderer mount for existing screen models.
- Phase 13-D: static build and public asset safety.
- Phase 13-E: product dev server and Compose behavior.
- Phase 13-F: live backend compatibility smoke.

## Suggested Parallel Agent Prompts

Use these only for a future implementation planning pass.

### Agent A - Renderer Fit

```text
Inspect /mnt/c/Users/alvin/WebstormProjects/groupscout-ui web/src/app, DESIGN.md, and tests only. Do not edit files. Recommend the smallest renderer approach that can mount the existing screen models, preserve design-token usage, and support browser-level tests.
```

### Agent B - Docker Runtime Impact

```text
Inspect Dockerfile, compose.dev.yml, package.json, web/src/server, and docs/ui-dockerization-contract.md only. Do not edit files. Identify the exact Docker and Compose changes a product dev server or static build would require, and which D0-D5 guarantees must stay unchanged.
```

### Agent C - Browser Test Strategy

```text
Inspect current node:test coverage and app screen models only. Do not edit files. Propose the first browser/component tests that should fail before adding a renderer, including routing, API boundary, accessibility, and responsive smoke coverage.
```

### Agent D - Security Boundary

```text
Inspect browser-facing web/src modules, web/src/server, and docs/troubleshooting.md only. Do not edit files. List how generated assets, public config, dev-server env injection, and Compose output could expose secrets, then propose guardrail tests first.
```

## Explicit Non-Goals For This Brainstorm

- Choosing a framework without failing tests.
- Replacing the D4 production static/proxy server.
- Moving production UI serving into the backend without a cross-repo contract.
- Passing backend `.env` or automation tokens into UI containers.
- Treating metadata-only accessibility and responsive tests as equivalent to browser behavior.
