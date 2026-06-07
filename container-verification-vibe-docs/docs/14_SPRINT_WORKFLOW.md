# 14 — Sprint Workflow

## Project duration

The PRD estimates 10 weeks. This workflow converts it into implementation sprints.

## Sprint 0 — Project foundation

Duration: 2–3 days.

Goals:

- Create monorepo.
- Configure frontend, backend, shared package.
- Configure Docker Compose.
- Add lint/typecheck/build scripts.
- Add base CI workflow.

Deliverables:

- Project runs locally.
- Health endpoint works.
- Frontend landing/login shell exists.
- PostgreSQL, Redis, MinIO run locally.

## Sprint 1 — Auth, RBAC, and database

Duration: 1 week.

Goals:

- Implement Prisma schema.
- Implement migrations.
- Seed admin/inspector/auditor.
- Build login/refresh/logout.
- Build RBAC middleware.
- Build user management API.

Deliverables:

- Admin can create users.
- Login works by role.
- Protected routes reject unauthorized users.
- Audit log captures login and user management actions.

## Sprint 2 — Inspection core

Duration: 1 week.

Goals:

- Create inspection session API.
- Implement inspection search/list/detail.
- Implement status lifecycle guard.
- Build inspector dashboard.
- Build inspection wizard step 1.

Deliverables:

- Inspector can create draft inspection.
- Inspector can view own records.
- Admin/auditor can view all records.
- Status transition rules are tested.

## Sprint 3 — Photo upload pipeline

Duration: 1 week.

Goals:

- Implement upload endpoint.
- Validate image type, size, and resolution.
- Extract EXIF metadata.
- Upload original and thumbnail to object storage.
- Build photo capture/upload UI.

Deliverables:

- Inspector can upload required photos.
- Photo metadata persists.
- Thumbnails display in UI.
- Invalid files are rejected.

## Sprint 4 — OCR queue and review UI

Duration: 1 week.

Goals:

- Configure BullMQ.
- Implement fake OCR provider.
- Implement OCR worker.
- Build OCR review UI.
- Allow inspector correction.

Deliverables:

- Upload queues OCR job.
- OCR status updates.
- Inspector can confirm/correct serial.
- Low-confidence OCR is visible.

## Sprint 5 — Admin verification

Duration: 1 week.

Goals:

- Build admin dashboard.
- Build verification queue.
- Build inspection detail page.
- Implement approve/reject/clarification API.
- Add admin comments.

Deliverables:

- Admin can verify pending inspections.
- Inspector can see clarification/rejection status.
- Webhook event is queued on status change.
- Audit logs capture verification decisions.

## Sprint 6 — Archive, reports, and webhook

Duration: 1 week.

Goals:

- Build archive search/filter UI.
- Implement container history endpoint.
- Implement PDF export.
- Implement CSV export.
- Implement webhook endpoint management and dispatch.

Deliverables:

- Auditor can search archive.
- Auditor/admin can export PDF and CSV.
- Webhook delivery retry works.
- Export actions are audited.

## Sprint 7 — PWA and offline support

Duration: 1 week.

Goals:

- Add manifest and service worker.
- Add IndexedDB offline queue.
- Add online/offline UI banners.
- Add sync retry logic.
- Test mobile installability.

Deliverables:

- PWA installable.
- Inspector can create local draft while offline.
- Photos queue offline and sync later.
- Duplicate upload risk is controlled.

## Sprint 8 — Real OCR/CV provider integration

Duration: 1 week.

Goals:

- Replace fake OCR provider with chosen provider.
- Add provider configuration.
- Add CV damage label provider or stub.
- Improve OCR normalization.
- Add confidence UI.

Deliverables:

- Real OCR works on test photos.
- OCR failure falls back to manual input.
- Damage labels display where available.
- Provider costs and failures are observable.

## Sprint 9 — QA, hardening, and deployment

Duration: 1 week.

Goals:

- E2E tests for main flows.
- Load test upload and list endpoints.
- Security review.
- Production deployment.
- Monitoring and backup setup.

Deliverables:

- Production app deployed.
- Health checks pass.
- Backup configured.
- Admin seed password changed.
- Client handover package prepared.

## Weekly ceremony

Each sprint should have:

- Planning: define exact scope.
- Daily check: blockers and progress.
- Demo: show working feature.
- Retrospective: document what to fix next.

## Definition of ready

A task is ready when:

- Purpose is clear.
- Inputs/outputs are defined.
- API contract or UI acceptance criteria exist.
- Role permissions are known.
- Data model impact is known.

## Definition of done

A task is done when:

- Code is implemented.
- Typecheck passes.
- Tests pass.
- Role access is enforced.
- Errors are handled.
- Audit log exists if mutation is sensitive.
- UI handles loading/empty/error states.
- Documentation is updated if contract changed.
