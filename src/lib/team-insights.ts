// src/lib/team-insights.ts
// Értelmezési réteg — elkülönítve a core kalkulációtól (team-pattern.ts)

import { withHuArticle } from "@/lib/hu-grammar";
import { deficitSlotEligible } from "@/lib/score-valence";

// ── TRITAN profil 1 mondatos összefoglaló ─────────────────

export function generateTeamSummary(scores: Record<string, number>): string {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return "";

  const highest = entries[0];
  const secondHighest = entries[1];
  // A fordított kódolású E alacsony pólusa (érzelmi stabilitás) NEM
  // hiányosság — a „legalacsonyabb csapatátlag … elég-e a szerephez?"
  // NEGATÍV valenciájú slotból a kanonikus kapun (score-valence
  // deficitSlotEligible) át zárjuk ki, különben egy érzelmileg stabil
  // csapatnál épp a stabilitást kérdőjelezné meg. A magas slotok tényszerű
  // megnevezések, azok maradnak.
  const deficitEntries = entries.filter(([dim]) => deficitSlotEligible(dim));
  const lowest =
    deficitEntries[deficitEntries.length - 1] ?? entries[entries.length - 1];

  // Alanyesetű, tényszerű dimenzió-nevek — a magas ÉS az alacsony slot is
  // ugyanazt a mért dimenziót nevezi meg (a korábbi verzió az alacsony
  // pólus pozitív címkéjét adta „fejlesztési irányként" — szemantikai
  // inverzió, nyelvi kör 2026-08).
  const dimNames: Record<string, string> = {
    H: "fairness-érzékenység",
    E: "érzelmi érzékenység",
    X: "társas energia",
    A: "együttműködési készség",
    C: "strukturáltság",
    O: "nyitottság",
  };

  const h = dimNames[highest[0]] ?? highest[0];
  const h2 = dimNames[secondHighest[0]] ?? secondHighest[0];
  const l = dimNames[lowest[0]] ?? lowest[0];

  return `A csapatprofil két legmagasabb átlagú dimenziója ${withHuArticle(h)} (${highest[1]}%) és ${withHuArticle(h2)} (${secondHighest[1]}%). A legalacsonyabb csapatátlag ${withHuArticle(l)} (${lowest[1]}%) — érdemes megnézni, hogy a szerep igényeihez ez elég-e.`;
}

// ── Kulcs jellemzők actionable insight-ok ─────────────────

// A E-sor a valencia-kapun (strengthSlotEligible "evaluative" —
// team-report.ts) NEM jut el az erősség-slotba: egy Félelem/Szorongás
// átlagból „empatikus csapat — különösen erős" erény-állítást csinálni
// kétszeresen hibás volt (2026-08-11 valencia-döntés). A sor a térkép
// teljessége miatt marad, jellemző-keretezésben, hozadékkal ÉS árral.
export function getStrengthInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "A csapat ösztönösen méltányos döntéseket hoz — használd ki a belső mediátorok erejét.",
    E: "Érzelmileg ráhangolódó csapat — a feszültséget korán érzik, és tartós nyomás alatt gyorsabban is fáradnak.",
    X: "Társas helyzetekben gyorsan aktiválható — workshopokon, prezentációknál kiváló.",
    A: "Erős együttműködés — komplex projekteknél kevesebb koordinációra lehet szükség.",
    C: "Fegyelmezett végrehajtás — határidős projekteknél ez jellemzően erőforrás.",
    O: "Nyitott az újra — innovációs sprintek és kísérletezés természetes közeg nekik.",
  };
  return insights[dimension] ?? "";
}

export function getWatchAreaInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Figyelj a csapaton belüli méltányosságérzetre — érdemes rendszeres visszajelző kört tartani.",
    E: "Érzelmileg ráhangolódóbb dinamika — konfliktushelyzetben érdemes lassabb tempót tartani.",
    X: "Visszafogottabb csapat — az aktiváláshoz tudatos energizálás kell a megbeszéléseken.",
    A: "Direkt kommunikáció — konfliktusnál gyorsabban eszkalálódhat. Strukturált vitaformátum segít.",
    C: "Rugalmas, de kaotikus lehet — enyhe struktúra bevezetése javít a kiszámíthatóságon.",
    O: "Pragmatikus fókusz — az innovációhoz külső impulzus (workshop, vendégelőadó) kell.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Eltérő igazságérzet — érdemes tudatosan tisztázni a csapat normáit.",
    E: "Eltérő érzelmi ráhangolódás — érdemes személyre szabottan támogatnod a tagokat.",
    X: "Eltérő energiaszintek — az introvertáltak és extravertáltak külön figyelmet igényelnek a megbeszélések formátumánál.",
    A: "Eltérő együttműködési stílusok — a páros munkában érdemes tudatosan keverni.",
    C: "Eltérő szervezettség — közös minimum-szabályok kellenek a koordinációhoz.",
    O: "Eltérő nyitottság új megközelítésekre — az innováció és a stabilitás igénye egyaránt jelen van.",
  };
  return insights[dimension] ?? "";
}
