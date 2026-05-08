# Nice To Knows

## Repo Boundaries

- UI repo: `/mnt/c/Users/alvin/WebstormProjects/groupscout-ui`
- Backend repo: `/mnt/c/Users/alvin/GolandProjects/groupscout`

The UI repo is intentionally lightweight right now. It models contracts and screen state before introducing a rendering framework.

## No Install Step Yet

`package.json` only defines:

```json
{
  "scripts": {
    "test": "node --test"
  }
}
```

There is no lockfile, bundler, or framework dependency yet.

## Phase Docs Are The Product History

The phase docs in `docs/phase-*` explain what each UI slice added and what stayed out of scope.

Use them before changing scope:

- `docs/phase-0-product-contract.md`
- `docs/phase-1-lead-inbox-contract.md`
- `docs/phase-2-lead-inbox-ui.md`
- `docs/phase-3-lead-detail-evidence-workspace.md`
- `docs/phase-4-lead-status-actions-state-model.md`
- `docs/phase-5-verification-queue-raw-audit-review.md`
- `docs/phase-6-outreach-workspace-activity-log.md`
- `docs/phase-7-pipeline-monitor-run-controls.md`
- `docs/phase-8-basic-analytics-demand-signals.md`
- `docs/phase-9-session-auth-wrapper-same-origin-deployment.md`
- `docs/phase-10-later-alertd-read-only-console.md`
- `docs/phase-11-today-command-center-system-health.md`

## Design Tokens Are Partial

`DESIGN.md` is larger than the exported token subset in `web/src/design/tokens.js`.

The tests currently assert the tokens needed by implemented phases. They do not prove every `DESIGN.md` reference is exported or resolvable.

## API Client Is The Browser Safety Boundary

Use `createApiClient(...)` for API access. It enforces same-origin `/api/*` paths and `credentials: "same-origin"`.

Avoid direct external backend URLs in browser-facing modules.

## Mocked Data Is Intentional

Current screen data is mocked so the UI can lock screen contracts before a renderer and live backend integration exist. This applies across Lead Inbox, Lead Detail, Verification, Outreach, Pipeline, Analytics, Alerts, and Today.

When live data is introduced, keep adapters at the boundary and avoid spreading raw backend field names throughout app modules.

## Design Doc Lint Is Optional

`DESIGN.md` documents this lint command:

```sh
npx @google/design.md lint DESIGN.md
```

It is not wired into `package.json` yet. Treat it as an optional design-doc check, especially when changing design-token language.

## UI Docs Mirror Some Backend Context

Backend startup notes in this repo are convenience notes for UI work, not the backend source of truth.

When backend examples disagree, prefer the backend repo's current `.env.example`, `config/config.go`, `docker-compose.yml`, and `Makefile`.

## Backend Docker Service Names

The current backend compose file names the API service `groupscout` and the container `groupscout_app`.

Prefer:

```sh
docker compose logs groupscout --tail=50
```

Use `docker compose ps` if documentation examples disagree.

## Useful Backend Make Targets

From `/mnt/c/Users/alvin/GolandProjects/groupscout`:

```sh
make help
make test
make run
make run-once
make docker-up
make docker-down
make docker-logs
make doctor
```

`make doctor` runs the backend environment health check.
