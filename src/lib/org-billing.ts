// ─────────────────────────────────────────────────────────────────────
// Cég-/számlázási adatok (Organization.billingProfile) — mező-definíciók.
//
// KIZÁRÓLAG az admin felület (Szervezetek nézet) jeleníti meg és
// szerkeszti — az ügyfél-oldali felületeken nem látszik. Célja: a
// számlázáshoz és szerződéskezeléshez szükséges adatok egy helyen.
//
// Kliens-safe modul (nincs prisma-függés): a form és az API validáció
// ugyanebből a listából dolgozik.
// ─────────────────────────────────────────────────────────────────────

export interface OrgBillingProfile {
  /** Hivatalos cégnév (ha eltér a megjelenített névtől) */
  legalName?: string;
  /** Adószám */
  taxId?: string;
  /** EU közösségi adószám */
  euVatId?: string;
  /** Irányítószám */
  zip?: string;
  /** Város */
  city?: string;
  /** Utca, házszám */
  address?: string;
  /** Ország (alapért.: Magyarország) */
  country?: string;
  /** Kapcsolattartó neve */
  contactName?: string;
  /** Kapcsolattartó email */
  contactEmail?: string;
  /** Kapcsolattartó telefon */
  contactPhone?: string;
  /** Számlázási email (ha eltér a kapcsolattartóétól) */
  billingEmail?: string;
  /** Iparág */
  industry?: string;
  /** Belső megjegyzés (fizetési feltételek, PO-szám igény stb.) */
  note?: string;
}

export const ORG_BILLING_FIELDS: Array<{
  key: keyof OrgBillingProfile;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "textarea";
}> = [
  { key: "legalName", label: "Hivatalos cégnév", placeholder: "pl. Kovács Tanácsadó Kft." },
  { key: "taxId", label: "Adószám", placeholder: "12345678-2-42" },
  { key: "euVatId", label: "EU adószám", placeholder: "HU12345678" },
  { key: "zip", label: "Irányítószám", placeholder: "1051" },
  { key: "city", label: "Város", placeholder: "Budapest" },
  { key: "address", label: "Utca, házszám", placeholder: "Fő utca 1." },
  { key: "country", label: "Ország", placeholder: "Magyarország" },
  { key: "contactName", label: "Kapcsolattartó", placeholder: "Kovács Anna" },
  { key: "contactEmail", label: "Kapcsolattartó email", type: "email", placeholder: "nev@ceg.hu" },
  { key: "contactPhone", label: "Telefon", placeholder: "+36 30 123 4567" },
  { key: "billingEmail", label: "Számlázási email", type: "email", placeholder: "szamla@ceg.hu" },
  { key: "industry", label: "Iparág", placeholder: "pl. IT, gyártás, pénzügy" },
  { key: "note", label: "Belső megjegyzés", type: "textarea", placeholder: "Fizetési feltételek, PO-szám, egyéb…" },
];

/** Ismeretlen kulcsok kiszűrése + üres stringek elhagyása (tároláshoz). */
export function sanitizeOrgBillingProfile(input: unknown): OrgBillingProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const allowed = new Set(ORG_BILLING_FIELDS.map((f) => f.key as string));
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!allowed.has(key)) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > 500) continue;
    out[key] = trimmed;
  }
  return out as OrgBillingProfile;
}

/** Van-e legalább egy kitöltött mező? (lista-jelzéshez) */
export function hasBillingData(profile: unknown): boolean {
  return Object.keys(sanitizeOrgBillingProfile(profile)).length > 0;
}
