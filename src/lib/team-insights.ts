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
    H: "méltányosság iránti érzékenység",
    E: "érzelmi érzékenység",
    X: "társas energia",
    A: "együttműködési készség",
    C: "strukturáltság",
    O: "nyitottság",
  };

  const h = dimNames[highest[0]] ?? highest[0];
  const h2 = dimNames[secondHighest[0]] ?? secondHighest[0];
  const l = dimNames[lowest[0]] ?? lowest[0];

  return `A csapatprofil két legmagasabb átlagú dimenziója ${withHuArticle(h)} (${highest[1]}%) és ${withHuArticle(h2)} (${secondHighest[1]}%). A legalacsonyabb csapatátlagot ${withHuArticle(l)} területén mértük (${lowest[1]}%) – érdemes megvizsgálni, hogy ez mennyire felel meg a csapat feladatainak.`;
}

// ── Kulcs jellemzők actionable insight-ok ─────────────────

// A E-sor a valencia-kapun (strengthSlotEligible "evaluative" –
// team-report.ts) NEM jut el az erősség-slotba: egy Félelem/Szorongás
// átlagból „empatikus csapat – különösen erős" erény-állítást csinálni
// kétszeresen hibás volt (2026-08-11 valencia-döntés). A sor a térkép
// teljessége miatt marad, jellemző-keretezésben, hozadékkal ÉS árral.
export function getStrengthInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "A csapat jellemzően méltányosságra törekszik a döntésekben – építs erre a nehezebb egyeztetéseknél is.",
    E: "Érzelmileg ráhangolódó csapat – a feszültséget korán érzik, és tartós nyomás alatt gyorsabban is fáradnak.",
    X: "A csapat társas helyzetekben gyorsan lendületbe jön – műhelymunkákon és prezentációknál ez különösen hasznos lehet.",
    A: "A csapat erősen törekszik az együttműködésre – ez összetett projekteknél csökkentheti az egyeztetési terhet.",
    C: "Fegyelmezett végrehajtás – határidős projekteknél ez jellemzően erőforrás.",
    O: "A csapat nyitott az újra – a rövid kísérleti szakaszok és az új megoldások kipróbálása természetes közeget jelenthetnek számára.",
  };
  return insights[dimension] ?? "";
}

export function getWatchAreaInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Figyelj a csapaton belüli méltányosságérzetre – érdemes rendszeres visszajelző kört tartani.",
    E: "Érzelmileg ráhangolódóbb dinamika – konfliktushelyzetben érdemes lassabb tempót tartani.",
    X: "A csapat visszafogottabb – a megbeszéléseken tudatos bevonás és az egyeztetések egyértelmű indítása segíthet.",
    A: "A közvetlen kommunikáció miatt a konfliktusok gyorsabban kiéleződhetnek. Egy előre kialakított vitakeret segíthet.",
    C: "A csapat rugalmas, de könnyen széttartóvá válhat – egyszerű közös keretekkel javítható a kiszámíthatóság.",
    O: "A gyakorlatias szemlélet mellett külső nézőpont adhat lendületet az újításnak, például műhelymunka vagy vendégelőadó bevonása.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Eltérő igazságérzet – érdemes tudatosan tisztázni a csapat normáit.",
    E: "Eltérő érzelmi ráhangolódás – érdemes személyre szabottan támogatnod a tagokat.",
    X: "A csapaton belül eltérnek az energiaszintek – a visszafogottabb és az energikusabb tagok igényeit is érdemes figyelembe venni a megbeszélések kialakításakor.",
    A: "A csapaton belül eltérnek az együttműködési stílusok – páros munkában érdemes tudatosan különböző működésű tagokat összekapcsolni.",
    C: "A csapaton belül eltér a tagok szervezettsége – a koordinációhoz néhány közös alapszabályra van szükség.",
    O: "Eltérő nyitottság új megközelítésekre – az innováció és a stabilitás igénye egyaránt jelen van.",
  };
  return insights[dimension] ?? "";
}
