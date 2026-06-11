export {
  userSettingsSchema,
  type UserSettings,
} from "@leadforge/shared";

import { userSettingsSchema } from "@leadforge/shared";

export const patchUserSettingsSchema = userSettingsSchema.partial();

export type PatchUserSettingsInput = ReturnType<
  typeof patchUserSettingsSchema.parse
>;

export function parseUserSettings(value: unknown) {
  return userSettingsSchema.parse(value);
}

export function parsePatchUserSettings(value: unknown) {
  return patchUserSettingsSchema.parse(value);
}
