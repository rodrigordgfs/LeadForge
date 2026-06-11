import type { LeadStatus } from "@leadforge/db";
import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import { getLeadDetailForUser } from "@/lib/leads/get-lead-detail";
import { updateLeadStatusForUser } from "@/lib/leads/update-lead-status";
import { deleteLeadForUser } from "@/lib/leads/delete-lead";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const lead = await getLeadDetailForUser(authResult.userId, id);

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = (body as { status?: LeadStatus }).status;
  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const result = await updateLeadStatusForUser({
    userId: authResult.userId,
    leadId: id,
    status,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  const lead = await getLeadDetailForUser(authResult.userId, id);
  return NextResponse.json(lead ?? result.lead);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const deleted = await deleteLeadForUser(authResult.userId, id);

  if (!deleted) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
