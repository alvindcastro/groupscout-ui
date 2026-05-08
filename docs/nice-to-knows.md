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

## Design Tokens Are Partial

`DESIGN.md` is larger than the exported token subset in `web/src/design/tokens.js`.

The tests currently assert the tokens needed by implemented phases. They do not prove every `DESIGN.md` reference is exported or resolvable.

## API Client Is The Browser Safety Boundary

Use `createApiClient(...)` for API access. It enforces same-origin `/api/*` paths and `credentials: "same-origin"`.

Avoid direct external backend URLs in browser-facing modules.

## Mocked Data Is Intentional

Lead inbox and lead detail data are mocked so the UI can lock screen contracts before the real app shell exists.

When live data is introduced, keep adapters at the boundary and avoid spreading raw backend field names throughout app modules.

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
