import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireApiUserId(): Promise<
  { userId: string } | NextResponse
> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId };
}

export function isAuthError(
  result: { userId: string } | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
