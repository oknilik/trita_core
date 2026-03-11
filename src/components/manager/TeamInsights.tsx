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
      hu: "A csapat kultúráját az igazságosság és becsületesség jellemzi — alacsony belső politizálás, magas kölcsönös bizalom. Jó alap bizalomra épülő együttműködéshez.",
      en: "The team culture is defined by fairness and honesty — low internal politics, high mutual trust. A strong foundation for trust-based collaboration.",
    },
    mid: {
      hu: "Kiegyensúlyozott etikai érzék — a csapat helyzetfüggően alkalmaz rugalmasságot, miközben alapvetően megbízható.",
      en: "Balanced ethical sense — the team applies pragmatic flexibility while remaining fundamentally trustworthy.",
    },
    low: {
      hu: "Alacsony csapatátlag ezen a dimenzión önérdek-vezérelt dinamikákat jelezhet. Érdemes az elvárásokat és normákat explicitté tenni.",
      en: "A low team average on this dimension may signal self-interest-driven dynamics. Making expectations and norms explicit is advisable.",
    },
  },
  E: {
    high: {
      hu: "Empatikus, érzelmileg érzékeny csapat — erős interperszonális érzékenység, de nyomás alatt érdemes strukturált érzelmi támogatást biztosítani.",
      en: "Empathetic and emotionally sensitive team — strong interpersonal awareness, though structured emotional support is useful under pressure.",
    },
    mid: {
      hu: "Egészséges érzelmi egyensúly — a csapat kezeli a stresszt, miközben fogékony az empátiára és a kapcsolati dinamikákra.",
      en: "Healthy emotional balance — the team handles stress well while remaining responsive to empathy and relational dynamics.",
    },
    low: {
      hu: "Stressztűrő, racionális döntéshozó csapat. Az empátiát és érzelmi kommunikációt tudatos fejlesztéssel lehet erősíteni.",
      en: "Stress-tolerant, rational decision-making team. Empathy and emotional communication can be strengthened with intentional development.",
    },
  },
  X: {
    high: {
      hu: "Energikus, kommunikatív csapat — gyorsan épít kapcsolatokat, jól teljesít együttműködést és csapatmunkát igénylő feladatokon.",
      en: "Energetic, communicative team — builds relationships quickly and performs well on tasks requiring collaboration and teamwork.",
    },
    mid: {
      hu: "Kiegyensúlyozott szociális dinamika — erős egyéni fókusz és csapatmunka egyszerre van jelen.",
      en: "Balanced social dynamics — strong individual focus and teamwork coexist effectively.",
    },
    low: {
      hu: "Introvertáltabb csapat — mély fókusz és önálló munkavégzés az erőssége. A proaktív kommunikáció tudatos fejlesztést igényelhet.",
      en: "More introverted team — deep focus and independent work are strengths. Proactive communication may need intentional development.",
    },
  },
  A: {
    high: {
      hu: "Együttműködő, konfliktusmentes csapat — erős harmónia és empátia. Érdemes a direkt visszajelzési kultúrát is tudatosan erősíteni.",
      en: "Cooperative, low-conflict team — strong harmony and empathy. Intentionally building a direct feedback culture is also worthwhile.",
    },
    mid: {
      hu: "Egészséges assertivitás és együttműködés aránya — a csapat képes mind az egyenes kommunikációra, mind a harmóniára.",
      en: "Healthy balance of assertiveness and cooperation — the team can handle both direct communication and harmony.",
    },
    low: {
      hu: "Direkt, magabiztos csapat — gyors döntéshozatal és határozottság jellemzi. A konfliktuskezelési kultúrára figyelni érdemes.",
      en: "Direct, assertive team — characterized by fast decision-making and confidence. Conflict management culture deserves attention.",
    },
  },
  C: {
    high: {
      hu: "Szervezett, megbízható, határidőkre érzékeny csapat — ideális komplex, több lépéses projektek végrehajtásához.",
      en: "Organized, reliable, deadline-aware team — ideal for executing complex, multi-step projects.",
    },
    mid: {
      hu: "Jó egyensúly szervezettség és rugalmasság között — a csapat megbízható, miközben képes adaptálódni.",
      en: "Good balance between organization and flexibility — the team is reliable while remaining adaptable.",
    },
    low: {
      hu: "Rugalmas, kreatív munkavégzési stílus. Strukturális keretek, prioritizálási eszközök és folyamatkövetés erősítése javasolt.",
      en: "Flexible, creative working style. Strengthening structural frameworks, prioritization tools, and process tracking is recommended.",
    },
  },
  O: {
    high: {
      hu: "Innovatív, kíváncsi csapat — szívesen kísérletezik és nyitott az új megközelítésekre. Jól teljesít változékony, kreatív feladatokban.",
      en: "Innovative, curious team — embraces experimentation and new approaches. Performs well in dynamic, creative tasks.",
    },
    mid: {
      hu: "Kiegyensúlyozott kreativitás és pragmatizmus — az újítások és a bevált megoldások között rugalmasan navigál.",
      en: "Balanced creativity and pragmatism — navigates flexibly between innovation and proven solutions.",
    },
    low: {
      hu: "Gyakorlatias, stabil csapat — értékeli a bevált folyamatokat és a kiszámíthatóságot. Változásmenedzsment igényelhet külön figyelmet.",
      en: "Practical, stable team — values proven processes and predictability. Change management may require extra attention.",
    },
  },
  N: {
    high: {
      hu: "Magas érzelmi reaktivitás a csapatban — stressz alatt az érzelmi szabályozás és a kiszámítható környezet kulcsfontosságú.",
      en: "High emotional reactivity in the team — emotional regulation and a predictable environment are key under stress.",
    },
    mid: {
      hu: "Közepes stressz-érzékenység — a csapat általában stabilnak mutatkozik, de helyzetfüggő ingadozás előfordulhat.",
      en: "Moderate stress sensitivity — the team is generally stable, but situational variation may occur.",
    },
    low: {
      hu: "Alacsony neuroticizmus — nyugodt, stressztűrő csapat, jól teljesít nyomás és bizonytalanság közepette.",
      en: "Low neuroticism — calm, stress-resistant team that performs well under pressure and uncertainty.",
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

  // Calculate std deviation per dimension (spread / diversity)
  const dimStdDev: Record<string, number> = {};
  for (const dim of dims) {
    const scores = scored
      .map((r) => r.scores[dim.code])
      .filter((s): s is number => s !== null);
    if (scores.length < 2) continue;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    dimStdDev[dim.code] = Math.round(Math.sqrt(variance));
  }

  const rankedDims = dims
    .filter((d) => teamAvg[d.code] !== null)
    .sort((a, b) => (teamAvg[b.code] ?? 0) - (teamAvg[a.code] ?? 0));

  const topStrength = rankedDims[0];
  const topGap = rankedDims[rankedDims.length - 1];
  const mostDiverse = Object.entries(dimStdDev).sort((a, b) => b[1] - a[1])[0];
  const mostDiverseDim = mostDiverse
    ? dims.find((d) => d.code === mostDiverse[0])
    : null;

  const lang = isHu ? "hu" : "en";

  return (
    <div className="flex flex-col gap-6">
      {/* Average profile bars */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
          {isHu ? "Csapatátlag dimenzióként" : "Team average by dimension"}
        </p>
        <div className="flex flex-col gap-3">
          {dims.map((dim) => {
            const avg = teamAvg[dim.code];
            const stdDev = dimStdDev[dim.code];
            return (
              <div key={dim.code} className="flex items-center gap-3">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: dim.color }}
                >
                  {dim.code}
                </span>
                <div className="flex-1">
                  <div className="relative h-7 overflow-hidden rounded-lg bg-gray-100">
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
                      <span className="text-xs font-semibold text-gray-600">
                        {dim.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-16 shrink-0 text-right">
                  {avg !== null ? (
                    <span className="text-sm font-bold tabular-nums text-gray-800">
                      {avg}
                      <span className="text-xs font-semibold text-gray-400">%</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">–</span>
                  )}
                  {stdDev !== undefined && scored.length > 1 && (
                    <p className="text-[10px] text-gray-400">
                      ±{stdDev}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {scored.length > 1 && (
          <p className="mt-2 text-[10px] text-gray-400">
            {isHu ? "±: szórás a csapaton belül" : "±: standard deviation within the team"}
          </p>
        )}
      </div>

      {/* Insight cards */}
      {rankedDims.length >= 2 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            {isHu ? "Csapatdinamika" : "Team dynamics"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Strength */}
            {topStrength && teamAvg[topStrength.code] !== null && (
              <div className="flex flex-col gap-2 rounded-xl border border-green-100 bg-green-50/60 p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <StrengthIcon />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                    {isHu ? "Csapat erőssége" : "Team strength"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: topStrength.color }}
                  >
                    {topStrength.code}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {topStrength.label}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      {teamAvg[topStrength.code]}%
                    </span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">
                  {DIM_INSIGHTS[topStrength.code]?.[getLevel(teamAvg[topStrength.code]!)]?.[lang] ?? ""}
                </p>
              </div>
            )}

            {/* Gap */}
            {topGap && topGap.code !== topStrength?.code && teamAvg[topGap.code] !== null && (
              <div className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <GapIcon />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                    {isHu ? "Fejlesztési terület" : "Growth area"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: topGap.color }}
                  >
                    {topGap.code}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {topGap.label}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      {teamAvg[topGap.code]}%
                    </span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">
                  {DIM_INSIGHTS[topGap.code]?.[getLevel(teamAvg[topGap.code]!)]?.[lang] ?? ""}
                </p>
              </div>
            )}

            {/* Diversity */}
            {mostDiverseDim && mostDiverse[1] >= 10 && (
              <div className="flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <DiversityIcon />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                    {isHu ? "Legnagyobb sokszínűség" : "Most diverse"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: mostDiverseDim.color }}
                  >
                    {mostDiverseDim.code}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {mostDiverseDim.label}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      ±{mostDiverse[1]}
                    </span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">
                  {isHu
                    ? "A csapattagok eltérő megközelítéseket és perspektívákat hoznak erre a területre — ez gazdag vita- és kreatív potenciált jelent."
                    : "Team members bring diverse approaches and perspectives to this area — this represents rich discussion and creative potential."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {scored.length < rows.length && (
        <p className="text-xs text-gray-400">
          {isHu
            ? `Az elemzés ${scored.length} kitöltött teszten alapul (${rows.length - scored.length} tag még nem töltötte ki).`
            : `Analysis based on ${scored.length} completed assessments (${rows.length - scored.length} member${rows.length - scored.length !== 1 ? "s" : ""} haven't completed yet).`}
        </p>
      )}
    </div>
  );
}
