# Kontainer Verification

Initial scaffold for a container photo inspection and verification platform.

## Purpose

This project will become a mobile-first PWA and API for field inspectors, admins, and auditors to manage container inspection photos, OCR review, visual damage detection, verification, audit history, exports, and ERP webhook sync.

## Workspace

- `apps/web` - Next.js PWA frontend.
- `apps/api` - Express API backend.
- `packages/shared` - Shared TypeScript types, constants, and validators.
- `docs` - Architecture and implementation notes.
- `ai` - AI-agent operating instructions.
- `tests` - API, E2E, and fixture placeholders.
- `infra` - Docker, nginx, and script placeholders.

## Setup Overview

1. Install Node.js 20+ and pnpm.
2. Copy `.env.example` to `.env` and fill local values.
3. Start local infrastructure with Docker Compose.
4. Install dependencies from the repository root.
5. Build incrementally according to `ai/03_TASK_QUEUE.md`.

## Current Status

Scaffold only. No production features are implemented yet.
