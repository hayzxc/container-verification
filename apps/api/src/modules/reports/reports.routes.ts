import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { reportsController } from "./reports.controller.js";

export const reportsRouter = Router();

// Admin and Auditor only per RBAC matrix
reportsRouter.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.AUDITOR));
reportsRouter.get("/export/pdf", reportsController.exportPdf);
reportsRouter.get("/export/csv", reportsController.exportCsv);
