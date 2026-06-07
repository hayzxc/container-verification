# PRD: Sistem Web Verifikasi Foto Kontainer

> **Version:** 1.0.0 | **Status:** Ready for Development | **Target:** Full-stack Web App

---

## CONTEXT FOR CODEX

You are building a **container photo inspection and verification web platform** for logistics field operations. Field inspectors submit photos of physical containers; the system uses OCR + Computer Vision to extract serial numbers and detect damage, then stores everything for audit and monitoring.

**Tech stack preference:** Node.js + Express backend, React/Next.js frontend, PostgreSQL, S3-compatible object storage.

---

## 1. GOALS

### Business Goals
- Digitize end-to-end container physical inspection workflow (field → archive)
- Reduce manual recording errors by ≥ 90% vs. current paper/manual process
- Cut container verification & audit time from 2–3 days to < 2 hours
- Provide a legally defensible, comprehensive audit trail
- Enable data sync to existing ERP systems via webhook

### Product Goals
- SPA/PWA accessible on mobile browser by field inspectors under poor connectivity
- OCR auto-extraction of ISO 6346 container serial numbers at ≥ 95% accuracy
- Visual inventory management searchable by container ID, date range, status, location
- Export audit reports as PDF and CSV
- Webhook API for ERP synchronization on status change

### KPIs
| Metric | Target |
|---|---|
| OCR accuracy (ISO 6346 serial) | ≥ 95% |
| Photo upload + verification time | < 30s/photo |
| System uptime | ≥ 99.5% |
| API response time (p95) | < 500ms |
| Reduction in manual process | ≥ 80% |
| PWA Time-to-Interactive (3G) | < 3 seconds |

---

## 2. SCOPE

### In-Scope
- Role-Based Access Control (Admin, Field Inspector, Auditor)
- Photo upload module: resolution validation, auto metadata extraction (GPS, timestamp, device)
- OCR service: ISO 6346 serial number extraction from photos
- Computer Vision: damage detection and area labeling on container surface
- Visual inventory archive: multi-parameter search
- Real-time monitoring dashboard for Admin and Auditor
- Audit report generator: PDF and CSV export
- Webhook API for ERP sync
- PWA interface supporting intermittent connectivity and offline photo queue
- S3-compatible object storage for high-resolution photos

### Out-of-Scope (Phase 1)
- Native mobile app (iOS/Android) — PWA covers this
- Direct CCTV/IoT hardware integration
- End-to-end logistics management (routing, shipment tracking)
- Payment or billing module
- Multi-language beyond Bahasa Indonesia + English
- ERP-specific integrations beyond standard webhook

### Development Timeline
| Phase | Scope | Duration | Weight |
|---|---|---|---|
| 1 — Analysis & Design | Data schema modeling, API specs, infrastructure architecture | 2 weeks | 15% |
| 2 — Backend Engineering | API construction, auth layer, OCR integration, storage logic | 3 weeks | 35% |
| 3 — Frontend Engineering | UI components, state management, API integration | 3 weeks | 30% |
| 4 — Comprehensive Testing | Integration tests, parallel upload load test, OCR accuracy validation | 1 week | 10% |
| 5 — Deployment & Handover | CI/CD pipeline, production migration, repo handover | 1 week | 10% |

**Total: 10 weeks**

---

## 3. USER ROLES

### Admin
- Full CRUD on user accounts (create, edit, delete, assign role, reset password)
- Configure system parameters: photo validation standards, OCR threshold, notifications
- Access all inspection data across all locations and periods
- Export global audit reports and manage ERP webhooks
- Monitor system health via admin dashboard

### Field Inspector
- Login via PWA on mobile or browser
- Create new inspection sessions (container ID, location, inspection type)
- Upload photos (up to 10 per session: front, back, left, right, interior, serial close-up)
- Review and confirm/correct OCR-extracted serial numbers
- Mark damage areas from CV detection results
- Submit inspection report for verification

### Auditor
- Read-only access to all inspection archives
- Search and filter by container ID, date range, verification status, location, inspector
- View photos, metadata, and OCR results per inspection session
- Export audit reports as PDF or CSV

---

## 4. USER FLOWS

### Flow A — Field Inspector (Inspection Submission)
```
1. Open PWA → Login with credentials
2. System validates JWT → redirect to Inspector Dashboard
3. Create new inspection session:
   - Fill form: container ID (manual input or QR scan), location (GPS auto or manual), inspection type
4. Capture/upload photos:
   - Minimum 4 angles required: front, back, left, right
   - Optional: interior, serial number close-up
5. System validates photo: min resolution, file format, max size
6. System auto-extracts metadata: GPS geotag, EXIF timestamp, device model
7. System sends photos to OCR + CV service (async):
   - Returns detected serial number with bounding box overlay
   - Returns damage labels with confidence scores
8. Inspector reviews OCR result:
   - Confirm or correct serial number
   - Confirm or adjust damage labels
9. Inspector adds optional notes → Submit report
10. System saves to DB + photos to object storage → sends notification to Admin/Auditor
11. Inspector receives success confirmation
```

### Flow B — Admin (Verification)
```
1. Admin logs in → opens Admin Dashboard (summary + anomaly alerts)
2. Selects pending inspection from verification queue
3. Reviews: photos, metadata, OCR results, inspector notes
4. Sets verification status: Approved / Rejected / Needs Clarification
5. If rejected/clarification: adds comment → system notifies relevant inspector
6. Admin exports reports or configures ERP webhook
```

### Flow C — Auditor (Review & Export)
```
1. Auditor logs in → opens Inspection Archive page
2. Uses filters: container ID, date range, status, location, inspector name
3. Selects inspection record → views detail (photos, metadata, analysis results)
4. Exports audit report as PDF or CSV
```

---

## 5. FEATURES

### Module 1 — Authentication & Access Management
| ID | Feature | Description | Priority |
|---|---|---|---|
| F-01 | Login & Logout | Email + password auth with JWT, session management, auto-logout on idle | High |
| F-02 | RBAC | Differentiated access for Admin, Inspector, Auditor — UI and API endpoint guards | High |
| F-03 | User Management | CRUD user accounts, assign/change role, reset password, deactivate account | High |
| F-04 | User Profile | Edit own profile: name, phone, profile picture | Medium |

### Module 2 — Photo Upload & Ingestion
| ID | Feature | Description | Priority |
|---|---|---|---|
| F-05 | Multi-photo Upload | Upload up to 10 photos per session. Supports JPEG, PNG, HEIC. Max 20MB/photo | High |
| F-06 | Auto Photo Validation | Server-side check: min resolution (1080p), valid format, detect blurry/too dark photos | High |
| F-07 | Auto Metadata Extraction | Extract GPS geotag, EXIF timestamp, camera/device model from uploaded photo | High |
| F-08 | In-App Camera (PWA) | Direct camera access via WebRTC/MediaDevices API for real-time photo capture | Medium |
| F-09 | Offline Queue Mode | Photos taken offline stored in IndexedDB, auto-uploaded when connection restores | Medium |

### Module 3 — OCR & Computer Vision
| ID | Feature | Description | Priority |
|---|---|---|---|
| F-10 | Container Serial OCR | Auto-extract ISO 6346 serial number from photos. Target accuracy ≥ 95% | High |
| F-11 | OCR Confirm & Correct UI | Inspector reviews OCR result with bounding box highlight on photo; editable field | High |
| F-12 | Visual Damage Detection | CV model detects and labels damage areas (rust, dent, crack, hole) on container surface | High |
| F-13 | Confidence Score Display | Each OCR result and damage label shows a confidence score (0.0–1.0) | Medium |

### Module 4 — Visual Inventory Management
| ID | Feature | Description | Priority |
|---|---|---|---|
| F-14 | Multi-parameter Search | Search archive by container ID, date range, verification status, location, inspector name | High |
| F-15 | Structured Photo Gallery | Display photos per inspection session in gallery layout with thumbnail, zoom, navigation | High |
| F-16 | Container History Timeline | Show chronological history of all inspections for a single container ID | Medium |
| F-17 | Filter & Sort | Filter by status (Pending/Approved/Rejected), sort by date, location, or inspector | Medium |

### Module 5 — Dashboard & Reports
| ID | Feature | Description | Priority |
|---|---|---|---|
| F-18 | Real-time Admin Dashboard | Summary cards: today's inspections, pending count, anomaly count; trend charts | High |
| F-19 | PDF Export | Generate individual or batch inspection report PDFs with logo, metadata, photos, analysis | High |
| F-20 | CSV Export | Export inspection dataset as CSV for further analysis in Excel or BI tools | High |
| F-21 | In-app & Email Notifications | Real-time notifications for: new inspection submitted, verification complete, anomaly detected | Medium |
| F-22 | ERP Webhook | Auto POST JSON payload to external ERP endpoint on every inspection status change | Medium |

---

## 6. UI/UX REQUIREMENTS

### Design Principles
- **Mobile-first:** UI optimized for 375px+ screens; usable one-handed in field conditions
- **Outdoor legibility:** Large typography, high contrast, intuitive icons for direct sunlight conditions
- **Minimal friction:** Photo capture to submission in ≤ 5 taps
- **Responsive feedback:** Every action has visual feedback (loading states, toast notifications, upload progress bar)
- **PWA-ready:** Installable to homescreen, service worker for static asset caching, push notification support

### Page Layouts

#### Login Page
- Simple form: email + password fields
- "Forgot Password" link with email reset flow
- Logo and system name at top

#### Inspector Dashboard
- Header: username, active location, logout button
- Large CTA button: "Mulai Inspeksi Baru" (most prominent element)
- Recent inspections list (own only) with status badges: Pending | Approved | Rejected | Needs Clarification
- Bottom navigation: Home | New Inspection | Archive | Profile

#### New Inspection — 4-step wizard
- **Step 1 — Container Data:** Container ID input (text + QR scan option), inspection type dropdown (arrival/departure/periodic), location (GPS auto-detect or manual select)
- **Step 2 — Upload Photos:** 4 required angle placeholders + "Add Photo" optional button; live thumbnail preview after each capture
- **Step 3 — OCR Review:** Photo with overlay highlight on detected serial number + damage areas; confirm or edit OCR result
- **Step 4 — Notes & Submit:** Optional notes field, prominent "Submit Report" button, confirmation modal before final submit

#### Admin Dashboard
- Sidebar: Overview | Verification Queue | User Management | Reports | Settings
- Main panel: metric summary cards, daily/weekly trend charts, pending inspection table with quick-action buttons
- Inspection detail: photo slideshow, metadata table, OCR results, Approve/Reject/Clarify action buttons

#### Archive & Search Page
- Prominent search bar at top
- Collapsible filter panel: Date, Status, Location, Inspector
- Results in list or grid view (user-switchable)
- Each result card shows: first photo thumbnail, container ID, inspection date, inspector name, status badge

### Design System
| Element | Specification |
|---|---|
| Primary Font | Inter or Roboto (Google Fonts) |
| Base Font Size | 16px body, 14px caption, 12px label |
| Primary Color | `#1A3C5E` (Navy) — header, main CTA |
| Accent Color | `#F0A500` (Amber) — alerts, highlights |
| Status: Approved | `#27AE60` (Green) |
| Status: Rejected | `#E74C3C` (Red) |
| Status: Pending | `#F39C12` (Orange) |
| Breakpoints | Mobile < 768px · Tablet 768–1024px · Desktop > 1024px |

### Accessibility
- All images have descriptive `alt` attributes
- Text contrast meets WCAG 2.1 Level AA (minimum ratio 4.5:1)
- Full keyboard navigation for all interactive elements
- Screen reader support for form elements and status notifications

---

## 7. DATABASE SCHEMA

### Storage Architecture
- **PostgreSQL 15+** — transactional data (users, sessions, metadata, OCR results, audit logs)
- **S3-compatible Object Storage** (AWS S3 / MinIO / Cloudflare R2) — high-res photo files; DB stores reference URLs only
- **Redis** — session token cache, rate limiting, job queue

### Table: `users`
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin', 'inspector', 'auditor') NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  last_login_at   TIMESTAMP
);
```

### Table: `inspection_sessions`
```sql
CREATE TABLE inspection_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id    VARCHAR(20) NOT NULL,          -- ISO 6346 format
  inspector_id    UUID REFERENCES users(id),
  inspection_type ENUM('arrival', 'departure', 'periodic') NOT NULL,
  location_name   VARCHAR(255) NOT NULL,
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  status          ENUM('pending', 'approved', 'rejected', 'clarification') DEFAULT 'pending',
  notes           TEXT,
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### Table: `inspection_photos`
```sql
CREATE TABLE inspection_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES inspection_sessions(id) ON DELETE CASCADE,
  storage_url     TEXT NOT NULL,                 -- presigned S3/object storage URL
  photo_angle     ENUM('front','back','left','right','interior','serial','other') NOT NULL,
  file_size_kb    INTEGER NOT NULL,
  resolution      VARCHAR(20),                   -- e.g. "1920x1080"
  exif_timestamp  TIMESTAMP,
  device_info     VARCHAR(255),
  uploaded_at     TIMESTAMP DEFAULT NOW()
);
```

### Table: `ocr_results`
```sql
CREATE TABLE ocr_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id          UUID REFERENCES inspection_photos(id) ON DELETE CASCADE,
  detected_serial   VARCHAR(20),                 -- raw OCR output
  confirmed_serial  VARCHAR(20),                 -- after inspector review/correction
  confidence_score  FLOAT,                       -- 0.0 to 1.0
  damage_labels     JSONB,                       -- [{ "type": "rust", "bbox": [...], "confidence": 0.87 }]
  is_corrected      BOOLEAN DEFAULT FALSE,       -- true if inspector edited OCR result
  processed_at      TIMESTAMP NOT NULL
);
```

### Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,            -- CREATE | UPDATE | DELETE | EXPORT | LOGIN | VERIFY
  entity_type  VARCHAR(50) NOT NULL,             -- inspection_session | user | photo | etc.
  entity_id    UUID,
  ip_address   INET,
  timestamp    TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
-- Frequent query patterns
CREATE INDEX idx_sessions_container_id    ON inspection_sessions(container_id);
CREATE INDEX idx_sessions_status          ON inspection_sessions(status);
CREATE INDEX idx_sessions_inspector       ON inspection_sessions(inspector_id);
CREATE INDEX idx_sessions_created_at      ON inspection_sessions(created_at DESC);
CREATE INDEX idx_photos_session           ON inspection_photos(session_id);
CREATE INDEX idx_ocr_photo                ON ocr_results(photo_id);
CREATE INDEX idx_audit_user_timestamp     ON audit_logs(user_id, timestamp DESC);
```

---

## 8. TECHNICAL REQUIREMENTS

### 8.1 Frontend Stack
| Component | Technology | Notes |
|---|---|---|
| Framework | React.js + Next.js | SPA with optional SSR for initial load performance |
| State Management | Zustand or Redux Toolkit | Global state: auth, active inspection session |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system |
| PWA | Workbox (Service Worker) + Web App Manifest + IndexedDB | Offline caching + photo queue |
| HTTP Client | Axios | REST API communication |
| Camera | MediaDevices API (`getUserMedia`) | In-browser photo capture |
| Testing | Jest + React Testing Library | Unit + integration tests |

### 8.2 Backend Stack
| Component | Technology | Notes |
|---|---|---|
| Runtime | Node.js 20 LTS | LTS for stability |
| Framework | Express.js (or Fastify) | Modular monolith, RESTful API |
| Authentication | JWT (access 15min) + Refresh Token (7 days) | Rotation on refresh |
| Authorization | RBAC middleware | Role-checked on every protected route |
| File Upload | Multer | Server-side: MIME type check, size limit, resolution validation |
| OCR Service | Google Cloud Vision API or AWS Textract | Dedicated microservice or async worker |
| Computer Vision | YOLOv8 (custom) or Google Vision API | Damage detection, label classification |
| PDF Generator | Puppeteer or PDFKit | Audit report rendering |
| Job Queue | Bull + Redis | Non-blocking OCR/CV processing |
| Webhook | Custom HTTP POST dispatcher | Exponential backoff retry logic |
| API Docs | Swagger / OpenAPI 3.0 | Auto-generated from code annotations |

### 8.3 Infrastructure & DevOps
| Component | Technology | Notes |
|---|---|---|
| Cloud | AWS / GCP / Alibaba Cloud (Asia region) | Low latency for Indonesia users |
| Containers | Docker + Docker Compose | Dev/staging/prod consistency |
| Orchestration | Kubernetes (EKS/GKE) or Docker Swarm | Auto-scaling, high availability |
| CI/CD | GitHub Actions | Auto test → build → deploy to staging → production |
| Reverse Proxy | Nginx + Cloudflare CDN | SSL termination, static caching, DDoS protection |
| Monitoring | Prometheus + Grafana | Uptime, API latency, error rate, resource usage |
| Logging | Winston + ELK Stack | Centralized logs for debugging and audit |
| Error Tracking | Sentry | Real-time errors with stack traces |

### 8.4 Security Requirements
- HTTPS mandatory for all client–server communication (TLS 1.2+)
- Passwords hashed with bcrypt (salt factor ≥ 12)
- JWT short expiry (15 min access) + refresh token rotation
- Input sanitization and server-side validation (prevent SQL injection, XSS)
- File uploads: validate MIME type (not just extension); store in isolated object storage, never on app server
- Rate limiting on `/auth/login`: max 5 attempts/minute/IP
- CORS: allowlist registered origins only
- All sensitive actions logged to `audit_logs` (user, action, IP, timestamp)

### 8.5 Performance Targets
| Scenario | Target |
|---|---|
| API response time (p95, non-OCR) | < 500ms |
| Photo upload (10MB on 4G) | < 15 seconds |
| OCR processing per photo | < 10 seconds (async via queue) |
| Concurrent active inspectors | ≥ 100 users without degradation |
| Concurrent parallel uploads | ≥ 50 uploads/minute |
| PWA Time-to-Interactive (3G) | < 3 seconds (Lighthouse score ≥ 85) |

### 8.6 API Structure (RESTful Conventions)
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/users                          # Admin only
POST   /api/users                          # Admin only
PUT    /api/users/:id                      # Admin only
DELETE /api/users/:id                      # Admin only

GET    /api/inspections                    # Filtered list
POST   /api/inspections                    # Create session
GET    /api/inspections/:id                # Session detail
PATCH  /api/inspections/:id/status         # Admin: approve/reject/clarify

POST   /api/inspections/:id/photos         # Upload photo to session
GET    /api/inspections/:id/photos         # List photos in session

GET    /api/inspections/:id/ocr            # Get OCR results
PATCH  /api/inspections/:id/ocr/:photoId   # Inspector correction

GET    /api/reports/export/pdf             # Generate PDF report
GET    /api/reports/export/csv             # Export CSV

GET    /api/containers/:containerId/history # Full inspection history

POST   /api/webhooks                       # Admin: register webhook endpoint
```

---

## 9. ASSUMPTIONS & RISKS

### Assumptions
- Field inspectors have smartphones with min 8MP camera and at least 3G connectivity
- Container serial numbers follow ISO 6346 standard (4-char owner code + 6-digit serial + 1 check digit)
- Client provides ERP API/webhook endpoint credentials if ERP sync is required
- Sufficient labeled photo dataset is available for Computer Vision damage model training

### Risk Register
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Low OCR accuracy on poor quality / dark photos | Medium | High | Add photo capture guidelines; implement image pre-processing (contrast, sharpening) before OCR |
| Unstable field connectivity causes upload failures | High | Medium | Implement offline queue (IndexedDB) + auto-retry with exponential backoff |
| Storage scalability as photo volume scales | Medium | Medium | Use elastic object storage (S3/R2) with lifecycle archiving policy |
| CV model undertrained for local container damage types | Medium | High | Phase 1: use generic Vision API; iterate custom model from production data |
| Scope creep from mid-development feature requests | High | Medium | Formal adendum process with time/cost estimate before starting any new work |

### Open Questions (Resolve Before Sprint 1)
1. What is the minimum acceptable photo resolution as the inspection quality standard?
2. Does the existing ERP have documented webhook/API, or does it need analysis first?
3. Is a labeled container photo dataset available for CV model training?
4. Single-tenant (one company) or multi-tenant (multiple depots/companies)?
5. Preferred cloud provider: on-premise, AWS, GCP, or Alibaba Cloud?

---

## 10. CODEX IMPLEMENTATION NOTES

### Suggested Project Structure
```
/
├── apps/
│   ├── web/                    # Next.js frontend (PWA)
│   │   ├── app/                # App router pages
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   └── lib/                # API client, utils
│   └── api/                    # Express.js backend
│       ├── routes/             # Route handlers per module
│       ├── middleware/         # Auth, RBAC, validation, rate limit
│       ├── services/           # Business logic (OCR, CV, storage, webhook)
│       ├── workers/            # Bull job processors
│       └── db/                 # Prisma schema + migrations
├── packages/
│   └── shared/                 # Shared types, constants, validators
├── infra/
│   ├── docker-compose.yml
│   └── k8s/
└── .github/workflows/          # CI/CD pipelines
```

### Key Implementation Priorities (Build in this order)
1. **Auth system** — JWT login, RBAC middleware, user CRUD
2. **Database schema** — Run Prisma migrations for all 5 core tables
3. **Photo upload pipeline** — Multer → validation → S3 upload → metadata extraction
4. **OCR integration** — Async Bull job → Vision API → store result in `ocr_results`
5. **Inspector PWA UI** — 4-step inspection wizard, camera capture, OCR review
6. **Admin dashboard** — Verification queue, approve/reject flow, audit log
7. **Search & archive** — Multi-parameter search with indexed queries
8. **Report export** — PDF (Puppeteer) and CSV generation
9. **Webhook dispatcher** — Status change trigger → HTTP POST with retry
10. **CV damage detection** — Integrate after OCR is stable

### Environment Variables Required
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/kontainer_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Object Storage
S3_BUCKET_NAME=kontainer-photos
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_ENDPOINT=https://s3.amazonaws.com   # or MinIO endpoint

# OCR / Vision
GOOGLE_CLOUD_VISION_API_KEY=your_api_key
# OR
AWS_TEXTRACT_REGION=ap-southeast-1

# Redis (job queue + cache)
REDIS_URL=redis://localhost:6379

# Email (notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
```

---

## GLOSSARY

| Term | Definition |
|---|---|
| ISO 6346 | International standard for container ID numbering. Format: 4-char owner code + 6-digit serial + 1 check digit |
| OCR | Optical Character Recognition — auto-extraction of text from images |
| Computer Vision | AI that interprets visual content; used here for damage area detection |
| PWA | Progressive Web App — web app installable to homescreen with offline support |
| RBAC | Role-Based Access Control — permissions assigned by user role |
| JWT | JSON Web Token — stateless authentication token |
| ERP | Enterprise Resource Planning — integrated business management software |
| Webhook | Auto HTTP POST to external URL triggered by an internal event |
| Object Storage | Blob storage system (S3-compatible) for scalable large file storage |
| Geotag / GPS | Geographic coordinates (lat/lng) embedded in photo EXIF metadata |
| EXIF | Exchangeable Image File Format — photo metadata standard (camera, timestamp, GPS) |
| Audit Trail | Chronological record of all system actions for accountability and compliance |

---

*PRD v1.0.0 — Sistem Web Verifikasi Foto Kontainer — Juni 2026*
