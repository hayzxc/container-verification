import { AuditAction, InspectionStatus, UserRole, type Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { auditService } from "../audit/audit.service.js";

async function getInspectionForOcr(inspectionId: string) {
  const inspection = await prisma.inspectionSession.findUnique({
    where: { id: inspectionId },
    include: { photos: { include: { ocrResult: true } } }
  });
  if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
  return inspection;
}

export const ocrService = {
  async list(inspectionId: string, actor: Express.User) {
    const inspection = await getInspectionForOcr(inspectionId);
    if (actor.role === UserRole.INSPECTOR && inspection.inspectorId !== actor.id) {
      throw new AppError("FORBIDDEN", "You cannot access this OCR result", 403);
    }
    return inspection.photos.map((photo) => ({
      photoId: photo.id,
      photoAngle: photo.photoAngle,
      ocrResult: photo.ocrResult
    }));
  },

  async update(inspectionId: string, photoId: string, input: { confirmedSerial: string; damageLabels?: Prisma.InputJsonValue }, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const inspection = await getInspectionForOcr(inspectionId);
    if (actor.role !== UserRole.INSPECTOR || inspection.inspectorId !== actor.id) {
      throw new AppError("FORBIDDEN", "Only the owning inspector can correct OCR results", 403);
    }
    if (inspection.status === InspectionStatus.APPROVED) {
      throw new AppError("CONFLICT", "Approved inspection OCR results cannot be changed", 409);
    }
    const photo = inspection.photos.find((item) => item.id === photoId);
    if (!photo?.ocrResult) throw new AppError("NOT_FOUND", "OCR result not found", 404);

    const result = await prisma.ocrResult.update({
      where: { photoId },
      data: {
        confirmedSerial: input.confirmedSerial,
        damageLabels: input.damageLabels ?? undefined,
        isCorrected: true
      }
    });
    await auditService.log({
      userId: actor.id,
      sessionId: inspectionId,
      action: AuditAction.UPDATE,
      entityType: "ocr_result",
      entityId: result.id,
      metadata: { photoId, confirmedSerial: input.confirmedSerial },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return result;
  }
};
