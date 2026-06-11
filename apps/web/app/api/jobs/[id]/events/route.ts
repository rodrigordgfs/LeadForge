import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { createJobEventsStream } from "@/lib/jobs/create-job-events-stream";
import { getSearchJobForUser } from "@/lib/search/get-search-job";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const job = await getSearchJobForUser(authResult.userId, id);

  if (!job) {
    return NextResponse.json({ error: "Search job not found" }, { status: 404 });
  }

  const stream = createJobEventsStream(id, request.signal);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
