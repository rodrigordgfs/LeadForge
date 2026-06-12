"use client";

import { createContext, useContext } from "react";

const ModalPortalTargetContext = createContext<HTMLElement | null>(null);

export function ModalPortalTargetProvider({
  target,
  children,
}: {
  target: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <ModalPortalTargetContext.Provider value={target}>
      {children}
    </ModalPortalTargetContext.Provider>
  );
}

export function useModalPortalTarget(): HTMLElement | null {
  return useContext(ModalPortalTargetContext);
}
