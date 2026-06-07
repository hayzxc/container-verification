import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../modules/auth/auth.service.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!token) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true }
    });
    if (!user?.isActive) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("UNAUTHORIZED", "Authentication required", 401));
  }
};
