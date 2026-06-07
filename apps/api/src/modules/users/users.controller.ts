import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { usersService } from "./users.service.js";

export const usersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.list(req.query);
    return sendSuccess(res, result.users, result.meta);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.create(req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, user, undefined, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.update(req.params.id, req.body, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, user);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.deactivate(req.params.id, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, user);
  })
};
