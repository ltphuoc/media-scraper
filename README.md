# 🚀 Media Scraper - Quick Start

A full-stack web scraper system built with Node.js, Redis, PostgreSQL, and Next.js.

---

## 🧱 Requirements

- Docker & Docker Compose
- (Optional) Make installed (for running single CLI commands)

> 💡 **For Windows users:**
> Please run all `make` commands in **Git Bash** or **WSL**.
> These environments include Unix utilities (bash, cp, curl, timeout) used by the Makefile.

---

## ▶️ Start Project (1 CLI)

Build, start all services (API, Worker, DB, Redis, Landing, Queue Dashboard) and run smoke/load tests:

```bash
make start
```

Build and start all services (API, Worker, DB, Redis, Landing, Queue Dashboard):

```bash
make up
```

Access:

- API → http://localhost:4000
- API Docs (Swagger) → http://localhost:4000/api/docs
- Landing →
  - http://localhost:3000 (Submit requests URLs)
  - http://localhost:3000/media (View media items)
- Queue Dashboard → http://localhost:4000/admin/queues

---

## 🧪 Tests & Monitoring

### Monitoring

Log All:

```bash
make logs
```

Log API:

```bash
make logs-api
```

Log Worker:

```bash
make logs-worker
```

### Smoke Test

Check system works correctly:

```bash
make smoke
```

### Load Test (~5000 requests)

Verify performance:

```bash
make load
```

## 🧹 Stop & Clean

Stops and removes all containers and volumes.

```bash
make clean
```

---

✅ **Ready:** `make up` → run project
✅ **Prove works:** `make smoke`, `make load`
