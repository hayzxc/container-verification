# Container Verification App — Vibe Coding Documentation Pack

This folder contains implementation-ready Markdown documents for building the **Sistem Web Verifikasi Foto Kontainer** as a full-stack PWA.

The docs are designed for AI-assisted coding in tools such as Codex, Cursor, Antigravity, or any IDE agent. Use them as the project source of truth together with the original PRD.

## Recommended reading order

1. `01_PROJECT_CONTEXT.md`
2. `02_ARCHITECTURE.md`
3. `03_SETUP.md`
4. `04_DATABASE_SCHEMA.md`
5. `05_API_CONTRACTS.md`
6. `06_BACKEND_GUIDE.md`
7. `07_FRONTEND_GUIDE.md`
8. `08_PWA_OFFLINE_CAMERA.md`
9. `09_STORAGE_OCR_CV_PIPELINE.md`
10. `10_UI_UX_DESIGN_SYSTEM.md`
11. `11_SECURITY_RBAC_AUDIT.md`
12. `12_TESTING_QA.md`
13. `13_DEPLOYMENT_DEVOPS.md`
14. `14_SPRINT_WORKFLOW.md`
15. `15_AI_CODING_AGENT_RULES.md`
16. `16_TASK_BREAKDOWN.md`

## Core product summary

Build a mobile-first PWA for field inspectors to capture/upload container photos, validate image quality, extract metadata, run OCR for ISO 6346 container serial numbers, detect damage using Computer Vision, and submit inspection records for admin verification and audit export.

## Target stack

- Frontend: Next.js + React + TypeScript + TailwindCSS + shadcn/ui
- Backend: Node.js 20 + Express.js + TypeScript
- Database: PostgreSQL 15+
- ORM: Prisma
- Queue: Redis + BullMQ
- Object storage: S3-compatible storage, preferably Cloudflare R2 or AWS S3
- PDF: Puppeteer or PDFKit
- OCR: Google Cloud Vision, AWS Textract, or Tesseract as fallback
- CV: Google Vision API first, YOLOv8 or Roboflow later

## MVP principle

Do not build all AI/ML parts first. Build the inspection workflow, storage, auditability, and verification flow first. OCR/CV can start as an async stub, then be replaced with a real provider.

MVP build order:

1. Auth + RBAC
2. Database schema
3. Inspection CRUD
4. Photo upload to object storage
5. Inspector 4-step wizard
6. Admin verification queue
7. Search and archive
8. PDF/CSV export
9. Async OCR worker
10. CV damage detection

## Definition of done

A feature is done only when:

- API route exists and is role-protected.
- Data is persisted with the correct relational model.
- UI handles loading, empty, success, and error states.
- Sensitive action is written to `audit_logs`.
- Tests cover the happy path and at least one failure path.
- The implementation does not break mobile layout.
