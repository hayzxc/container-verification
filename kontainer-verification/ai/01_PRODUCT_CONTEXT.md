# 01 Product Context

Kontainer Verification is a web platform for container photo inspection and verification.

Field inspectors use a mobile-first PWA to create inspection sessions, capture required container photos, review OCR results, and submit reports. Admins verify submitted inspections. Auditors search archives and export evidence. The backend stores transactional data in PostgreSQL, image files in private S3-compatible object storage, and slow OCR/CV work in asynchronous queues.

Core roles:

- Admin
- Field Inspector
- Auditor

Core goals:

- Digitize field inspection records.
- Preserve defensible audit trails.
- Validate uploads server-side.
- Keep OCR/CV provider logic isolated and asynchronous.
- Support exports and ERP webhook sync.
