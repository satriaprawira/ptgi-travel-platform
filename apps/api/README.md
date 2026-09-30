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
| `npm test` / `npm run test:watch` | Unit tests (Vitest), e.g. the pricing rules in `src/pricing/quote.spec.ts` |

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
| `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `AUTH_TOKEN_SECRET` | Demo admin sign-in. All three or none. Password 16+ characters in production; secret 32+ characters (`openssl rand -base64 48`). |

In development the API listens on `127.0.0.1` only; in any other environment on `0.0.0.0`.

## Layout

```
database/migrations/    SQL migrations
src/
  main.ts               global prefix /v1, validation pipe, CORS, shutdown hooks
  config/               environment schema and validation
  auth/                 demo admin sign-in: POST /v1/auth/login, GET /v1/auth/me; token.ts = signed tokens
  common/               AdminAuthGuard, shared DTO transforms
  database/             pg Pool (DatabaseService: query, transaction), Postgres error + PATCH SET helpers
  health/               GET /v1/health
  reservation-options/  GET /v1/reservation-options (public)
  pricing/              POST /v1/quotes (public); quote.ts holds the pricing rules, unit-tested
  vehicle-types/        customer-facing vehicle types (read)
  payment-methods/      payment methods (read)
  fares/                route pricing: base fare per airport and area (admin)
  surcharges/           everything added on top of the fare (admin); time-windows.ts = overlap check
  vehicles/             fleet vehicles + vehicle classes (admin)
  drivers/              drivers and their assigned vehicle (admin)
```

Conventions: SQL lives in `*.repository.ts` files and is always parameterized (`$1, $2, ...`); see
section 7.1 of the design doc.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/health` | Public |
| GET | `/v1/reservation-options` | Public. Vehicle types, payment methods, airports, areas (regions with a fare) and add-ons. A vehicle type is listed only while the fleet has an Available vehicle of its class |
| POST | `/v1/auth/login` | Demo admin sign-in: `{ email, password }` → `{ accessToken, expiresAt, user }` (12 h). Wrong credentials → 401; demo login not configured → 503 |
| GET | `/v1/auth/me` | The signed-in admin (`Authorization: Bearer <token>`), or `authDisabled: true` in local development |
| POST | `/v1/quotes` | Public. Prices a trip from `airportId`, `serviceRegionId`, `vehicleTypeId`, `paymentMethodId`, `pickupDate`, `pickupTime` (Tokyo time) and optional `addOns: [{ addOnId, quantity }]`. Returns the line items, `totalJpy` and `quoteRequired` (then `totalJpy` is the "from" price). A past pickup, unknown ids or too many of an add-on → 422 |
| GET | `/v1/admin/vehicle-classes` | Seeded list: Standard car, Medium car, New Alphard, Grand Cabin, Bus |
| GET, POST | `/v1/admin/vehicles` | Plate is trimmed and uppercased; duplicate plate → 409 |
| GET, PATCH, DELETE | `/v1/admin/vehicles/:id` | Deleting unassigns its driver. Status `retired` keeps history instead |
| GET | `/v1/admin/fares` | Route pricing: every airport ⇄ area base fare, in price-sheet order |
| GET, PATCH | `/v1/admin/fares/:id` | Edit `zone`, `priceJpy` (`null` = quote on request), `minPriceJpy` ("from" price, quote routes only), `isActive` (hide from the booking form). No create/delete |
| GET | `/v1/admin/surcharges` | The whole "Additional Cost" sheet: vehicle surcharges, pickup-time windows, last-minute fee, extras, payment fees |
| PATCH | `/v1/admin/surcharges/{vehicle-types,pickup-times,last-minute,add-ons,payment-methods}/:id` | Edit one row; returns the whole sheet. Pickup-time windows can't overlap (422, serialized by an advisory lock). Pickup-time labels are names only; the window is appended where customers see it. No create/delete |
| GET, POST | `/v1/admin/drivers` | Optional `vehicleId`; a vehicle belongs to one driver at most (409) |
| GET, PATCH, DELETE | `/v1/admin/drivers/:id` | `vehicleId: null` unassigns. New assignments to a retired vehicle → 422 |

All `/v1/admin/*` routes go through `AdminAuthGuard`. They need `Authorization: Bearer <token>` from
`POST /v1/auth/login`, unless `AUTH_DISABLED=true` (development only). Without the demo-login variables
they answer 401 "Admin authentication is not configured". The demo login is a stand-in for a real auth
provider (Auth.js or Clerk), which will issue tokens with the same `role` claim. PATCH bodies are partial;
omitted fields are left alone, `null` is accepted only for the nullable `licenseNumber` and `vehicleId`.
