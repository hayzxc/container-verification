import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { containersRouter } from "./modules/inspections/containers.routes.js";
import { inspectionsRouter } from "./modules/inspections/inspections.routes.js";
import { inspectionPhotosRouter, photosRouter } from "./modules/photos/photos.routes.js";
import { ocrRouter } from "./modules/ocr/ocr.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { webhooksRouter } from "./modules/webhooks/webhooks.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/inspections", inspectionsRouter);
apiRouter.use("/inspections/:id/photos", inspectionPhotosRouter);
apiRouter.use("/inspections/:id/ocr", ocrRouter);
apiRouter.use("/photos", photosRouter);
apiRouter.use("/containers", containersRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/webhooks", webhooksRouter);
