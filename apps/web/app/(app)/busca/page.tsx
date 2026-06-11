import { SearchForm } from "@/components/search/search-form";

export default function BuscaPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Nova busca</h1>
        <p className="text-sm text-slate-600">
          Configure segmento, localização e filtros para encontrar oportunidades.
        </p>
      </header>
      <SearchForm />
    </section>
  );
}
