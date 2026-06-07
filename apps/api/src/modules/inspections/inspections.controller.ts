import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { inspectionsService } from "./inspections.service.js";

export const inspectionsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionsService.create(req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, inspection, undefined, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await inspectionsService.list(req.query, req.user!);
    return sendSuccess(res, result.items, result.meta);
  }),

  detail: asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionsService.detail(req.params.id, req.user!);
    return sendSuccess(res, inspection);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionsService.update(req.params.id, req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, inspection);
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionsService.submit(req.params.id, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, inspection);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionsService.updateStatus(req.params.id, req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, inspection);
  })
};
