# 01 — Project Context

## Product name

Sistem Web Verifikasi Foto Kontainer / Container Inspection & Monitoring Web Platform.

## Problem

Container photo inspection is often handled manually with inconsistent records, weak audit trails, and slow verification. Field inspectors need a fast mobile workflow. Admins need centralized review. Auditors need searchable historical evidence with exportable reports.

## Product objective

Create a web-based PWA that allows inspectors to submit container inspection photos, verifies container serials through OCR, identifies visual damage, stores photo evidence, and supports admin/auditor workflows for verification, monitoring, and reporting.

## Business goals

- Digitize field-to-archive inspection workflow.
- Reduce manual recording errors by at least 90%.
- Reduce verification and audit time from 2–3 days to under 2 hours.
- Maintain a legally defensible audit trail.
- Support ERP synchronization through webhook.

## Product goals

- Mobile-first SPA/PWA for poor connectivity field usage.
- OCR extraction for ISO 6346 container serial numbers with target accuracy of at least 95%.
- Searchable visual inventory by container ID, date, status, location, and inspector.
- PDF and CSV export.
- Standard webhook payload on inspection status changes.

## User roles

### Admin

Admin manages users, system settings, verification, reporting, webhooks, and system monitoring.

Key permissions:

- Create, update, deactivate, and delete users.
- Assign roles.
- View all inspection data.
- Approve, reject, or request clarification for inspections.
- Export reports.
- Configure webhook endpoints.

### Field Inspector

Field Inspector performs inspections from mobile browser or PWA.

Key permissions:

- Create inspection sessions.
- Upload/capture photos.
- Confirm or correct OCR results.
- Review damage labels.
- Submit reports.
- View their own submitted inspections.

### Auditor

Auditor has read-only access to archives and exports.

Key permissions:

- View all inspection records.
- Search/filter archives.
- Export PDF/CSV reports.
- Cannot mutate inspection data.

## Main workflow

1. Inspector logs in.
2. Inspector creates inspection session.
3. Inspector enters or scans container ID.
4. Inspector captures required photos: front, back, left, right.
5. Optional photos: interior, serial close-up, other.
6. System validates file type, size, resolution, and quality.
7. System extracts metadata: GPS, timestamp, device info.
8. System stores photos in object storage.
9. System queues OCR/CV processing.
10. Inspector confirms or corrects OCR result.
11. Inspector submits report.
12. Admin reviews and verifies.
13. Auditor searches and exports records.

## Phase 1 scope

Included:

- RBAC with Admin, Inspector, Auditor.
- Auth with JWT access/refresh tokens.
- Photo upload and metadata extraction.
- OCR and CV service integration or stubbed worker.
- Inspection archive and search.
- Admin dashboard and verification queue.
- PDF/CSV export.
- ERP webhook dispatch.
- PWA with offline queue.
- Object storage.

Excluded:

- Native mobile app.
- CCTV or IoT integration.
- Payment/billing.
- Full logistics/shipment routing.
- ERP-specific custom integration beyond generic webhook.
- Languages beyond Bahasa Indonesia and English.

## Success metrics

| Metric | Target |
|---|---:|
| OCR accuracy | ≥ 95% |
| Upload + verification time | < 30 seconds/photo |
| Uptime | ≥ 99.5% |
| Non-OCR API p95 latency | < 500 ms |
| Manual process reduction | ≥ 80% |
| PWA Time-to-Interactive on 3G | < 3 seconds |

## Build stance

Prefer a modular monolith first. Do not start with microservices unless scaling pressure appears. OCR/CV should be isolated behind service interfaces so it can later move to workers or separate services without breaking API contracts.
