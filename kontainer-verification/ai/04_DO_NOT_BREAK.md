# 04 Do Not Break

Strict rules:

- Do not remove RBAC.
- Do not skip audit logs.
- Do not store uploaded photos permanently on the app server.
- Do not process OCR synchronously in the request lifecycle.
- Do not expose private object storage files publicly without signed access.
