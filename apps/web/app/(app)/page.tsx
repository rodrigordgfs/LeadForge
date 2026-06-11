export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="text-slate-600">
        Bem-vindo ao LeadForge. Em breve você verá métricas de prospecção,
        oportunidades e atividades recentes aqui.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Leads ativos</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Buscas em andamento</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Alta oportunidade</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
      </div>
    </section>
  );
}
