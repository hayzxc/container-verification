import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ocrService } from "./ocr.service.js";

export const ocrController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const results = await ocrService.list(req.params.id, req.user!);
    return sendSuccess(res, results);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await ocrService.update(req.params.id, req.params.photoId, req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, result);
  })
};
