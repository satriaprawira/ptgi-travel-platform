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
| `npm run users:create-admin -- --email <email> --name "<name>"` | Creates an admin account in the `DATABASE_URL_DIRECT` database and prints a one-time temporary password. For the first admin; after that, use User Management |

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
| `AUTH_TOKEN_SECRET` | Signs staff sign-in tokens, 32+ characters (`openssl rand -base64 48`). Without it, admin routes stay locked. Changing it signs everyone out. |

In development the API listens on `127.0.0.1` only; in any other environment on `0.0.0.0`.

## Layout

```
database/migrations/    SQL migrations
src/
  main.ts               global prefix /v1, validation pipe, CORS, shutdown hooks
  config/               environment schema and validation
  auth/                 staff sign-in: login, me, change-password; password.ts (scrypt), token.ts, login-throttle.ts
  users/                staff accounts (admin): User Management; admin-rules.ts = keep an active admin
  scripts/              create-admin.ts: the first admin of a new database
  common/               AdminAuthGuard, @Roles / @AllowPasswordChange, shared DTO transforms
  database/             pg Pool (DatabaseService: query, transaction), Postgres error + PATCH SET helpers
  health/               GET /v1/health
  reservation-options/  GET /v1/reservation-options (public)
  pricing/              POST /v1/quotes (public); quote.ts holds the pricing rules, unit-tested
  bookings/             POST /v1/bookings (public) + the staff Bookings Queue; holds a vehicle per booking
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
| POST | `/v1/auth/login` | Staff sign-in: `{ email, password }` → `{ accessToken, expiresAt, user: { id, fullName, email, role, mustChangePassword } }` (12 h). Wrong credentials or a disabled account → 401; 5 failures per email or 20 per IP in 15 min → 429; `AUTH_TOKEN_SECRET` not set → 503 |
| GET | `/v1/auth/me` | The signed-in user (`Authorization: Bearer <token>`), or `authDisabled: true` in local development |
| POST | `/v1/auth/change-password` | `{ currentPassword, newPassword }` (12–128 characters). Wrong current password → 422. Ends the user's other sessions and returns a fresh `accessToken` |
| GET, POST | `/v1/admin/users` | Admin only. POST `{ fullName, email, role }` (`admin` / `staff`) → `{ user, temporaryPassword }`; the password is shown once and must be changed at first sign-in. Duplicate email → 409 |
| GET, PATCH | `/v1/admin/users/:id` | Admin only. `fullName`, `email`, `role`, `status` (`active` / `disabled`). Disabling signs the user out at once. You can't demote or disable yourself, and the last active admin can't be removed (409). No delete |
| POST | `/v1/admin/users/:id/reset-password` | Admin only. New `temporaryPassword`; the user's sessions end. Not for your own account (409) |
| POST | `/v1/bookings` | Public. The reservation form's "Confirm reservation": the quote fields plus `direction`, `address`, passenger and contact details. The price is recalculated server-side and stored with the booking. Status starts as `new` and a vehicle of the type's class is held from the pickup time for `HOLD_HOURS` (3 h, `bookings.service.ts`). No vehicle free at that time → 409, unless `joinWaitlist: true` is sent: then it is saved as `waitlisted`, holding nothing. Returns the booking number (`GI-YYMM-NNNN`) and price |
| GET | `/v1/admin/bookings`, `/v1/admin/bookings/:id` | Staff queue: new requests first, then by pickup time |
| GET | `/v1/admin/bookings/schedule?date=YYYY-MM-DD&days=N` | `new` and `confirmed` bookings that occupy a vehicle during `days` Tokyo days from `date` (default 1, max 31; the admin calendar asks for 7). A trip crossing midnight belongs to both days |
| GET | `/v1/admin/bookings/waitlist` | Waitlisted bookings in joining order, each with `slotFree` (a vehicle of its class is free for its time right now). The Bookings Queue uses it to enable "Move to bookings" |
| POST | `/v1/admin/bookings/:id/promote` | `waitlisted` → `new`, taking a hold. No vehicle free yet → 409 |
| GET | `/v1/admin/bookings/:id/assignment-options` | Vehicles (Available, of the booking's class) and drivers (active) with no other confirmed booking overlapping its time; each vehicle carries its `usualDriverId` |
| POST | `/v1/admin/bookings/:id/confirm` | `new` → `confirmed`. Body `{ vehicleId, driverId, finalTotalJpy? }`: assigns the vehicle and driver for the trip. Either one not free → 422, or 409 if taken a moment ago (exclusion constraints `bookings_vehicle_no_overlap` / `bookings_driver_no_overlap`). `finalTotalJpy` is required for quote-required bookings and refused for fixed-price ones. Not `new` any more → 409 |
| POST | `/v1/admin/bookings/:id/cancel` | `new`, `confirmed` or `waitlisted` → `cancelled`; releases the held vehicle and the assigned vehicle and driver. Already cancelled → 409 |
| POST | `/v1/quotes` | Public. Prices a trip from `airportId`, `serviceRegionId`, `vehicleTypeId`, `paymentMethodId`, `pickupDate`, `pickupTime` (Tokyo time) and optional `addOns: [{ addOnId, quantity }]`. Returns the line items, `totalJpy` and `quoteRequired` (then `totalJpy` is the "from" price). A past pickup, unknown ids or too many of an add-on → 422 |
| GET | `/v1/admin/vehicle-classes` | Seeded list: Standard car, Medium car, New Alphard, Grand Cabin, Bus |
| GET, POST | `/v1/admin/vehicles` | Plate is trimmed and uppercased; duplicate plate → 409 |
| GET, PATCH, DELETE | `/v1/admin/vehicles/:id` | Deleting unassigns its usual driver; a vehicle that has bookings can't be deleted (409, retire it instead). Responses include `currentTrip` and `nextTrip`, derived from confirmed bookings |
| GET | `/v1/admin/fares` | Route pricing: every airport ⇄ area base fare, in price-sheet order |
| GET, PATCH | `/v1/admin/fares/:id` | PATCH is admin only. Edit `zone`, `priceJpy` (`null` = quote on request), `minPriceJpy` ("from" price, quote routes only), `isActive` (hide from the booking form). No create/delete |
| GET | `/v1/admin/surcharges` | The whole "Additional Cost" sheet: vehicle surcharges, pickup-time windows, last-minute fee, extras, payment fees |
| PATCH | `/v1/admin/surcharges/{vehicle-types,pickup-times,last-minute,add-ons,payment-methods}/:id` | Admin only. Edit one row; returns the whole sheet. Pickup-time windows can't overlap (422, serialized by an advisory lock). Pickup-time labels are names only; the window is appended where customers see it. No create/delete |
| GET, POST | `/v1/admin/drivers` | Optional `vehicleId`; a vehicle belongs to one driver at most (409) |
| GET, PATCH, DELETE | `/v1/admin/drivers/:id` | `vehicleId` is the driver's usual vehicle (`null` unassigns; a retired vehicle → 422). A driver who has bookings can't be deleted (409, set inactive instead). Responses include `currentTrip` and `nextTrip` |

All `/v1/admin/*` routes go through `AdminAuthGuard`. They need `Authorization: Bearer <token>` from
`POST /v1/auth/login`, unless `AUTH_DISABLED=true` (development only, counts as an admin). Without
`AUTH_TOKEN_SECRET` they answer 401 "Admin authentication is not configured". On every request the
guard reads the user from the database: a disabled account, or a token from before a password change,
reset or status change, gets 401. Roles: **admin** can do everything; **staff** everything except
User Management and price edits (403, marked `@Roles('admin')`). A user still on a temporary password
gets 403 everywhere except `auth/me` and `auth/change-password`. PATCH bodies are partial;
omitted fields are left alone, `null` is accepted only for the nullable `licenseNumber` and `vehicleId`.
