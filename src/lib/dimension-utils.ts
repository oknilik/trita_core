export type DimensionTier = "high" | "mid" | "low";

export function getDimensionTier(value: number): DimensionTier {
  if (value >= 70) return "high";
  if (value >= 40) return "mid";
  return "low";
}

export function getDimensionLabel(value: number, locale: string = "hu"): string {
  const isHu = locale === "hu";
  if (value >= 70) return isHu ? "erősség" : "strength";
  if (value >= 40) return isHu ? "mérsékelt" : "moderate";
  return isHu ? "figyelendő" : "watch";
}

// Tailwind classok tier-enként
export const tierColors = {
  high: {
    dot: "bg-[#3d6b5e]",
    text: "text-[#3d6b5e]",
    fill: "bg-[#3d6b5e]",
    tagBg: "bg-[#e8f2f0]",
    tagText: "text-[#1e3d34]",
    border: "border-[#3d6b5e]/20",
    cardBg: "bg-[#e8f2f0]",
    cardHover: "hover:bg-[#dbeee8]",
  },
  mid: {
    dot: "bg-[#c17f4a]",
    text: "text-[#c17f4a]",
    fill: "bg-[#c17f4a]",
    tagBg: "bg-[#fdf5ee]",
    tagText: "text-[#8a5530]",
    border: "border-[#c17f4a]/20",
    cardBg: "bg-[#fdf5ee]",
    cardHover: "hover:bg-[#f7ede1]",
  },
  low: {
    dot: "border border-[#8a8a9a] bg-[#e8e0d3]",
    text: "text-[#8a8a9a]",
    fill: "bg-[#e8e0d3]",
    tagBg: "bg-[#f2ede6]",
    tagText: "text-[#8a8a9a]",
    border: "border-[#e8e0d3]",
    cardBg: "bg-white",
    cardHover: "hover:bg-[#f2ede6]",
  },
} as const;

// HEXACO alskálák — dimenzió KÓD alapján (teszt-független)
export const dimensionFacets: Record<string, string[]> = {
  H: ["Őszinteség", "Igazságosság", "Szerénység", "Önzetlenség"],
  E: ["Félelem", "Szorongás", "Függőség", "Érzékenység"],
  X: ["Társas önértékelés", "Társas merészség", "Szociabilitás", "Élénkség"],
  A: ["Megbocsátás", "Kedvesség", "Rugalmasság", "Türelem"],
  C: ["Szervezettség", "Szorgalom", "Perfekcionizmus", "Körültekintés"],
  O: ["Esztétikai érzék", "Kíváncsiság", "Kreativitás", "Nem-konvencionálitás"],
};
