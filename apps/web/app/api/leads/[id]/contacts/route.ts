import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";
import {
  createLeadContact,
  listLeadContacts,
} from "@/lib/contacts/lead-contacts";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const contacts = await listLeadContacts(authResult.userId, id);

  if (!contacts) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(contacts);
}

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id } = await params;
  const body = (await request.json()) as {
    notes?: string;
    status?: string;
    nextContact?: string | null;
  };

  const result = await createLeadContact({
    userId: authResult.userId,
    leadId: id,
    notes: body.notes ?? "",
    status: body.status ?? "",
    nextContact: body.nextContact ? new Date(body.nextContact) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json(result.contact, { status: 201 });
}
