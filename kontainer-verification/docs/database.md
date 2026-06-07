# Database

PostgreSQL is the transactional database. Prisma owns schema definition and migrations.

## Implemented Baseline

- UUID primary keys.
- Role enum: `ADMIN`, `INSPECTOR`, `AUDITOR`.
- Inspection status lifecycle: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CLARIFICATION`.
- Evidence tables store object storage keys and metadata, not photo binaries.
- OCR and CV results are separate async processing records.
- Webhook endpoints and delivery attempts are persisted.
- Audit logs are append-only application records.
- Seed creates one Admin, Inspector, and Auditor for local development.

## TODO

- Generate and commit the first Prisma migration after local PostgreSQL is running.
- Add migration review notes for production rollout.
- Add retention policy for photos, audit logs, and webhook delivery records.
- Add database integration tests after auth and inspection services exist.
