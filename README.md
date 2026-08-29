# ptgi-travel-platform
Private airport transfer booking platform for PT. Goal International, replacing the current Wix-based reservation form with an integrated system for customers, travel agent staff, and drivers.

> **Status:** Phase 1 in development. Frontend is scaffolded; backend is not yet built. Internal / proprietary — not for public distribution.

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
│   └── api/             NestJS backend                                              [planned, Phase 1]
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

### Frontend
```bash
cd apps/web
npm install
npm run dev
```
Opens at http://localhost:3000. See [`apps/web/README.md`](apps/web/README.md) for details.

### Backend
Not yet implemented — arriving in Phase 1.

---

## Documentation

- [`docs/product-brief-review.md`](docs/product-brief-review.md) — requirements review notes
- [`docs/tech-stack-recommendation.md`](docs/tech-stack-recommendation.md) — stack choice and rationale
- [`docs/staging-production-setup.md`](docs/staging-production-setup.md) — environment setup guide
- [`docs/repository-setup.md`](docs/repository-setup.md) — monorepo structure and naming rationale

---

## Contributing

1. Branch off `staging` for new work.
2. Open a PR into `staging` — auto-deploys to the staging URL for QA.
3. Once verified, PR `staging` into `main` to release to production.
