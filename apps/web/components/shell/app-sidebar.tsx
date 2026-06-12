"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@leadforge/ui";

export const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/busca", label: "Busca" },
  { href: "/crm", label: "CRM" },
  { href: "/configuracoes", label: "Configurações" },
] as const;

type AppSidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function AppSidebar({ collapsed = false, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-col gap-1 p-3",
        collapsed ? "items-center" : "items-stretch",
      )}
      aria-label="Navegação principal"
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "rounded-md text-sm font-medium transition-colors",
              collapsed ? "px-2 py-2 text-center" : "px-3 py-2",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {collapsed ? item.label.charAt(0) : item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function getPageTitle(pathname: string): string | undefined {
  return navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.label;
}
