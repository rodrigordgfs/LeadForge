import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats";

export async function GET() {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const stats = await getDashboardStats(authResult.userId);
  return NextResponse.json(stats);
}
