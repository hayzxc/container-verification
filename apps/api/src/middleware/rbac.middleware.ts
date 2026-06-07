import type { Request, RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { AppError } from "../utils/app-error.js";

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("UNAUTHORIZED", "Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("FORBIDDEN", "Insufficient permissions", 403));
    }
    next();
  };
}

export function requireOwnershipOrRole(options: {
  role: UserRole;
  getOwnerId: (req: Request) => Promise<string | null>;
}): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        throw new AppError("UNAUTHORIZED", "Authentication required", 401);
      }
      if (req.user.role === options.role) {
        return next();
      }
      const ownerId = await options.getOwnerId(req);
      if (ownerId && ownerId === req.user.id) {
        return next();
      }
      throw new AppError("FORBIDDEN", "You cannot access this resource", 403);
    } catch (error) {
      next(error);
    }
  };
}
