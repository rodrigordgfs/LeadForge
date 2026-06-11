"use client";

import {
  BRAZILIAN_UFS,
  getAllSegments,
  type CreateSearchInput,
} from "@leadforge/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const segments = getAllSegments();

export function SearchForm() {
  const router = useRouter();
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [state, setState] = useState<(typeof BRAZILIAN_UFS)[number]>("SP");
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [noWebsite, setNoWebsite] = useState(false);
  const [minRating, setMinRating] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasInstagram, setHasInstagram] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.id === segmentId),
    [segmentId],
  );

  const handleSegmentChange = (nextSegmentId: string) => {
    setSegmentId(nextSegmentId);
    setSubcategoryId("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCityError(null);
    setSubmitError(null);

    if (!city.trim()) {
      setCityError("Informe a cidade");
      return;
    }

    const payload: CreateSearchInput = {
      segmentId,
      state,
      city: city.trim(),
      radiusKm,
      filters: {
        ...(hasWebsite ? { hasWebsite: true } : {}),
        ...(noWebsite ? { noWebsite: true } : {}),
        ...(minRating ? { minRating: Number(minRating) } : {}),
        ...(hasWhatsapp ? { hasWhatsapp: true } : {}),
        ...(hasInstagram ? { hasInstagram: true } : {}),
      },
    };

    if (subcategoryId) {
      payload.subcategoryId = subcategoryId;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Falha ao iniciar busca");
      }

      const data = (await response.json()) as { searchJobId: string };
      router.push(`/busca/${data.searchJobId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Falha ao iniciar busca",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Segmento</span>
          <select
            value={segmentId}
            onChange={(event) => handleSegmentChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            data-testid="segment-select"
          >
            {segments.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">
            Subcategoria (opcional)
          </span>
          <select
            value={subcategoryId}
            onChange={(event) => setSubcategoryId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            data-testid="subcategory-select"
          >
            <option value="">Todas</option>
            {selectedSegment?.subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Estado</span>
          <select
            value={state}
            onChange={(event) =>
              setState(event.target.value as (typeof BRAZILIAN_UFS)[number])
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {BRAZILIAN_UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Cidade</span>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ex.: São Paulo"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            data-testid="city-input"
          />
          {cityError ? (
            <span className="text-xs text-red-600">{cityError}</span>
          ) : null}
        </label>

        <label className="block space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Raio (km): {radiusKm}
          </span>
          <input
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="w-full"
          />
        </label>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Filtros opcionais
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasWebsite}
              onChange={(event) => setHasWebsite(event.target.checked)}
            />
            Possui site
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={noWebsite}
              onChange={(event) => setNoWebsite(event.target.checked)}
            />
            Sem site
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasWhatsapp}
              onChange={(event) => setHasWhatsapp(event.target.checked)}
            />
            Possui WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasInstagram}
              onChange={(event) => setHasInstagram(event.target.checked)}
            />
            Possui Instagram
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span>Avaliação mínima (0–5)</span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(event) => setMinRating(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ex.: 4.0"
            />
          </label>
        </div>
      </fieldset>

      {submitError ? (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isSubmitting ? "Iniciando busca…" : "Iniciar busca"}
      </button>
    </form>
  );
}

export { segments as searchFormSegments };
