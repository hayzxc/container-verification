import { z } from "zod";

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  secret: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().optional(),
  secret: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

export const listWebhookQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});
