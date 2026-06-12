"use client";

import { SelectContent } from "@leadforge/ui";
import type { ComponentProps } from "react";

import { useModalPortalTarget } from "@/components/ui/modal-portal-target";

export function ModalSelectContent(
  props: ComponentProps<typeof SelectContent>,
) {
  const container = useModalPortalTarget();

  return (
    <SelectContent
      position="popper"
      sideOffset={4}
      container={container}
      {...props}
    />
  );
}
