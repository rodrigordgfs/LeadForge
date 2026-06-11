import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "LeadForge",
  description: "Plataforma de prospecção inteligente para agências web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
