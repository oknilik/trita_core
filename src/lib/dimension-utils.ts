export type DimensionTier = "high" | "mid" | "low";

export function getDimensionTier(value: number): DimensionTier {
  if (value >= 70) return "high";
  if (value >= 40) return "mid";
  return "low";
}

export function getDimensionLabel(value: number, locale: string = "hu"): string {
  const labels: Record<string, Record<string, string>> = {
    high: { hu: "erősség", en: "strength" },
    mid: { hu: "mérsékelt", en: "moderate" },
    low: { hu: "figyelendő", en: "watch" },
  };
  const tier = getDimensionTier(value);
  return labels[tier]?.[locale] ?? labels[tier]?.hu ?? "";
}

// Tailwind classok tier-enként — az értékelő ramp tokenjein (globals.css
// --color-eval-*, tükör: color-system.ts EVAL_RAMP): zsálya→bronz→neutrális,
// piros nélkül. A text-változatok AA-biztos fg-fokozatok (a korábbi bronz-
// és ink300-szöveg kis méretben bukott fehéren).
export const tierColors = {
  high: {
    dot: "bg-[var(--color-eval-high-accent)]",
    text: "text-[var(--color-eval-high-accent)]",
    fill: "bg-[var(--color-eval-high-accent)]",
    tagBg: "bg-[var(--color-eval-high-bg)]",
    tagText: "text-[var(--color-eval-high-fg)]",
    border: "border-[var(--color-eval-high-accent)]/20",
    cardBg: "bg-[var(--color-eval-high-bg)]",
    cardHover: "hover:bg-[#dbeee8]",
  },
  mid: {
    dot: "bg-[var(--color-eval-mid-accent)]",
    text: "text-[var(--color-eval-mid-fg)]",
    fill: "bg-[var(--color-eval-mid-accent)]",
    tagBg: "bg-[var(--color-eval-mid-bg)]",
    tagText: "text-[var(--color-eval-mid-fg)]",
    border: "border-[var(--color-eval-mid-accent)]/20",
    cardBg: "bg-[var(--color-eval-mid-bg)]",
    cardHover: "hover:bg-[#f7ede1]",
  },
  low: {
    dot: "border border-[var(--color-eval-low-accent)] bg-[var(--color-sand)]",
    text: "text-[var(--color-eval-low-fg)]",
    fill: "bg-[var(--color-sand)]",
    tagBg: "bg-[var(--color-eval-low-bg)]",
    tagText: "text-[var(--color-eval-low-fg)]",
    border: "border-[var(--color-sand)]",
    cardBg: "bg-surface-card",
    cardHover: "hover:bg-[var(--color-eval-low-bg)]",
  },
} as const;

// TRITAN alskálák — dimenzió KÓD alapján (teszt-független)
export const dimensionFacets: Record<string, string[]> = {
  INTE: ["Egyenesség", "Méltányosság", "Mértékletesség", "Szerénység"],
  RESO: ["Óvatosság", "Stresszérzékenység", "Támaszkeresés", "Érzelmi kötődés"],
  TEMP: ["Társas önbizalom", "Fellépés", "Társaságkedvelés", "Lendület"],
  ADAP: ["Megbocsátás", "Elfogadás", "Rugalmasság", "Türelem"],
  THOR: ["Rendszerezettség", "Kitartás", "Precizitás", "Megfontoltság"],
  OPEN: ["Esztétikai fogékonyság", "Kíváncsiság", "Alkotókedv", "Rendhagyó gondolkodás"],
};
