"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@leadforge/ui";

import { ThemeToggle } from "./theme-toggle";

type AppHeaderProps = {
  pageTitle?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
};

export function AppHeader({
  pageTitle,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileNav,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Abrir menu"
        onClick={onOpenMobileNav}
      >
        <Menu className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        aria-label={sidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        onClick={onToggleSidebar}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-semibold text-foreground">LeadForge</p>
        {pageTitle ? (
          <p className="truncate text-xs text-muted-foreground">{pageTitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
