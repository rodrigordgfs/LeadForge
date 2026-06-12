import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { retrySearchJob } from "@/lib/search/retry-search-job";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const result = await retrySearchJob(authResult.userId, id);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ searchJobId: result.searchJobId });
}
