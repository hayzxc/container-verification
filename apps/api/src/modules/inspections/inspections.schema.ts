import { InspectionStatus, InspectionType } from "@prisma/client";
import { containerIdSchema } from "@container-verification/shared";
import { z } from "zod";

export const createInspectionSchema = z.object({
  containerId: containerIdSchema,
  inspectionType: z.nativeEnum(InspectionType),
  locationName: z.string().min(2).max(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(5000).optional()
});

export const updateInspectionSchema = createInspectionSchema.partial();

export const listInspectionsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  containerId: z.string().optional().transform((value) => (value ? value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : undefined)),
  status: z.nativeEnum(InspectionStatus).optional(),
  inspectionType: z.nativeEnum(InspectionType).optional(),
  locationName: z.string().optional(),
  inspectorId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

export const statusUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CLARIFICATION"]),
  comment: z.string().min(1).max(5000).optional()
});
