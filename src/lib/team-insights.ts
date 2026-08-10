// src/lib/team-insights.ts
// Értelmezési réteg — elkülönítve a core kalkulációtól (team-pattern.ts)

import { withHuArticle } from "@/lib/hu-grammar";

// ── TRITAN profil 1 mondatos összefoglaló ─────────────────

export function generateTeamSummary(scores: Record<string, number>): string {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return "";

  const highest = entries[0];
  const secondHighest = entries[1];
  const lowest = entries[entries.length - 1];

  // Alanyesetű, tényszerű dimenzió-nevek — a magas ÉS az alacsony slot is
  // ugyanazt a mért dimenziót nevezi meg (a korábbi verzió az alacsony
  // pólus pozitív címkéjét adta „fejlesztési irányként" — szemantikai
  // inverzió, nyelvi kör 2026-08).
  const dimNames: Record<string, string> = {
    INTE: "fairness-érzékenység",
    RESO: "érzelmi érzékenység",
    TEMP: "társas energia",
    ADAP: "együttműködési készség",
    THOR: "strukturáltság",
    OPEN: "nyitottság",
  };

  const h = dimNames[highest[0]] ?? highest[0];
  const h2 = dimNames[secondHighest[0]] ?? secondHighest[0];
  const l = dimNames[lowest[0]] ?? lowest[0];

  return `A csapatprofil két legmagasabb átlagú dimenziója ${withHuArticle(h)} (${highest[1]}%) és ${withHuArticle(h2)} (${secondHighest[1]}%). A legalacsonyabb csapatátlag ${withHuArticle(l)} (${lowest[1]}%) — érdemes megnézni, hogy a szerep igényeihez ez elég-e.`;
}

// ── Kulcs jellemzők actionable insight-ok ─────────────────

export function getStrengthInsight(dimension: string): string {
  const insights: Record<string, string> = {
    INTE: "A csapat ösztönösen méltányos döntéseket hoz — használd ki a belső mediátorok erejét.",
    RESO: "Empatikus csapat — workshopokon és ügyfélhelyzetekben különösen erős.",
    TEMP: "Társas helyzetekben gyorsan aktiválható — workshopokon, prezentációknál kiváló.",
    ADAP: "Erős együttműködés — komplex projekteknél kevesebb koordinációra lehet szükség.",
    THOR: "Fegyelmezett végrehajtás — határidős projekteknél ez jellemzően erőforrás.",
    OPEN: "Nyitott az újra — innovációs sprintek és kísérletezés természetes közeg nekik.",
  };
  return insights[dimension] ?? "";
}

export function getWatchAreaInsight(dimension: string): string {
  const insights: Record<string, string> = {
    INTE: "Figyelj a csapaton belüli méltányosságérzetre — érdemes rendszeres visszajelző kört tartani.",
    RESO: "Érzelmileg ráhangolódóbb dinamika — konfliktushelyzetben érdemes lassabb tempót tartani.",
    TEMP: "Visszafogottabb csapat — az aktiváláshoz tudatos energizálás kell a megbeszéléseken.",
    ADAP: "Direkt kommunikáció — konfliktusnál gyorsabban eszkalálódhat. Strukturált vitaformátum segít.",
    THOR: "Rugalmas, de kaotikus lehet — enyhe struktúra bevezetése javít a kiszámíthatóságon.",
    OPEN: "Pragmatikus fókusz — az innovációhoz külső impulzus (workshop, vendégelőadó) kell.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    INTE: "Eltérő igazságérzet — érdemes tudatosan tisztázni a csapat normáit.",
    RESO: "Eltérő érzelmi ráhangolódás — érdemes személyre szabottan támogatnod a tagokat.",
    TEMP: "Eltérő energiaszintek — az introvertáltak és extravertáltak külön figyelmet igényelnek a megbeszélések formátumánál.",
    ADAP: "Eltérő együttműködési stílusok — a páros munkában érdemes tudatosan keverni.",
    THOR: "Eltérő szervezettség — közös minimum-szabályok kellenek a koordinációhoz.",
    OPEN: "Eltérő nyitottság új megközelítésekre — az innováció és a stabilitás igénye egyaránt jelen van.",
  };
  return insights[dimension] ?? "";
}
