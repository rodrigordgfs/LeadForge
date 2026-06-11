interface DiagnosisPanelProps {
  problems?: string[];
  opportunities?: string[];
}

export function DiagnosisPanel({ problems = [], opportunities = [] }: DiagnosisPanelProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2" data-testid="diagnosis-panel">
      <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
        <h3 className="text-sm font-semibold text-red-900">Problemas</h3>
        {problems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nenhum problema identificado.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
        <h3 className="text-sm font-semibold text-emerald-900">Oportunidades</h3>
        {opportunities.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Nenhuma oportunidade identificada.
          </p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {opportunities.map((opportunity) => (
              <li key={opportunity}>{opportunity}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
