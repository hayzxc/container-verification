# 12 — Testing and QA

## Testing goal

The system must prove that field inspection, photo upload, verification, audit trail, and export flows work reliably before OCR/CV accuracy is optimized.

## Test levels

| Level | Tool | Scope |
|---|---|---|
| Unit | Vitest/Jest | Pure functions, validators, services |
| API integration | Supertest | Express routes + database |
| Frontend component | React Testing Library | Forms, cards, wizard steps |
| E2E | Playwright | Full user flows |
| Load | k6 or Locust | Upload/API performance |
| Manual QA | Checklist | Mobile camera, PWA, offline queue |

## Backend unit tests

Test these pure functions:

- `normalizeContainerId`
- `validateIso6346Like`
- `canTransitionInspectionStatus`
- `buildWebhookSignature`
- `mapUploadError`
- `parseInspectionFilters`

Example test cases for container ID:

| Input | Expected |
|---|---|
| `abcd1234567` | `ABCD1234567` |
| `ABCD-123456-7` | `ABCD1234567` |
| `ABC123` | invalid |
| `1234ABCDEFG` | invalid |

## API integration tests

### Auth

- Login succeeds with valid credentials.
- Login fails with invalid password.
- Inactive user cannot login.
- Refresh returns new access token.
- Logout clears refresh token.

### RBAC

- Inspector cannot access `/users`.
- Auditor cannot create inspection.
- Inspector cannot verify inspection.
- Admin can verify pending inspection.

### Inspection

- Inspector can create draft inspection.
- Inspector can submit only with required photos.
- Admin can change pending to approved.
- Admin comment is required for rejection/clarification.
- Auditor can read inspection detail but cannot mutate.

### Upload

- Accept valid JPEG/PNG.
- Reject unsupported MIME.
- Reject oversized file.
- Reject insufficient resolution.
- Queue OCR job after successful upload.

### Audit

- Creating inspection creates audit log.
- Uploading photo creates audit log.
- Verification creates audit log.
- Export creates audit log.

## Frontend component tests

Test:

- Login form validation.
- Container ID validation.
- Wizard step navigation.
- Required photo checklist.
- OCR correction form.
- Verification action modal.
- Archive filter panel.
- RoleGate access behavior.

## E2E scenarios

### Scenario 1 — Inspector submits inspection

1. Login as inspector.
2. Open dashboard.
3. Start new inspection.
4. Fill container data.
5. Upload four required photos.
6. Wait for OCR processing or fake result.
7. Correct serial if needed.
8. Submit inspection.
9. Verify status is pending.

### Scenario 2 — Admin verifies inspection

1. Login as admin.
2. Open verification queue.
3. Open pending inspection.
4. Review photos and OCR.
5. Approve inspection.
6. Verify status changes to approved.
7. Verify audit log exists.

### Scenario 3 — Auditor exports report

1. Login as auditor.
2. Open archive.
3. Search by container ID.
4. Open detail.
5. Export PDF.
6. Export CSV.

### Scenario 4 — Offline queue

1. Login as inspector while online.
2. Disable network.
3. Create inspection draft.
4. Capture photos.
5. Confirm photos are queued.
6. Enable network.
7. Confirm sync completes.
8. Submit inspection.

## Load testing targets

| Scenario | Target |
|---|---:|
| Non-OCR API p95 response | < 500 ms |
| Photo upload 10 MB over 4G | < 15 seconds |
| OCR processing job | < 10 seconds/photo where provider allows |
| Active inspectors | ≥ 100 concurrent users |
| Parallel uploads | ≥ 50 uploads/minute |
| PWA TTI on 3G | < 3 seconds |

## k6 smoke test ideas

- Login.
- List inspections.
- Create inspection.
- Upload small test image.
- Submit inspection.

Do not use production OCR provider during routine load tests unless costs are approved.

## Manual QA checklist

### Mobile

- Layout works at 375 px width.
- Buttons are easy to tap.
- Camera opens rear camera where available.
- Retake works.
- Upload progress visible.
- Offline banner appears.

### Admin

- Verification queue loads fast.
- Detail page shows all evidence.
- Approve/reject/clarify actions show confirmation.
- Admin comment persists.

### Auditor

- Filters produce correct results.
- PDF includes logo, metadata, photos, OCR, verification status.
- CSV opens correctly in spreadsheet software.

### Accessibility

- Keyboard navigation works.
- Dialog focus trap works.
- Form errors are announced.
- Images have alt text.
- Contrast is readable.

## Release gate

Do not release unless:

- All high-priority API tests pass.
- Inspector submit flow passes E2E.
- Admin verification flow passes E2E.
- Required audit logs are created.
- Upload validation rejects invalid files.
- Production environment variables are configured.
- Admin seed password has been changed.
