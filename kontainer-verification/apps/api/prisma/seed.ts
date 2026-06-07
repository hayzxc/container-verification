import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const seedUsers = [
  {
    fullName: "Admin User",
    email: "admin@example.com",
    role: UserRole.ADMIN
  },
  {
    fullName: "Field Inspector",
    email: "inspector@example.com",
    role: UserRole.INSPECTOR
  },
  {
    fullName: "Audit User",
    email: "auditor@example.com",
    role: UserRole.AUDITOR
  }
] as const;

export const seed = async () => {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        passwordHash,
        isActive: true
      },
      create: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        passwordHash
      }
    });
  }
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
