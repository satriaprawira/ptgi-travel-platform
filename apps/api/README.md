# apps/api

NestJS backend for the PT. Goal International travel platform. TypeScript (ESM), PostgreSQL through the
`pg` driver with raw SQL, no ORM.

Design and roadmap: [`docs/backend-vehicle-payment-design.md`](../../docs/backend-vehicle-payment-design.md).

## Run locally

Prerequisites: Node 22.9 or newer (`.nvmrc` pins 24) and Docker.

```bash
cd apps/api
cp .env.example .env          # local defaults already match docker-compose.yml
docker compose up -d          # Postgres 16 on localhost:5433
npm install
npm run start:dev             # http://127.0.0.1:4000/v1
```

Check it: `curl http://localhost:4000/v1/health` returns `{"status":"ok","database":"up"}`
(HTTP 503 with `"database":"down"` when Postgres is unreachable).

## Scripts

| Script | Does |
|---|---|
| `npm run start:dev` | Run with reload on file changes |
| `npm run build` / `npm run start:prod` | Compile to `dist/`, run the compiled app |
| `npm run migrate:create -- <name>` | New SQL migration in `database/migrations/` |
| `npm run migrate:up` | Apply all pending migrations |
| `npm run migrate:down` | Roll back the most recent migration |

Migrations are plain `.sql` files with a `-- Up Migration` and a `-- Down Migration` section, run by
[node-pg-migrate](https://github.com/salsita/node-pg-migrate) over `DATABASE_URL_DIRECT`. Never edit a
migration that has been applied; add a new one.

## Configuration

Read from the environment (a local `.env` is loaded automatically). Invalid or missing values stop the
app at startup with a list of what's wrong. See [`.env.example`](.env.example) for the full annotated list.

| Variable | Notes |
|---|---|
| `NODE_ENV` | Required: `development`, `test` or `production`. No default. |
| `PORT` | Default `4000`. |
| `DATABASE_URL` | Runtime connection. On Neon: the pooled string with `?sslmode=require`. |
| `DATABASE_URL_DIRECT` | Migrations only. On Neon: the direct (unpooled) string. |
| `WEB_ORIGIN` | The single browser origin allowed by CORS, e.g. `http://localhost:3000`. |
| `AUTH_DISABLED` | Local only. The app refuses to start with `true` unless `NODE_ENV=development`. |

In development the API listens on `127.0.0.1` only; in any other environment on `0.0.0.0`.

## Layout

```
database/migrations/    SQL migrations
src/
  main.ts               global prefix /v1, validation pipe, CORS, shutdown hooks
  config/               environment schema and validation
  database/             pg Pool (DatabaseService: query, transaction)
  health/               GET /v1/health
```

Conventions: SQL lives in `*.repository.ts` files and is always parameterized (`$1, $2, ...`); see
section 7.1 of the design doc.
