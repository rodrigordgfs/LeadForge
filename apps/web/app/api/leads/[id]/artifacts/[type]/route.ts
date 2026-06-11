import { ArtifactType, prisma } from "@leadforge/db";
import { NextResponse } from "next/server";

import { isAuthError, requireApiUserId } from "@/lib/api/auth";

interface RouteParams {
  params: Promise<{ id: string; type: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireApiUserId();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { id, type } = await params;

  if (!Object.values(ArtifactType).includes(type as ArtifactType)) {
    return NextResponse.json({ error: "Invalid artifact type" }, { status: 400 });
  }

  const artifact = await prisma.artifact.findFirst({
    where: {
      leadId: id,
      type: type as ArtifactType,
      lead: { userId: authResult.userId },
    },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const buffer = Buffer.from(artifact.contentBase64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": artifact.mimeType,
      "Content-Disposition": `attachment; filename="${artifact.filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
