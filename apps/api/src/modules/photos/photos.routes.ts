import multer from "multer";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { photosController } from "./photos.controller.js";

const upload = multer({ storage: multer.memoryStorage() });

export const inspectionPhotosRouter = Router({ mergeParams: true });
inspectionPhotosRouter.use(requireAuth);
inspectionPhotosRouter.get("/", photosController.list);
inspectionPhotosRouter.post("/", upload.single("file"), photosController.upload);

export const photosRouter = Router();
photosRouter.use(requireAuth);
photosRouter.delete("/:photoId", photosController.remove);
