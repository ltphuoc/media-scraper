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

Build and start all services (API, Worker, DB, Redis, Landing, Dashboard):

```bash
make start
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

```bash
make logs
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

```bash
make clean
```

Stops and removes all containers and volumes.

---

✅ **Ready:** `make up` → run project
✅ **Prove works:** `make smoke`, `make load`
