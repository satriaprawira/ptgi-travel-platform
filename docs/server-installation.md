# Server Installation Guide (`ptgi-travel-platform`)

Step-by-step runbook for provisioning a fresh **2 vCPU / 2 GB RAM (2c/2g)** Ubuntu VPS (e.g., Tencent Cloud Lighthouse) and deploying the full `ptgi-travel-platform` stack (`postgres`, `api`, `web`, and `nginx`).

> **Note:** All terminal commands below are formatted as **single-line commands** so terminal copy-paste never breaks on line wraps or indentation.

---

## 1. Cloud Firewall & Network Prerequisites

Before running commands on the server, open the **Tencent Cloud Console → Lighthouse (or CVM) → Select Instance → Firewall** tab and ensure these **Inbound Rules** are allowed:

| Type | Protocol | Port | Source | Action | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SSH** | `TCP` | `22` | `0.0.0.0/0` | Allow | Remote terminal access |
| **HTTP** | `TCP` | `80` | `0.0.0.0/0` | Allow | Web & API reverse proxy |
| **HTTPS** | `TCP` | `443` | `0.0.0.0/0` | Allow | SSL/TLS traffic (when domain is connected) |

> **Security Rule:** Keep ports `3000` (Next.js), `4000` (NestJS), and `5432` (PostgreSQL) **closed** to the public internet. They communicate strictly over Docker's private internal network.

---

## 2. OS Update & 2 GB Swap Setup

SSH into your server (`ssh ubuntu@<YOUR_SERVER_IP>` or `ssh rai@<YOUR_SERVER_IP>`) and run each single-line command below to update packages and add a 2 GB Swap file (protecting 2 GB RAM during builds and traffic spikes):

```bash
sudo apt update && sudo apt upgrade -y
```

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab && free -h
```

---

## 3. Install Docker, Docker Compose & Log Rotation

Install Docker Engine and Docker Compose, grant your user permission to run Docker, and cap container logs at `30 MB` per container (`10m` x `3` files) so your 40 GB SSD never fills up:

```bash
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER
```

```bash
printf '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}\n' | sudo tee /etc/docker/daemon.json && sudo systemctl restart docker
```

```bash
newgrp docker
```

Verify Docker is ready:

```bash
docker --version && docker compose version
```

---

## 4. Prepare `/opt/ptgi` & Configure GitHub Deploy Key

### 4.1 Create Deployment Directory

```bash
sudo mkdir -p /opt/ptgi && sudo chown -R $USER:$USER /opt/ptgi
```

### 4.2 Generate SSH Deploy Key for GitHub

Since `satriaprawira/ptgi-travel-platform` is a private repository, generate a read-only deploy key on the server:

```bash
ssh-keygen -t ed25519 -C "tencent-prod-server" -f ~/.ssh/id_ed25519 -N "" && cat ~/.ssh/id_ed25519.pub
```

1. Copy the `ssh-ed25519 AAAA...` output line.
2. Open **GitHub → `satriaprawira/ptgi-travel-platform` → Settings → Deploy keys → Add deploy key**.
3. Set Title to `Tencent Prod Server`, paste the public key, leave **Allow write access** unchecked, and click **Add key**.

### 4.3 Clone the Repository Directly into `/opt/ptgi`

*(Note the trailing `.` at the end so files are cloned directly into `/opt/ptgi` rather than a subfolder)*:

```bash
cd /opt/ptgi && git clone git@github.com:satriaprawira/ptgi-travel-platform.git . && ls -la /opt/ptgi
```

---

## 5. Generate Production `/opt/ptgi/.env`

Run these single-line commands to automatically detect your server's public IP address and generate random single-line credentials for PostgreSQL and staff authentication tokens:

```bash
PUBLIC_IP=$(curl -s ifconfig.me) && echo "PUBLIC_ORIGIN=http://${PUBLIC_IP}" > /opt/ptgi/.env
```

```bash
echo "POSTGRES_USER=ptgi" >> /opt/ptgi/.env && echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" >> /opt/ptgi/.env && echo "POSTGRES_DB=goal_intl" >> /opt/ptgi/.env && echo "AUTH_TOKEN_SECRET=$(openssl rand -hex 32)" >> /opt/ptgi/.env
```

Verify the generated `.env` file:

```bash
cat /opt/ptgi/.env
```

> **How PostgreSQL Uses These Variables:** You do not need to install or configure PostgreSQL manually. On first launch, the `postgres:16-alpine` container automatically initializes the user (`POSTGRES_USER`), password (`POSTGRES_PASSWORD`), and database (`POSTGRES_DB`), and the `api` container uses the exact same credentials to run all SQL migrations.

---

## 6. Build & Launch the Stack

Build `api` and `web` **one by one** (sequentially) so the 2 GB RAM server is never overloaded, then start all containers in detached mode:

```bash
cd /opt/ptgi && docker compose -f docker-compose.prod.yml build api
```

```bash
cd /opt/ptgi && docker compose -f docker-compose.prod.yml build web
```

```bash
cd /opt/ptgi && docker compose -f docker-compose.prod.yml up -d && docker compose -f docker-compose.prod.yml ps
```

Verify the API and database health endpoint:

```bash
curl -i http://localhost/v1/health
```

Expected response: `{"status":"ok","database":"up"}` (`HTTP/1.1 200 OK`).

---

## 7. Create the Initial Admin User

Once the stack is running, create the first staff admin user:

```bash
cd /opt/ptgi && docker compose -f docker-compose.prod.yml exec api node dist/scripts/create-admin.js --email admin@example.com --name "Admin"
```

1. Copy the one-time **Temporary password** printed in the terminal.
2. Open **`http://<YOUR_SERVER_IP>/login`** in your browser *(make sure the URL starts with `http://`, not `https://`)*.
3. Sign in with `admin@example.com` and the temporary password, then set your permanent password (12+ characters).
4. Create additional staff or admin accounts anytime from **Admin Dashboard → User Management**.
