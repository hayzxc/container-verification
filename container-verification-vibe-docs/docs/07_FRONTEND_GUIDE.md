# 07 — Frontend Guide

## Frontend goals

The frontend must be mobile-first, fast under poor connectivity, clear in outdoor use, and simple for field inspectors. Admin and auditor views can be desktop-optimized but must remain responsive.

## Frontend stack

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- React Hook Form
- Zod
- Axios
- idb for IndexedDB
- next-pwa or custom service worker

## Folder structure

```txt
apps/web/src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (inspector)/inspector/page.tsx
│   ├── (inspector)/inspector/inspections/new/page.tsx
│   ├── (admin)/admin/page.tsx
│   ├── (admin)/admin/verification/page.tsx
│   ├── (auditor)/archive/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   └── feedback/
├── features/
│   ├── auth/
│   ├── inspections/
│   ├── photos/
│   ├── ocr-review/
│   ├── admin-dashboard/
│   └── archive/
├── hooks/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   ├── cn.ts
│   └── validators.ts
├── stores/
│   ├── auth.store.ts
│   └── inspection-draft.store.ts
└── styles/
```

## Route groups

Use route groups to separate role layouts:

```txt
(auth)      public auth pages
(inspector) inspector-only mobile-first pages
(admin)     admin dashboard pages
(auditor)   archive and export pages
```

## Auth flow

1. User submits email/password.
2. API returns access token and user.
3. Store access token in memory/Zustand.
4. Refresh token is HTTP-only cookie.
5. Axios interceptor attaches `Authorization: Bearer <token>`.
6. On 401, call `/auth/refresh` once.
7. If refresh fails, redirect to login.

## Role-based routing

Create `RoleGate` component:

```tsx
<RoleGate allow={["ADMIN"]}>
  <AdminDashboard />
</RoleGate>
```

Rules:

- Admin cannot access inspector-only submission UI unless explicitly needed.
- Inspector cannot access admin or auditor pages.
- Auditor cannot access mutation pages.

## Inspector dashboard

Must show:

- User name.
- Active location if available.
- Big CTA: `Mulai Inspeksi Baru`.
- Recent inspections owned by the inspector.
- Status badges: Pending, Approved, Rejected, Needs Clarification.
- Bottom nav: Home, New Inspection, Archive, Profile.

## New inspection wizard

Use a four-step flow.

### Step 1 — Container Data

Fields:

- Container ID.
- Inspection type: Arrival, Departure, Periodic.
- Location name.
- GPS latitude/longitude if permission granted.
- Notes optional.

UX:

- Normalize container ID automatically.
- Show validation error immediately.
- Allow manual location if GPS fails.

### Step 2 — Upload Photos

Required placeholders:

- Front.
- Back.
- Left.
- Right.

Optional placeholders:

- Interior.
- Serial close-up.
- Other.

UX:

- Large capture buttons.
- Thumbnail preview.
- Upload progress per photo.
- Offline queue indicator.
- Clear error if photo too small, too large, unsupported, or blurry.

### Step 3 — OCR Review

Display:

- Photo preview.
- OCR detected serial.
- Confidence score.
- Editable confirmed serial field.
- Damage labels if available.
- Bounding box overlay when available.

UX:

- If OCR is not complete, show processing state.
- Allow manual correction.
- Warn when confidence is below threshold.

### Step 4 — Notes & Submit

Display:

- Session summary.
- Required photo checklist.
- Confirmed serial.
- Notes field.
- Submit button.
- Confirmation modal.

## Admin dashboard

Must show:

- Total inspections today.
- Pending verification count.
- Anomaly count.
- Recent upload activity.
- Verification queue table.
- Quick action buttons.

Verification detail must show:

- Photo slideshow/grid.
- Metadata table.
- OCR and CV result.
- Inspector notes.
- Audit history summary.
- Buttons: Approve, Reject, Clarification.
- Admin comment field.

## Auditor archive

Must show:

- Search bar.
- Collapsible filters.
- List/grid switch.
- Result cards.
- Export PDF/CSV buttons.

Filters:

- Container ID.
- Date range.
- Status.
- Location.
- Inspector.

## State management

Use Zustand for:

- Auth user and token.
- Active inspection draft.
- Offline upload queue state.

Do not store large image blobs in Zustand for long periods. Store blobs in IndexedDB for offline queue.

## API client

Centralize API calls under `lib/api-client.ts` and feature services:

```txt
features/auth/auth.api.ts
features/inspections/inspection.api.ts
features/photos/photo.api.ts
features/reports/report.api.ts
```

## UI states checklist

Every page/component must handle:

- Loading.
- Empty state.
- Success state.
- Error state.
- Permission denied.
- Offline state where relevant.

## Mobile-first rules

- Base design starts at 375 px width.
- Tap targets should be at least 44 px high.
- Avoid dense tables on mobile; use cards.
- Use sticky bottom actions in inspector flow.
- Compress text but do not hide critical status.

## Frontend MVP order

1. App shell and auth pages.
2. Role-based layouts.
3. Inspector dashboard.
4. New inspection wizard step 1.
5. Photo capture/upload step.
6. OCR review step.
7. Submit summary step.
8. Admin verification queue.
9. Admin verification detail.
10. Archive search.
11. Export actions.
12. Offline queue.
13. Push/in-app notifications.
