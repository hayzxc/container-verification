import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { User, UserRole } from "@prisma/client";
import { AuditAction } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../utils/app-error.js";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

export type TokenUser = Pick<User, "id" | "email" | "role" | "fullName">;

function publicUser(user: TokenUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
  };
}

export function signAccessToken(user: Pick<User, "id" | "email" | "role">) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

export function signRefreshToken(user: Pick<User, "id" | "email" | "role">) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as {
    sub: string;
    email: string;
    role: UserRole;
  };
}

export async function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
    sub: string;
    email: string;
    role: UserRole;
  };
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user?.isActive || !user.refreshTokenHash) {
    throw new AppError("UNAUTHORIZED", "Invalid refresh token", 401);
  }
  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) {
    throw new AppError("UNAUTHORIZED", "Invalid refresh token", 401);
  }
  return user;
}

export const authService = {
  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, lastLoginAt: new Date() }
    });

    return { accessToken, refreshToken, user: publicUser(user) };
  },

  async refresh(refreshToken: string) {
    const user = await verifyRefreshToken(refreshToken);
    const nextRefreshToken = signRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(nextRefreshToken, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash }
    });
    return { accessToken: signAccessToken(user), refreshToken: nextRefreshToken };
  },

  async logout(userId: string | undefined, refreshToken: string | undefined) {
    if (userId) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { refreshTokenHash: null }
      });
      return;
    }
    if (refreshToken) {
      const user = await verifyRefreshToken(refreshToken).catch(() => null);
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } });
      }
    }
  }
};

export { AuditAction };
