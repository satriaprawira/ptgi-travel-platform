# ptgi-travel-platform
Private airport transfer booking platform for PT. Goal International, replacing the current Wix-based reservation form with an integrated system for customers, travel agent staff, and drivers.

> **Status:** Phase 1 in development. Frontend is scaffolded; the backend serves Driver and Vehicle Management for the admin dashboard. Internal / proprietary — not for public distribution.

---

## What this is

Customers currently book airport pickups through a Wix form that only collects data — staff coordinate everything else (drivers, vehicles, payment, confirmations) manually. This platform brings booking, payment, driver/vehicle management, notifications, and reporting into one system, built and released in three phases.

| Phase | Delivers |
|---|---|
| **1** | Integrated booking & quotation, driver & vehicle management, WhatsApp/email integration |
| **2** | Centralized payment & booking confirmation, trip lifecycle management, automated notifications |
| **3** | Reduced manual processing, integrated reporting |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React, TypeScript) |
| Driver interface | Progressive Web App, same Next.js app |
| Backend API | NestJS (Node.js, TypeScript) |
| Database | PostgreSQL |
| Background jobs | BullMQ + Redis |
| Auth | Auth.js (NextAuth) or Clerk, role-based (Customer / Staff / Driver) |
| Payments | Square + PayPal (hosted checkout), manual reconciliation for bank transfer/cash |
| Notifications | WhatsApp Cloud API (via Twilio/360dialog) + Resend/Postmark for email |
| Hosting | Vercel (frontend) · Railway (backend) · Neon (managed Postgres) |

Full reasoning behind these choices is in [`docs/tech-stack-recommendation.md`](docs/tech-stack-recommendation.md).

---

## Repository structure

A monorepo — one place for both apps, deployed independently via each host's root-directory setting.

```
nrt-hnd-transfers/
├── apps/
│   ├── web/            Next.js frontend — booking site, staff dashboard, driver PWA  [scaffolded]
│   └── api/             NestJS backend                                              [scaffolded]
├── packages/
│   └── shared/           Shared TypeScript types (booking payloads, etc.)             [planned]
└── docs/                 Product brief, tech stack, environment, and repo docs
```

---

## Environments

| | Branch | Frontend | Backend |
|---|---|---|---|
| Staging | `staging` | `staging.book.yourdomain.com` | Railway staging environment |
| Production | `main` | `book.yourdomain.com` | Railway production environment |

PRs target `staging` first; once verified there, `staging` merges into `main` to release to production. Full setup steps (Vercel domains, Railway environments, Neon branching, sandbox payment/messaging keys) are in [`docs/staging-production-setup.md`](docs/staging-production-setup.md).

---

## Getting started

**First time?** Follow [`docs/local-development.md`](docs/local-development.md): installing Docker and
Node, the database, migrations, and running both apps, with troubleshooting.

Short version, once the tools are installed (Docker Desktop running, Node 24):

```bash
# Backend + database
cd apps/api
cp .env.example .env
docker compose up -d      # local Postgres on localhost:5433
npm install
npm run migrate:up        # create / update the tables
npm run start:dev         # http://localhost:4000/v1 (health check: /v1/health)

# Frontend (new terminal)
cd apps/web
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:4000" > .env.local
npm run dev               # http://localhost:3000, admin at /admin
```

See [`apps/api/README.md`](apps/api/README.md) for the API's scripts, configuration and endpoints.

---

## Documentation

- [`docs/local-development.md`](docs/local-development.md) — step-by-step local setup (Docker, database, both apps)
- [`docs/backend-vehicle-payment-design.md`](docs/backend-vehicle-payment-design.md) — backend design for the configurable Vehicle & Payment options
- [`docs/product-brief-review.md`](docs/product-brief-review.md) — requirements review notes
- [`docs/tech-stack-recommendation.md`](docs/tech-stack-recommendation.md) — stack choice and rationale
- [`docs/staging-production-setup.md`](docs/staging-production-setup.md) — environment setup guide
- [`docs/repository-setup.md`](docs/repository-setup.md) — monorepo structure and naming rationale

---

## Contributing

1. Branch off `staging` for new work.
2. Open a PR into `staging` — auto-deploys to the staging URL for QA.
3. Once verified, PR `staging` into `main` to release to production.
