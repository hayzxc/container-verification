import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { auditService } from "../audit/audit.service.js";
import { authService, AuditAction } from "./auth.service.js";

const refreshCookieName = "refreshToken";
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions);
    await auditService.log({
      userId: result.user.id,
      action: AuditAction.LOGIN,
      entityType: "user",
      entityId: result.user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, { accessToken: result.accessToken, user: result.user });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[refreshCookieName];
    const result = await authService.refresh(refreshToken);
    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions);
    return sendSuccess(res, { accessToken: result.accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user?.id, req.cookies?.[refreshCookieName]);
    res.clearCookie(refreshCookieName);
    if (req.user?.id) {
      await auditService.log({
        userId: req.user.id,
        action: AuditAction.LOGOUT,
        entityType: "user",
        entityId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
    }
    return sendSuccess(res, { loggedOut: true });
  })
};
