# 11 — Security, RBAC, and Audit

## Security baseline

This application stores operational evidence, user data, photo metadata, GPS data, and audit logs. Treat all API routes as protected by default unless explicitly public.

## Required controls

- HTTPS in production.
- Password hashing with bcrypt, salt rounds ≥ 12.
- JWT access token expiry: 15 minutes.
- Refresh token expiry: 7 days.
- Refresh token rotation.
- HTTP-only secure refresh cookie.
- Server-side validation on every request.
- CORS allowlist.
- Rate limit login endpoint.
- MIME sniffing for uploads.
- Private object storage bucket.
- Audit logs for sensitive actions.

## Public endpoints

Only these should be public:

```txt
POST /api/auth/login
POST /api/auth/refresh
GET  /api/health
```

All other endpoints require authentication.

## Role permissions

### Admin

Can:

- Manage users.
- View all inspections.
- Verify inspections.
- Export reports.
- Configure webhooks.
- View system summary.

Cannot:

- Bypass audit logging.
- Mutate approved inspection evidence without explicit future amendment feature.

### Inspector

Can:

- Create inspections.
- Upload photos to own draft/clarification inspection.
- Correct own OCR result before final approval.
- View own inspection history.

Cannot:

- Verify inspections.
- View other inspectors’ records unless future policy allows.
- Export global reports.
- Manage users.

### Auditor

Can:

- View all inspection archives.
- Export audit reports.

Cannot:

- Create or edit inspections.
- Upload photos.
- Verify or reject inspections.
- Manage users.

## Endpoint RBAC matrix

| Endpoint | Admin | Inspector | Auditor |
|---|---:|---:|---:|
| `GET /users` | yes | no | no |
| `POST /users` | yes | no | no |
| `GET /inspections` | all | own | all |
| `POST /inspections` | no | yes | no |
| `PATCH /inspections/:id` | restricted | own draft/clarification | no |
| `POST /inspections/:id/photos` | no | own draft/clarification | no |
| `POST /inspections/:id/submit` | no | own draft/clarification | no |
| `PATCH /inspections/:id/status` | yes | no | no |
| `GET /reports/export/pdf` | yes | no | yes |
| `GET /reports/export/csv` | yes | no | yes |
| `POST /webhooks` | yes | no | no |

## Audit log events

Log these events:

- User login success.
- User login failure after threshold.
- User logout.
- User created.
- User role changed.
- User deactivated.
- Inspection created.
- Inspection submitted.
- Photo uploaded.
- Photo deleted.
- OCR result corrected.
- Inspection approved.
- Inspection rejected.
- Clarification requested.
- PDF exported.
- CSV exported.
- Webhook endpoint created/updated.
- Webhook delivery attempted.

## Audit log payload

```json
{
  "userId": "uuid",
  "action": "VERIFY",
  "entityType": "inspection_session",
  "entityId": "uuid",
  "sessionId": "uuid",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0",
  "metadata": {
    "previousStatus": "PENDING",
    "nextStatus": "APPROVED"
  }
}
```

## File upload security

Do:

- Validate MIME using file content, not only extension.
- Restrict file size.
- Restrict image dimensions.
- Store files outside app server.
- Generate randomized object keys.
- Strip or control public access.
- Use signed URLs for private access.

Do not:

- Trust original filename.
- Serve uploads directly from Express static folder.
- Store executable file types.
- Put permanent public URLs in audit reports if access control matters.

## Rate limits

Suggested defaults:

| Endpoint | Limit |
|---|---:|
| `/auth/login` | 5 attempts/minute/IP |
| `/auth/refresh` | 30 requests/minute/user |
| photo upload | 60 requests/minute/user |
| export PDF | 10 requests/hour/user |
| webhook create/update | 20 requests/hour/admin |

## Data minimization

Store only necessary GPS/device data for audit and operational evidence. Avoid collecting unrelated personal data.

## Webhook security

- Store webhook secret encrypted if possible.
- Sign payloads with HMAC SHA-256.
- Include timestamp header.
- Retry with exponential backoff.
- Disable endpoint after repeated failures only with admin visibility.

Suggested headers:

```txt
X-Webhook-Event: inspection.status_changed
X-Webhook-Timestamp: 2026-06-06T10:00:00.000Z
X-Webhook-Signature: sha256=<signature>
```

## Production checklist

- `NODE_ENV=production`.
- HTTPS enabled.
- CORS origin restricted.
- Secure cookies enabled.
- Default seed passwords removed.
- Database backups enabled.
- Object storage bucket private.
- Error tracking enabled.
- Audit log table indexed.
- Admin accounts reviewed.
