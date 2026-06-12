/**
 * Clerk appearance mapped to Geist CSS variables from @leadforge/ui.
 * Uses --color-* tokens (hex) because the UI package defines @theme colors directly.
 */
export const clerkAppearance = {
  variables: {
    colorBackground: "var(--color-background)",
    colorText: "var(--color-foreground)",
    colorPrimary: "var(--color-primary)",
    colorInputBackground: "var(--color-background)",
    colorInputText: "var(--color-foreground)",
    colorNeutral: "var(--color-muted-foreground)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    card: "shadow-none border border-border bg-card",
    formButtonPrimary: "bg-primary text-primary-foreground rounded-md",
    navbar: "hidden",
    footer: "hidden",
  },
};
