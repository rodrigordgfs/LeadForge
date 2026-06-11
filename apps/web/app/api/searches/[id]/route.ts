import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { getSearchJobForUser } from "@/lib/search/get-search-job";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const job = await getSearchJobForUser(authResult.userId, id);

  if (!job) {
    return NextResponse.json({ error: "Search job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
