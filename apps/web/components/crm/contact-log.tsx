"use client";

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Textarea,
} from "@leadforge/ui";
import { useCallback, useEffect, useState } from "react";

export interface ContactEntry {
  id: string;
  date: string;
  notes: string;
  status: string;
  nextContact?: string | null;
}

interface ContactLogProps {
  leadId: string;
}

export function ContactLog({ leadId }: ContactLogProps) {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("follow_up");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/contacts`);
      if (!response.ok) {
        throw new Error("Falha ao carregar contatos");
      }

      const data = (await response.json()) as ContactEntry[];
      setContacts(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Falha ao carregar contatos",
      );
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError("Informe as anotações do contato");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim(), status }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Falha ao registrar contato");
      }

      setNotes("");
      await loadContacts();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao registrar contato",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4" data-testid="contact-log">
      <h2 className="text-lg font-semibold text-foreground">
        Registro de contatos
      </h2>

      <Card className="gap-4 py-4">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-sm">Novo contato</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Anotações</Label>
              <Textarea
                id="contact-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                data-testid="contact-notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-status">Resultado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="contact-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="interested">Interessado</SelectItem>
                  <SelectItem value="not_interested">Sem interesse</SelectItem>
                  <SelectItem value="scheduled">Reunião agendada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              data-testid="contact-submit"
            >
              {isSubmitting ? "Salvando…" : "Registrar contato"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum contato registrado.
        </p>
      ) : (
        <Card className="gap-0 py-0">
          <ul>
            {contacts.map((contact, index) => (
              <li key={contact.id}>
                {index > 0 ? <Separator /> : null}
                <div className="px-4 py-3">
                  <p className="text-sm text-foreground">{contact.notes}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {new Date(contact.date).toLocaleString("pt-BR")} ·{" "}
                    {contact.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
