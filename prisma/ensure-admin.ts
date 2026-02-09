import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "scootergupta@gmail.com";

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashSync("password123", 12),
      name: "Scooter Gupta",
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin user ensured:", email);
}

main()
  .catch((e) => {
    console.error("ensure-admin failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
