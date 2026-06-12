import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { createSearchJob } from "@/lib/search/create-search-job";
import { listUserSearches } from "@/lib/search/list-user-searches";

export async function GET() {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const searches = await listUserSearches(authResult.userId);
  return NextResponse.json({ searches });
}

export async function POST(request: Request) {
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

  try {
    const result = await createSearchJob(authResult.userId, body);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to enqueue search job" },
      { status: 503 },
    );
  }
}
