import PDFDocument from "pdfkit";
import type { Writable } from "node:stream";
import type { Prisma } from "@prisma/client";
import { AuditAction } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { auditService } from "../audit/audit.service.js";
import type { ExportQuery } from "./reports.schema.js";

function buildWhere(query: ExportQuery): Prisma.InspectionSessionWhereInput {
  const where: Prisma.InspectionSessionWhereInput = {};

  if (query.inspectionId) {
    where.id = query.inspectionId;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
      lte: query.dateTo ? new Date(query.dateTo) : undefined
    };
  }

  return where;
}

async function getInspections(query: ExportQuery) {
  const where = buildWhere(query);

  return prisma.inspectionSession.findMany({
    where,
    include: {
      inspector: { select: { id: true, fullName: true, email: true } },
      verifiedBy: { select: { id: true, fullName: true } },
      photos: {
        include: { ocrResult: true },
        orderBy: { uploadedAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });
}

export const reportsService = {
  async generatePdf(
    query: ExportQuery,
    output: Writable,
    actor: Express.User,
    requestMeta: { ipAddress?: string; userAgent?: string }
  ) {
    const inspections = await getInspections(query);
    if (inspections.length === 0) {
      throw new AppError("NOT_FOUND", "No inspections found for the given filters", 404);
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(output);

    // Header
    doc.fontSize(20).text("Container Inspection Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666666")
      .text(`Generated: ${new Date().toISOString()}`, { align: "center" });
    doc.moveDown(1);

    for (let i = 0; i < inspections.length; i++) {
      const inspection = inspections[i];
      if (i > 0) doc.addPage();

      // Inspection header
      doc.fontSize(14).fillColor("#1A3C5E")
        .text(`Inspection: ${inspection.containerId}`);
      doc.moveDown(0.3);

      doc.fontSize(10).fillColor("#333333");

      const details = [
        ["Status", inspection.status],
        ["Type", inspection.inspectionType],
        ["Location", inspection.locationName],
        ["Inspector", inspection.inspector.fullName],
        ["Created", inspection.createdAt.toISOString()],
        ["Submitted", inspection.submittedAt?.toISOString() ?? "—"]
      ];

      if (inspection.verifiedBy) {
        details.push(
          ["Verified By", inspection.verifiedBy.fullName],
          ["Verified At", inspection.verifiedAt?.toISOString() ?? "—"]
        );
      }

      if (inspection.adminComment) {
        details.push(["Admin Comment", inspection.adminComment]);
      }

      if (inspection.notes) {
        details.push(["Notes", inspection.notes]);
      }

      for (const [label, value] of details) {
        doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
        doc.font("Helvetica").text(String(value));
      }

      // Photos section
      if (inspection.photos.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor("#1A3C5E").text("Photos");
        doc.moveDown(0.3);

        for (const photo of inspection.photos) {
          doc.fontSize(9).fillColor("#333333");
          doc.text(`• ${photo.photoAngle} — ${photo.resolution ?? "?"} — ${photo.fileSizeKb} KB`);

          if (photo.ocrResult) {
            const ocr = photo.ocrResult;
            const serial = ocr.confirmedSerial ?? ocr.detectedSerial ?? "Not detected";
            const confidence = ocr.confidenceScore != null
              ? `${(ocr.confidenceScore * 100).toFixed(1)}%`
              : "—";
            doc.text(`  OCR: ${serial} (confidence: ${confidence}, status: ${ocr.status})`);
          }
        }
      }

      // Coordinates
      if (inspection.latitude && inspection.longitude) {
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor("#666666")
          .text(`GPS: ${inspection.latitude}, ${inspection.longitude}`);
      }
    }

    doc.end();

    // Audit log
    await auditService.log({
      userId: actor.id,
      action: AuditAction.EXPORT,
      entityType: "report_pdf",
      entityId: query.inspectionId ?? null,
      metadata: {
        format: "pdf",
        count: inspections.length,
        filters: query
      },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
  },

  async generateCsv(
    query: ExportQuery,
    output: Writable,
    actor: Express.User,
    requestMeta: { ipAddress?: string; userAgent?: string }
  ) {
    const inspections = await getInspections(query);

    // CSV header
    const headers = [
      "inspection_id",
      "container_id",
      "status",
      "inspection_type",
      "location",
      "latitude",
      "longitude",
      "inspector_name",
      "inspector_email",
      "verified_by",
      "verified_at",
      "admin_comment",
      "notes",
      "photo_count",
      "submitted_at",
      "created_at"
    ];

    output.write(headers.join(",") + "\n");

    for (const inspection of inspections) {
      const row = [
        inspection.id,
        inspection.containerId,
        inspection.status,
        inspection.inspectionType,
        `"${(inspection.locationName ?? "").replace(/"/g, '""')}"`,
        inspection.latitude?.toString() ?? "",
        inspection.longitude?.toString() ?? "",
        `"${inspection.inspector.fullName}"`,
        inspection.inspector.email,
        inspection.verifiedBy?.fullName ?? "",
        inspection.verifiedAt?.toISOString() ?? "",
        `"${(inspection.adminComment ?? "").replace(/"/g, '""')}"`,
        `"${(inspection.notes ?? "").replace(/"/g, '""')}"`,
        inspection.photos.length.toString(),
        inspection.submittedAt?.toISOString() ?? "",
        inspection.createdAt.toISOString()
      ];
      output.write(row.join(",") + "\n");
    }

    output.end();

    // Audit log
    await auditService.log({
      userId: actor.id,
      action: AuditAction.EXPORT,
      entityType: "report_csv",
      entityId: query.inspectionId ?? null,
      metadata: {
        format: "csv",
        count: inspections.length,
        filters: query
      },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
  }
};
