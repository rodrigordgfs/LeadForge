import { requireAuthUser, toClerkUserData } from "@/lib/auth";
import { syncUserFromClerk } from "@/lib/user-sync";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkUser = await requireAuthUser();
  await syncUserFromClerk(toClerkUserData(clerkUser));

  return <AppShell>{children}</AppShell>;
}
