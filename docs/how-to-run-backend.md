# How To Run The Backend

This UI repo does not start the GroupScout backend directly. The backend lives at:

```sh
/mnt/c/Users/alvin/GolandProjects/groupscout
```

Use these notes when you need API data for UI contract work or local integration checks. They mirror useful backend context, but the backend repo remains the source of truth when examples disagree.

## Prerequisites

- Go `1.26+`
- Docker and Docker Compose for Postgres, n8n, monitoring, and the full stack
- `pdftotext` for PDF permit scraping when running collectors locally
- A backend `.env` copied from `.env.example`

Minimum backend `.env` values called out by the backend docs:

```env
CLAUDE_API_KEY=sk-ant-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
API_TOKEN=your_secure_token_here
DATABASE_URL=groupscout.db
```

Note: backend email-provider docs have had `SENDGRID_API_KEY` versus `RESEND_API_KEY` drift. Prefer the backend repo's current `.env.example` and `config/config.go` when configuring email.

For Postgres local development:

```env
DATABASE_URL=postgres://groupscout:groupscout@localhost:5432/groupscout
```

## Local Go Server

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
go mod download
go run cmd/server/main.go
```

Expected API base:

```txt
http://localhost:8080
```

Useful endpoints:

- `GET /health`
- `POST /run`
- `POST /digest?to=email@example.com`
- `POST /n8n/webhook`

Most write or trigger endpoints expect:

```txt
Authorization: Bearer YOUR_API_TOKEN
```

## One-Shot Pipeline

Run one collector/enrichment/notification pass and exit:

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
go run cmd/server/main.go --run-once
```

Equivalent Makefile target:

```sh
make run-once
```

## Postgres-Only Setup

Use this when the backend should run locally but storage should match the Postgres path:

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
docker compose up postgres -d
docker compose ps
```

Set:

```env
DATABASE_URL=postgres://groupscout:groupscout@localhost:5432/groupscout
```

Then run:

```sh
go run cmd/server/main.go --run-once
```

Migrations run automatically on first boot.

## Full Docker Stack

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
docker compose up -d
```

Services exposed by the current compose file:

| Service | URL / Port | Purpose |
|---|---:|---|
| GroupScout API | `http://localhost:8080` | Lead generation server |
| Alertd | `http://localhost:8081` | Airport disruption monitor |
| Postgres | `localhost:5432` | Primary database with pgvector |
| n8n | `http://localhost:5678` | Workflow scheduler |
| Prometheus | `http://localhost:9090` | Metrics |
| Grafana | `http://localhost:3000` | Dashboards and logs |
| Loki | `http://localhost:3100` | Log aggregation |

Important: the compose service is currently named `groupscout`, with container name `groupscout_app`. Some backend docs still mention `app` in log commands. Prefer:

```sh
docker compose logs -f groupscout
docker compose logs groupscout --tail=50
```

If that fails, inspect service names:

```sh
docker compose ps
```

## Alertd

Run the airport disruption monitor locally:

```sh
cd /mnt/c/Users/alvin/GolandProjects/groupscout
go run cmd/alertd/main.go
```

Alertd listens on `localhost:8081` by default and needs `config/airports.yaml`.

Manual slash-command simulation:

```sh
curl -X POST -d "command=/inventory&text=34" http://localhost:8081/slack/inventory
```

## Health And Trigger Checks

```sh
curl -i http://localhost:8080/health
```

```sh
curl -i -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  http://localhost:8080/run
```

For container logs after a run:

```sh
docker compose logs groupscout --tail=50
```

## Backend Source Docs

Primary backend references:

- `/mnt/c/Users/alvin/GolandProjects/groupscout/README.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/DEVELOPER.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/SETUP.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/DOCKER.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/TESTING.md`
- `/mnt/c/Users/alvin/GolandProjects/groupscout/docs/guides/TROUBLESHOOTING.md`
