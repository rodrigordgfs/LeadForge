"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LEAD_STATUS_LABELS } from "@/lib/constants/labels";

interface DashboardStats {
  totalLeads: number;
  byStatus: Record<string, number>;
  highOpportunityCount: number;
  recentSearches: Array<{
    id: string;
    city: string;
    state: string;
    createdAt: string;
    totalFound: number;
  }>;
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Falha ao carregar dashboard");
        }

        setStats((await response.json()) as DashboardStats);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar dashboard",
        );
      }
    })();
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (!stats) {
    return <p className="text-sm text-slate-500">Carregando dashboard…</p>;
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Visão geral da prospecção e oportunidades.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total de leads" value={stats.totalLeads} />
        <StatCard
          label="Alta oportunidade"
          value={stats.highOpportunityCount}
          highlight
        />
        <StatCard
          label="Em negociação"
          value={stats.byStatus.negociacao ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Leads por status
          </h2>
          <ul className="mt-3 space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li
                key={status}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-600">
                  {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS]}
                </span>
                <span className="font-medium text-slate-900">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Buscas recentes
          </h2>
          {stats.recentSearches.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Nenhuma busca realizada ainda.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {stats.recentSearches.map((search) => (
                <li key={search.id} className="py-2">
                  <Link
                    href={`/busca/${search.id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    {search.city}/{search.state}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {new Date(search.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                    {search.totalFound} leads
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
      data-testid={`stat-${label}`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
