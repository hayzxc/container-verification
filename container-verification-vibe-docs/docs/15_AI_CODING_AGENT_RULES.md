# 15 — AI Coding Agent Rules

Use this file as an instruction source for Codex, Cursor, Antigravity, or any coding assistant.

## Product source of truth

Build only the container photo inspection and verification platform described in the PRD.

Core features:

- Auth and RBAC for Admin, Inspector, Auditor.
- Mobile-first inspector PWA.
- Inspection session creation.
- Multi-photo upload.
- Photo metadata extraction.
- OCR result review and correction.
- CV damage label display.
- Admin verification queue.
- Auditor archive and export.
- PDF/CSV reports.
- ERP webhook dispatch.
- Audit logs.

Do not add unrelated logistics features such as payment, shipment tracking, route planning, or billing unless explicitly requested.

## Coding style

- Use TypeScript everywhere.
- Keep modules small and explicit.
- Prefer service layer for business logic.
- Keep controllers thin.
- Use Zod for request validation.
- Use Prisma for database access.
- Use centralized API response shape.
- Use centralized error handler.
- Avoid duplicating role-check logic.

## Backend rules

1. Every protected route must use `requireAuth`.
2. Every role-specific route must use `requireRole` or ownership guard.
3. Every mutation must validate input with Zod.
4. Every sensitive mutation must write an audit log.
5. File upload validation must be server-side.
6. OCR/CV must be asynchronous.
7. Do not block upload response while waiting for OCR/CV provider.
8. Do not store image binaries in PostgreSQL.
9. Do not return password hashes.
10. Do not expose stack traces in production responses.

## Frontend rules

1. Build mobile-first.
2. Use role-specific route groups.
3. Every API call must handle loading and error state.
4. Inspector wizard must not lose data on step changes.
5. Required photo checklist must be visible before submit.
6. Offline state must be visible when queue exists.
7. Do not store large image blobs in Zustand.
8. Use IndexedDB for offline photo queue.
9. Use accessible labels and alt text.
10. Do not build dense desktop tables for mobile inspector flow.

## Database rules

1. Use UUID primary keys.
2. Add indexes for frequent filters.
3. Keep audit logs append-only.
4. Do not hard-delete inspection evidence.
5. Store object keys, not only URLs.
6. Normalize container IDs before saving.
7. Use enums for role, status, inspection type, photo angle.

## Security rules

1. Hash passwords using bcrypt with salt rounds ≥ 12.
2. Access token expires in 15 minutes.
3. Refresh token expires in 7 days.
4. Use HTTP-only secure refresh cookie.
5. Restrict CORS to allowed origins.
6. Rate-limit login.
7. Validate MIME using content, not extension only.
8. Use signed URLs for private photos.
9. Redact secrets from logs.
10. Do not commit `.env` files.

## API rules

Use this response shape:

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Use pagination shape:

```ts
type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
```

## Implementation order for coding agents

Follow this order unless the user explicitly changes it:

1. Monorepo setup.
2. Prisma schema.
3. Auth and RBAC.
4. User management.
5. Inspection CRUD.
6. Photo upload pipeline.
7. OCR queue with fake provider.
8. Inspector wizard.
9. Admin verification.
10. Archive search.
11. PDF/CSV export.
12. Webhook dispatch.
13. PWA offline queue.
14. Real OCR/CV integration.
15. Testing and deployment.

## Avoid these mistakes

- Starting with OCR/CV before inspection workflow works.
- Making the app desktop-first.
- Putting base64 images into database.
- Using public buckets without access policy review.
- Letting inspectors see all company records by default.
- Letting auditors mutate records.
- Skipping audit logs for verification.
- Building native mobile app in Phase 1.
- Adding multi-tenant complexity before it is confirmed.
- Hardcoding provider credentials.

## Prompt template for next coding task

```txt
You are working on the Container Verification PWA.
Read these docs first:
- README.md
- 01_PROJECT_CONTEXT.md
- 02_ARCHITECTURE.md
- 15_AI_CODING_AGENT_RULES.md

Task:
[describe exact task]

Constraints:
- Use TypeScript.
- Preserve API response shape.
- Enforce RBAC.
- Add validation with Zod.
- Add audit log for sensitive mutation.
- Do not add unrelated features.

Expected output:
- Files changed.
- Explanation of implementation.
- How to test.
```
