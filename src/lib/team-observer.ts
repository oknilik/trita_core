// ─────────────────────────────────────────────────────────────────────
// CSAPAT-SZINTŰ VISSZAJELZÉSI KULTÚRA — TISZTA modul (Prisma-mentes).
//
// Mit mér, és MIÉRT ÍGY (2026-08-11 termékdöntés):
//
// A kézenfekvő lépés — „csapat observer-átlag" dimenziónként — SZÁNDÉKOSAN
// NEM ez. Három okból védhetetlen lenne:
//   1. Az értékelői körök nem összemérhetők: a tag maga nominál (max 5 aktív
//      meghívó), így „A" három közeli ismerőse és „B" öt kollégája kerülne
//      egy átlagba. A szám rigorózusnak látszana, de nem az.
//   2. Önszelektált minta: kampányban a jóváhagyás VÉTÓ, nem mintavételi
//      terv; kampányon kívül teljesen a tag választ.
//   3. Differencia-támadás: ha a csapatnézet observer-átlagot mutatna, és a
//      néző a tag-dossziékat is meg tudja nyitni, a hiányzó tag értéke
//      visszaszámolható (ugyanaz az osztály, amit a /profile/results
//      küszöbe már ma is kezel).
//
// Ehelyett minden számítás SZEMÉLYEN BELÜL fut (önkép vs. a SAJÁT értékelői
// köre), és csak az EREDMÉNY-KATEGÓRIA aggregálódik darabszámmá. Így soha
// nem hasonlítjuk „A" raterjét „B" raterjéhez — az összemérhetetlenség
// problémája szerkezetileg megszűnik.
//
// A kimenet nem pontszám és nem ítélet: azt mondja meg, hogy a csapatban
// mennyire van összhangban az önkép azzal, ahogy a kollégák látnak valakit.
// Ez visszajelzés-kultúra jel (áramlik-e a visszajelzés), nem teljesítmény-
// mérés — a szövegezésnek is ezt kell tükröznie.
// ─────────────────────────────────────────────────────────────────────

import { computeObserverAverage, DOSSIER_GAP_MIN_DELTA } from "@/lib/member-dossier";
import { HEXACO_ORDER } from "@/lib/hexaco";

/**
 * Hány tagnak kell MÉRT külső képpel rendelkeznie, hogy a blokk egyáltalán
 * megjelenjen. A per-fős anonimitás-padló (n≥3 értékelő) önmagában NEM elég
 * csapat-szinten: 2 lefedett tagnál egy „1 eltérés" kimenet 1-az-2-höz szűkít.
 * A 4-es padlóval a legrosszabb eset 1-az-4-hez — a rater-padlóval azonos
 * nagyságrend. A dossziét amúgy is csak org admin/tanácsadó nyithatja
 * (canViewMemberDossier), a csapatnézetet viszont a manager is látja, ezért
 * a küszöbnek ITT is állnia kell, nem csak a dossziéban.
 */
export const TEAM_OBSERVER_MIN_COVERED = 4;

export interface TeamObserverMemberInput {
  /** A tag önértékelése (kanonikus olvasóból, HEXACO-kulccsal). */
  selfDims: Record<string, number> | null;
  /**
   * A tag SAJÁT értékelőinek dimenzió-készletei — KIZÁRÓLAG kampány-
   * hatókörű körökből. A privát (saját meghívós) visszajelzés a tagé; azt a
   * manager-feed sem használja, és ide sem kerülhet be.
   */
  observerDimSets: Record<string, number>[];
}

export interface TeamFeedbackCulture {
  /** Csapatlétszám (viszonyítási alap a szövegben). */
  memberCount: number;
  /** Ennyi tagnak van MÉRT külső képe (saját körében n≥3 értékelő). */
  coveredCount: number;
  /** Közülük ennyinél az önkép a mérési hibán BELÜL egyezik a külső képpel. */
  alignedCount: number;
  /** Közülük ennyinél legalább egy dimenzión érdemi (SEM feletti) eltérés van. */
  gapCount: number;
}

/**
 * Egy tag besorolása. `null` = nincs mért külső képe (nem számít bele).
 *
 * Az „érdemi eltérés" küszöbe a kanonikus DOSSIER_GAP_MIN_DELTA (√2·SEM):
 * az önkép és a külső átlag KÉT FÜGGETLEN mérés, a különbségük hibája
 * ezért √2·SEM. Ez alatt a delta nem jel, hanem zaj — ugyanaz a szabály,
 * amit a tag-dosszié is futtat, hogy a két felület ne mondjon mást
 * ugyanarról az emberről.
 */
function classifyMember(member: TeamObserverMemberInput): "aligned" | "gap" | null {
  if (!member.selfDims) return null;
  // A per-fős anonimitás-padlót (n≥3) maga az átlagoló érvényesíti: küszöb
  // alatt null, és dimenziónként is listwise.
  const observerAvg = computeObserverAverage(HEXACO_ORDER, member.observerDimSets);
  if (!observerAvg) return null;

  let comparableDims = 0;
  let hasGap = false;
  for (const code of HEXACO_ORDER) {
    const self = member.selfDims[code];
    const observer = observerAvg[code];
    if (typeof self !== "number" || typeof observer !== "number") continue;
    comparableDims += 1;
    if (Math.abs(observer - self) >= DOSSIER_GAP_MIN_DELTA) hasGap = true;
  }
  // Egyetlen összevethető dimenzió nélkül nincs mit állítani — a tag nem
  // számít lefedettnek (különben „egyezés"-ként könyvelnénk az adathiányt).
  if (comparableDims === 0) return null;
  return hasGap ? "gap" : "aligned";
}

/**
 * Csapat-szintű visszajelzési kultúra kép. `null`, ha a lefedettség a
 * TEAM_OBSERVER_MIN_COVERED padló alatt van — ilyenkor a felület NEM
 * rendereli a blokkot (nem „0 eredményt" mutat, hanem semmit).
 */
export function computeTeamFeedbackCulture(
  members: TeamObserverMemberInput[],
): TeamFeedbackCulture | null {
  let alignedCount = 0;
  let gapCount = 0;
  for (const member of members) {
    const verdict = classifyMember(member);
    if (verdict === "aligned") alignedCount += 1;
    else if (verdict === "gap") gapCount += 1;
  }
  const coveredCount = alignedCount + gapCount;
  if (coveredCount < TEAM_OBSERVER_MIN_COVERED) return null;
  return {
    memberCount: members.length,
    coveredCount,
    alignedCount,
    gapCount,
  };
}
