"use client";

import type { UserSettings } from "@leadforge/shared";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Skeleton,
  Textarea,
} from "@leadforge/ui";
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
    return (
      <div className="space-y-4" data-testid="settings-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste o limiar de alta oportunidade e padrões de proposta.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="threshold">
            Limiar de alta oportunidade:{" "}
            <span className="font-mono">{threshold}</span>
          </Label>
          <Input
            id="threshold"
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="h-2 cursor-pointer p-0"
            data-testid="threshold-slider"
          />
          <p className="text-xs text-muted-foreground">
            Leads com score ≤ {threshold} ou sem site são considerados alta
            oportunidade.
          </p>
        </div>

        <Separator />

        <Card className="gap-4 py-4">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-sm">Padrões de proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="scope">Escopo padrão</Label>
              <Textarea
                id="scope"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo padrão</Label>
              <Input
                id="deadline"
                type="text"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                placeholder="Ex.: 30 dias"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Mensalidade padrão (R$)</Label>
              <Input
                id="monthlyFee"
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(event) => setMonthlyFee(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {message ? (
          <Alert>
            <AlertDescription className="text-success" role="status">
              {message}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={isSaving} data-testid="settings-save">
          {isSaving ? "Salvando…" : "Salvar configurações"}
        </Button>
      </form>
    </section>
  );
}
