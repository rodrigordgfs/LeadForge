"use client";

import { Skeleton } from "@leadforge/ui";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import { SimpleModal } from "@/components/ui/simple-modal";

const SearchForm = dynamic(
  () =>
    import("@/components/search/search-form").then((module) => ({
      default: module.SearchForm,
    })),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
    ssr: false,
  },
);

interface NewSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSearchDialog({ open, onOpenChange }: NewSearchDialogProps) {
  const router = useRouter();

  return (
    <SimpleModal
      open={open}
      onClose={() => onOpenChange(false)}
      className="max-w-2xl"
      testId="new-search-dialog"
    >
      <header className="border-b border-[var(--color-border)] px-6 py-4 pr-14">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          Nova busca
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Configure segmento, localização e filtros para encontrar oportunidades.
        </p>
      </header>
      <div className="overflow-y-auto px-6 py-4">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <SearchForm
            onSuccess={(searchJobId) => {
              onOpenChange(false);
              router.push(`/busca/${searchJobId}`);
            }}
          />
        </Suspense>
      </div>
    </SimpleModal>
  );
}
