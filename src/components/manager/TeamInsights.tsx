interface DimInfo {
  code: string;
  label: string;
  color: string;
}

interface HeatmapRow {
  memberId: string;
  displayName: string;
  scores: Record<string, number | null>;
  testType: string | null;
}

import { t, tf, type Locale } from "@/lib/i18n";
import { sampleStdDev } from "@/lib/stats/dimension-stats";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";

interface TeamInsightsProps {
  rows: HeatmapRow[];
  dims: DimInfo[];
  isHu: boolean;
}

// Per-dimension team-context interpretations
type Level = "high" | "mid" | "low";

const DIM_INSIGHTS: Record<string, Record<Level, { hu: string; en: string }>> = {
  H: {
    high: {
      hu: "Az önértékelések alapján fontos lehet nektek a méltányos eljárás és az egyenes beszéd. Beszéljétek át, hogyan jelenik meg ez a feladatok vagy az elismerés elosztásában. A csapaton belüli bizalmat ez a pontszám nem méri.",
      en: "The team culture is defined by fairness and honesty – low internal politics, high mutual trust. A strong foundation for trust-based collaboration.",
    },
    mid: {
      hu: "A becsületesség-alázat csapatátlaga a középső sávban van. Ebből nem derül ki, mindenki hasonlóan gondolkodik-e. Konkrét döntéseken beszéljétek át, mit tartotok méltányosnak.",
      en: "Balanced ethical sense – the team applies pragmatic flexibility while remaining fundamentally trustworthy.",
    },
    low: {
      hu: "Az önértékelések alapján erősebben érvényesülhetnek az egyéni érdekek. Egyezzetek meg a feladatelosztás és a döntések közös szempontjaiban, hogy mindenki tudja, mire számíthat.",
      en: "A low team average on this dimension may signal self-interest-driven dynamics. Making expectations and norms explicit is advisable.",
    },
  },
  // 2026-08-11, valencia-revízió (kanonikus kapu: score-valence.ts): az
  // Emocionalitás egyik pólusa sem erősség és nem is fejlesztendő hiány —
  // mindhárom sáv jellemző-keretezésű, hozadékkal ÉS árral. A korábbi szöveg
  // empátiát tulajdonított a magas átlagnak (amit a Félelem/Szorongás/
  // Dependencia/Érzelmi kötődés facetek nem mérnek), az alacsonyat pedig
  // „fejlesztendő empátia-hiánynak" keretezte. A két kártya-slot (erősség /
  // fejlesztési terület) a valencia-kapun át már nem hívja ezt a sort — a
  // térkép teljessége miatt marad, hogy egy jövőbeli felület se a régi
  // keretezést találja itt.
  E: {
    high: {
      hu: "Az önértékelések alapján érzékenyebben reagálhattok a feszültségre. Egy sűrű időszakban beszéljétek át, ki mit él meg megterhelőnek, és milyen segítségre lenne szüksége.",
      en: "Emotionally sensitive team – they register tension early, but tire faster under sustained pressure. A predictable tempo and regular short feedback points help.",
    },
    mid: {
      hu: "Az emocionalitás csapatátlaga a középső sávban van. A tagok ettől még eltérően élhetnek meg egy nehéz helyzetet. Kérdezzetek rá egymás tapasztalataira.",
      en: "Mixed emotional intensity – the team generally handles pressure while relational signals still get picked up.",
    },
    low: {
      hu: "Az önértékelések alapján nyugodtabban reagálhattok a feszültségre. A terhelésről akkor is érdemes egyeztetni: kinek mennyire férnek bele a feladatai, és hol van szükség változtatásra?",
      en: "Stress-tolerant, matter-of-fact decision-making. In exchange, tension can stay invisible for a long time: an explicit check-in round helps, since it won't come up on its own.",
    },
  },
  X: {
    high: {
      hu: "Az önértékelések alapján szívesen kezdeményezhettek társas helyzetekben. Ez segíthet elindítani egy közös ötletelést. Közben arra is figyeljetek, hogy mindenkinek jusson ideje hozzászólni.",
      en: "Energetic, communicative team – builds relationships quickly and performs well on tasks requiring collaboration and teamwork.",
    },
    mid: {
      hu: "Az extraverzió csapatátlaga a középső sávban van. Beszéljétek át, kinek mely feladatnál segít az egyéni átgondolás, és mikor hasznosabb együtt egyeztetni.",
      en: "Balanced social dynamics – strong individual focus and teamwork coexist effectively.",
    },
    low: {
      hu: "Az önértékelések alapján visszafogottabbak lehettek társas helyzetekben. A megbeszélések előtt adjatok időt az egyéni átgondolásra, majd kérdezzetek rá mindenki szempontjaira.",
      en: "More introverted team – deep focus and independent work are strengths. Proactive communication may need intentional development.",
    },
  },
  // 2026-08-11, valencia-revízió (a E-döntés kiterjesztése): a Barátságosság
  // facetjei a Megbocsátás · Gyengédség · Rugalmasság · Türelem — a skála NEM
  // mér empátiát, ezért a magas csapatátlaghoz nem tapadhat empátia-ígéret
  // („erős harmónia és empátia"). Mindkét pólus kétoldalú: a magas engedékeny
  // ÉS elfedi a vitát, az alacsony élesebb ÉS hamarabb kimondja a bajt.
  A: {
    high: {
      hu: "Az önértékelések alapján türelemmel fordulhattok egymáshoz, és könnyebben engedhettek egy vitában. Döntés előtt külön kérdezzetek rá az ellenvetésekre is, hogy azok se maradjanak ki.",
      en: "Patient, low-conflict team – lenient with each other's mistakes and quick to compromise. In exchange, disagreement rarely reaches the table: intentionally building a direct feedback culture is worthwhile.",
    },
    mid: {
      hu: "A barátságosság csapatátlaga a középső sávban van. Saját példákon nézzétek meg, mikor ragaszkodtok az álláspontotokhoz, és mikor kerestek kompromisszumot.",
      en: "Healthy balance of assertiveness and accommodation – the team can handle both straight debate and compromise.",
    },
    low: {
      hu: "Az önértékelések alapján határozottabban ragaszkodhattok a saját álláspontotokhoz. Ez segíthet kimondani az ellenvetéseket, de megnehezítheti a megegyezést. Egy vitában hallgassátok végig egymást, és előre tisztázzátok, hogyan születik meg a döntés.",
      en: "Direct, debate-ready team – problems get named early, decisions come fast, feedback stays honest. In exchange, debates sharpen faster: a structured discussion format and clear decision rules help.",
    },
  },
  C: {
    high: {
      hu: "Az önértékelések alapján fontos lehet nektek a gondos tervezés és ellenőrzés. Egy összetett feladatnál egyezzetek meg a lépésekben és abban is, mikor tekintitek késznek a munkát.",
      en: "Organized, reliable, deadline-aware team – ideal for executing complex, multi-step projects.",
    },
    mid: {
      hu: "A lelkiismeretesség csapatátlaga a középső sávban van. Beszéljétek át, mit szükséges előre megterveznetek, és miben választhatja meg mindenki a saját munkamenetét.",
      en: "Good balance between organization and flexibility – the team is reliable while remaining adaptable.",
    },
    low: {
      hu: "Az önértékelésekben kevésbé hangsúlyos a részletes tervezés. Egy közös listán rögzítsétek, ki mit vállal, mikorra készül el, és hol jelzi az elakadásokat.",
      en: "Flexible, creative working style. Strengthening structural frameworks, prioritization tools, and process tracking is recommended.",
    },
  },
  O: {
    high: {
      hu: "Az önértékelések alapján szívesen kereshettek új megoldásokat. Válasszatok ki egy ötletet, próbáljátok ki egy kisebb feladaton, majd beszéljétek át, mi vált be belőle.",
      en: "Innovative, curious team – embraces experimentation and new approaches. Performs well in dynamic, creative tasks.",
    },
    mid: {
      hu: "A nyitottság csapatátlaga a középső sávban van. Saját példákon nézzétek meg, mikor választotok bevált megoldást, és mikor próbáltok ki valami újat.",
      en: "Balanced creativity and pragmatism – navigates flexibly between innovation and proven solutions.",
    },
    low: {
      hu: "Az önértékelések alapján közelebb állhatnak hozzátok a bevált megoldások. Ha változtatásra van szükség, kezdjétek egy kisebb próbával, és előre egyezzetek meg, miből látjátok majd, hogy bevált-e.",
      en: "Practical, stable team – values proven processes and predictability. Change management may require extra attention.",
    },
  },
};

function getLevel(score: number): Level {
  if (score >= 65) return "high";
  if (score >= 38) return "mid";
  return "low";
}

function StrengthIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13.1l-4.2 2.4.8-4.7L3.2 7.5l4.7-.7L10 2.5Z" />
    </svg>
  );
}

function GapIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v4M10 13.5v.5" />
    </svg>
  );
}

function DiversityIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 15.5c0-2.21 2.46-4 5.5-4s5.5 1.79 5.5 4" />
      <circle cx="9" cy="7" r="3" />
      <path d="M14.5 11.5c1.38.55 2.5 1.62 2.5 3" />
      <circle cx="14" cy="5.5" r="2.5" />
    </svg>
  );
}

export function TeamInsights({ rows, dims, isHu }: TeamInsightsProps) {
  // Only include members who have scores
  const scored = rows.filter((r) => dims.some((d) => r.scores[d.code] !== null));
  if (scored.length === 0) return null;

  // Calculate team average per dimension
  const teamAvg: Record<string, number | null> = {};
  for (const dim of dims) {
    const scores = scored
      .map((r) => r.scores[dim.code])
      .filter((s): s is number => s !== null);
    teamAvg[dim.code] = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  }

  // Calculate std deviation per dimension (spread / diversity) — Bessel-
  // korrekciós mintaszórás a közös stats-helperből (a csapat a populáció
  // mintája; a ÷n populációs szórás lefelé torzított).
  const dimStdDev: Record<string, number> = {};
  for (const dim of dims) {
    const scores = scored
      .map((r) => r.scores[dim.code])
      .filter((s): s is number => s !== null);
    if (scores.length < 2) continue;
    dimStdDev[dim.code] = Math.round(sampleStdDev(scores));
  }

  const rankedDims = dims
    .filter((d) => teamAvg[d.code] !== null)
    .sort((a, b) => (teamAvg[b.code] ?? 0) - (teamAvg[a.code] ?? 0));

  // „Csapat erőssége" (erősség-slot): a fordított kódolású E ezen az
  // ÉRTÉKELŐ felületen sem lehet erősség — ugyanaz a kapu, mint a
  // team-report.ts riport-generátorában (strengthSlotEligible "evaluative").
  // Enélkül egy magas Emocionalitás-átlagú csapatnál a Félelem/Szorongás
  // átlaga jelent volna meg zöld „erősség" kártyán. Ilyenkor a következő
  // legmagasabb, valenciálható dimenzió lép a helyére.
  const strengthRanked = rankedDims.filter((d) =>
    strengthSlotEligible(d.code, "evaluative"),
  );
  const topStrength = strengthRanked[0];
  // „Fejlesztési terület" (deficit-slot): a fordított kódolású E kizárva
  // a kanonikus valencia-kapun át (score-valence) — az alacsony Emocionalitás
  // stabilitás, nem fejlesztendő gyengeség; különben egy érzelmileg stabil
  // csapat épp a stabilitását látná figyelmeztető kártyán.
  const deficitRanked = rankedDims.filter((d) => deficitSlotEligible(d.code));
  const topGap = deficitRanked[deficitRanked.length - 1];
  const mostDiverse = Object.entries(dimStdDev).sort((a, b) => b[1] - a[1])[0];
  const mostDiverseDim = mostDiverse
    ? dims.find((d) => d.code === mostDiverse[0])
    : null;

  const lang = isHu ? "hu" : "en";
  const locale: Locale = lang;

  return (
    <div className="flex flex-col gap-6">
      {/* Average profile bars */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
          {t("manager.teamInsights.avgByDimension", locale)}
        </p>
        <div className="flex flex-col gap-3">
          {dims.map((dim) => {
            const avg = teamAvg[dim.code];
            return (
              <div key={dim.code} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dim.color }}
                />
                <div className="flex-1">
                  <div className="relative h-7 overflow-hidden rounded-lg bg-sand/50">
                    {avg !== null && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg transition-all"
                        style={{
                          width: `${avg}%`,
                          backgroundColor: dim.color,
                          opacity: 0.75,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center px-2.5">
                      <span className="text-xs font-semibold text-ink-body">
                        {dim.label}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Csak az átlag jelenik meg – a ±szórás-szám 2026-08-11-i
                    termékdöntéssel lekerült a felületről (a szórás-számítás
                    belül él tovább: a sokszínűség-kártyát hajtja). */}
                <div className="w-16 shrink-0 text-right">
                  {avg !== null ? (
                    <span className="text-sm font-bold tabular-nums text-ink">
                      {avg}
                      <span className="text-xs font-semibold text-muted">%</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted/60">–</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {scored.length > 1 && (
          <p className="mt-2 text-micro text-muted">
            {t("manager.teamInsights.stdDevHint", locale)}
          </p>
        )}
      </div>

      {/* Insight cards */}
      {rankedDims.length >= 2 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
            {t("manager.teamInsights.teamDynamics", locale)}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Strength */}
            {topStrength && teamAvg[topStrength.code] !== null && (
              <div className="flex flex-col gap-2 rounded-xl border border-state-success-border bg-state-success-bg/60 p-4">
                <div className="flex items-center gap-2 text-state-success-fg">
                  <StrengthIcon />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {t("manager.teamInsights.teamStrength", locale)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: topStrength.color }}
                  />
                  <span className="text-sm font-semibold text-ink">
                    {topStrength.label}
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      {teamAvg[topStrength.code]}%
                    </span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-ink-body">
                  {DIM_INSIGHTS[topStrength.code]?.[getLevel(teamAvg[topStrength.code]!)]?.[lang] ?? ""}
                </p>
              </div>
            )}

            {/* Gap */}
            {topGap && topGap.code !== topStrength?.code && teamAvg[topGap.code] !== null && (
              <div className="flex flex-col gap-2 rounded-xl border border-state-warning-border bg-state-warning-bg/60 p-4">
                <div className="flex items-center gap-2 text-state-warning-fg">
                  <GapIcon />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {t("manager.teamInsights.growthArea", locale)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: topGap.color }}
                  />
                  <span className="text-sm font-semibold text-ink">
                    {topGap.label}
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      {teamAvg[topGap.code]}%
                    </span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-ink-body">
                  {DIM_INSIGHTS[topGap.code]?.[getLevel(teamAvg[topGap.code]!)]?.[lang] ?? ""}
                </p>
              </div>
            )}

            {/* Diversity */}
            {mostDiverseDim && mostDiverse[1] >= 10 && (
              <div className="flex flex-col gap-2 rounded-xl border border-sage-soft bg-sage-ghost/60 p-4">
                <div className="flex items-center gap-2 text-sage-dark">
                  <DiversityIcon />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {t("manager.teamInsights.mostDiverse", locale)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: mostDiverseDim.color }}
                  />
                  {/* A ±szórás-szám nem jelenik meg (termékdöntés) – a
                      kiválasztást továbbra is a belső szórás-rangsor adja. */}
                  <span className="text-sm font-semibold text-ink">
                    {mostDiverseDim.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-ink-body">
                  {t("manager.teamInsights.diversityDesc", locale)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {scored.length < rows.length && (
        <p className="text-xs text-muted">
          {tf("manager.teamInsights.analysisBasis", locale, { scored: scored.length, remaining: rows.length - scored.length })}
        </p>
      )}
    </div>
  );
}
