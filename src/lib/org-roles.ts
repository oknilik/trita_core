// ─────────────────────────────────────────────────────────────────────
// Szervezeti szerep-rangsor — EGYETLEN igazságforrás.
//
// Korábban két példányban élt (lib/auth.ts + lib/team-auth.ts, „tartsd
// szinkronban" kommenttel), és az elcsúszás egyszer már bugot okozott
// (a consultant kimaradása). Tiszta, függőség-mentes modul, hogy kliens
// és szerver oldalról egyaránt importálható legyen.
//
// FONTOS: az ORG_CONSULTANT admin-paritású (rank 3) — a hozzárendelt
// tanácsadó a szervezetben admin-jogokkal jár el (explicit termékdöntés,
// 2026-07-22, tag-kezelés racionalizálás).
// ─────────────────────────────────────────────────────────────────────

export const ORG_ROLE_RANK: Record<string, number> = {
  ORG_ADMIN: 3,
  ORG_CONSULTANT: 3,
  ORG_MANAGER: 2,
  ORG_MEMBER: 1,
};

export function hasOrgRole(actual: string, minimum: string): boolean {
  return (ORG_ROLE_RANK[actual] ?? 0) >= (ORG_ROLE_RANK[minimum] ?? 999);
}

/** Csapat-szintű kezelő szerep? (a legacy „admin" team-szerepet is elfogadjuk) */
export function isTeamManagerRole(teamRole: string | null | undefined): boolean {
  return teamRole === "manager" || teamRole === "admin";
}
