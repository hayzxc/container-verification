import { containerIdSchema } from "@container-verification/shared";
import { z } from "zod";

export const updateOcrSchema = z.object({
  confirmedSerial: containerIdSchema,
  damageLabels: z
    .array(
      z.object({
        type: z.enum(["rust", "dent", "crack", "hole", "other"]),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
        confidence: z.number().min(0).max(1)
      })
    )
    .optional()
});
