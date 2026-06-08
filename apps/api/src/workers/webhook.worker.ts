import crypto from "node:crypto";
import { Worker, type Job } from "bullmq";
import { AuditAction } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { auditService } from "../modules/audit/audit.service.js";
import { redisConnectionOptions } from "./queues.js";

type WebhookJobData = {
  endpointId: string;
  deliveryId: string;
  url: string;
  secret: string | null;
  payload: Record<string, unknown>;
};

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function processWebhookJob(job: Job<WebhookJobData>) {
  const { deliveryId, url, secret, payload } = job.data;

  const body = JSON.stringify(payload);
  const timestamp = new Date().toISOString();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": String(payload.event ?? "unknown"),
    "X-Webhook-Timestamp": timestamp
  };

  if (secret) {
    headers["X-Webhook-Signature"] = `sha256=${signPayload(body, secret)}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(30_000)
    });

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        statusCode: response.status,
        success: response.ok,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        attempts: { increment: 1 }
      }
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: HTTP ${response.status}`);
    }

    console.log(`Webhook delivered to ${url}: ${response.status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        success: false,
        error: message,
        attempts: { increment: 1 }
      }
    });

    // Audit failed delivery
    await auditService.log({
      action: AuditAction.WEBHOOK_DISPATCH,
      entityType: "webhook_delivery",
      entityId: deliveryId,
      metadata: { url, error: message, attempt: job.attemptsMade + 1 }
    });

    throw error; // Re-throw so BullMQ retries
  }

  // Audit successful delivery
  await auditService.log({
    action: AuditAction.WEBHOOK_DISPATCH,
    entityType: "webhook_delivery",
    entityId: deliveryId,
    metadata: { url, success: true }
  });
}

export function startWebhookWorker() {
  const worker = new Worker("webhook-dispatch", processWebhookJob, {
    connection: redisConnectionOptions,
    concurrency: 10
  });

  worker.on("completed", (job) => {
    console.log(`Webhook job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Webhook job ${job?.id} failed:`, error.message);
  });

  // Suppress noisy Redis connection retry logs
  worker.on("error", (error) => {
    if ((error as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
      console.error("Webhook worker error:", error.message);
    }
  });

  console.log("Webhook worker started");
  return worker;
}
