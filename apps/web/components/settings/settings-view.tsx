"use client";

import type { UserSettings } from "@leadforge/shared";
import { useEffect, useState } from "react";

export function SettingsView() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [threshold, setThreshold] = useState(60);
  const [scope, setScope] = useState("");
  const [deadline, setDeadline] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("Falha ao carregar configurações");
        }

        const data = (await response.json()) as UserSettings;
        setSettings(data);
        setThreshold(data.highOpportunityThreshold);
        setScope(data.proposalDefaults?.scope ?? "");
        setDeadline(data.proposalDefaults?.deadline ?? "");
        setMonthlyFee(
          data.proposalDefaults?.monthlyFee != null
            ? String(data.proposalDefaults.monthlyFee)
            : "",
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar configurações",
        );
      }
    })();
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          highOpportunityThreshold: threshold,
          proposalDefaults: {
            scope: scope || undefined,
            deadline: deadline || undefined,
            monthlyFee: monthlyFee ? Number(monthlyFee) : undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Falha ao salvar configurações");
      }

      const data = (await response.json()) as UserSettings;
      setSettings(data);
      setMessage("Configurações salvas com sucesso.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Falha ao salvar configurações",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings && !error) {
    return <p className="text-sm text-slate-500">Carregando configurações…</p>;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-600">
          Ajuste o limiar de alta oportunidade e padrões de proposta.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Limiar de alta oportunidade: {threshold}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="w-full"
            data-testid="threshold-slider"
          />
          <span className="text-xs text-slate-500">
            Leads com score ≤ {threshold} ou sem site são considerados alta
            oportunidade.
          </span>
        </label>

        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">
            Padrões de proposta
          </legend>

          <label className="block space-y-1">
            <span className="text-sm text-slate-700">Escopo padrão</span>
            <textarea
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-slate-700">Prazo padrão</span>
            <input
              type="text"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ex.: 30 dias"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-slate-700">Mensalidade padrão (R$)</span>
            <input
              type="number"
              min={0}
              value={monthlyFee}
              onChange={(event) => setMonthlyFee(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </fieldset>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          data-testid="settings-save"
        >
          {isSaving ? "Salvando…" : "Salvar configurações"}
        </button>
      </form>
    </section>
  );
}
