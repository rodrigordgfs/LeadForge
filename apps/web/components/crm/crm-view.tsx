"use client";

import type { LeadStatus } from "@leadforge/db";
import { useCallback, useEffect, useState } from "react";

import {
  KanbanBoard,
  type KanbanLead,
} from "@/components/crm/kanban-board";
import { LEAD_STATUS_ORDER } from "@/lib/constants/labels";

function emptyGrouped(): Record<LeadStatus, KanbanLead[]> {
  return LEAD_STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as Record<LeadStatus, KanbanLead[]>,
  );
}

export function CrmView() {
  const [leadsByStatus, setLeadsByStatus] =
    useState<Record<LeadStatus, KanbanLead[]>>(emptyGrouped);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/leads");
      if (!response.ok) {
        throw new Error("Falha ao carregar leads");
      }

      const data = (await response.json()) as { leads: KanbanLead[] };
      const grouped = emptyGrouped();

      for (const lead of data.leads) {
        grouped[lead.status].push(lead);
      }

      setLeadsByStatus(grouped);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Falha ao carregar leads",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error ?? "Falha ao atualizar status");
    }

    await loadLeads();
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">CRM</h1>
        <p className="text-sm text-slate-600">
          Arraste leads entre colunas para atualizar o status.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando pipeline…</p>
      ) : (
        <KanbanBoard
          leadsByStatus={leadsByStatus}
          onStatusChange={handleStatusChange}
        />
      )}
    </section>
  );
}
