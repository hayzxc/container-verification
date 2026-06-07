import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validateBody, validateQuery } from "../../middleware/validate.middleware.js";
import { inspectionsController } from "./inspections.controller.js";
import { createInspectionSchema, listInspectionsQuerySchema, statusUpdateSchema, updateInspectionSchema } from "./inspections.schema.js";

export const inspectionsRouter = Router();

inspectionsRouter.use(requireAuth);
inspectionsRouter.get("/", validateQuery(listInspectionsQuerySchema), inspectionsController.list);
inspectionsRouter.post("/", requireRole(UserRole.INSPECTOR), validateBody(createInspectionSchema), inspectionsController.create);
inspectionsRouter.get("/:id", inspectionsController.detail);
inspectionsRouter.patch("/:id", requireRole(UserRole.INSPECTOR), validateBody(updateInspectionSchema), inspectionsController.update);
inspectionsRouter.post("/:id/submit", requireRole(UserRole.INSPECTOR), inspectionsController.submit);
inspectionsRouter.patch("/:id/status", requireRole(UserRole.ADMIN), validateBody(statusUpdateSchema), inspectionsController.updateStatus);
