import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/rbac.middleware.js";
import { validateBody, validateQuery } from "../../middleware/validate.middleware.js";
import { usersController } from "./users.controller.js";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./users.schema.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(UserRole.ADMIN));
usersRouter.get("/", validateQuery(listUsersQuerySchema), usersController.list);
usersRouter.post("/", validateBody(createUserSchema), usersController.create);
usersRouter.patch("/:id", validateBody(updateUserSchema), usersController.update);
usersRouter.delete("/:id", usersController.deactivate);
