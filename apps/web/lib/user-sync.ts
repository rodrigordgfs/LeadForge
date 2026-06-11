import { prisma, type Prisma } from "@leadforge/db";

export const DEFAULT_USER_SETTINGS: Prisma.InputJsonValue = {
  highOpportunityThreshold: 60,
};

export interface ClerkUserData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export async function syncUserFromClerk(user: ClerkUserData) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
    },
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
      settingsJson: DEFAULT_USER_SETTINGS,
    },
  });
}
