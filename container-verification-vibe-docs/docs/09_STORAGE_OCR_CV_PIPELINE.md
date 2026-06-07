# 09 — Storage, OCR, and Computer Vision Pipeline

## Objective

Photos must be stored reliably, processed asynchronously, and linked to inspection sessions with searchable OCR/CV results.

## Storage principles

- Store original images in private object storage.
- Generate thumbnails for listing pages.
- Store storage keys in database.
- Generate signed URLs only when needed.
- Never store high-resolution image binaries in PostgreSQL.

## Supported input types

| Type | MIME |
|---|---|
| JPEG | image/jpeg |
| PNG | image/png |
| HEIC | image/heic |
| HEIF | image/heif |

## Limits

- Maximum file size: 20 MB per photo.
- Recommended minimum resolution: 1920×1080.
- Required angles: front, back, left, right.
- Maximum photos per session: 10.

## Upload pipeline

```txt
API receives file
  -> MIME sniffing
  -> file size check
  -> image dimension check
  -> optional quality check
  -> EXIF extraction
  -> thumbnail generation
  -> upload original to object storage
  -> upload thumbnail to object storage
  -> create InspectionPhoto
  -> create OcrResult with QUEUED
  -> enqueue OCR/CV job
```

## Metadata extraction

Extract:

- Width.
- Height.
- Resolution string.
- File size.
- MIME type.
- EXIF timestamp.
- Camera/device model.
- GPS latitude/longitude if present.

If EXIF GPS is missing, use browser-provided GPS from the inspection session.

## Image quality validation

Phase 1 minimum:

- Reject too-small images.
- Reject unsupported MIME type.
- Reject files above size limit.

Phase 2 improvement:

- Blur detection using Laplacian variance.
- Darkness detection using brightness histogram.
- OCR readiness score.

## OCR processing flow

```txt
Worker receives photoId
  -> load photo row
  -> generate signed URL
  -> call OCR provider
  -> normalize detected serial
  -> validate ISO 6346-like format
  -> save detected serial, confidence, bounding box
  -> mark COMPLETED or FAILED
```

## OCR normalization

Rules:

- Uppercase all letters.
- Remove spaces and separators.
- Convert common OCR errors only cautiously:
  - `O` vs `0`
  - `I` vs `1`
  - `S` vs `5`
- Keep raw OCR output for debugging if stored under internal metadata.

## ISO 6346-like validator

MVP validator:

```regex
^[A-Z]{4}\d{7}$
```

UI may display as:

```txt
ABCD 123456 7
```

Database stores normalized:

```txt
ABCD1234567
```

## OCR confidence handling

| Confidence | UI treatment |
|---:|---|
| ≥ 0.90 | Show green/high confidence |
| 0.70–0.89 | Show amber/review recommended |
| < 0.70 | Show red/manual confirmation required |
| null | Show “not detected” |

Inspector must always be able to correct OCR output.

## CV damage labels

Damage label shape:

```json
{
  "type": "rust",
  "bbox": [120, 80, 240, 160],
  "confidence": 0.87
}
```

Supported MVP label types:

- rust
- dent
- crack
- hole
- scratch
- other

## Provider strategy

### Phase 1

Use fake OCR/CV provider for end-to-end app development.

### Phase 2

Use Google Cloud Vision or AWS Textract for OCR. Use generic vision API for simple visual labels.

### Phase 3

Use YOLOv8 or Roboflow custom model trained on local container damage datasets.

## Job queue

Use BullMQ queues:

```txt
ocr-processing
webhook-dispatch
report-generation
```

OCR job payload:

```json
{
  "photoId": "uuid",
  "inspectionId": "uuid",
  "attempt": 1
}
```

Job settings:

- Attempts: 3.
- Backoff: exponential.
- Remove completed: keep last 1000.
- Remove failed: keep for diagnosis.

## Failure handling

If OCR fails:

- Mark OCR result `FAILED`.
- Store error message.
- Allow manual serial entry.
- Allow admin to verify if required evidence exists.

If storage upload fails:

- Do not create final photo row unless using staged upload.
- Return clear upload error.
- Offline queue should retry.

## Signed URL policy

- Use short-lived signed URLs for private photos.
- Recommended expiry: 5–15 minutes.
- Generate on demand for detail pages.
- Avoid storing permanent public URLs if compliance matters.

## Thumbnail policy

Generate WebP thumbnail:

- Max width: 480 px.
- Quality: 75–80.
- Used in archive list and verification queue.

## Acceptance criteria

- Upload rejects invalid type and oversized files.
- Upload stores original and thumbnail.
- Metadata is persisted correctly.
- OCR job is queued after upload.
- Worker updates OCR status.
- Inspector can correct OCR result.
- Admin detail page shows photo, metadata, OCR, and damage labels.
