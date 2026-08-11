// ─────────────────────────────────────────────────────────────────────
// Trita csapatszerep-modell — 9 szerep, saját névtér és scoring.
//
// A korábbi 7×8-as pontelosztásos SPI-scoring kivezetve (jogi kiváltás,
// ld. docs/product/team-role-instrument-replacement-plan.md). Az új
// formátum: 27 itemes kiválasztás (8–12 jelölés + 3 kiemelt, dupla
// súllyal) — az itembank a team-role-questions.ts-ben él, és self + peer
// perspektívában ugyanaz.
// ─────────────────────────────────────────────────────────────────────

import type { TeamRoleSelections } from "./team-role-questions";

export const TEAM_ROLES = {
  OG: { hu: "Ötletgazda", en: "Idea Generator" },
  KE: { hu: "Kapcsolatépítő", en: "Opportunity Scout" },
  KO: { hu: "Koordinátor", en: "Coordinator" },
  HA: { hu: "Hajtóerő", en: "Driver" },
  ER: { hu: "Értékelő-elemző", en: "Critical Evaluator" },
  CS: { hu: "Csapatsegítő", en: "Team Supporter" },
  MV: { hu: "Megvalósító", en: "Executor" },
  MI: { hu: "Minőségőr", en: "Quality Guardian" },
  SZ: { hu: "Szakértő", en: "Domain Expert" },
} as const;

export type TeamRoleCode = keyof typeof TEAM_ROLES;

/**
 * Egy mondatos indoklás a PROFIL-ALAPÚ becsléshez (P5.3) — miért ez a
 * szerep következik a TRITAN-profilból. A megfogalmazás a becslő
 * (team-role-estimate) súlyait tükrözi; MÉRT kérdőíves eredménynél nem
 * használjuk (ott a kitöltés maga az indok).
 */
export const TEAM_ROLE_WHY: Record<TeamRoleCode, { hu: string; en: string }> = {
  OG: {
    hu: "Mert az újító, rendhagyó gondolkodás hajt, és nem ragadsz le a bevett keretekben.",
    en: "Because inventive, unconventional thinking drives you, and set frames don't hold you.",
  },
  KE: {
    hu: "Mert az extraverzió és a nyitottság nálad természetes kapunyitás mások és új lehetőségek felé.",
    en: "Because extraversion and openness make you a natural door-opener to people and opportunities.",
  },
  KO: {
    hu: "Mert az emberek és az elvek összehangolása egyszerre fontos számodra.",
    en: "Because aligning people and principles matters to you at the same time.",
  },
  HA: {
    hu: "Mert a lendület és a közvetlen, nyomás alatt is toló stílus nálad együtt jár.",
    en: "Because momentum and a direct, pressure-proof pushing style go together in you.",
  },
  ER: {
    hu: "Mert az alapos, kritikus mérlegelés erősebb nálad, mint a rivaldafény igénye.",
    en: "Because thorough, critical weighing is stronger in you than the need for the spotlight.",
  },
  CS: {
    hu: "Mert a barátságosság és a másokra hangolódás a profilod erős vonása.",
    en: "Because agreeableness and attunement to others are strong threads in your profile.",
  },
  MV: {
    hu: "Mert a megbízható, következetes végrehajtás a profilod magja.",
    en: "Because dependable, consistent execution is the core of your profile.",
  },
  MI: {
    hu: "Mert a precizitás és a hibákra való érzékenység együtt mozog nálad.",
    en: "Because precision and sensitivity to errors move together in you.",
  },
  SZ: {
    hu: "Mert a mély, fókuszált tudásépítés vonz jobban, mint a széles színpad.",
    en: "Because deep, focused expertise-building draws you more than a broad stage.",
  },
};

export type TeamRoleScores = Record<TeamRoleCode, number>;

/** Item-id → szerep-kód (az id prefixe a szerep-kód: "OG1" → "OG"). */
function itemRole(itemId: string): TeamRoleCode | null {
  const prefix = itemId.slice(0, 2);
  return prefix in TEAM_ROLES ? (prefix as TeamRoleCode) : null;
}

/**
 * Szerep-pontszámok egy kiválasztás-halmazból, 0–100 skálán.
 *
 * Szerepenként az elméleti maximum: mind a 3 item kiemelt jelöléssel
 * (3 × 2 = 6 súly) — a gyakorlatban a 3 kiemelt-limit miatt ritka, de a
 * skála így stabil, és a self és peer profilok összevethetők rajta.
 */
export function calculateTeamRoleScores(
  selections: TeamRoleSelections,
): TeamRoleScores {
  const totals = Object.fromEntries(
    Object.keys(TEAM_ROLES).map((k) => [k, 0]),
  ) as TeamRoleScores;

  for (const [itemId, weight] of Object.entries(selections)) {
    const role = itemRole(itemId);
    if (role && (weight === 1 || weight === 2)) {
      totals[role] += weight;
    }
  }

  const MAX_PER_ROLE = 6; // 3 item × 2 súly
  for (const role of Object.keys(totals) as TeamRoleCode[]) {
    totals[role] = Math.round((totals[role] / MAX_PER_ROLE) * 100);
  }

  return totals;
}

/**
 * FNV-1a hash — kicsi, függőség-mentes, determinisztikus. A holtverseny-
 * feloldáshoz kell (ld. getTopRoles), nem kriptográfiai célra.
 */
function tieBreakHash(role: TeamRoleCode, seed: string): number {
  let h = 0x811c9dc5;
  const input = `${role}|${seed}`;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Top-N szerep egy pontszám-profilból.
 *
 * HOLTVERSENY-SZABÁLY (S2) — dokumentált döntés:
 *  1. Elsődleges rendezés: pontszám szerint csökkenő.
 *  2. Ha van finomabb evidencia (`exact` — pl. kerekítetlen peer-átlag vagy
 *     becslés-összeg), az dönt: két azonosra KEREKÍTETT szerep közül az áll
 *     előrébb, amelyik mögött ténylegesen több jel van.
 *  3. Pontosan egyenlő evidenciánál egy determinisztikus, profil-függő hash
 *     dönt — SZÁNDÉKOSAN NEM a szerep-kód sorrendje. A korábbi stabil sort a
 *     TEAM_ROLES deklarációs sorrendjét örökítette, ami minden holtversenyt
 *     a korai kódok (OG/KE/KO) javára döntött el a későiek (MV/MI/SZ)
 *     rovására — kis mintánál (3 peer) ez látható, szisztematikus torzítás.
 *     A hash a teljes pontszám-vektorból magvazódik, így ugyanarra a
 *     profilra ismételt rendereléskor stabil (determinisztikus), a
 *     populáció szintjén viszont egyik szerep sem élvez fix előnyt
 *     (más profilnál más szerep nyeri az egyenlőséget).
 */
export function getTopRoles(
  scores: TeamRoleScores,
  n = 3,
  exact?: Partial<Record<TeamRoleCode, number>>,
): { role: TeamRoleCode; score: number }[] {
  // Kanonikus seed a hash-hez: a kódsorrend itt csak a seed-szöveg
  // stabilitását adja (objektum-kulcssorrendtől független), rangot nem oszt.
  const seed = (Object.keys(TEAM_ROLES) as TeamRoleCode[])
    .map((role) => `${role}:${exact?.[role] ?? scores[role] ?? 0}`)
    .join(",");
  return (Object.entries(scores) as [TeamRoleCode, number][])
    .map(([role, score]) => ({ role, score, sortKey: exact?.[role] ?? score }))
    .sort(
      (a, b) =>
        b.sortKey - a.sortKey ||
        tieBreakHash(a.role, seed) - tieBreakHash(b.role, seed),
    )
    .slice(0, n)
    .map(({ role, score }) => ({ role, score }));
}
