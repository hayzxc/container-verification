import crypto from "node:crypto";
import { AuditAction, InspectionStatus, UserRole, type PhotoAngle } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { auditService } from "../audit/audit.service.js";
import { validateImageUpload, generateThumbnail } from "./upload-validator.js";
import { storageService } from "../../config/storage.js";

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

    // Upload original to object storage
    try {
      await storageService.upload(storageKey, input.file.buffer, validated.mimeType);
    } catch (error) {
      console.error("Storage upload failed (original):", error);
      // Continue — photo metadata still valuable even without storage
    }

    // Generate and upload thumbnail
    let thumbnailKey: string | null = null;
    try {
      const thumbnail = await generateThumbnail(input.file.buffer);
      thumbnailKey = `thumbnails/${input.inspectionId}/${idPart}.webp`;
      await storageService.upload(thumbnailKey, thumbnail, "image/webp");
    } catch (error) {
      console.error("Thumbnail generation/upload failed:", error);
    }

    const photo = await prisma.inspectionPhoto.create({
      data: {
        sessionId: input.inspectionId,
        photoAngle: input.photoAngle,
        storageKey,
        thumbnailKey,
        mimeType: validated.mimeType,
        fileSizeKb: Math.ceil(input.file.size / 1024),
        width: validated.width,
        height: validated.height,
        resolution: validated.resolution,
        exifTimestamp: validated.exifTimestamp,
        deviceInfo: validated.deviceInfo,
        latitude: validated.latitude,
        longitude: validated.longitude,
        ocrResult: { create: { status: "QUEUED" } }
      },
      include: { ocrResult: true }
    });

    // Enqueue OCR job (lazy import to avoid circular dependency)
    try {
      const { addOcrJob } = await import("../../workers/queues.js");
      await addOcrJob({
        photoId: photo.id,
        inspectionId: input.inspectionId,
        attempt: 1
      });
    } catch (error) {
      // Worker may not be available in test environment
      console.error("Failed to enqueue OCR job:", error);
    }

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
      storageUrl: null,
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

    // Clean up from object storage
    try {
      await storageService.delete(photo.storageKey);
      if (photo.thumbnailKey) {
        await storageService.delete(photo.thumbnailKey);
      }
    } catch (error) {
      console.error("Storage cleanup failed:", error);
    }

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
