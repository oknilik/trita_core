import type { Localized } from "./questions";

/** Bits in information/coordination/decision/execution order: 0=left, 1=right. */
export const OPERATING_PATTERNS = {
  "0000": { hu: "Irányítótorony", en: "Control Tower" },
  "0001": { hu: "Navigációs központ", en: "Navigation Hub" },
  "0010": { hu: "Óramű", en: "Clockwork" },
  "0011": { hu: "Kísérleti műhely", en: "Experiment Workshop" },
  "0100": { hu: "Vezényelt zenekar", en: "Conducted Orchestra" },
  "0101": { hu: "Kutatóhajó", en: "Research Vessel" },
  "0110": { hu: "Váltócsapat", en: "Relay Team" },
  "0111": { hu: "Felfedezőhálózat", en: "Explorer Network" },
  "1000": { hu: "Művezetői kör", en: "Foreman's Circle" },
  "1001": { hu: "Bevetési csapat", en: "Response Crew" },
  "1010": { hu: "Mesterek céhe", en: "Craft Guild" },
  "1011": { hu: "Alkotóműhely", en: "Creative Workshop" },
  "1100": { hu: "Összeszokott legénység", en: "Seasoned Crew" },
  "1101": { hu: "Terepjáró csapat", en: "Trail Crew" },
  "1110": { hu: "Közös ritmus", en: "Shared Rhythm" },
  "1111": { hu: "Jam session", en: "Jam Session" },
} as const satisfies Record<string, Localized>;
export type OperatingPatternCode = keyof typeof OPERATING_PATTERNS;
