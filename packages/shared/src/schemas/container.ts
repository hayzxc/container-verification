import { z } from "zod";

export const normalizedContainerIdRegex = /^[A-Z]{4}\d{7}$/;

export function normalizeContainerId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export const containerIdSchema = z
  .string()
  .min(1)
  .transform(normalizeContainerId)
  .refine((value) => normalizedContainerIdRegex.test(value), {
    message: "Container ID must match ISO 6346-like format, e.g. ABCD1234567"
  });
