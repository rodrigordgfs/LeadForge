import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import {
  getUserSettings,
  updateUserSettings,
} from "@/lib/settings/user-settings";

export async function GET() {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const settings = await getUserSettings(authResult.userId);
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await updateUserSettings(authResult.userId, body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json(result.settings);
}
