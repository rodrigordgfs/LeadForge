"use client";

import type { LeadStatus } from "@leadforge/db";
import { useState } from "react";

import { ScoreBadge } from "@/components/leads/score-badge";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
} from "@/lib/constants/labels";

export interface KanbanLead {
  id: string;
  name: string;
  city: string;
  score?: number | null;
  scoreBand?: "critical" | "low" | "medium" | "excellent" | null;
  status: LeadStatus;
}

interface KanbanBoardProps {
  leadsByStatus: Record<LeadStatus, KanbanLead[]>;
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<void>;
}

export function KanbanBoard({ leadsByStatus, onStatusChange }: KanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (status: LeadStatus) => {
    if (!draggedLeadId) {
      return;
    }

    setError(null);

    try {
      await onStatusChange(draggedLeadId, status);
    } catch (dropError) {
      setError(
        dropError instanceof Error
          ? dropError.message
          : "Falha ao atualizar status",
      );
    } finally {
      setDraggedLeadId(null);
    }
  };

  return (
    <div className="space-y-4" data-testid="kanban-board">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="min-w-[240px] flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50"
            data-testid={`kanban-column-${status}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(status)}
          >
            <header className="border-b border-slate-200 px-3 py-2">
              <h3 className="text-sm font-semibold text-slate-800">
                {LEAD_STATUS_LABELS[status]}
              </h3>
              <p className="text-xs text-slate-500">
                {leadsByStatus[status]?.length ?? 0} leads
              </p>
            </header>

            <ul className="space-y-2 p-2">
              {(leadsByStatus[status] ?? []).map((lead) => (
                <li
                  key={lead.id}
                  draggable
                  onDragStart={() => setDraggedLeadId(lead.id)}
                  className="cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                  data-testid={`kanban-card-${lead.id}`}
                >
                  <p className="text-sm font-medium text-slate-900">
                    {lead.name}
                  </p>
                  <p className="text-xs text-slate-500">{lead.city}</p>
                  <div className="mt-2">
                    <ScoreBadge score={lead.score} band={lead.scoreBand} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
