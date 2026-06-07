import crypto from "node:crypto";
import { AuditAction, InspectionStatus, UserRole, type PhotoAngle } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { auditService } from "../audit/audit.service.js";
import { validateImageUpload } from "./upload-validator.js";

function assertCanMutatePhoto(inspection: { inspectorId: string; status: InspectionStatus }, actor: Express.User) {
  if (actor.role === UserRole.ADMIN) return;
  if (actor.role !== UserRole.INSPECTOR || inspection.inspectorId !== actor.id) {
    throw new AppError("FORBIDDEN", "You cannot mutate photos for this inspection", 403);
  }
  if (
    inspection.status !== InspectionStatus.DRAFT &&
    inspection.status !== InspectionStatus.CLARIFICATION
  ) {
    throw new AppError("CONFLICT", "Photos can only be changed in draft or clarification status", 409);
  }
}

export const photosService = {
  async list(inspectionId: string, actor: Express.User) {
    const inspection = await prisma.inspectionSession.findUnique({ where: { id: inspectionId } });
    if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
    if (actor.role === UserRole.INSPECTOR && inspection.inspectorId !== actor.id) {
      throw new AppError("FORBIDDEN", "You cannot access this inspection", 403);
    }
    return prisma.inspectionPhoto.findMany({
      where: { sessionId: inspectionId },
      include: { ocrResult: true },
      orderBy: { uploadedAt: "asc" }
    });
  },

  async upload(input: {
    inspectionId: string;
    photoAngle: PhotoAngle;
    file: Express.Multer.File;
  }, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const inspection = await prisma.inspectionSession.findUnique({ where: { id: input.inspectionId } });
    if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
    assertCanMutatePhoto(inspection, actor);

    const validated = await validateImageUpload(input.file);
    const idPart = crypto.randomUUID();
    const storageKey = `inspections/${input.inspectionId}/${input.photoAngle}/${Date.now()}-${idPart}.${validated.ext}`;

    const photo = await prisma.inspectionPhoto.create({
      data: {
        sessionId: input.inspectionId,
        photoAngle: input.photoAngle,
        storageKey,
        mimeType: validated.mimeType,
        fileSizeKb: Math.ceil(input.file.size / 1024),
        width: validated.width,
        height: validated.height,
        resolution: validated.resolution,
        ocrResult: { create: { status: "QUEUED" } }
      },
      include: { ocrResult: true }
    });

    await auditService.log({
      userId: actor.id,
      sessionId: input.inspectionId,
      action: AuditAction.CREATE,
      entityType: "inspection_photo",
      entityId: photo.id,
      metadata: { photoAngle: input.photoAngle, storageKey, ocrStatus: "QUEUED" },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });

    return {
      id: photo.id,
      photoAngle: photo.photoAngle,
      storageKey: photo.storageKey,
      width: photo.width,
      height: photo.height,
      ocrStatus: photo.ocrResult?.status
    };
  },

  async remove(photoId: string, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const photo = await prisma.inspectionPhoto.findUnique({
      where: { id: photoId },
      include: { session: true }
    });
    if (!photo) throw new AppError("NOT_FOUND", "Photo not found", 404);
    assertCanMutatePhoto(photo.session, actor);
    const deleted = await prisma.inspectionPhoto.delete({ where: { id: photoId } });
    await auditService.log({
      userId: actor.id,
      sessionId: photo.sessionId,
      action: AuditAction.DELETE,
      entityType: "inspection_photo",
      entityId: photoId,
      metadata: { photoAngle: photo.photoAngle, storageKey: photo.storageKey },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return deleted;
  }
};
