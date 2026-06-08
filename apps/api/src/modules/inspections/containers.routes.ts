import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { containersController } from "./containers.controller.js";

export const containersRouter = Router();

containersRouter.use(requireAuth);
containersRouter.get("/:containerId/history", containersController.history);
