"use client";

import type { LeadStatus } from "@leadforge/db";
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@leadforge/ui";
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUS_ORDER.map((status) => (
          <Card
            key={status}
            className="min-w-[240px] shrink-0 gap-0 bg-muted/30 py-0"
            data-testid={`kanban-column-${status}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(status)}
          >
            <CardHeader className="gap-1 border-b px-3 py-2">
              <CardTitle className="text-sm">
                {LEAD_STATUS_LABELS[status]}
              </CardTitle>
              <CardDescription>
                {leadsByStatus[status]?.length ?? 0} leads
              </CardDescription>
            </CardHeader>

            <CardContent className="p-2">
              <ul className="space-y-2">
                {(leadsByStatus[status] ?? []).map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedLeadId(lead.id)}
                    className="cursor-grab gap-2 py-3 shadow-xs active:cursor-grabbing"
                    data-testid={`kanban-card-${lead.id}`}
                  >
                    <CardContent className="px-3 py-0">
                      <p className="text-sm font-medium text-foreground">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.city}</p>
                      <div className="mt-2">
                        <ScoreBadge score={lead.score} band={lead.scoreBand} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
