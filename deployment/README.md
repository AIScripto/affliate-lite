# Affiliate Tracker — Deployment Guide

Automated deployment tooling for **Affiliate Tracker** on Ubuntu VM (`161.97.110.121`).

---

## 1. Stack & Architecture

- **Project Name**: `affliate`
- **Frontend**: Vite + React SPA (served via Nginx on port `80`, published to host port `3085`)
  - Image: `tariqsulehri/affliate-fe:latest`
  - Container: `affliate_fe`
- **Backend API**: Node.js + Express + Prisma (port `3086`, published to host port `3086`)
  - Image: `tariqsulehri/affliate-be:latest`
  - Container: `affliate_be`
- **Database**: PostgreSQL 18 running on VM host
  - Database name: `affiliate_tracker`
  - Connection: `postgresql://appuser:%23786Allahis1@161.97.110.121:5432/affiliate_tracker`
- **Remote VM Directory**: `/deployments/affliate`

---

## 2. Fast Commands

### From your local machine:
```bash
# Build and push new Docker Hub images:
./deployment/build-and-push.sh

# Build, push, and deploy immediately to the remote VM:
./deployment/build-and-push.sh --deploy
```

### On the server (`/deployments/affliate`):
```bash
# Deploy latest release:
./deploy.sh latest

# Check health, endpoints, migrations, and resources:
./status.sh

# Instant rollback to the previous working release:
./rollback.sh previous

# Create a manual compressed database backup:
./backup.sh manual
```

---

## 3. Configuration Files

| File | Purpose |
| :--- | :--- |
| `.env.backend` | Backend runtime secrets, port, CORS, and remote `DATABASE_URL` |
| `.env.frontend` | Frontend build and proxy configuration |
| `docker-compose.yml` | Multi-container stack (backend, frontend, migration job). Ports bound to 127.0.0.1 |
| `host-caddy.example` | The entry for this app in the server's shared Caddy (HTTPS). Reference only |
| `lib.sh` | Shared utilities, preflight checks, health checks, and status reporting |
| `backup.sh` | Automated compressed PostgreSQL backups with 30-day retention |
| `rollback.sh` | Fast zero-registry rollback to `:previous` image |
| `status.sh` | Color-coded production diagnostic dashboard |

