# AGENTS.md — Sistem Verifikasi Foto Kontainer
# Master Codex Orchestration File

> Load this file first in every Codex session.
> It tells the AI which doc to read for which task.

---

## WHO YOU ARE

You are a senior full-stack engineer building a **container photo inspection & verification platform** for Indonesian logistics field operations.

- **Monorepo structure:** `apps/web` (Next.js PWA) + `apps/api` (Express.js)
- **Language:** TypeScript everywhere, strict mode
- **Style:** functional, no classes except where framework requires, named exports only
- **Comments:** in English, concise, only explain *why* not *what*

---

## DOCUMENT MAP — READ BEFORE CODING

| When you need to... | Read this file |
|---|---|
| Understand full product context & goals | `PRD_Verifikasi_Kontainer_Codex.md` |
| Build any frontend page or component | `FRONTEND_SPEC.md` |
| Build any backend route, service, middleware | `BACKEND_SPEC.md` |
| Implement or consume any API endpoint | `API_CONTRACT.md` |
| Write or modify database schema | `DATABASE.md` |
| Write any test (unit, integration, e2e) | `TESTING.md` |
| Set up infra, Docker, CI/CD, env vars | `INFRA_DEVOPS.md` |

**Rule:** Never write code for a layer without reading its spec doc first.

---

## PROJECT STRUCTURE

```
/
├── apps/
│   ├── web/                        # Next.js 14 (App Router) + PWA
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (inspector)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── inspections/
│   │   │   │   │   ├── new/        # 4-step wizard
│   │   │   │   │   └── [id]/
│   │   │   │   └── archive/
│   │   │   └── (admin)/
│   │   │       ├── dashboard/
│   │   │       ├── queue/
│   │   │       ├── users/
│   │   │       └── reports/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui base components
│   │   │   ├── inspection/         # domain: inspection wizard steps
│   │   │   ├── photo/              # domain: upload, gallery, OCR overlay
│   │   │   ├── dashboard/          # domain: charts, metric cards
│   │   │   └── shared/             # layout, nav, modals, toasts
│   │   ├── hooks/
│   │   ├── stores/                 # Zustand slices
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance + interceptors
│   │   │   ├── auth.ts             # token helpers
│   │   │   └── offline.ts          # IndexedDB queue helpers
│   │   ├── public/
│   │   │   └── manifest.json       # PWA manifest
│   │   └── next.config.js
│   │
│   └── api/                        # Express.js + TypeScript
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── users.routes.ts
│       │   │   ├── inspections.routes.ts
│       │   │   ├── photos.routes.ts
│       │   │   ├── ocr.routes.ts
│       │   │   ├── reports.routes.ts
│       │   │   └── webhooks.routes.ts
│       │   ├── middleware/
│       │   │   ├── authenticate.ts  # JWT verify
│       │   │   ├── authorize.ts     # RBAC role guard
│       │   │   ├── validate.ts      # Zod schema validator
│       │   │   ├── rateLimiter.ts
│       │   │   └── errorHandler.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── inspection.service.ts
│       │   │   ├── photo.service.ts
│       │   │   ├── ocr.service.ts
│       │   │   ├── cv.service.ts
│       │   │   ├── storage.service.ts
│       │   │   ├── report.service.ts
│       │   │   ├── notification.service.ts
│       │   │   └── webhook.service.ts
│       │   ├── workers/
│       │   │   ├── ocr.worker.ts
│       │   │   └── webhook.worker.ts
│       │   ├── db/
│       │   │   ├── prisma/
│       │   │   │   └── schema.prisma
│       │   │   └── migrations/
│       │   ├── utils/
│       │   └── app.ts
│       └── tsconfig.json
│
├── packages/
│   └── shared/
│       ├── types/                  # Shared TS interfaces
│       ├── constants/              # Enums, magic values
│       └── validators/             # Zod schemas shared by FE+BE
│
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   └── k8s/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── AGENTS.md                       # ← YOU ARE HERE
├── PRD_Verifikasi_Kontainer_Codex.md
├── FRONTEND_SPEC.md
├── BACKEND_SPEC.md
├── API_CONTRACT.md
├── DATABASE.md
├── TESTING.md
└── INFRA_DEVOPS.md
```

---

## CODING CONVENTIONS

### TypeScript
```ts
// ✅ Good — named export, typed, functional
export const getInspectionById = async (id: string): Promise<Inspection> => { ... }

// ❌ Bad — default export, untyped, class-based
export default class InspectionService { ... }
```

### File Naming
```
components/   PascalCase.tsx         InspectionCard.tsx
hooks/        camelCase with use     useInspectionQueue.ts
services/     camelCase.service.ts   ocr.service.ts
routes/       camelCase.routes.ts    inspections.routes.ts
stores/       camelCase.store.ts     auth.store.ts
utils/        camelCase.util.ts      date.util.ts
types/        PascalCase.types.ts    Inspection.types.ts
```

### Error Handling
```ts
// Backend: always use AppError class, never throw raw Error
throw new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND')

// Frontend: always handle loading + error states in components
const { data, isLoading, error } = useInspection(id)
if (isLoading) return <Skeleton />
if (error) return <ErrorBanner message={error.message} />
```

### API Response Shape
```ts
// Success
{ success: true, data: T, meta?: PaginationMeta }

// Error
{ success: false, error: { code: string, message: string, details?: unknown } }
```

---

## FEATURE FLAG SYSTEM

Use this to gate incomplete features without breaking main:

```ts
// packages/shared/constants/flags.ts
export const FEATURE_FLAGS = {
  CV_DAMAGE_DETECTION: process.env.NEXT_PUBLIC_FLAG_CV === 'true',
  OFFLINE_QUEUE:       process.env.NEXT_PUBLIC_FLAG_OFFLINE === 'true',
  ERP_WEBHOOK:         process.env.FLAG_ERP_WEBHOOK === 'true',
} as const
```

---

## GIT WORKFLOW

```
main          → production-ready, protected
staging       → pre-production, auto-deployed to staging env
dev           → integration branch
feature/*     → individual features, PR into dev
fix/*         → bug fixes
```

### Commit Message Format
```
feat(module): short description
fix(auth): handle expired refresh token edge case
chore(db): add index on inspection_sessions.container_id
test(ocr): add unit tests for confidence score parsing
docs: update API_CONTRACT with new /reports endpoint
```

---

## ENVIRONMENT QUICK REFERENCE

```bash
# Start full local stack
docker-compose up -d

# Run API dev server
cd apps/api && pnpm dev

# Run Web dev server
cd apps/web && pnpm dev

# Run all tests
pnpm test

# Run DB migrations
cd apps/api && pnpm prisma migrate dev

# Seed development data
cd apps/api && pnpm prisma db seed
```

---

## CURRENT BUILD ORDER (follow this sequence)

- [x] Repo scaffold + monorepo config
- [ ] 1. `DATABASE.md` → Prisma schema + migrations
- [ ] 2. `BACKEND_SPEC.md` → Auth module (JWT + RBAC)
- [ ] 3. `BACKEND_SPEC.md` → Photo upload pipeline
- [ ] 4. `BACKEND_SPEC.md` → OCR worker + service
- [ ] 5. `FRONTEND_SPEC.md` → Auth pages + layout shells
- [ ] 6. `FRONTEND_SPEC.md` → Inspector 4-step wizard
- [ ] 7. `FRONTEND_SPEC.md` → Admin dashboard + queue
- [ ] 8. `BACKEND_SPEC.md` → Report export (PDF/CSV)
- [ ] 9. `BACKEND_SPEC.md` → Webhook dispatcher
- [ ] 10. `FRONTEND_SPEC.md` → Auditor archive + search
- [ ] 11. `TESTING.md` → Full test suite
- [ ] 12. `INFRA_DEVOPS.md` → Docker + CI/CD + deploy

---

*AGENTS.md v1.0.0 — update this file when architecture decisions change*
