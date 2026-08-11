// Szakaszba sorolás és iparág-ellentmondás — TISZTA szabályok, a service-ből
// kiemelve, hogy unit-tesztelhetők legyenek (a service prisma-t húz be).

import type { OccupationFit } from "./types";

export type CareerSectionKey = "atLevel" | "belowLevel" | "afterTraining";

const ENTRY_RANK: Record<OccupationFit["entry"], number> = {
  open: 0,
  course: 1,
  vocational: 2,
  higher: 3,
  specialized: 4,
};

const EDU_RANK: Record<string, number> = {
  primary: 0,
  secondary: 1,
  vocational: 2,
  higher: 3,
  specialized: 4,
};

/**
 * Melyik szakaszba kerül a szerep. A „Most elérhető" a SZINTEDNEK megfelelő
 * belépésű szerepeket jelenti — egy diplomás egészségügyisnek a szakma-szintű
 * látszerész nem „most elérhető" ajánlat, hanem tudatos lefelé-váltás
 * (belowLevel, összecsukva). A szint fölött: tanulással.
 */
const AT_LEVEL: Record<number, number[]> = {
  0: [0],
  1: [0, 1],
  2: [2],
  3: [3],
  4: [3, 4],
};

/**
 * EGYETLEN forrás arra, hogy egy szerep MOST elérhető-e: a motor feasibility
 * eredménye (2026-08-11, fix). A korábbi külön lépcső ismeretlen (null)
 * végzettségnél a course-belépésű szerepet is „Most elérhető"-be tette,
 * miközben a feasibility ugyanarra „training-needed"-et mondott — a kártya
 * egyszerre állította mindkettőt. Ha a feasibility szerint nem ready, a
 * szerep tanulással érhető el; ready szerepnél a szint-összevetés csak azt
 * dönti el, hogy szint-azonos vagy a végzettség ALATTI ajánlat-e.
 */
export function sectionFor(
  fit: Pick<OccupationFit, "entry" | "feasibility">,
  eduLevel: string | null | undefined,
): CareerSectionKey {
  if (!fit.feasibility.ready) return "afterTraining";
  const entry = ENTRY_RANK[fit.entry];
  // Ismeretlen végzettségnél a feasibility csak az "open" belépést engedi
  // ready-nek — az ide jutó szerep definíció szerint most elérhető.
  if (!eduLevel) return "atLevel";
  const edu = EDU_RANK[eduLevel] ?? 0;
  if ((AT_LEVEL[edu] ?? [edu]).includes(entry)) return "atLevel";
  return "belowLevel";
}

/**
 * „A bejelölt területeid ellentmondanak a mért érdeklődésednek" jelzés —
 * CSAK az iparág-címkézett szerepek fölött (2026-08-11, fix). Scope-módban a
 * lista eleve a bejelölt területekre szűrt, de az univerzális (címke nélküli)
 * szerepek dominálhatják a top-ot: rajtuk sosincs industry-pick flag, így a
 * jelzés a SAJÁT bejelölt területeinek listáján sütött el. Ha a top-ban
 * nincs egyetlen címkézett tétel sem, a kérdés eldönthetetlen → nincs jelzés.
 */
export function hasIndustryMismatch(
  topFits: Array<{ flags: string[]; industryTagged: boolean }>,
  pickedCount: number,
  interestSource: "measured" | "tags" | "estimated" | null | undefined,
): boolean {
  if (pickedCount === 0 || interestSource !== "measured") return false;
  const tagged = topFits.filter((fit) => fit.industryTagged);
  if (tagged.length === 0) return false;
  return tagged.every((fit) => !fit.flags.includes("industry-pick"));
}
