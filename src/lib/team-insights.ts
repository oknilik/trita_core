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
  const number = (value: number) => value.toLocaleString("hu-HU", { maximumFractionDigits: 1 });

  return `Az önértékelésekben ${withHuArticle(h)} (${number(highest[1])}/100) és ${withHuArticle(h2)} (${number(secondHighest[1])}/100) kapta a legmagasabb csapatátlagot. A többi területhez képest ${withHuArticle(l)} kevésbé hangsúlyos (${number(lowest[1])}/100). Beszéljétek át, hogyan jelenik meg ez a mindennapi feladataitokban.`;
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
    E: "A csapat tagjai érzékenyen reagálhatnak a feszültségre, és tartós nyomás alatt hamarabb elfáradhatnak.",
    X: "A csapat társas helyzetekben gyorsan lendületbe jön – műhelymunkákon és prezentációknál ez különösen hasznos lehet.",
    A: "A csapat erősen törekszik az együttműködésre – ez összetett projekteknél csökkentheti az egyeztetési terhet.",
    C: "A feladatok gondos végigvitele a csapat egyik erőssége lehet. Erre különösen a határidőhöz kötött munkáknál érdemes építeni.",
    O: "Az új megoldások keresése közel állhat hozzátok. Egy kisebb, jól körülhatárolt kísérletben érdemes kipróbálni az ötleteiteket.",
  };
  return insights[dimension] ?? "";
}

export function getWatchAreaInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Figyelj a csapaton belüli méltányosságérzetre – érdemes rendszeres visszajelző kört tartani.",
    E: "A csapattagok érzékenyebben reagálhatnak egymás érzelmeire. Konfliktushelyzetben érdemes időt hagyni a megbeszélésre.",
    X: "A társas kezdeményezés kevésbé hangsúlyos a csapatprofilban. A megbeszélések előtt hagyjatok időt az egyéni átgondolásra, hogy a csendesebb tagok is könnyebben hozzá tudjanak szólni.",
    A: "A közvetlen kommunikáció miatt a konfliktusok gyorsabban kiéleződhetnek. Egy előre kialakított vitakeret segíthet.",
    C: "A csapat rugalmas, de könnyen széttartóvá válhat – egyszerű közös keretekkel javítható a kiszámíthatóság.",
    O: "A gyakorlatias szemlélet mellett külső nézőpont adhat lendületet az újításnak, például műhelymunka vagy vendégelőadó bevonása.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Eltérő igazságérzet – érdemes tudatosan tisztázni a csapat normáit.",
    E: "Másként élhetitek meg ugyanazt a feszültséget. Beszéljétek meg, kinek milyen segítségre van szüksége a sűrűbb időszakokban.",
    X: "A csapaton belül eltérnek az energiaszintek – a visszafogottabb és az energikusabb tagok igényeit is érdemes figyelembe venni a megbeszélések kialakításakor.",
    A: "Eltérhet, ki hogyan viseli a nézeteltéréseket. Beszéljétek meg, hogyan tudtok úgy vitázni, hogy mindenki elmondhassa a véleményét.",
    C: "A csapaton belül eltér a tagok szervezettsége – a koordinációhoz néhány közös alapszabályra van szükség.",
    O: "Eltérő nyitottság új megközelítésekre – az innováció és a stabilitás igénye egyaránt jelen van.",
  };
  return insights[dimension] ?? "";
}
