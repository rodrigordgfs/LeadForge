import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { triggerLeadAnalyze } from "@/lib/leads/trigger-analyze";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { force?: boolean };

  const result = await triggerLeadAnalyze(authResult.userId, id, {
    force: body.force === true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ jobId: result.jobId }, { status: 202 });
}
