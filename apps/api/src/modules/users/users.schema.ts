import { UserRole } from "@prisma/client";
import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true"))
});

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  phone: z.string().max(30).optional()
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().max(30).nullable().optional()
});
