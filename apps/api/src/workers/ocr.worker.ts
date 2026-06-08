import { Worker, type Job } from "bullmq";
import { OcrStatus } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { storageService } from "../config/storage.js";
import { fakeOcrProvider } from "../modules/ocr/fake-ocr.provider.js";
import { redisConnectionOptions } from "./queues.js";

type OcrJobData = {
  photoId: string;
  inspectionId: string;
  attempt: number;
};

async function processOcrJob(job: Job<OcrJobData>) {
  const { photoId } = job.data;

  // Mark as processing
  await prisma.ocrResult.update({
    where: { photoId },
    data: { status: OcrStatus.PROCESSING }
  });

  const photo = await prisma.inspectionPhoto.findUnique({
    where: { id: photoId },
    select: { storageKey: true }
  });

  if (!photo) {
    await prisma.ocrResult.update({
      where: { photoId },
      data: {
        status: OcrStatus.FAILED,
        errorMessage: "Photo record not found",
        processedAt: new Date()
      }
    });
    return;
  }

  try {
    const signedUrl = await storageService.getSignedUrl(photo.storageKey);

    // Use fake provider for now; swap with real provider via env config later
    const result = await fakeOcrProvider.extractContainerSerial({
      storageKey: photo.storageKey,
      signedUrl
    });

    await prisma.ocrResult.update({
      where: { photoId },
      data: {
        status: OcrStatus.COMPLETED,
        detectedSerial: result.detectedSerial,
        confidenceScore: result.confidenceScore,
        boundingBox: result.boundingBox ?? undefined,
        processedAt: new Date()
      }
    });

    console.log(`OCR completed for photo ${photoId}: ${result.detectedSerial} (${result.confidenceScore})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.ocrResult.update({
      where: { photoId },
      data: {
        status: OcrStatus.FAILED,
        errorMessage: message,
        processedAt: new Date()
      }
    });
    throw error; // Re-throw so BullMQ retries
  }
}

export function startOcrWorker() {
  const worker = new Worker("ocr-processing", processOcrJob, {
    connection: redisConnectionOptions,
    concurrency: 5
  });

  worker.on("completed", (job) => {
    console.log(`OCR job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`OCR job ${job?.id} failed:`, error.message);
  });

  // Suppress noisy Redis connection retry logs
  worker.on("error", (error) => {
    if ((error as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
      console.error("OCR worker error:", error.message);
    }
  });

  console.log("OCR worker started");
  return worker;
}
