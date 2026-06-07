# 02 Build Rules

## Stack Decisions

- Language: TypeScript everywhere.
- Frontend: Next.js PWA.
- Backend: Node.js with Express.
- Database: PostgreSQL with Prisma.
- Queue: Redis-backed worker queue.
- Storage: S3-compatible private object storage.
- Validation: Zod.
- Authentication: JWT access token plus rotating refresh token.
- Authorization: RBAC and ownership guards.

## Coding Standards

- Keep modules small and explicit.
- Use service functions for business logic.
- Keep controllers thin.
- Use named exports.
- Validate every mutation.
- Use centralized API response and error shapes.
- Never return password hashes.
- Prefer placeholders until the task queue reaches that feature.

## Security Standards

- Protected routes require authentication.
- Role-specific routes require RBAC.
- Sensitive mutations write audit logs.
- Uploads are validated server-side.
- OCR/CV processing runs outside the request lifecycle.
