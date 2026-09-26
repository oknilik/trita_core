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
    H: "A profil alapján fontos lehet nektek a méltányos döntés. Egy nehezebb egyeztetésen beszéljétek át, kinek mit jelentene az igazságos megoldás.",
    E: "A csapat tagjai érzékenyen reagálhatnak a feszültségre, és tartós nyomás alatt hamarabb elfáradhatnak.",
    X: "A profil alapján szívesen kezdeményezhettek társas helyzetekben. Egy közös ötletelésen vagy bemutatón ez segíthet elindítani a beszélgetést.",
    A: "A profil alapján könnyebb lehet türelemmel fordulnotok egymás felé. Egy vitás kérdésnél használjátok ezt arra, hogy minden álláspontot végighallgassatok.",
    C: "A feladatok gondos végigvitele a csapat egyik erőssége lehet. Erre különösen a határidőhöz kötött munkáknál érdemes építeni.",
    O: "Az új megoldások keresése közel állhat hozzátok. Egy kisebb, jól körülhatárolt kísérletben érdemes kipróbálni az ötleteiteket.",
  };
  return insights[dimension] ?? "";
}

export function getWatchAreaInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Beszéljétek át, mennyire érzitek méltányosnak a feladatok és az elismerés elosztását. A profil önmagában nem mutatja meg, hogyan élitek meg ezeket a helyzeteket.",
    E: "A csapattagok érzékenyebben reagálhatnak egymás érzelmeire. Konfliktushelyzetben érdemes időt hagyni a megbeszélésre.",
    X: "A társas kezdeményezés kevésbé hangsúlyos a csapatprofilban. A megbeszélések előtt hagyjatok időt az egyéni átgondolásra, hogy a csendesebb tagok is könnyebben hozzá tudjanak szólni.",
    A: "A profil alapján könnyebben ragaszkodhattok a saját álláspontotokhoz. Egyezzetek meg, hogyan hallgatjátok végig egymást, és hogyan döntötök, ha nem értetek egyet.",
    C: "A részletes tervezés kevésbé hangsúlyos a profilban. Tisztázzátok a feladatok elején, ki mit vállal, mikorra készül el, és hol jelzi, ha elakad.",
    O: "A profil alapján közelebb állhatnak hozzátok a bevált megoldások. Ha egy feladatnál ezek már nem segítenek, kérdezzetek meg egy másik csapatot, ők hogyan oldanák meg.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Eltérhet, mit tartotok méltányosnak. Egy konkrét feladatelosztás példáján beszéljétek át, milyen szempontok fontosak nektek.",
    E: "Másként élhetitek meg ugyanazt a feszültséget. Beszéljétek meg, kinek milyen segítségre van szüksége a sűrűbb időszakokban.",
    X: "Eltérhet, mennyire szívesen szólaltok meg társaságban. Küldjétek el előre a megbeszélés témáit, és hagyjatok időt arra is, hogy mindenki átgondolja a válaszát.",
    A: "Eltérhet, ki hogyan viseli a nézeteltéréseket. Beszéljétek meg, hogyan tudtok úgy vitázni, hogy mindenki elmondhassa a véleményét.",
    C: "Más-más részletességgel tervezhetitek meg a munkátokat. Egyezzetek meg, mit kell mindenkinek rögzítenie, és miben választhatja meg maga a munkamenetet.",
    O: "Van, akit az új ötlet vonz, más szívesebben marad a bevált megoldásnál. Egy változtatás előtt beszéljétek át, mit próbáltok ki, és miből látjátok majd, hogy bevált-e.",
  };
  return insights[dimension] ?? "";
}
