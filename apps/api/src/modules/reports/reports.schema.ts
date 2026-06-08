import { InspectionStatus } from "@prisma/client";
import { z } from "zod";

export const exportQuerySchema = z.object({
  inspectionId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.nativeEnum(InspectionStatus).optional()
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;
