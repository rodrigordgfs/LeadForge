import { Font } from "@react-pdf/renderer";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

export interface GeistFontDirs {
  sansDir: string;
  monoDir: string;
}

export function resolveGeistFontDirs(): GeistFontDirs {
  const geistDist = path.dirname(require.resolve("geist/font/sans"));
  return {
    sansDir: path.join(geistDist, "fonts/geist-sans"),
    monoDir: path.join(geistDist, "fonts/geist-mono"),
  };
}

let fontsRegistered = false;

export function registerGeistFonts(dirs?: GeistFontDirs): void {
  if (fontsRegistered) {
    return;
  }

  const { sansDir, monoDir } = dirs ?? resolveGeistFontDirs();

  Font.register({
    family: "Geist Sans",
    fonts: [
      { src: path.join(sansDir, "Geist-Regular.ttf"), fontWeight: 400 },
      { src: path.join(sansDir, "Geist-SemiBold.ttf"), fontWeight: 600 },
    ],
  });

  Font.register({
    family: "Geist Mono",
    fonts: [
      { src: path.join(monoDir, "GeistMono-Regular.ttf"), fontWeight: 400 },
    ],
  });

  fontsRegistered = true;
}
