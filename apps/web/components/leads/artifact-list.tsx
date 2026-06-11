"use client";

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
      <p className="text-sm text-slate-600" data-testid="artifact-list-empty">
        Nenhum artefato gerado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="artifact-list">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {artifacts.map((artifact) => (
          <li
            key={artifact.type}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {ARTIFACT_TYPE_LABELS[artifact.type] ?? artifact.type}
              </p>
              <p className="text-xs text-slate-500">
                {artifact.filename} · {formatBytes(artifact.sizeBytes)}
              </p>
            </div>
            <a
              href={`/api/leads/${leadId}/artifacts/${artifact.type}`}
              download={artifact.filename}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              data-testid={`artifact-download-${artifact.type}`}
            >
              Baixar
            </a>
          </li>
        ))}
      </ul>

      {wireframePreview ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-medium text-slate-900">
            Prévia do wireframe
          </h4>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">
            {wireframePreview}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
