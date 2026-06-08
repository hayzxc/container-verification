import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { webhooksService } from "./webhooks.service.js";

export const webhooksController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await webhooksService.list(req.query);
    return sendSuccess(res, result.endpoints, result.meta);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const endpoint = await webhooksService.create(req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, endpoint, undefined, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const endpoint = await webhooksService.update(req.params.id, req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, endpoint);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const endpoint = await webhooksService.remove(req.params.id, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, endpoint);
  }),

  deliveries: asyncHandler(async (req: Request, res: Response) => {
    const result = await webhooksService.getDeliveries(req.params.id, req.query);
    return sendSuccess(res, result.deliveries, result.meta);
  })
};
