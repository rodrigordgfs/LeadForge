import { userSettingsSchema, type UserSettings } from "@leadforge/shared";
import { prisma } from "@leadforge/db";

import { patchUserSettingsSchema } from "@/lib/settings/schema";

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settingsJson: true },
  });

  return userSettingsSchema.parse(user?.settingsJson ?? {});
}

export async function updateUserSettings(
  userId: string,
  input: unknown,
): Promise<
  | { ok: true; settings: UserSettings }
  | { ok: false; status: number; message: string }
> {
  const parsed = patchUserSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.issues[0]?.message ?? "Invalid settings",
    };
  }

  const current = await getUserSettings(userId);
  const merged = userSettingsSchema.parse({
    ...current,
    ...parsed.data,
    proposalDefaults: {
      ...current.proposalDefaults,
      ...parsed.data.proposalDefaults,
    },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { settingsJson: merged },
    select: { settingsJson: true },
  });

  return {
    ok: true,
    settings: userSettingsSchema.parse(user.settingsJson),
  };
}
