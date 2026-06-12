"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@leadforge/ui";

import { ARTIFACT_TYPE_LABELS } from "@/lib/constants/labels";

export interface ArtifactMeta {
  type: string;
  filename: string;
  sizeBytes: number;
}

interface ArtifactListProps {
  leadId: string;
  artifacts: ArtifactMeta[];
  wireframePreview?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ArtifactList({
  leadId,
  artifacts,
  wireframePreview,
}: ArtifactListProps) {
  if (artifacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="artifact-list-empty">
        Nenhum artefato gerado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="artifact-list">
      <Card className="gap-0 py-0">
        <ul className="divide-y divide-border">
          {artifacts.map((artifact) => (
            <li
              key={artifact.type}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {ARTIFACT_TYPE_LABELS[artifact.type] ?? artifact.type}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {artifact.filename} · {formatBytes(artifact.sizeBytes)}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/api/leads/${leadId}/artifacts/${artifact.type}`}
                  download={artifact.filename}
                  data-testid={`artifact-download-${artifact.type}`}
                >
                  Baixar
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {wireframePreview ? (
        <Card className="gap-4 bg-muted/50 py-4">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-sm">Prévia do wireframe</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-foreground">
              {wireframePreview}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
