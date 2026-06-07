# 06 — Backend Guide

## Backend goals

The backend must be secure, predictable, and audit-friendly. Every mutation must pass validation, role checks, and audit logging where relevant.

## Backend stack

- Node.js 20 LTS
- Express.js
- TypeScript
- Prisma
- PostgreSQL
- Redis + BullMQ
- Multer for multipart upload
- Sharp for image metadata/resize
- exifr for EXIF metadata
- JWT + refresh token
- Zod for validation

## Folder structure

```txt
apps/api/src/
├── config/
│   ├── env.ts
│   ├── cors.ts
│   └── storage.ts
├── db/
│   └── prisma.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── error.middleware.ts
│   ├── validate.middleware.ts
│   └── rate-limit.middleware.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── inspections/
│   ├── photos/
│   ├── ocr/
│   ├── reports/
│   ├── webhooks/
│   └── audit/
├── workers/
│   ├── queues.ts
│   ├── ocr.worker.ts
│   └── webhook.worker.ts
├── utils/
│   ├── api-response.ts
│   ├── async-handler.ts
│   ├── normalize-container-id.ts
│   └── iso6346.ts
└── server.ts
```

## Module pattern

Each module should contain:

```txt
module-name/
├── module-name.routes.ts
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.schema.ts
└── module-name.types.ts
```

Use controllers only for HTTP concerns. Put business logic in services.

## Server bootstrap

`server.ts` should:

1. Load env.
2. Create Express app.
3. Apply security middleware.
4. Apply JSON and cookie parser.
5. Register routes under `/api`.
6. Register 404 handler.
7. Register error handler.
8. Start server.

## Auth implementation

### Password

- Hash passwords with bcrypt.
- Salt rounds minimum: 12.
- Never return password hash from API.

### Access token

Payload:

```json
{
  "sub": "user-id",
  "role": "ADMIN",
  "email": "admin@example.com"
}
```

Expiry: 15 minutes.

### Refresh token

- Store as HTTP-only secure cookie.
- Expiry: 7 days.
- Use token rotation.
- Invalidate on logout.

## RBAC middleware

Example usage:

```ts
router.get(
  "/users",
  requireAuth,
  requireRole("ADMIN"),
  userController.list
);
```

Support ownership checks separately:

```ts
requireOwnershipOrRole({
  role: "ADMIN",
  getOwnerId: async (req) => inspectionService.getInspectorId(req.params.id),
});
```

## Validation

Use Zod for:

- Body validation.
- Query params.
- Route params.
- File metadata.

Never trust frontend validation.

## Upload pipeline

Recommended flow:

1. Multer receives file into memory or temp path.
2. Validate MIME type from file buffer.
3. Validate size.
4. Use Sharp to read width/height.
5. Validate minimum resolution.
6. Extract EXIF metadata.
7. Generate storage key.
8. Upload original to object storage.
9. Generate thumbnail.
10. Save photo row.
11. Create OCR row with `QUEUED`.
12. Add OCR job to BullMQ.

## Storage key format

```txt
inspections/{inspectionId}/{photoAngle}/{timestamp}-{uuid}.{ext}
thumbnails/{inspectionId}/{photoId}.webp
```

## OCR provider interface

```ts
export interface OcrProvider {
  extractContainerSerial(input: {
    storageKey: string;
    signedUrl: string;
  }): Promise<{
    detectedSerial: string | null;
    confidenceScore: number | null;
    boundingBox?: unknown;
    raw?: unknown;
  }>;
}
```

Start with `FakeOcrProvider`, then implement:

- `GoogleVisionOcrProvider`
- `AwsTextractOcrProvider`
- `TesseractOcrProvider`

## CV provider interface

```ts
export interface DamageDetectionProvider {
  detectDamage(input: {
    storageKey: string;
    signedUrl: string;
  }): Promise<Array<{
    type: "rust" | "dent" | "crack" | "hole" | "other";
    bbox: [number, number, number, number];
    confidence: number;
  }>>;
}
```

## Audit logging

Use one centralized audit service:

```ts
auditService.log({
  userId: req.user.id,
  action: "VERIFY",
  entityType: "inspection_session",
  entityId: inspection.id,
  sessionId: inspection.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  metadata: { previousStatus, nextStatus },
});
```

Do not let audit logging failure silently hide critical business operation failure. Log the system error and decide per operation whether to abort.

## Status transition guard

Create a pure function:

```ts
canTransitionInspectionStatus({
  actorRole,
  currentStatus,
  nextStatus,
})
```

Use it in service layer, not only in controller.

## Error handling

Use typed app errors:

```ts
throw new AppError("FORBIDDEN", "You cannot access this inspection", 403);
```

Common error codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `UPLOAD_INVALID_TYPE`
- `UPLOAD_TOO_LARGE`
- `OCR_FAILED`
- `INTERNAL_ERROR`

## Pagination

Use standard shape:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Backend MVP order

1. Environment loader and server health check.
2. Prisma schema and migration.
3. Seed users.
4. Auth endpoints.
5. RBAC middleware.
6. User management.
7. Inspection CRUD.
8. Photo upload.
9. OCR queue with fake provider.
10. Admin verification.
11. Archive search.
12. PDF/CSV export.
13. Webhook dispatch.
14. Real OCR provider.
15. CV provider.
