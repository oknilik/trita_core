import { z } from "zod";

// Feature-interest közös vokabulárium — a kulcsok, címkék és a POST-séma
// egyetlen forrása.
//
// Egyetlen végpont (/api/features/interest) szolgál ki két módot, közös
// Feedback(kind:"feature_interest") tárból, szándékosan eltérő viselkedéssel:
//   · LEAD  (mode:"lead"): meleg lead — rögzít + admin-emailt küld,
//     idempotens (ismételt jelzés nem duplikál). Kulcsok: team, industry_role.
//   · WISHLIST (mode:"wishlist"): dashboard-kívánságlista — TOGGLE
//     (add/remove), GET-listával. Kulcsok: team, comm, 360.
// A "team" mindkettőben szerepel (ugyanaz a targetKey a tárban).
// A régi /api/feature-interest út 308-cal ide irányít (?legacy=lead).

export const FEATURE_INTEREST_LEAD_KEYS = ["team", "industry_role"] as const;
export const FEATURE_INTEREST_WISHLIST_KEYS = ["team", "comm", "360"] as const;

export type FeatureInterestLeadKey = (typeof FEATURE_INTEREST_LEAD_KEYS)[number];
export type FeatureInterestWishlistKey = (typeof FEATURE_INTEREST_WISHLIST_KEYS)[number];

// Ezeknél a lead-kulcsoknál egy user csak egyszer jelezhet; a többinél (pl.
// szakma-javaslat) az ismételt beküldés is értékes — akkor csak emailt
// küldünk, rekordot nem duplikálunk.
export const FEATURE_INTEREST_LEAD_UNIQUE_KEYS: ReadonlySet<string> = new Set(["team"]);

export const featureInterestPostSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("lead"),
    featureKey: z.enum(FEATURE_INTEREST_LEAD_KEYS),
    message: z.string().trim().max(2000).optional(),
  }),
  z.object({
    mode: z.literal("wishlist"),
    featureKey: z.enum(FEATURE_INTEREST_WISHLIST_KEYS),
  }),
]);

export type FeatureInterestPostBody = z.infer<typeof featureInterestPostSchema>;

// Mode-hiányos (régi kliens) payload normalizálása: a 308-cal átirányított
// /api/feature-interest hívás ?legacy=lead jelölővel érkezik — az lead;
// minden más mode nélküli POST a korábbi wishlist-viselkedést kapja.
export function normalizeFeatureInterestBody(body: unknown, legacyLead: boolean): unknown {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return body;
  if ("mode" in body) return body;
  return { ...body, mode: legacyLead ? "lead" : "wishlist" };
}

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
