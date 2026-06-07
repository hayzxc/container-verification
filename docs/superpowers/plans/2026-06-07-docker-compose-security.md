# Docker Compose Environment Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure Docker Compose configuration by moving hardcoded secrets to a root `.env` file and using environment variable references.

**Architecture:** Use Docker Compose's built-in support for `.env` files. Variables in the root `.env` will be automatically loaded by Docker Compose when run from the `infra/` directory (if specified or if the root is the context) or explicitly referenced.

**Tech Stack:** Docker, Docker Compose

---

### Task 1: Create Root .env File

**Files:**
- Create: `.env`

- [ ] **Step 1: Create .env file with secrets**

```env
# Database
POSTGRES_USER=container_app
POSTGRES_PASSWORD=container_app
POSTGRES_DB=container_verification

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# API Secrets
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret

# API Configuration
# NEXT_PUBLIC_API_URL is for client-side fetches from the browser
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 2: Commit .env (Wait, .env should usually be ignored, but for this task I will create it. I should check .gitignore first)**

### Task 2: Update infra/docker-compose.yml

**Files:**
- Modify: `infra/docker-compose.yml`

- [ ] **Step 1: Replace hardcoded values with variables**

```yaml
services:
  postgres:
    # ...
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    # ...

  minio:
    # ...
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    # ...

  api:
    # ...
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@container-postgres:5432/${POSTGRES_DB}?schema=public
      REDIS_URL: redis://container-redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGINS: http://localhost:3000
      COOKIE_SECURE: "false"

  web:
    # ...
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      PORT: 3000
      NODE_ENV: production
```

- [ ] **Step 2: Add comments for clarity**

### Task 3: Verification

- [ ] **Step 1: Verify docker-compose config**
Run: `docker compose -f infra/docker-compose.yml config` (This will show the interpolated values)

- [ ] **Step 2: Commit changes**
