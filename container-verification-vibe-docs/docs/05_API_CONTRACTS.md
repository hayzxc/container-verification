# 05 — API Contracts

## Base URL

```txt
Local:      http://localhost:3001/api
Production: https://api.your-domain.com/api
```

## Standard response shape

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

## Auth

### POST `/auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "user": {
      "id": "uuid",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

Refresh token should be stored as an HTTP-only secure cookie.

### POST `/auth/refresh`

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-access-token"
  }
}
```

### POST `/auth/logout`

Invalidates refresh token cookie/session.

## Users

Admin-only unless stated otherwise.

### GET `/users`

Query params:

| Name | Type | Notes |
|---|---|---|
| page | number | default `1` |
| limit | number | default `20` |
| search | string | name/email search |
| role | enum | ADMIN/INSPECTOR/AUDITOR |
| isActive | boolean | optional |

### POST `/users`

Request:

```json
{
  "fullName": "Field Inspector 1",
  "email": "inspector1@example.com",
  "password": "Password123!",
  "role": "INSPECTOR",
  "phone": "+6281234567890"
}
```

### PATCH `/users/:id`

Request:

```json
{
  "fullName": "Updated Name",
  "role": "AUDITOR",
  "isActive": true
}
```

### DELETE `/users/:id`

Deactivate user by default. Do not physically delete if the user has audit logs or inspections.

## Inspections

### GET `/inspections`

Roles:

- Admin: all records.
- Auditor: all records, read-only.
- Inspector: own records only.

Query params:

| Name | Type | Notes |
|---|---|---|
| page | number | default `1` |
| limit | number | default `20` |
| containerId | string | normalized container ID |
| status | enum | DRAFT/PENDING/APPROVED/REJECTED/CLARIFICATION |
| inspectionType | enum | ARRIVAL/DEPARTURE/PERIODIC |
| locationName | string | partial match |
| inspectorId | uuid | admin/auditor only |
| dateFrom | ISO date | optional |
| dateTo | ISO date | optional |

### POST `/inspections`

Role: Inspector.

Request:

```json
{
  "containerId": "ABCD12345678",
  "inspectionType": "ARRIVAL",
  "locationName": "Depot Surabaya",
  "latitude": -7.2575,
  "longitude": 112.7521,
  "notes": "Initial arrival inspection"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "DRAFT"
  }
}
```

### GET `/inspections/:id`

Returns session detail with photos, OCR results, inspector info, verification info, and audit summary.

### PATCH `/inspections/:id`

Role: Inspector only for own `DRAFT` or `CLARIFICATION` records.

### POST `/inspections/:id/submit`

Role: Inspector.

Rules:

- Required photo angles exist.
- Container ID is valid.
- Session status is `DRAFT` or `CLARIFICATION`.

Status changes to `PENDING`.

### PATCH `/inspections/:id/status`

Role: Admin.

Request:

```json
{
  "status": "APPROVED",
  "comment": "Verified. All required photos complete."
}
```

Allowed statuses:

- `APPROVED`
- `REJECTED`
- `CLARIFICATION`

Side effects:

- Write audit log.
- Queue notification.
- Queue webhook dispatch.

## Photos

### POST `/inspections/:id/photos`

Role: Inspector for own draft/clarification session.

Content type: `multipart/form-data`

Fields:

| Field | Type | Required |
|---|---|---|
| file | file | yes |
| photoAngle | enum | yes |

Validation:

- MIME: `image/jpeg`, `image/png`, `image/heic`, `image/heif`
- Max size: 20 MB
- Minimum resolution: 1920×1080 recommended for production; configurable
- Reject blurry or too dark image if quality validator enabled

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "photoAngle": "FRONT",
    "storageUrl": "signed-or-public-url",
    "width": 1920,
    "height": 1080,
    "ocrStatus": "QUEUED"
  }
}
```

### GET `/inspections/:id/photos`

Returns all photos for the session.

### DELETE `/photos/:photoId`

Role: Inspector for own draft/clarification session, Admin if needed.

## OCR/CV

### GET `/inspections/:id/ocr`

Returns OCR and CV results grouped by photo.

### PATCH `/inspections/:id/ocr/:photoId`

Role: Inspector for own record before final admin approval.

Request:

```json
{
  "confirmedSerial": "ABCD12345678",
  "damageLabels": [
    {
      "type": "rust",
      "bbox": [120, 80, 240, 160],
      "confidence": 0.87
    }
  ]
}
```

## Reports

### GET `/reports/export/pdf`

Roles: Admin, Auditor.

Query params:

| Name | Type |
|---|---|
| inspectionId | uuid |
| dateFrom | ISO date |
| dateTo | ISO date |
| status | enum |

If `inspectionId` exists, generate individual report. Otherwise generate batch report from filters.

### GET `/reports/export/csv`

Roles: Admin, Auditor.

Returns CSV stream.

## Container history

### GET `/containers/:containerId/history`

Returns chronological inspection history for one container.

## Webhooks

### GET `/webhooks`

Admin only.

### POST `/webhooks`

Request:

```json
{
  "name": "ERP Sync",
  "url": "https://erp.example.com/webhooks/container-inspections",
  "secret": "optional-signing-secret",
  "isActive": true
}
```

### Webhook payload: inspection status changed

```json
{
  "event": "inspection.status_changed",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "data": {
    "inspectionId": "uuid",
    "containerId": "ABCD12345678",
    "previousStatus": "PENDING",
    "currentStatus": "APPROVED",
    "verifiedBy": "uuid",
    "verifiedAt": "2026-06-06T10:00:00.000Z"
  }
}
```

## Authorization matrix

| Endpoint group | Admin | Inspector | Auditor |
|---|---:|---:|---:|
| Auth | yes | yes | yes |
| User management | yes | no | no |
| Create inspection | no | yes | no |
| Upload photo | no | own only | no |
| Submit inspection | no | own only | no |
| Verify inspection | yes | no | no |
| Archive search | yes | own only | yes |
| PDF/CSV export | yes | no | yes |
| Webhook config | yes | no | no |
