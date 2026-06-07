# 10 — UI/UX Design System

## Design direction

The interface should feel operational, reliable, and clear. It is for field work, not decoration-heavy marketing. Prioritize readability, direct actions, and status clarity.

## Design principles

### Mobile-first

Start from 375 px width. Inspector workflows must work comfortably on mobile devices.

### Outdoor legibility

Use large typography, high contrast, clear iconography, and visible status badges.

### Minimal friction

Photo capture to submission should require as few steps as possible. The inspection wizard should guide the user without creating confusion.

### Explicit feedback

Every action needs visible feedback:

- Loading spinner.
- Upload progress.
- Success toast.
- Error message.
- Disabled state when action is unavailable.

## Color tokens

```ts
export const colors = {
  primary: "#1A3C5E",
  accent: "#F0A500",
  approved: "#27AE60",
  rejected: "#E74C3C",
  pending: "#F39C12",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0"
};
```

## Typography

| Token | Size | Use |
|---|---:|---|
| Display | 28 px | Dashboard page title |
| H1 | 24 px | Main page heading |
| H2 | 20 px | Section heading |
| Body | 16 px | Main readable text |
| Caption | 14 px | Supporting text |
| Label | 12 px | Form label, badge |

Fonts:

- Inter preferred.
- Roboto acceptable fallback.

## Breakpoints

| Name | Width |
|---|---:|
| Mobile | < 768 px |
| Tablet | 768–1024 px |
| Desktop | > 1024 px |

## Component standards

### Buttons

Primary button:

- Used for main action.
- Minimum height: 44 px.
- Full width on mobile when action is primary.

Secondary button:

- Used for cancel, back, or non-primary actions.

Danger button:

- Used for reject/delete actions only.

### Status badges

| Status | Label | Color intent |
|---|---|---|
| DRAFT | Draft | Neutral |
| PENDING | Pending | Amber/orange |
| APPROVED | Approved | Green |
| REJECTED | Rejected | Red |
| CLARIFICATION | Needs Clarification | Amber/red emphasis |

### Cards

Inspection card should show:

- Thumbnail.
- Container ID.
- Inspection date.
- Inspector name.
- Location.
- Status badge.
- Quick action if user has permission.

### Forms

Rules:

- Labels always visible.
- Validation messages below fields.
- Required marker for mandatory fields.
- Preserve user input after validation failure.
- Use select/dropdown for enums.

## Inspector page layouts

### Login

Elements:

- Logo/system name.
- Email input.
- Password input.
- Login button.
- Forgot password link.

### Dashboard

Elements:

- Header with user name and logout.
- Optional active location.
- Large CTA: `Mulai Inspeksi Baru`.
- Recent inspections list.
- Bottom navigation.

### New inspection wizard

Progress indicator:

```txt
1 Data Kontainer -> 2 Foto -> 3 Review OCR -> 4 Submit
```

Use sticky bottom navigation:

- Back.
- Next.
- Submit on final step.

## Admin page layouts

Use sidebar on desktop, top/bottom navigation on tablet/mobile.

Sidebar items:

- Overview.
- Verification Queue.
- User Management.
- Reports.
- Settings.

Admin dashboard metric cards:

- Today’s inspections.
- Pending verification.
- Anomalies.
- Active inspectors.

## Auditor page layouts

Archive page:

- Search bar at top.
- Collapsible filter panel.
- List/grid toggle.
- Export buttons.
- Paginated results.

## Accessibility checklist

- All images have alt text.
- Text contrast ratio at least 4.5:1.
- Keyboard navigation works.
- Dialogs trap focus.
- Toasts are announced with accessible live region.
- Icon-only buttons have aria-label.
- Form errors are associated with fields.

## Empty states

Use direct text:

- No inspections yet.
- No pending verification.
- No search results found.
- No uploaded photos yet.

Each empty state should offer one useful next action when applicable.

## Error states

Errors should explain what happened and what the user can do next.

Examples:

```txt
Photo is too small. Use an image with at least 1920×1080 resolution.
Upload failed because connection was lost. The photo has been saved and will retry automatically.
You do not have permission to access this page.
```

## UI acceptance criteria

- Inspector can complete the main flow on a 375 px wide screen.
- Admin verification detail is usable on desktop and tablet.
- Auditor archive filters are clear and collapsible.
- All critical actions have confirmation where needed.
- Status is visible without opening detail page.
