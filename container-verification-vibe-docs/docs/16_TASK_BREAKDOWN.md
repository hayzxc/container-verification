# 16 — Task Breakdown

## Epic 1 — Project foundation

### TASK-001 Create monorepo

Acceptance criteria:

- `apps/web` exists.
- `apps/api` exists.
- `packages/shared` exists.
- `pnpm-workspace.yaml` configured.
- Root scripts for dev/build/lint/test exist.

### TASK-002 Add local infrastructure

Acceptance criteria:

- Docker Compose starts PostgreSQL, Redis, and MinIO.
- `.env.example` exists for web and API.
- API can connect to PostgreSQL.

## Epic 2 — Auth and RBAC

### TASK-003 Implement Prisma user schema

Acceptance criteria:

- User model exists.
- UserRole enum exists.
- Migration runs.
- Seed creates Admin, Inspector, Auditor.

### TASK-004 Implement login and refresh

Acceptance criteria:

- Valid user can login.
- Invalid credentials return 401.
- Inactive user cannot login.
- Refresh token cookie is HTTP-only.
- Access token expires in 15 minutes.

### TASK-005 Implement RBAC middleware

Acceptance criteria:

- Admin-only route blocks Inspector and Auditor.
- Authenticated route blocks anonymous user.
- Ownership guard supports inspector-owned records.

## Epic 3 — Inspection sessions

### TASK-006 Create inspection session API

Acceptance criteria:

- Inspector can create draft inspection.
- Container ID is normalized.
- Invalid container ID is rejected.
- Audit log is written.

### TASK-007 List and detail inspections

Acceptance criteria:

- Admin sees all.
- Auditor sees all read-only.
- Inspector sees own only.
- Filters work for status, container ID, date, location.

### TASK-008 Implement status transition guard

Acceptance criteria:

- Inspector can submit draft to pending.
- Admin can approve/reject/clarify pending.
- Invalid transitions are rejected.
- Status change writes audit log.

## Epic 4 — Photo upload

### TASK-009 Implement upload endpoint

Acceptance criteria:

- Accept JPEG/PNG/HEIC/HEIF.
- Reject unsupported MIME.
- Reject file > 20 MB.
- Reject below configured resolution.
- Persist photo metadata.

### TASK-010 Implement object storage service

Acceptance criteria:

- Original photo uploaded to S3-compatible storage.
- Thumbnail uploaded.
- Storage key stored in DB.
- Signed URL can be generated.

### TASK-011 Build frontend upload UI

Acceptance criteria:

- Four required angle slots shown.
- Optional slots supported.
- Thumbnail preview works.
- Upload progress visible.
- Errors visible.

## Epic 5 — OCR/CV

### TASK-012 Configure OCR queue

Acceptance criteria:

- Upload creates OCR result with `QUEUED`.
- Worker receives job.
- Fake provider returns deterministic result.
- OCR result updates to `COMPLETED`.

### TASK-013 Build OCR review UI

Acceptance criteria:

- Detected serial shown.
- Confidence shown.
- Inspector can edit confirmed serial.
- Correction writes audit log.

### TASK-014 Add CV damage labels

Acceptance criteria:

- Damage labels stored as JSON.
- UI displays label type and confidence.
- Bounding box rendering is supported when coordinates exist.

## Epic 6 — Admin verification

### TASK-015 Build admin dashboard

Acceptance criteria:

- Shows metric cards.
- Shows pending verification queue.
- Links to detail page.

### TASK-016 Build verification detail

Acceptance criteria:

- Photos displayed.
- Metadata displayed.
- OCR/CV results displayed.
- Inspector notes displayed.
- Approve/reject/clarify actions available.

### TASK-017 Implement verification API

Acceptance criteria:

- Admin can approve.
- Admin can reject with comment.
- Admin can request clarification with comment.
- Webhook event queued.
- Audit log written.

## Epic 7 — Auditor archive and reports

### TASK-018 Build archive search

Acceptance criteria:

- Search by container ID.
- Filter by date, status, location, inspector.
- Pagination works.
- List/grid switch works.

### TASK-019 Implement PDF export

Acceptance criteria:

- Individual inspection PDF generated.
- PDF includes photos, metadata, OCR/CV, status, verifier.
- Export action audited.

### TASK-020 Implement CSV export

Acceptance criteria:

- CSV downloads from filters.
- CSV contains inspection metadata and status.
- Export action audited.

## Epic 8 — Webhook

### TASK-021 Create webhook config API

Acceptance criteria:

- Admin can create endpoint.
- Admin can disable endpoint.
- Secret can be stored.

### TASK-022 Implement webhook dispatcher

Acceptance criteria:

- Status change queues delivery.
- Payload matches contract.
- Retry with exponential backoff.
- Delivery result persisted.

## Epic 9 — PWA and offline

### TASK-023 Add PWA manifest and service worker

Acceptance criteria:

- App installable.
- Static shell cached.
- Theme color configured.

### TASK-024 Implement IndexedDB offline queue

Acceptance criteria:

- Draft can be saved locally.
- Photo blob can be queued locally.
- Queue syncs when online.
- Failed sync can retry.

### TASK-025 Build offline UI

Acceptance criteria:

- Offline banner visible.
- Queue count visible.
- Sync progress visible.
- Failure message visible.

## Epic 10 — QA and deployment

### TASK-026 Add E2E tests

Acceptance criteria:

- Inspector submit flow tested.
- Admin verify flow tested.
- Auditor export flow tested.

### TASK-027 Add load test script

Acceptance criteria:

- Tests non-OCR API latency.
- Tests upload endpoint.
- Reports p95 latency.

### TASK-028 Production deployment

Acceptance criteria:

- Web deployed.
- API deployed.
- Worker deployed.
- Database migration applied.
- Object storage configured.
- Health check passing.

## Priority order

MVP critical:

1. TASK-001 to TASK-013
2. TASK-015 to TASK-019
3. TASK-026 to TASK-028

Post-MVP:

- Real OCR provider.
- CV model improvement.
- Offline queue hardening.
- Push notifications.
- Advanced monitoring dashboard.
