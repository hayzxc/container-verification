import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>,
  status = 200
) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}
