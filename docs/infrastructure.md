# Server Infrastructure & Operations Runbook (`ptgi-travel-platform`)

This document describes the production infrastructure architecture, resource allocation, configuration workflows, backup procedures, and troubleshooting guide for `ptgi-travel-platform`.

---

## 1. Architecture Overview

All services run inside isolated Docker containers on a single **2 vCPU / 2 GB RAM** VPS at `/opt/ptgi`, orchestrated by [`docker-compose.prod.yml`](../docker-compose.prod.yml).

```mermaid
flowchart LR
    User["Customer / Staff Browser"] -->|"HTTP :80 (or HTTPS :443)"| FW["Tencent Cloud Firewall"]
    FW -->|"Port 80"| Nginx["nginx:alpine (:80)"]
    Nginx -->|"/* (Frontend)"| Web["web: Next.js Standalone (:3000)"]
    Nginx -->|"/v1/* (REST API)"| Api["api: NestJS + Migrations (:4000)"]
    Api -->|"Internal TCP :5432"| Pg["postgres:16-alpine (:5432)"]
    Pg -->|"Persistent Storage"| Vol[("Docker Volume: pgdata")]
```

### Why Single-Origin Reverse Proxy (`nginx`)?
- Both the Next.js frontend (`/`) and NestJS backend (`/v1/*`) are served from the **exact same origin** (`PUBLIC_ORIGIN`) through Port `80`.
- Eliminates cross-origin (`CORS`) issues and keeps ports `3000`, `4000`, and `5432` completely hidden from the public internet.

---

## 2. Resource Allocation & Memory Budget (2 vCPU / 2 GB RAM)

Each container in [`docker-compose.prod.yml`](../docker-compose.prod.yml) is tuned with explicit memory caps and Node/Postgres flags so total steady-state usage stays around **~500–650 MB RAM**:

| Component | Image / Runtime | Typical RAM | Hard Memory Limit | Tuning Applied |
| :--- | :--- | :--- | :--- | :--- |
| **Host OS** | Ubuntu 22.04 / 24.04 | ~160 MB | — | 2 GB `/swapfile` enabled in `/etc/fstab` |
| **Reverse Proxy (`nginx`)** | `nginx:alpine` | ~10 MB | `64M` | `worker_connections 512` in [`nginx.conf`](../nginx.conf) |
| **Frontend (`web`)** | `node:22-alpine` | ~90 MB | `450M` | Next.js `output: "standalone"`, `--max-old-space-size=384` |
| **Backend (`api`)** | `node:22-alpine` | ~95 MB | `450M` | `--max-old-space-size=384`, auto-runs `node-pg-migrate up` |
| **Database (`postgres`)** | `postgres:16-alpine` | ~130 MB | `300M` | `shared_buffers=128MB`, `work_mem=4MB`, `max_connections=40` |

---

## 3. Configuration Management Workflows

How you apply changes on the server depends on what you are modifying:

### 3.1 Updating Backend Secrets in `/opt/ptgi/.env`
*(e.g., rotating `AUTH_TOKEN_SECRET` or adding new backend environment variables)*

1. Edit `/opt/ptgi/.env`:
   ```bash
   nano /opt/ptgi/.env
   ```
2. Recreate the affected container (takes ~2 seconds; database volume is untouched):
   ```bash
   cd /opt/ptgi && docker compose -f docker-compose.prod.yml up -d
   ```

### 3.2 Switching `PUBLIC_ORIGIN` (From IP Address to a Custom Domain)
Because Next.js embeds `NEXT_PUBLIC_API_URL` into the client bundle at **build time**, changing `PUBLIC_ORIGIN` requires rebuilding `web`:

1. Update `PUBLIC_ORIGIN=https://book.yourdomain.com` in `/opt/ptgi/.env`.
2. Rebuild `web` and restart the stack:
   ```bash
   cd /opt/ptgi && docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d
   ```

### 3.3 Deploying Code Changes or `nginx.conf` Updates
Code changes merged to `main` are deployed **automatically** by GitHub Actions ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)):
1. **`verify` job:** Runs `apps/api` unit tests (`npm test`) and build check (`npm run build`), plus `apps/web` lint check (`npm run lint`).
2. **`deploy` job:** Connects to `/opt/ptgi` via SSH, pulls `origin/main`, rebuilds only the containers whose files changed (`api` and/or `web`), restarts the stack (`docker compose -f docker-compose.prod.yml up -d --remove-orphans`), verifies `http://localhost/v1/health`, and prunes dangling images.

#### Required GitHub Actions Secrets (`Settings → Secrets and variables → Actions`)
| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `SERVER_HOST` | `129.226.95.102` | Public IP of the Tencent Lighthouse server |
| `SERVER_USER` | `rai` | SSH login user on the server |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Private SSH key authorized in `~/.ssh/authorized_keys` on the server |

To authorize the server's existing key and print the private key for `SERVER_SSH_KEY`:
```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && cat ~/.ssh/id_ed25519
```

For manual deployment on the server (if ever needed):
```bash
cd /opt/ptgi && git pull origin main && docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d && docker image prune -f
```

*(If only `nginx.conf` changed, reload Nginx with zero rebuild: `cd /opt/ptgi && docker compose -f docker-compose.prod.yml restart nginx`)*

---

## 4. Database Backups & Maintenance

### 4.1 Automated Daily PostgreSQL Backup (7-Day Retention)
Set up a daily cron job at 03:00 AM that dumps and compresses the `goal_intl` database to `/opt/ptgi/backups`:

```bash
mkdir -p /opt/ptgi/backups && (crontab -l 2>/dev/null; echo "0 3 * * * docker compose -f /opt/ptgi/docker-compose.prod.yml exec -T postgres pg_dump -U ptgi goal_intl | gzip > /opt/ptgi/backups/db-\$(date +\%F).sql.gz && find /opt/ptgi/backups -type f -mtime +7 -delete") | crontab -
```

### 4.2 Manual On-Demand Backup
Run before major upgrades:

```bash
mkdir -p /opt/ptgi/backups && docker compose -f /opt/ptgi/docker-compose.prod.yml exec -T postgres pg_dump -U ptgi goal_intl | gzip > /opt/ptgi/backups/manual-$(date +%F-%H%M).sql.gz
```

### 4.3 Restoring a Backup
To restore from a `.sql.gz` backup file:

```bash
gunzip -c /opt/ptgi/backups/<BACKUP_FILENAME>.sql.gz | docker compose -f /opt/ptgi/docker-compose.prod.yml exec -T postgres psql -U ptgi -d goal_intl
```

---

## 5. Troubleshooting Playbook

### Issue 1: Browser Shows `ERR_TIMED_OUT` ("took too long to respond")
1. **Check local response on the server:**
   ```bash
   curl -I http://localhost && sudo ufw status && docker compose -f docker-compose.prod.yml ps
   ```
2. **If `curl -I http://localhost` returns `HTTP/1.1 200 OK`:**
   - **Cause A (Tencent Cloud Firewall):** Port `80` is not open in **Tencent Cloud Console → Lighthouse/CVM → Firewall**. Add an Inbound Rule allowing `TCP:80` from `0.0.0.0/0`.
   - **Cause B (Browser HTTPS Upgrade):** Chrome may have automatically changed `http://<IP>` to `https://<IP>` (Port 443). Explicitly type `http://<IP>/login` or test in an Incognito window.
   - **Cause C (Ubuntu UFW active):** If `sudo ufw status` is `active`, run:
     ```bash
     sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
     ```

### Issue 2: `nginx` Returns `502 Bad Gateway` or Restarts with `host not found in upstream "api"`
- **Cause:** When `api` or `web` is recreated by `docker compose up -d`, Docker assigns a new container IP, or `api` is still running `node-pg-migrate up` for the first ~3 seconds. [`nginx.conf`](../nginx.conf) uses Docker's internal DNS resolver (`127.0.0.11 valid=5s`) and CI/CD runs `restart nginx` automatically.
- **Fix:** Check the `api` logs, ensure `api` is `Up`, then restart `nginx`:
  ```bash
  cd /opt/ptgi && docker compose -f docker-compose.prod.yml restart nginx && sleep 3 && curl -i http://localhost/v1/health
  ```

### Issue 3: Useful Diagnostic Commands
- **Check all container statuses and recent logs:**
  ```bash
  cd /opt/ptgi && docker compose -f docker-compose.prod.yml ps -a && docker compose -f docker-compose.prod.yml logs --tail=40
  ```
- **Check real-time container RAM & CPU usage:**
  ```bash
  docker stats --no-stream
  ```
- **Reclaim unused Docker disk space:**
  ```bash
  docker system prune -f
  ```
