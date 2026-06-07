# 02 — Architecture

## Architecture style

Use a **modular monolith** with an async worker. This gives enough separation for OCR/CV processing while keeping deployment simple.

```txt
User Browser / PWA
        |
        v
Next.js Web App
        |
        v
Express API Gateway / Modular Backend
        |
        |-- Auth Module
        |-- User Module
        |-- Inspection Module
        |-- Photo Module
        |-- OCR/CV Module
        |-- Report Module
        |-- Webhook Module
        |-- Audit Log Module
        |
        |-- PostgreSQL
        |-- Redis Queue
        |-- S3-compatible Object Storage
        |
        v
OCR/CV Worker
        |
        |-- Google Vision / AWS Textract / Tesseract
        |-- Generic Vision API / YOLOv8 / Roboflow
```

## Monorepo structure

```txt
container-verification/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   ├── styles/
│   │   └── public/
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── db/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── inspections/
│       │   │   ├── photos/
│       │   │   ├── ocr/
│       │   │   ├── reports/
│       │   │   ├── webhooks/
│       │   │   └── audit/
│       │   ├── middleware/
│       │   ├── workers/
│       │   ├── utils/
│       │   └── server.ts
│       └── prisma/
├── packages/
│   └── shared/
│       ├── src/types/
│       ├── src/schemas/
│       └── src/constants/
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── deployment/
└── docs/
```

## Runtime components

### Web app

Responsible for user-facing flows:

- Login and session refresh.
- Inspector dashboard.
- New inspection wizard.
- Camera capture and upload queue.
- OCR review UI.
- Admin verification queue.
- Auditor archive.
- Reports and exports.

### API server

Responsible for all protected business operations:

- Auth and role authorization.
- CRUD and query operations.
- File validation orchestration.
- Presigned upload or direct upload handling.
- Queueing OCR/CV jobs.
- Audit logging.
- Report generation.
- Webhook dispatch.

### Worker

Responsible for slow and external operations:

- OCR processing.
- CV damage detection.
- Webhook retry jobs.
- Heavy report generation if needed.

### Database

PostgreSQL stores all transactional and audit data. It must not store binary image files. Store object storage URLs, object keys, metadata, and processing status.

### Object storage

S3-compatible storage stores high-resolution photos. Use private buckets and signed URLs for access.

### Redis

Redis is used for:

- BullMQ job queue.
- Rate limit counters.
- Optional session/token metadata.
- Temporary upload state.

## Request flow: inspection upload

```txt
PWA captures photo
  -> validates client-side size/type preview
  -> sends upload request to API
  -> API validates JWT + role
  -> API validates MIME/type/size/resolution
  -> API uploads to S3/R2 or returns presigned URL flow
  -> API stores photo metadata in DB
  -> API queues OCR/CV job
  -> Worker processes photo
  -> Worker writes OCR/CV result
  -> PWA polls or receives notification
  -> Inspector reviews and submits
```

## Verification flow

```txt
Admin opens verification queue
  -> API returns pending/clarification inspections
  -> Admin opens detail
  -> API returns session, photos, OCR results, audit history
  -> Admin approves/rejects/clarifies
  -> API updates status
  -> API writes audit log
  -> API queues notification/webhook job
```

## Key module boundaries

### Auth module

Owns login, refresh token, logout, password hashing, role claims, and session validity.

### User module

Owns user CRUD and account activation/deactivation.

### Inspection module

Owns inspection sessions, status transitions, search filters, and container history.

### Photo module

Owns upload validation, metadata extraction, storage keys, and photo access URLs.

### OCR/CV module

Owns provider interface and persisted processing results. UI must not depend on a specific provider.

### Report module

Owns PDF and CSV generation.

### Webhook module

Owns webhook endpoint registration, payload signing, delivery, retry, and failure logging.

### Audit module

Owns immutable logs of sensitive actions.

## Status lifecycle

```txt
DRAFT -> PENDING -> APPROVED
                 -> REJECTED
                 -> CLARIFICATION -> PENDING
```

Rules:

- Inspector can create `DRAFT` and submit to `PENDING`.
- Admin can move `PENDING` to `APPROVED`, `REJECTED`, or `CLARIFICATION`.
- Inspector can update a `CLARIFICATION` record and resubmit to `PENDING`.
- Auditor cannot change status.
- Every status change must create an audit log entry.

## Scalability notes

- Keep OCR/CV async.
- Avoid loading original images on list pages; use thumbnails.
- Add indexes for status, container ID, inspector ID, created date, and location.
- Store S3 object keys, not only URLs, so URLs can be regenerated.
- Use pagination for archive and admin queue.
- Use background jobs for batch export.

## Recommended MVP simplification

For the first implementation:

- Use one Express API service.
- Use one worker process in the same codebase.
- Use local MinIO for development.
- Use Cloudflare R2 or AWS S3 for production.
- Start OCR/CV with fake provider that returns deterministic demo data.
- Replace fake provider after the inspection workflow is stable.
