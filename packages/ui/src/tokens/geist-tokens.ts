export interface GeistColorTokens {
  background: string;
  foreground: string;
}

export interface GeistTokens {
  light: GeistColorTokens;
  dark: GeistColorTokens;
}

/** Placeholder token map — populated in task_02. */
export const geistTokens: GeistTokens = {
  light: {
    background: "#fafafa",
    foreground: "#171717",
  },
  dark: {
    background: "#0a0a0a",
    foreground: "#ededed",
  },
};
