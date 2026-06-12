"use client";

import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@leadforge/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LEAD_STATUS_LABELS } from "@/lib/constants/labels";
import { formatSearchLeadLabel } from "@/lib/search/search-lead-display";

interface DashboardStats {
  totalLeads: number;
  byStatus: Record<string, number>;
  highOpportunityCount: number;
  recentSearches: Array<{
    id: string;
    city: string;
    state: string;
    status: string;
    createdAt: string;
    totalFound: number;
    leadCount: number;
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
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4" data-testid="dashboard-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
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
        <Card className="gap-4 py-4">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-sm">Leads por status</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <ul className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS]}
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-sm">Buscas recentes</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {stats.recentSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma busca realizada ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recentSearches.map((search) => (
                  <li key={search.id} className="py-2">
                    <Link
                      href={`/busca/${search.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {search.city}/{search.state}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(search.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                      {formatSearchLeadLabel(search)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
    <Card
      className={
        highlight ? "border-success/25 bg-success/5 gap-4 py-4" : "gap-4 py-4"
      }
      data-testid={`stat-${label}`}
    >
      <CardContent className="px-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
