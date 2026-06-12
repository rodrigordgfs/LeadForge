"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@leadforge/ui";

import { AppHeader } from "./app-header";
import { AppSidebar, getPageTitle } from "./app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        pageTitle={pageTitle}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <aside
          className={`hidden shrink-0 border-r border-border bg-background transition-[width] duration-200 md:block ${
            sidebarCollapsed ? "w-16" : "w-56"
          }`}
        >
          <AppSidebar collapsed={sidebarCollapsed} />
        </aside>

        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>LeadForge</SheetTitle>
          </SheetHeader>
          <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
