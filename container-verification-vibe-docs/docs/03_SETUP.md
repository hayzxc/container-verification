# 03 — Setup Guide

## Prerequisites

Install these locally:

- Node.js 20 LTS
- pnpm 9+
- Docker Desktop
- PostgreSQL client tools
- Git

Optional but recommended:

- Redis CLI
- Prisma Studio
- MinIO client

## Create project

```bash
mkdir container-verification
cd container-verification
pnpm init
```

Create workspace file:

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Create frontend

```bash
mkdir -p apps
cd apps
pnpm create next-app web --ts --eslint --tailwind --src-dir --app --import-alias "@/*"
cd ..
```

Recommended web dependencies:

```bash
cd apps/web
pnpm add axios zustand zod react-hook-form @hookform/resolvers date-fns lucide-react clsx tailwind-merge
pnpm add next-pwa idb
pnpm dlx shadcn@latest init
cd ../..
```

## Create backend

```bash
mkdir -p apps/api/src
cd apps/api
pnpm init
pnpm add express cors helmet morgan dotenv zod bcrypt jsonwebtoken cookie-parser multer sharp exifr @prisma/client bullmq ioredis uuid
pnpm add -D typescript tsx ts-node-dev prisma @types/express @types/cors @types/morgan @types/bcrypt @types/jsonwebtoken @types/cookie-parser @types/multer @types/node
pnpm tsc --init
cd ../..
```

Recommended `apps/api/package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Create shared package

```bash
mkdir -p packages/shared/src
cd packages/shared
pnpm init
pnpm add zod
pnpm add -D typescript
cd ../..
```

Use shared package for:

- Role constants.
- Status constants.
- Zod schemas.
- DTO types.
- API error shape.

## Docker Compose for local development

Create `infra/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15
    container_name: container_verification_postgres
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: container_verification
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: container_verification_redis
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    container_name: container_verification_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

Run:

```bash
cd infra
 docker compose up -d
cd ..
```

## Environment variables

Create `apps/api/.env`:

```env
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

DATABASE_URL=postgresql://app:app@localhost:5432/container_verification
REDIS_URL=redis://localhost:6379

JWT_SECRET=change-me-access-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=change-me-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

S3_BUCKET_NAME=container-photos
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true

OCR_PROVIDER=fake
GOOGLE_CLOUD_VISION_API_KEY=
AWS_TEXTRACT_REGION=ap-southeast-1

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@example.com
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Container Verification
```

## Local ports

| Service | Port |
|---|---:|
| Frontend | 3000 |
| Backend API | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## First run checklist

1. Start Docker services.
2. Run Prisma migration.
3. Seed admin user.
4. Run backend.
5. Run frontend.
6. Login as admin.
7. Create inspector user.
8. Login as inspector.
9. Create inspection.
10. Upload test photos.
11. Confirm admin can verify.

## Seed users

Use these only for local development:

```txt
Admin:
email: admin@example.com
password: Password123!

Inspector:
email: inspector@example.com
password: Password123!

Auditor:
email: auditor@example.com
password: Password123!
```

## Branch naming

```txt
feature/auth-rbac
feature/inspection-wizard
feature/photo-upload
feature/admin-verification
feature/report-export
fix/upload-validation
chore/prisma-migration
```

## Commit format

```txt
feat(auth): add JWT login and refresh flow
feat(inspection): create session endpoint
fix(upload): reject unsupported MIME type
chore(db): add inspection indexes
```
