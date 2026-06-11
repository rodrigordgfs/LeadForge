"use client";

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
      <h2 className="text-lg font-semibold text-slate-900">Registro de contatos</h2>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Anotações</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            data-testid="contact-notes"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Resultado</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="follow_up">Follow-up</option>
            <option value="interested">Interessado</option>
            <option value="not_interested">Sem interesse</option>
            <option value="scheduled">Reunião agendada</option>
          </select>
        </label>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          data-testid="contact-submit"
        >
          {isSubmitting ? "Salvando…" : "Registrar contato"}
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando histórico…</p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum contato registrado.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {contacts.map((contact) => (
            <li key={contact.id} className="px-4 py-3">
              <p className="text-sm text-slate-900">{contact.notes}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(contact.date).toLocaleString("pt-BR")} · {contact.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
