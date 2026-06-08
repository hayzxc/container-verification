import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validateBody, validateQuery } from "../../middleware/validate.middleware.js";
import { webhooksController } from "./webhooks.controller.js";
import { createWebhookSchema, updateWebhookSchema, listWebhookQuerySchema } from "./webhooks.schema.js";

export const webhooksRouter = Router();

// Admin only per RBAC matrix
webhooksRouter.use(requireAuth, requireRole(UserRole.ADMIN));
webhooksRouter.get("/", validateQuery(listWebhookQuerySchema), webhooksController.list);
webhooksRouter.post("/", validateBody(createWebhookSchema), webhooksController.create);
webhooksRouter.patch("/:id", validateBody(updateWebhookSchema), webhooksController.update);
webhooksRouter.delete("/:id", webhooksController.remove);
webhooksRouter.get("/:id/deliveries", webhooksController.deliveries);
