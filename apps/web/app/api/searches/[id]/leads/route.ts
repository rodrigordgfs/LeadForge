import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { listSearchLeads } from "@/lib/search/list-search-leads";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireApiUserId();
    if (isAuthError(authResult)) {
      return authResult;
    }

    const { id } = await params;
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "20");

    const result = await listSearchLeads({
      userId: authResult.userId,
      searchJobId: id,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    if (!result) {
      return NextResponse.json({ error: "Search job not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/searches/:id/leads] failed to list leads", error);
    return NextResponse.json(
      { error: "Failed to load leads" },
      { status: 500 },
    );
  }
}
