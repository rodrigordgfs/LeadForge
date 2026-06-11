import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { requireAuthUser, toClerkUserData } from "@/lib/auth";
import { syncUserFromClerk } from "@/lib/user-sync";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/busca", label: "Busca" },
  { href: "/crm", label: "CRM" },
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
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:flex md:w-64 md:flex-col md:border-b-0 md:border-r">
        <div className="border-b border-slate-200 px-4 py-4 md:px-6 md:py-5">
          <p className="text-lg font-semibold text-slate-900">LeadForge</p>
          <p className="text-sm text-slate-500">Prospecção inteligente</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col md:p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden border-t border-slate-200 p-4 md:block">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8 md:py-4">
          <p className="text-sm text-slate-500">Área autenticada</p>
          <div className="md:hidden">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
