import { Queue } from "bullmq";
import { env } from "../config/env.js";

// Parse Redis URL into connection options for BullMQ
// Using plain connection options avoids ioredis version mismatch issues
// between the app's ioredis and BullMQ's peer dependency
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.slice(1) || "0", 10) : 0
  };
}

export const redisConnectionOptions = parseRedisUrl(env.REDIS_URL);

// OCR processing queue
export const ocrQueue = new Queue("ocr-processing", {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: false
  }
});

// Webhook dispatch queue
export const webhookQueue = new Queue("webhook-dispatch", {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: false
  }
});

// Suppress noisy Redis connection retry logs on queues
for (const queue of [ocrQueue, webhookQueue]) {
  queue.on("error", (error) => {
    if ((error as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
      console.error(`Queue "${queue.name}" error:`, error.message);
    }
  });
}

// Helper to add OCR job
export async function addOcrJob(data: {
  photoId: string;
  inspectionId: string;
  attempt: number;
}) {
  return ocrQueue.add("process-ocr", data, {
    jobId: `ocr-${data.photoId}`
  });
}

// Helper to add webhook dispatch job
export async function addWebhookJob(data: {
  endpointId: string;
  deliveryId: string;
  url: string;
  secret: string | null;
  payload: Record<string, unknown>;
}) {
  return webhookQueue.add("dispatch-webhook", data, {
    jobId: `webhook-${data.deliveryId}`
  });
}
