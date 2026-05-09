# UI Dockerization Contract

D0 status: documentation-only. This contract records the path for future Docker work before any image, Compose, proxy, dev server, renderer, or browser runtime is added.

## Decision

The chosen dockerization path is test image first, browser runtime later.

- D1 will add the first Docker target: a deterministic Node image that runs the current `npm test` suite.
- D2 will define the browser runtime contract before selecting or wiring a dev server, renderer, proxy, or static-asset serving model.
- D3 and later phases will wire development Compose and same-origin serving only after each behavior has failing tests or validation.
- No Dockerfile, Compose file, reverse proxy, dev server, renderer, or application runtime is added in D0.

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

## Out Of Scope

- Dockerfile and `.dockerignore`.
- Compose files and Compose overrides.
- Nginx, reverse-proxy, or static-serving config.
- Browser framework, renderer, dev server, or production app runtime.
- Docker build, container smoke, and Compose validation commands.
