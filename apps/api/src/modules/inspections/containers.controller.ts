import type { Request, Response } from "express";
import { normalizeContainerId } from "@container-verification/shared";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { inspectionsService } from "./inspections.service.js";

export const containersController = {
  history: asyncHandler(async (req: Request, res: Response) => {
    const containerId = normalizeContainerId(req.params.containerId);
    const items = await inspectionsService.getContainerHistory(containerId, req.user!);
    return sendSuccess(res, items);
  })
};
