import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { ocrController } from "./ocr.controller.js";
import { updateOcrSchema } from "./ocr.schema.js";

export const ocrRouter = Router({ mergeParams: true });

ocrRouter.use(requireAuth);
ocrRouter.get("/", ocrController.list);
ocrRouter.patch("/:photoId", validateBody(updateOcrSchema), ocrController.update);
