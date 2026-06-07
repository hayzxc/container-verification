import type { Prisma } from "@prisma/client";
import { AuditAction, InspectionStatus, PhotoAngle, UserRole } from "@prisma/client";
import { REQUIRED_PHOTO_ANGLES } from "@container-verification/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { parsePagination } from "../../utils/pagination.js";
import { auditService } from "../audit/audit.service.js";
import { canTransitionInspectionStatus } from "./status-transition.js";

const detailInclude = {
  inspector: { select: { id: true, fullName: true, email: true, role: true } },
  verifiedBy: { select: { id: true, fullName: true, email: true, role: true } },
  photos: { include: { ocrResult: true }, orderBy: { uploadedAt: "asc" as const } },
  auditLogs: { orderBy: { timestamp: "desc" as const }, take: 50 }
} satisfies Prisma.InspectionSessionInclude;

function auditActionForStatus(status: InspectionStatus) {
  if (status === InspectionStatus.APPROVED) return AuditAction.VERIFY;
  if (status === InspectionStatus.REJECTED) return AuditAction.REJECT;
  if (status === InspectionStatus.CLARIFICATION) return AuditAction.CLARIFY;
  return AuditAction.UPDATE;
}

export const inspectionsService = {
  async getInspectorId(id: string) {
    const inspection = await prisma.inspectionSession.findUnique({
      where: { id },
      select: { inspectorId: true }
    });
    return inspection?.inspectorId ?? null;
  },

  async create(input: {
    containerId: string;
    inspectionType: Prisma.InspectionSessionCreateInput["inspectionType"];
    locationName: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    if (actor.role !== UserRole.INSPECTOR) {
      throw new AppError("FORBIDDEN", "Only inspectors can create inspections", 403);
    }
    const inspection = await prisma.inspectionSession.create({
      data: {
        containerId: input.containerId,
        inspectionType: input.inspectionType,
        locationName: input.locationName,
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes,
        inspectorId: actor.id
      }
    });
    await auditService.log({
      userId: actor.id,
      sessionId: inspection.id,
      action: AuditAction.CREATE,
      entityType: "inspection_session",
      entityId: inspection.id,
      metadata: { containerId: inspection.containerId, status: inspection.status },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return { id: inspection.id, status: inspection.status };
  },

  async list(query: Record<string, unknown>, actor: Express.User) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.InspectionSessionWhereInput = {};
    if (actor.role === UserRole.INSPECTOR) where.inspectorId = actor.id;
    if (actor.role !== UserRole.INSPECTOR && query.inspectorId) where.inspectorId = String(query.inspectorId);
    if (query.containerId) where.containerId = String(query.containerId);
    if (query.status) where.status = query.status as InspectionStatus;
    if (query.inspectionType) where.inspectionType = query.inspectionType as Prisma.EnumInspectionTypeFilter["equals"];
    if (query.locationName) where.locationName = { contains: String(query.locationName), mode: "insensitive" };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        gte: query.dateFrom ? new Date(String(query.dateFrom)) : undefined,
        lte: query.dateTo ? new Date(String(query.dateTo)) : undefined
      };
    }

    const [items, total] = await Promise.all([
      prisma.inspectionSession.findMany({
        where,
        include: {
          inspector: { select: { id: true, fullName: true, email: true } },
          _count: { select: { photos: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.inspectionSession.count({ where })
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async detail(id: string, actor: Express.User) {
    const inspection = await prisma.inspectionSession.findUnique({ where: { id }, include: detailInclude });
    if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
    if (actor.role === UserRole.INSPECTOR && inspection.inspectorId !== actor.id) {
      throw new AppError("FORBIDDEN", "You cannot access this inspection", 403);
    }
    return inspection;
  },

  async update(id: string, input: Prisma.InspectionSessionUpdateInput, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const inspection = await prisma.inspectionSession.findUnique({ where: { id } });
    if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
    if (actor.role !== UserRole.INSPECTOR || inspection.inspectorId !== actor.id) {
      throw new AppError("FORBIDDEN", "Only the owning inspector can update this inspection", 403);
    }
    if (
      inspection.status !== InspectionStatus.DRAFT &&
      inspection.status !== InspectionStatus.CLARIFICATION
    ) {
      throw new AppError("CONFLICT", "Only draft or clarification inspections can be updated", 409);
    }
    const updated = await prisma.inspectionSession.update({ where: { id }, data: input });
    await auditService.log({
      userId: actor.id,
      sessionId: id,
      action: AuditAction.UPDATE,
      entityType: "inspection_session",
      entityId: id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return updated;
  },

  async submit(id: string, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const inspection = await prisma.inspectionSession.findUnique({
      where: { id },
      include: { photos: { select: { photoAngle: true } } }
    });
    if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
    if (actor.role !== UserRole.INSPECTOR || inspection.inspectorId !== actor.id) {
      throw new AppError("FORBIDDEN", "Only the owning inspector can submit this inspection", 403);
    }
    if (!canTransitionInspectionStatus({ actorRole: actor.role, currentStatus: inspection.status, nextStatus: InspectionStatus.PENDING })) {
      throw new AppError("CONFLICT", "Inspection cannot be submitted from current status", 409);
    }

    const presentAngles = new Set(inspection.photos.map((photo) => photo.photoAngle));
    const missingAngles = REQUIRED_PHOTO_ANGLES.filter(
      (angle: (typeof REQUIRED_PHOTO_ANGLES)[number]) => !presentAngles.has(angle as PhotoAngle)
    );
    if (missingAngles.length > 0) {
      throw new AppError("VALIDATION_ERROR", "Required photos are missing", 400, { missingAngles });
    }

    const updated = await prisma.inspectionSession.update({
      where: { id },
      data: { status: InspectionStatus.PENDING, submittedAt: new Date() }
    });
    await auditService.log({
      userId: actor.id,
      sessionId: id,
      action: AuditAction.UPDATE,
      entityType: "inspection_session",
      entityId: id,
      metadata: { previousStatus: inspection.status, nextStatus: updated.status },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return updated;
  },

  async updateStatus(id: string, input: { status: InspectionStatus; comment?: string }, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const inspection = await prisma.inspectionSession.findUnique({ where: { id } });
    if (!inspection) throw new AppError("NOT_FOUND", "Inspection not found", 404);
    if (!canTransitionInspectionStatus({ actorRole: actor.role, currentStatus: inspection.status, nextStatus: input.status })) {
      throw new AppError("CONFLICT", "Invalid inspection status transition", 409);
    }
    const updated = await prisma.inspectionSession.update({
      where: { id },
      data: {
        status: input.status,
        adminComment: input.comment,
        verifiedById: actor.id,
        verifiedAt: new Date()
      }
    });
    await auditService.log({
      userId: actor.id,
      sessionId: id,
      action: auditActionForStatus(input.status),
      entityType: "inspection_session",
      entityId: id,
      metadata: { previousStatus: inspection.status, nextStatus: updated.status, comment: input.comment },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return updated;
  }
};
