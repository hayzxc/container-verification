# 08 — PWA, Offline Queue, and Camera

## PWA requirements

The app must be installable and usable on mobile browsers in field conditions. The inspection submission flow must degrade gracefully under intermittent connectivity.

## Web app manifest

Required fields:

```json
{
  "name": "Container Verification",
  "short_name": "ContainerVerify",
  "start_url": "/inspector",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1A3C5E",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Service worker strategy

Cache:

- App shell.
- Static assets.
- Fonts.
- Icons.
- Recently opened inspection detail pages where safe.

Do not cache:

- Auth tokens.
- Sensitive API responses indefinitely.
- Original high-resolution photos unless they are part of pending offline upload.

## Offline queue design

Use IndexedDB for queued inspections/photos.

### Store names

```txt
inspection_drafts
photo_upload_queue
sync_logs
```

### `inspection_drafts` shape

```ts
type OfflineInspectionDraft = {
  localId: string;
  serverId?: string;
  containerId: string;
  inspectionType: "ARRIVAL" | "DEPARTURE" | "PERIODIC";
  locationName: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  status: "LOCAL_DRAFT" | "SYNCING" | "SYNCED" | "FAILED";
  createdAt: string;
  updatedAt: string;
};
```

### `photo_upload_queue` shape

```ts
type OfflinePhotoQueueItem = {
  localId: string;
  localInspectionId: string;
  serverInspectionId?: string;
  photoAngle: "FRONT" | "BACK" | "LEFT" | "RIGHT" | "INTERIOR" | "SERIAL" | "OTHER";
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  status: "QUEUED" | "UPLOADING" | "UPLOADED" | "FAILED";
  retryCount: number;
  lastError?: string;
  createdAt: string;
};
```

## Sync algorithm

When online:

1. Find local inspection drafts without `serverId`.
2. Create server inspection.
3. Store returned `serverId` locally.
4. Upload queued photos for that inspection.
5. Mark uploaded photos as `UPLOADED`.
6. If all required photos are uploaded, allow submit.
7. If submit was requested while offline, submit after all uploads complete.

## Conflict policy

Use Last-Write-Wins for Phase 1 only on inspector-owned draft data. Admin verification decisions must not be overwritten by offline inspector sync.

Rules:

- If inspection is already `APPROVED` or `REJECTED`, offline updates are rejected.
- If inspection is `CLARIFICATION`, inspector may upload fixes and resubmit.
- If photo upload was duplicated due to retry, server should detect duplicate by local upload ID if provided.

## Camera capture

Use `navigator.mediaDevices.getUserMedia`.

Constraints:

```ts
const constraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  },
  audio: false
};
```

Fallback:

- If camera permission denied, show file input.
- If camera unavailable, show file input.
- If browser unsupported, show file input.

## Capture UX

For field usage:

- Show angle instruction before capture.
- Use full-width camera preview.
- Add guide text: “Pastikan nomor kontainer terlihat jelas.”
- Confirm captured image before upload.
- Allow retake.
- Show upload progress.

## Photo quality checks

Client-side checks should be fast and preliminary. Server remains source of truth.

Client checks:

- File type.
- File size.
- Image dimensions.
- Preview readability.

Server checks:

- MIME sniffing.
- Size limit.
- Resolution.
- Optional blur/darkness detection.
- EXIF extraction.

## Required field indicators

On upload step, show:

```txt
Front      Required — Pending/Uploaded
Back       Required — Pending/Uploaded
Left       Required — Pending/Uploaded
Right      Required — Pending/Uploaded
Interior   Optional — Pending/Uploaded
Serial     Optional — Pending/Uploaded
Other      Optional — Pending/Uploaded
```

## Offline UI states

Show clear banners:

- `Offline mode: photos will be uploaded automatically when connection returns.`
- `Syncing 3 photos...`
- `Sync failed: tap to retry.`
- `All photos synced.`

## Background sync

Use Background Sync API if available. If unavailable, sync when:

- App opens.
- User navigates to inspector dashboard.
- Browser fires `online` event.
- User taps retry.

## PWA acceptance criteria

- App can be installed on Android Chrome.
- Login state recovers through refresh cookie.
- Inspector can create a local draft while offline.
- Photos taken offline are stored in IndexedDB.
- Photos sync automatically when online.
- Duplicate retries do not create broken records.
- User sees clear status for queued/uploading/uploaded/failed photos.
