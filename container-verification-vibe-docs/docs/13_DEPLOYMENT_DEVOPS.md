# 13 — Deployment and DevOps

## Deployment model

Use separate deployments for frontend, backend API, worker, database, Redis, and object storage.

Recommended production architecture:

```txt
Cloudflare DNS/CDN
  -> Frontend hosting / Next.js runtime
  -> API reverse proxy
      -> Express API container
      -> Worker container
      -> PostgreSQL
      -> Redis
      -> S3/R2 object storage
```

## Environments

Use three environments:

| Environment | Purpose |
|---|---|
| Development | Local developer machines |
| Staging | Pre-production QA and client review |
| Production | Live operational use |

## Environment variables

### API

```env
NODE_ENV=production
PORT=3001
APP_URL=https://app.example.com
API_URL=https://api.example.com
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
CORS_ORIGIN=https://app.example.com
S3_BUCKET_NAME=...
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ENDPOINT=...
OCR_PROVIDER=google-vision
GOOGLE_CLOUD_VISION_API_KEY=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

### Web

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_APP_NAME=Container Verification
```

## Dockerfile: API

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

## Dockerfile: Web

Use the standard Next.js standalone output.

```js
// next.config.js
const nextConfig = {
  output: "standalone"
};
module.exports = nextConfig;
```

## GitHub Actions pipeline

Recommended stages:

1. Install dependencies.
2. Type check.
3. Lint.
4. Unit tests.
5. Build frontend.
6. Build backend.
7. Prisma migration check.
8. Docker build.
9. Deploy to staging.
10. Manual approval for production.

## Database migration strategy

- Use Prisma migrations.
- Never run destructive migration directly in production without backup.
- Run migrations before API rollout.
- Keep migration logs.

Commands:

```bash
pnpm --filter api prisma migrate deploy
pnpm --filter api prisma generate
```

## Backup strategy

PostgreSQL:

- Daily automated backups.
- 30-day retention.
- Point-in-time recovery if cloud provider supports it.

Object storage:

- Versioning enabled if budget allows.
- Lifecycle policy for old photos if retention rules are defined.

Redis:

- Persistence optional for queues, but recommended if jobs must survive restart.

## Monitoring

Track:

- API uptime.
- p95 latency.
- Error rate.
- Upload failure rate.
- OCR job failure rate.
- Queue depth.
- Database connection count.
- Storage usage.
- Webhook delivery failures.

Tools:

- Prometheus + Grafana.
- Sentry for errors.
- Centralized logs with ELK, Grafana Loki, or provider logs.

## Logging

Use structured JSON logs.

Include:

- request ID.
- user ID if available.
- route.
- status code.
- latency.
- error code.

Do not log:

- Passwords.
- JWT tokens.
- Refresh tokens.
- Object storage secret keys.

## Production readiness checklist

### Security

- HTTPS enabled.
- CORS allowlist configured.
- Secure cookies enabled.
- Secrets stored in provider secret manager.
- Default seed users removed or passwords changed.
- Rate limiting enabled.

### Database

- Migrations applied.
- Backups enabled.
- Indexes created.
- Connection pooling configured.

### Storage

- Bucket private.
- CORS policy restricted.
- Signed URL flow tested.
- Lifecycle policy reviewed.

### App

- Health endpoint available.
- API logs visible.
- Worker running.
- OCR queue tested.
- Upload tested with production bucket.
- PDF export tested.
- Webhook test delivery succeeds.

## Rollback plan

1. Keep previous container image tag.
2. Deploy previous image if new release fails.
3. Avoid irreversible database migrations without rollback plan.
4. If migration is breaking, create forward-fix migration.
5. Keep object storage unchanged during rollback.

## Recommended hosting options

For Indonesian users, choose an Asia region.

Practical options:

- Railway/Render/Fly.io for early MVP.
- AWS Singapore for production-grade setup.
- GCP Singapore/Jakarta if available for client preference.
- Alibaba Cloud Indonesia/Singapore if client requires it.
- Cloudflare R2 for object storage if egress cost matters.
