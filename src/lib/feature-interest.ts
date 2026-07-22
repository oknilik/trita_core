// Feature-interest közös vokabulárium — a kulcsok és címkék egyetlen forrása.
//
// Két külön csatorna dolgozik ugyanabból a Feedback(kind:"feature_interest")
// tárból, szándékosan eltérő viselkedéssel:
//   · LEAD  (/api/feature-interest): meleg lead — rögzít + admin-emailt küld,
//     idempotens (ismételt jelzés nem duplikál). Kulcsok: team, industry_role.
//   · WISHLIST (/api/features/interest): dashboard-kívánságlista — TOGGLE
//     (add/remove), GET-listával. Kulcsok: team, comm, 360.
// A "team" mindkettőben szerepel (ugyanaz a targetKey a tárban).

export const FEATURE_INTEREST_LEAD_KEYS = ["team", "industry_role"] as const;
export const FEATURE_INTEREST_WISHLIST_KEYS = ["team", "comm", "360"] as const;

export type FeatureInterestLeadKey = (typeof FEATURE_INTEREST_LEAD_KEYS)[number];
export type FeatureInterestWishlistKey = (typeof FEATURE_INTEREST_WISHLIST_KEYS)[number];

// Admin-nézet megjelenítési címkéi (minden ismert kulcsra).
export const FEATURE_INTEREST_LABELS: Record<string, string> = {
  team: "Csapatelemzés",
  industry_role: "Hiányzó szakma / iparági szerep",
  comm: "Kommunikációs modul",
  "360": "360° visszajelzés",
};

export function featureInterestLabel(key: string): string {
  return FEATURE_INTEREST_LABELS[key] ?? key;
}
