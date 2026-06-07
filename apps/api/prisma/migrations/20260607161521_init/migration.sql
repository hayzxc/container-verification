-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INSPECTOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('ARRIVAL', 'DEPARTURE', 'PERIODIC');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION');

-- CreateEnum
CREATE TYPE "PhotoAngle" AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'INTERIOR', 'SERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'REJECT', 'CLARIFY', 'EXPORT', 'WEBHOOK_DISPATCH');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" VARCHAR(30),
    "profileUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionSession" (
    "id" UUID NOT NULL,
    "containerId" VARCHAR(20) NOT NULL,
    "inspectorId" UUID NOT NULL,
    "inspectionType" "InspectionType" NOT NULL,
    "locationName" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "status" "InspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "adminComment" TEXT,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "thumbnailKey" TEXT,
    "photoAngle" "PhotoAngle" NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSizeKb" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "resolution" VARCHAR(20),
    "exifTimestamp" TIMESTAMP(3),
    "deviceInfo" VARCHAR(255),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrResult" (
    "id" UUID NOT NULL,
    "photoId" UUID NOT NULL,
    "status" "OcrStatus" NOT NULL DEFAULT 'QUEUED',
    "detectedSerial" VARCHAR(20),
    "confirmedSerial" VARCHAR(20),
    "confidenceScore" DOUBLE PRECISION,
    "boundingBox" JSONB,
    "damageLabels" JSONB,
    "isCorrected" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OcrResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" UUID NOT NULL,
    "endpointId" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "sessionId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID,
    "metadata" JSONB,
    "ipAddress" INET,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "InspectionSession_containerId_idx" ON "InspectionSession"("containerId");

-- CreateIndex
CREATE INDEX "InspectionSession_status_idx" ON "InspectionSession"("status");

-- CreateIndex
CREATE INDEX "InspectionSession_inspectorId_idx" ON "InspectionSession"("inspectorId");

-- CreateIndex
CREATE INDEX "InspectionSession_createdAt_idx" ON "InspectionSession"("createdAt");

-- CreateIndex
CREATE INDEX "InspectionSession_locationName_idx" ON "InspectionSession"("locationName");

-- CreateIndex
CREATE INDEX "InspectionPhoto_sessionId_idx" ON "InspectionPhoto"("sessionId");

-- CreateIndex
CREATE INDEX "InspectionPhoto_photoAngle_idx" ON "InspectionPhoto"("photoAngle");

-- CreateIndex
CREATE UNIQUE INDEX "OcrResult_photoId_key" ON "OcrResult"("photoId");

-- CreateIndex
CREATE INDEX "OcrResult_status_idx" ON "OcrResult"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_idx" ON "WebhookDelivery"("endpointId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_success_idx" ON "WebhookDelivery"("success");

-- CreateIndex
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_sessionId_idx" ON "AuditLog"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "InspectionSession" ADD CONSTRAINT "InspectionSession_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionSession" ADD CONSTRAINT "InspectionSession_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InspectionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrResult" ADD CONSTRAINT "OcrResult_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "InspectionPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InspectionSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
