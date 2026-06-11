import type { Prisma } from "@prisma/client";
import { prisma } from "../src/index.js";

async function main() {
  const settings: Prisma.InputJsonValue = {
    highOpportunityThreshold: 60,
  };

  await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: {
      id: "dev-user",
      name: "Dev User",
      email: "dev@leadforge.local",
      settingsJson: settings,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
