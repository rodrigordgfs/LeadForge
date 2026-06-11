import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { requireAuthUser, toClerkUserData } from "@/lib/auth";
import { syncUserFromClerk } from "@/lib/user-sync";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/busca", label: "Busca" },
  { href: "/crm", label: "CRM" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
];

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkUser = await requireAuthUser();
  await syncUserFromClerk(toClerkUserData(clerkUser));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-lg font-semibold text-slate-900">LeadForge</p>
          <p className="text-sm text-slate-500">Prospecção inteligente</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-8 py-4">
          <p className="text-sm text-slate-500">Área autenticada</p>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
