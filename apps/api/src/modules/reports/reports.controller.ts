import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { exportQuerySchema } from "./reports.schema.js";
import { reportsService } from "./reports.service.js";

export const reportsController = {
  exportPdf: asyncHandler(async (req: Request, res: Response) => {
    const query = exportQuerySchema.parse(req.query);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=inspection-report.pdf");

    await reportsService.generatePdf(query, res, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const query = exportQuerySchema.parse(req.query);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=inspection-report.csv");

    await reportsService.generateCsv(query, res, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
  })
};
