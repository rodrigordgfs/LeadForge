"use client";

import { XIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@leadforge/ui";

import { ModalPortalTargetProvider } from "@/components/ui/modal-portal-target";

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  testId?: string;
  showCloseButton?: boolean;
}

export function SimpleModal({
  open,
  onClose,
  children,
  className = "",
  testId,
  showCloseButton = true,
}: SimpleModalProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid={testId}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        ref={setPortalTarget}
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-visible rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-2xl ${className}`}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {showCloseButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-[210]"
            aria-label="Fechar"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </Button>
        ) : null}
        <ModalPortalTargetProvider target={portalTarget}>
          {children}
        </ModalPortalTargetProvider>
      </div>
    </div>,
    document.body,
  );
}
