// ─────────────────────────────────────────────────────────────────────
// Mérés-kezelési jogosultság (kampányok: 360°, szerep-kör, pszich. biztonság)
//
// Döntés (2026-07-17): a méréseket ELSŐ KÖRBEN csak a tanácsadó kezeli —
// az org-adminok a csapataikat és a publikált riportokat látják, mérést
// nem indítanak. Tanácsadónak számít:
//   1. az ORG_CONSULTANT szerepű tag (trita-admin osztja ki), és
//   2. a platform-tanácsadók (UserProfile.isConsultant — az admin
//      onboardolja őket a ConsultantInvite úton), és
//   3. a platform-admin fiókok (ADMIN_EMAILS env) — a konzultáció-vezérelt
//      működésben az alapító maga a tanácsadó, és a demó/teszt is így fut.
//
// Ez a modul CSAK szerver-oldalon használható (env-t olvas). Kliens felé
// a kiszámolt boolean-t add át propként.
// ─────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

/**
 * Kezelhet-e méréseket (kampány létrehozás/aktiválás/zárás/résztvevők,
 * emlékeztetők, szerep-kör indítás) az adott org-tag?
 */
export function canManageMeasurements(
  orgRole: string | null | undefined,
  email?: string | null,
  isConsultant?: boolean | null,
): boolean {
  return (
    orgRole === "ORG_CONSULTANT" ||
    isConsultant === true ||
    isPlatformAdminEmail(email)
  );
}

/**
 * Tanácsadói felület-e (nyers csapat-adatok, riport-vázlat, mérés-idővonal)?
 * Jelenleg azonos a mérés-kezelési körrel — szándékosan egy fogalom.
 */
export function isConsultantSurface(
  orgRole: string | null | undefined,
  email?: string | null,
  isConsultant?: boolean | null,
): boolean {
  return canManageMeasurements(orgRole, email, isConsultant);
}

/**
 * Láthatja-e a tag-dossziét? DÖNTÖTT (2026-07-28): KIZÁRÓLAG org admin +
 * tanácsadói kör — a manager NEM, a tag a sajátját SEM. Szándékosan
 * explicit allowlist, NEM rang-alapú (a hasOrgRole a managert is beengedné).
 */
export function canViewMemberDossier(
  orgRole: string | null | undefined,
  email?: string | null,
  isConsultant?: boolean | null,
): boolean {
  return (
    orgRole === "ORG_ADMIN" || isConsultantSurface(orgRole, email, isConsultant)
  );
}
