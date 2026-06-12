"use client";

import {
  BRAZILIAN_UFS,
  getAllSegments,
  type CreateSearchInput,
} from "@leadforge/shared";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@leadforge/ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ModalSelectContent } from "@/components/ui/modal-select-content";

const segments = getAllSegments();

interface SearchFormProps {
  onSuccess?: (searchJobId: string) => void;
}

export function SearchForm({ onSuccess }: SearchFormProps) {
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
      if (onSuccess) {
        onSuccess(data.searchJobId);
      } else {
        router.push(`/busca/${data.searchJobId}`);
      }
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
        <div className="space-y-2">
          <Label htmlFor="segment">Segmento</Label>
          <Select value={segmentId} onValueChange={handleSegmentChange}>
            <SelectTrigger
              id="segment"
              className="w-full"
              data-testid="segment-select"
            >
              <SelectValue />
            </SelectTrigger>
            <ModalSelectContent>
              {segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.name}
                </SelectItem>
              ))}
            </ModalSelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategoria (opcional)</Label>
          <Select
            value={subcategoryId || "all"}
            onValueChange={(value) =>
              setSubcategoryId(value === "all" ? "" : value)
            }
          >
            <SelectTrigger
              id="subcategory"
              className="w-full"
              data-testid="subcategory-select"
            >
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <ModalSelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {selectedSegment?.subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </ModalSelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Select
            value={state}
            onValueChange={(value) =>
              setState(value as (typeof BRAZILIAN_UFS)[number])
            }
          >
            <SelectTrigger id="state" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <ModalSelectContent>
              {BRAZILIAN_UFS.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </ModalSelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ex.: São Paulo"
            aria-invalid={cityError ? true : undefined}
            data-testid="city-input"
          />
          {cityError ? (
            <p className="text-xs text-destructive">{cityError}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="radius">
            Raio (km): <span className="font-mono">{radiusKm}</span>
          </Label>
          <Input
            id="radius"
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="h-2 cursor-pointer p-0"
          />
        </div>
      </div>

      <Card className="gap-4 py-4">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-sm">Filtros opcionais</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasWebsite"
                checked={hasWebsite}
                onCheckedChange={(checked) => setHasWebsite(checked === true)}
              />
              <Label htmlFor="hasWebsite" className="font-normal">
                Possui site
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="noWebsite"
                checked={noWebsite}
                onCheckedChange={(checked) => setNoWebsite(checked === true)}
              />
              <Label htmlFor="noWebsite" className="font-normal">
                Sem site
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasWhatsapp"
                checked={hasWhatsapp}
                onCheckedChange={(checked) => setHasWhatsapp(checked === true)}
              />
              <Label htmlFor="hasWhatsapp" className="font-normal">
                Possui WhatsApp
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasInstagram"
                checked={hasInstagram}
                onCheckedChange={(checked) => setHasInstagram(checked === true)}
              />
              <Label htmlFor="hasInstagram" className="font-normal">
                Possui Instagram
              </Label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="minRating">Avaliação mínima (0–5)</Label>
              <Input
                id="minRating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                placeholder="Ex.: 4.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Iniciando busca…" : "Iniciar busca"}
      </Button>
    </form>
  );
}

export { segments as searchFormSegments };
