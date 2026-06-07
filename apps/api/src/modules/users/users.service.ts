import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";
import { AuditAction } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { parsePagination } from "../../utils/pagination.js";
import { auditService } from "../audit/audit.service.js";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  phone: true,
  profileUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true
} satisfies Prisma.UserSelect;

export const usersService = {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { fullName: { contains: String(query.search), mode: "insensitive" } },
        { email: { contains: String(query.search), mode: "insensitive" } }
      ];
    }
    if (query.role) where.role = query.role as Prisma.EnumUserRoleFilter["equals"];
    if (query.isActive !== undefined) where.isActive = Boolean(query.isActive);

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: userSelect, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where })
    ]);
    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async create(input: {
    fullName: string;
    email: string;
    password: string;
    role: Prisma.UserCreateInput["role"];
    phone?: string;
  }, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new AppError("CONFLICT", "Email is already registered", 409);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        role: input.role,
        phone: input.phone
      },
      select: userSelect
    });
    await auditService.log({
      userId: actor.id,
      action: AuditAction.CREATE,
      entityType: "user",
      entityId: user.id,
      metadata: { role: user.role },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return user;
  },

  async update(id: string, input: Prisma.UserUpdateInput, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    const previous = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!previous) throw new AppError("NOT_FOUND", "User not found", 404);
    const user = await prisma.user.update({ where: { id }, data: input, select: userSelect });
    await auditService.log({
      userId: actor.id,
      action: input.isActive === false ? AuditAction.DELETE : AuditAction.UPDATE,
      entityType: "user",
      entityId: id,
      metadata: { previousRole: previous.role, nextRole: user.role, previousActive: previous.isActive, nextActive: user.isActive },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return user;
  },

  async deactivate(id: string, actor: Express.User, requestMeta: { ipAddress?: string; userAgent?: string }) {
    return this.update(id, { isActive: false }, actor, requestMeta);
  }
};
