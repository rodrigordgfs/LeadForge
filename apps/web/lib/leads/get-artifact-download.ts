import { ArtifactType, prisma } from "@leadforge/db";

const ARTIFACT_TYPES = new Set<string>(Object.values(ArtifactType));

export interface ArtifactDownload {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}

export function isValidArtifactType(type: string): type is ArtifactType {
  return ARTIFACT_TYPES.has(type);
}

export async function getArtifactDownload(
  userId: string,
  leadId: string,
  type: string,
): Promise<ArtifactDownload | null> {
  if (!isValidArtifactType(type)) {
    return null;
  }

  const artifact = await prisma.artifact.findFirst({
    where: {
      type,
      lead: { id: leadId, userId },
    },
    select: {
      filename: true,
      mimeType: true,
      contentBase64: true,
    },
  });

  if (!artifact) {
    return null;
  }

  return {
    filename: artifact.filename,
    mimeType: artifact.mimeType,
    bytes: Buffer.from(artifact.contentBase64, "base64"),
  };
}
