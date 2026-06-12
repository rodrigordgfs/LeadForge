export interface GeistColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  success: string;
  warning: string;
}

export type GeistSpacingKey = "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";

export interface GeistRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  pill: string;
}

export interface GeistTokens {
  light: GeistColorTokens;
  dark: GeistColorTokens;
  spacing: Record<GeistSpacingKey, string>;
  radius: GeistRadiusTokens;
  fontSans: string;
  fontMono: string;
}

const lightColors: GeistColorTokens = {
  background: "#fafafa",
  foreground: "#171717",
  card: "#ffffff",
  cardForeground: "#171717",
  muted: "#f5f5f5",
  mutedForeground: "#737373",
  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "#171717",
  primary: "#171717",
  primaryForeground: "#fafafa",
  destructive: "#e5484d",
  success: "#46a758",
  warning: "#ffb224",
};

const darkColors: GeistColorTokens = {
  background: "#0a0a0a",
  foreground: "#ededed",
  card: "#171717",
  cardForeground: "#ededed",
  muted: "#171717",
  mutedForeground: "#a3a3a3",
  border: "#333333",
  input: "#333333",
  ring: "#ededed",
  primary: "#ededed",
  primaryForeground: "#0a0a0a",
  destructive: "#e5484d",
  success: "#46a758",
  warning: "#ffb224",
};

export const geistTokens: GeistTokens = {
  light: lightColors,
  dark: darkColors,
  spacing: {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
  },
  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    pill: "9999px",
  },
  fontSans: "Geist Sans",
  fontMono: "Geist Mono",
};

/** Flat color map for @react-pdf StyleSheet (dark theme default). */
export const pdfTokens = {
  ...darkColors,
  spacing: geistTokens.spacing,
  radius: geistTokens.radius,
  fontSans: geistTokens.fontSans,
  fontMono: geistTokens.fontMono,
} as const;
