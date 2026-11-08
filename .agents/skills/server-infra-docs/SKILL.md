---
name: server-infra-docs
description: >-
  Provision and maintain VPS server infrastructure (Docker, Nginx, PostgreSQL, Swap, CI/CD)
  and generate or update server installation and infrastructure runbook documentation in docs/.
  Use this skill whenever the user asks to configure server deployment files, generate server
  installation or infrastructure documentation, update production configs, or troubleshoot
  VPS/Docker deployments.
---

# Server Infrastructure & Documentation Skill (`ptgi-travel-platform`)

This skill defines the standards for configuring, operating, and documenting the production VPS infrastructure for `ptgi-travel-platform`.

---

## 1. Production Stack & Server Profile

- **Target Host:** Linux VPS (e.g., Tencent Cloud Lighthouse Ubuntu, 2 vCPU / 2 GB RAM, 40 GB SSD).
- **Deployment Path on Server:** `/opt/ptgi`
- **Containers (`docker-compose.prod.yml`):**
  - `nginx` (`nginx:alpine`, `64M` limit): Listens on Port `80` (and `443` with SSL), routes `/v1/*` to `api:4000` and `/` to `web:3000`.
  - `web` (`node:22-alpine`, `450M` limit): Next.js 14 `standalone` server on Port `3000` (`NODE_OPTIONS="--max-old-space-size=384"`).
  - `api` (`node:22-alpine`, `450M` limit): NestJS backend on Port `4000` (`NODE_OPTIONS="--max-old-space-size=384"`). Runs `node-pg-migrate up` automatically before starting `node dist/main`.
  - `postgres` (`postgres:16-alpine`, `300M` limit): Tuned for 2 GB RAM (`shared_buffers=128MB`, `work_mem=4MB`, `maintenance_work_mem=32MB`, `max_connections=40`), persisted in the `pgdata` volume.

---

## 2. Mandatory Rules for Server Commands & Docker Configs

Whenever providing terminal commands for the server or editing Docker configs, strictly follow these rules:

1. **Single-Line Commands Only (No `\` or `<<EOF` Traps):**
   - Terminal copy-paste often pads lines with trailing spaces, which breaks backslash line continuations (`\`) and indented heredocs (`cat <<EOF`).
   - Always format server commands as single lines joined with `&&`, or single-line `echo "..." >> /opt/ptgi/.env` statements.
2. **Single-Line Secret Generation:**
   - Always use `openssl rand -hex 16` or `openssl rand -hex 32` instead of `openssl rand -base64 48` (which wraps across multiple lines and corrupts `.env` files).
3. **Sequential Docker Builds on 2 GB RAM:**
   - Always build `api` and `web` one by one (`docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml build web`) so 2 GB RAM is never exhausted by parallel TypeScript/Webpack builds.
4. **Preserve CLI Binaries in `apps/api/Dockerfile`:**
   - `node-pg-migrate` is declared in `devDependencies`. Always use `COPY --from=builder /app/node_modules ./node_modules` in the `runner` stage of `apps/api/Dockerfile` so `./node_modules/.bin/node-pg-migrate` is available when the container starts.
5. **Strict `.dockerignore` Files:**
   - Both `apps/api/.dockerignore` and `apps/web/.dockerignore` must exclude `node_modules`, `dist`, `.next`, `.env`, and `.env.*` so local `.env.local` files never override production build arguments.

---

## 3. Documentation Generation Workflow

When the user asks to generate or update server installation and infrastructure documentation, create or update these two files in `docs/`:

### 3.1 `docs/server-installation.md` (Step-by-Step Installation Guide)
Must include copy-paste-ready single-line commands for:
1. **Prerequisites & Firewall Setup:**
   - Cloud Console Firewall rules (Allow `TCP:22`, `TCP:80`, `TCP:443`; keep `3000`, `4000`, `5432` closed).
   - Ubuntu `ufw` check.
2. **OS Preparation & Swap Memory:**
   - Creating and persisting a 2 GB `/swapfile` in `/etc/fstab` and verifying with `free -h`.
3. **Docker & Docker Compose Installation:**
   - Installing via `https://get.docker.com`, adding `$USER` to the `docker` group, and configuring Docker log rotation (`/etc/docker/daemon.json` with `max-size: 10m`, `max-file: 3`).
4. **Repository Access & Cloning into `/opt/ptgi`:**
   - Creating `/opt/ptgi` with proper ownership.
   - Generating an `ed25519` SSH deploy key (`~/.ssh/id_ed25519.pub`) and registering it in GitHub Deploy Keys.
   - Cloning directly into `/opt/ptgi` (`git clone git@github.com:satriaprawira/ptgi-travel-platform.git .`).
5. **Environment Configuration (`/opt/ptgi/.env`):**
   - Auto-detecting public IP (`PUBLIC_IP=$(curl -s ifconfig.me)`) and writing `PUBLIC_ORIGIN`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `AUTH_TOKEN_SECRET` using single-line `echo` commands.
6. **Building, Starting, and Seeding Initial Admin:**
   - Sequential build (`build api`, `build web`), `up -d`, health check (`curl -I http://localhost/v1/health`), and creating the initial admin account via `dist/scripts/create-admin.js`.

### 3.2 `docs/infrastructure.md` (Architecture & Day-2 Operations Runbook)
Must include:
1. **Architecture Overview & Mermaid Diagram:**
   - Visual diagram of traffic flow (`Browser` → `Tencent Firewall` → `nginx:80` → `web:3000` / `api:4000` → `postgres:5432` → `pgdata` volume).
2. **Resource Allocation & Tuning Table:**
   - Breakdown of RAM limits and runtime usage across OS, Postgres, API, Web, and Nginx on a 2c/2g server.
3. **Configuration Change Procedures:**
   - Updating backend secrets in `/opt/ptgi/.env` (`docker compose -f docker-compose.prod.yml up -d`).
   - Updating `PUBLIC_ORIGIN` when switching from IP to a domain (`build web && up -d`, explaining why Next.js `NEXT_PUBLIC_API_URL` requires a `web` rebuild).
   - Updating code or `nginx.conf` via Git.
4. **Backup, Restore & Maintenance:**
   - Automated daily `pg_dump` cron job to `/opt/ptgi/backups` (7-day retention) and how to restore from a `.sql.gz` backup.
   - Cleaning up dangling Docker images (`docker image prune -f`).
5. **Troubleshooting Playbook:**
   - `ERR_TIMED_OUT` in browser (Cloud Console Firewall vs. Chrome auto-upgrading `http://` to `https://`).
   - `nginx: [emerg] host not found in upstream "api"` (checking `api` container logs and restarting `nginx`).
   - Viewing live logs and container health (`docker compose -f docker-compose.prod.yml ps -a` and `logs`).
