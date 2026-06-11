import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { listUserLeads } from "@/lib/leads/list-user-leads";

export async function GET() {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const leads = await listUserLeads(authResult.userId);
  return NextResponse.json({ leads });
}
