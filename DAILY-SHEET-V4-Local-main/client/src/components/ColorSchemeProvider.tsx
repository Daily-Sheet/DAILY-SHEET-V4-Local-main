import { useState, useEffect, createContext, useContext, useMemo } from "react";

export type ShowColorEntry = {
  bg: string;
  bar: string;
  text: string;
  border: string;
  dot: string;
};

const DEFAULT_PALETTE: ShowColorEntry[] = [
  { bg: "bg-blue-500/30", bar: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", border: "border-blue-500/50", dot: "bg-blue-500" },
  { bg: "bg-emerald-500/30", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/50", dot: "bg-emerald-500" },
  { bg: "bg-amber-500/30", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/50", dot: "bg-amber-500" },
  { bg: "bg-violet-500/30", bar: "bg-violet-500", text: "text-violet-700 dark:text-violet-300", border: "border-violet-500/50", dot: "bg-violet-500" },
  { bg: "bg-rose-500/30", bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/50", dot: "bg-rose-500" },
  { bg: "bg-cyan-500/30", bar: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/50", dot: "bg-cyan-500" },
  { bg: "bg-orange-500/30", bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-300", border: "border-orange-500/50", dot: "bg-orange-500" },
  { bg: "bg-pink-500/30", bar: "bg-pink-500", text: "text-pink-700 dark:text-pink-300", border: "border-pink-500/50", dot: "bg-pink-500" },
];

const COLORBLIND_PALETTE: ShowColorEntry[] = [
  { bg: "bg-[#0072B2]/30", bar: "bg-[#0072B2]", text: "text-[#0072B2] dark:text-[#56B4E9]", border: "border-[#0072B2]/50", dot: "bg-[#0072B2]" },
  { bg: "bg-[#E69F00]/30", bar: "bg-[#E69F00]", text: "text-[#E69F00] dark:text-[#F0C75E]", border: "border-[#E69F00]/50", dot: "bg-[#E69F00]" },
  { bg: "bg-[#009E73]/30", bar: "bg-[#009E73]", text: "text-[#009E73] dark:text-[#56D4A3]", border: "border-[#009E73]/50", dot: "bg-[#009E73]" },
  { bg: "bg-[#CC79A7]/30", bar: "bg-[#CC79A7]", text: "text-[#CC79A7] dark:text-[#E0A0C0]", border: "border-[#CC79A7]/50", dot: "bg-[#CC79A7]" },
  { bg: "bg-[#F0E442]/30", bar: "bg-[#F0E442]", text: "text-[#B8A800] dark:text-[#F0E442]", border: "border-[#F0E442]/50", dot: "bg-[#F0E442]" },
  { bg: "bg-[#D55E00]/30", bar: "bg-[#D55E00]", text: "text-[#D55E00] dark:text-[#E88040]", border: "border-[#D55E00]/50", dot: "bg-[#D55E00]" },
  { bg: "bg-[#56B4E9]/30", bar: "bg-[#56B4E9]", text: "text-[#2890C0] dark:text-[#56B4E9]", border: "border-[#56B4E9]/50", dot: "bg-[#56B4E9]" },
  { bg: "bg-[#999999]/30", bar: "bg-[#999999]", text: "text-[#666666] dark:text-[#BBBBBB]", border: "border-[#999999]/50", dot: "bg-[#999999]" },
];

const WARM_PALETTE: ShowColorEntry[] = [
  { bg: "bg-red-500/30", bar: "bg-red-500", text: "text-red-700 dark:text-red-300", border: "border-red-500/50", dot: "bg-red-500" },
  { bg: "bg-orange-500/30", bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-300", border: "border-orange-500/50", dot: "bg-orange-500" },
  { bg: "bg-amber-500/30", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/50", dot: "bg-amber-500" },
  { bg: "bg-yellow-500/30", bar: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-500/50", dot: "bg-yellow-500" },
  { bg: "bg-rose-500/30", bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/50", dot: "bg-rose-500" },
  { bg: "bg-pink-500/30", bar: "bg-pink-500", text: "text-pink-700 dark:text-pink-300", border: "border-pink-500/50", dot: "bg-pink-500" },
  { bg: "bg-fuchsia-500/30", bar: "bg-fuchsia-500", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-500/50", dot: "bg-fuchsia-500" },
  { bg: "bg-[#FF6B6B]/30", bar: "bg-[#FF6B6B]", text: "text-[#CC4444] dark:text-[#FF8888]", border: "border-[#FF6B6B]/50", dot: "bg-[#FF6B6B]" },
];

const COOL_PALETTE: ShowColorEntry[] = [
  { bg: "bg-blue-500/30", bar: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", border: "border-blue-500/50", dot: "bg-blue-500" },
  { bg: "bg-indigo-500/30", bar: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-500/50", dot: "bg-indigo-500" },
  { bg: "bg-violet-500/30", bar: "bg-violet-500", text: "text-violet-700 dark:text-violet-300", border: "border-violet-500/50", dot: "bg-violet-500" },
  { bg: "bg-cyan-500/30", bar: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/50", dot: "bg-cyan-500" },
  { bg: "bg-teal-500/30", bar: "bg-teal-500", text: "text-teal-700 dark:text-teal-300", border: "border-teal-500/50", dot: "bg-teal-500" },
  { bg: "bg-sky-500/30", bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-300", border: "border-sky-500/50", dot: "bg-sky-500" },
  { bg: "bg-emerald-500/30", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/50", dot: "bg-emerald-500" },
  { bg: "bg-slate-500/30", bar: "bg-slate-500", text: "text-slate-700 dark:text-slate-300", border: "border-slate-500/50", dot: "bg-slate-500" },
];

const EARTH_PALETTE: ShowColorEntry[] = [
  { bg: "bg-[#8B6914]/35", bar: "bg-[#8B6914]", text: "text-[#8B6914] dark:text-[#C9A84C]", border: "border-[#8B6914]/50", dot: "bg-[#8B6914]" },
  { bg: "bg-[#2D5F2D]/35", bar: "bg-[#2D5F2D]", text: "text-[#2D5F2D] dark:text-[#6BAF6B]", border: "border-[#2D5F2D]/50", dot: "bg-[#2D5F2D]" },
  { bg: "bg-[#C0603A]/35", bar: "bg-[#C0603A]", text: "text-[#C0603A] dark:text-[#E08860]", border: "border-[#C0603A]/50", dot: "bg-[#C0603A]" },
  { bg: "bg-[#6B4226]/35", bar: "bg-[#6B4226]", text: "text-[#6B4226] dark:text-[#A87B5A]", border: "border-[#6B4226]/50", dot: "bg-[#6B4226]" },
  { bg: "bg-[#7A8450]/35", bar: "bg-[#7A8450]", text: "text-[#7A8450] dark:text-[#A8B47A]", border: "border-[#7A8450]/50", dot: "bg-[#7A8450]" },
  { bg: "bg-[#B8860B]/35", bar: "bg-[#B8860B]", text: "text-[#B8860B] dark:text-[#DAA520]", border: "border-[#B8860B]/50", dot: "bg-[#B8860B]" },
  { bg: "bg-[#556B2F]/35", bar: "bg-[#556B2F]", text: "text-[#556B2F] dark:text-[#8FBC5F]", border: "border-[#556B2F]/50", dot: "bg-[#556B2F]" },
  { bg: "bg-[#8B4513]/35", bar: "bg-[#8B4513]", text: "text-[#8B4513] dark:text-[#CD853F]", border: "border-[#8B4513]/50", dot: "bg-[#8B4513]" },
];

const NEON_PALETTE: ShowColorEntry[] = [
  { bg: "bg-[#FF1493]/35", bar: "bg-[#FF1493]", text: "text-[#FF1493] dark:text-[#FF69B4]", border: "border-[#FF1493]/50", dot: "bg-[#FF1493]" },
  { bg: "bg-[#00FF7F]/35", bar: "bg-[#00FF7F]", text: "text-[#00994C] dark:text-[#00FF7F]", border: "border-[#00FF7F]/50", dot: "bg-[#00FF7F]" },
  { bg: "bg-[#00BFFF]/35", bar: "bg-[#00BFFF]", text: "text-[#0080AA] dark:text-[#00BFFF]", border: "border-[#00BFFF]/50", dot: "bg-[#00BFFF]" },
  { bg: "bg-[#FFD700]/35", bar: "bg-[#FFD700]", text: "text-[#B8960B] dark:text-[#FFD700]", border: "border-[#FFD700]/50", dot: "bg-[#FFD700]" },
  { bg: "bg-[#FF4500]/35", bar: "bg-[#FF4500]", text: "text-[#FF4500] dark:text-[#FF6B3D]", border: "border-[#FF4500]/50", dot: "bg-[#FF4500]" },
  { bg: "bg-[#8B00FF]/35", bar: "bg-[#8B00FF]", text: "text-[#8B00FF] dark:text-[#B366FF]", border: "border-[#8B00FF]/50", dot: "bg-[#8B00FF]" },
  { bg: "bg-[#39FF14]/35", bar: "bg-[#39FF14]", text: "text-[#229910] dark:text-[#39FF14]", border: "border-[#39FF14]/50", dot: "bg-[#39FF14]" },
  { bg: "bg-[#FF073A]/35", bar: "bg-[#FF073A]", text: "text-[#CC0530] dark:text-[#FF4060]", border: "border-[#FF073A]/50", dot: "bg-[#FF073A]" },
];

const PASTEL_PALETTE: ShowColorEntry[] = [
  { bg: "bg-[#FFB3BA]/40", bar: "bg-[#FFB3BA]", text: "text-[#CC5060] dark:text-[#FFB3BA]", border: "border-[#FFB3BA]/60", dot: "bg-[#FFB3BA]" },
  { bg: "bg-[#BAE1FF]/40", bar: "bg-[#BAE1FF]", text: "text-[#4A8DB8] dark:text-[#BAE1FF]", border: "border-[#BAE1FF]/60", dot: "bg-[#BAE1FF]" },
  { bg: "bg-[#BAFFC9]/40", bar: "bg-[#BAFFC9]", text: "text-[#3D8A50] dark:text-[#BAFFC9]", border: "border-[#BAFFC9]/60", dot: "bg-[#BAFFC9]" },
  { bg: "bg-[#E8BAFF]/40", bar: "bg-[#E8BAFF]", text: "text-[#8A4DAA] dark:text-[#E8BAFF]", border: "border-[#E8BAFF]/60", dot: "bg-[#E8BAFF]" },
  { bg: "bg-[#FFFFBA]/40", bar: "bg-[#FFFFBA]", text: "text-[#999930] dark:text-[#FFFFBA]", border: "border-[#FFFFBA]/60", dot: "bg-[#FFFFBA]" },
  { bg: "bg-[#FFDFBA]/40", bar: "bg-[#FFDFBA]", text: "text-[#AA7030] dark:text-[#FFDFBA]", border: "border-[#FFDFBA]/60", dot: "bg-[#FFDFBA]" },
  { bg: "bg-[#D4BAFF]/40", bar: "bg-[#D4BAFF]", text: "text-[#7040AA] dark:text-[#D4BAFF]", border: "border-[#D4BAFF]/60", dot: "bg-[#D4BAFF]" },
  { bg: "bg-[#BAFFED]/40", bar: "bg-[#BAFFED]", text: "text-[#30AA80] dark:text-[#BAFFED]", border: "border-[#BAFFED]/60", dot: "bg-[#BAFFED]" },
];

const HIGH_CONTRAST_PALETTE: ShowColorEntry[] = [
  { bg: "bg-[#E60000]/35", bar: "bg-[#E60000]", text: "text-[#E60000] dark:text-[#FF4D4D]", border: "border-[#E60000]/60", dot: "bg-[#E60000]" },
  { bg: "bg-[#0000E6]/35", bar: "bg-[#0000E6]", text: "text-[#0000E6] dark:text-[#6666FF]", border: "border-[#0000E6]/60", dot: "bg-[#0000E6]" },
  { bg: "bg-[#008000]/35", bar: "bg-[#008000]", text: "text-[#008000] dark:text-[#33CC33]", border: "border-[#008000]/60", dot: "bg-[#008000]" },
  { bg: "bg-[#FF8C00]/35", bar: "bg-[#FF8C00]", text: "text-[#FF8C00] dark:text-[#FFB347]", border: "border-[#FF8C00]/60", dot: "bg-[#FF8C00]" },
  { bg: "bg-[#800080]/35", bar: "bg-[#800080]", text: "text-[#800080] dark:text-[#CC66CC]", border: "border-[#800080]/60", dot: "bg-[#800080]" },
  { bg: "bg-[#008B8B]/35", bar: "bg-[#008B8B]", text: "text-[#008B8B] dark:text-[#40E0D0]", border: "border-[#008B8B]/60", dot: "bg-[#008B8B]" },
  { bg: "bg-[#DC143C]/35", bar: "bg-[#DC143C]", text: "text-[#DC143C] dark:text-[#FF6680]", border: "border-[#DC143C]/60", dot: "bg-[#DC143C]" },
  { bg: "bg-[#1A1A1A]/35", bar: "bg-[#1A1A1A]", text: "text-[#1A1A1A] dark:text-[#CCCCCC]", border: "border-[#1A1A1A]/60", dot: "bg-[#1A1A1A]" },
];

export type PaletteName = "default" | "colorblind" | "warm" | "cool" | "earth" | "neon" | "pastel" | "highContrast";

export const PALETTES: Record<PaletteName, { label: string; colors: ShowColorEntry[] }> = {
  default: { label: "Default", colors: DEFAULT_PALETTE },
  colorblind: { label: "Colorblind Safe", colors: COLORBLIND_PALETTE },
  warm: { label: "Warm", colors: WARM_PALETTE },
  cool: { label: "Cool", colors: COOL_PALETTE },
  earth: { label: "Earth", colors: EARTH_PALETTE },
  neon: { label: "Neon", colors: NEON_PALETTE },
  pastel: { label: "Pastel", colors: PASTEL_PALETTE },
  highContrast: { label: "High Contrast", colors: HIGH_CONTRAST_PALETTE },
};

type ColorSchemeContextType = {
  palette: PaletteName;
  setPalette: (p: PaletteName) => void;
  colors: ShowColorEntry[];
  buildColorMap: (eventNames: string[]) => Map<string, ShowColorEntry>;
};

const ColorSchemeContext = createContext<ColorSchemeContextType>({
  palette: "default",
  setPalette: () => {},
  colors: DEFAULT_PALETTE,
  buildColorMap: () => new Map(),
});

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteName>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("colorScheme") as PaletteName) || "default";
    }
    return "default";
  });

  useEffect(() => {
    localStorage.setItem("colorScheme", palette);
    const root = document.documentElement;
    if (palette === "default") {
      root.removeAttribute("data-palette");
    } else {
      root.setAttribute("data-palette", palette);
    }
  }, [palette]);

  const colors = PALETTES[palette].colors;

  const buildColorMap = useMemo(() => {
    return (eventNames: string[]) => {
      const map = new Map<string, ShowColorEntry>();
      eventNames.forEach((name, i) => {
        map.set(name, colors[i % colors.length]);
      });
      return map;
    };
  }, [colors]);

  return (
    <ColorSchemeContext.Provider value={{ palette, setPalette: setPaletteState, colors, buildColorMap }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}
