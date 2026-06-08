import type { Prisma } from "@prisma/client";
import { AuditAction } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { parsePagination } from "../../utils/pagination.js";
import { auditService } from "../audit/audit.service.js";
import { addWebhookJob } from "../../workers/queues.js";

export const webhooksService = {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const [endpoints, total] = await Promise.all([
      prisma.webhookEndpoint.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { deliveries: true } }
        }
      }),
      prisma.webhookEndpoint.count()
    ]);
    return { endpoints, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async create(
    input: { name: string; url: string; secret?: string; isActive?: boolean },
    actor: Express.User,
    requestMeta: { ipAddress?: string; userAgent?: string }
  ) {
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        name: input.name,
        url: input.url,
        secret: input.secret ?? null,
        isActive: input.isActive ?? true
      }
    });

    await auditService.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entityType: "webhook_endpoint",
      entityId: endpoint.id,
      metadata: { name: endpoint.name, url: endpoint.url },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });

    return endpoint;
  },

  async update(
    id: string,
    input: Prisma.WebhookEndpointUpdateInput,
    actor: Express.User,
    requestMeta: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!existing) throw new AppError("NOT_FOUND", "Webhook endpoint not found", 404);

    const endpoint = await prisma.webhookEndpoint.update({
      where: { id },
      data: input
    });

    await auditService.log({
      userId: actor.id,
      action: AuditAction.UPDATE,
      entityType: "webhook_endpoint",
      entityId: id,
      metadata: { previousActive: existing.isActive, nextActive: endpoint.isActive },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });

    return endpoint;
  },

  async remove(
    id: string,
    actor: Express.User,
    requestMeta: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!existing) throw new AppError("NOT_FOUND", "Webhook endpoint not found", 404);

    await prisma.webhookEndpoint.delete({ where: { id } });

    await auditService.log({
      userId: actor.id,
      action: AuditAction.DELETE,
      entityType: "webhook_endpoint",
      entityId: id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });

    return existing;
  },

  async getDeliveries(endpointId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { endpointId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.webhookDelivery.count({ where: { endpointId } })
    ]);
    return { deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  // Dispatch webhook for inspection status change
  async dispatchInspectionStatusChanged(data: {
    inspectionId: string;
    containerId: string;
    previousStatus: string;
    currentStatus: string;
    verifiedBy: string;
    verifiedAt: Date;
  }) {
    const activeEndpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true }
    });

    const payload = {
      event: "inspection.status_changed",
      timestamp: new Date().toISOString(),
      data: {
        inspectionId: data.inspectionId,
        containerId: data.containerId,
        previousStatus: data.previousStatus,
        currentStatus: data.currentStatus,
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt.toISOString()
      }
    };

    for (const endpoint of activeEndpoints) {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          eventType: "inspection.status_changed",
          payload: payload as Prisma.InputJsonValue,
          attempts: 0
        }
      });

      try {
        await addWebhookJob({
          endpointId: endpoint.id,
          deliveryId: delivery.id,
          url: endpoint.url,
          secret: endpoint.secret,
          payload
        });
      } catch (error) {
        console.error(`Failed to enqueue webhook job for endpoint ${endpoint.id}:`, error);
      }
    }
  }
};
