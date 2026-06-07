import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

type AuditInput = {
  userId?: string | null;
  sessionId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export const auditService = {
  async log(input: AuditInput) {
    return prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });
  }
};
