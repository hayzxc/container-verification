import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  ["Admin User", "admin@example.com", UserRole.ADMIN],
  ["Field Inspector", "inspector@example.com", UserRole.INSPECTOR],
  ["Audit User", "auditor@example.com", UserRole.AUDITOR]
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const [fullName, email, role] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { fullName, role, passwordHash, isActive: true },
      create: { fullName, email, role, passwordHash }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
