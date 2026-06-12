"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@leadforge/ui";

export const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/buscas", label: "Buscas" },
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
    <div
      className={cn(
        "flex flex-col p-3",
        collapsed ? "items-center" : "items-stretch",
      )}
    >
      <div
        className={cn(
          "flex w-full justify-center px-1 pb-3",
          collapsed ? "pt-1" : "pt-2",
        )}
      >
        <Image
          src="/shinoda-labs-logo.png"
          alt="Shinoda Labs"
          width={760}
          height={168}
          priority
          className={cn(
            "h-auto w-full object-contain",
            collapsed ? "max-w-10" : "max-w-[180px]",
          )}
          data-testid="shinoda-labs-logo"
        />
      </div>

      <div
        className="mb-3 border-b border-border"
        role="separator"
        aria-hidden="true"
      />

      <nav
        className="flex flex-col gap-1"
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
    </div>
  );
}

export function getPageTitle(pathname: string): string | undefined {
  return navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.label;
}
