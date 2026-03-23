import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { extractDimensionScores } from "@/lib/scoring";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  DIM_LABELS,
  CATEGORY_LABELS,
  RESOLUTION_NARRATIVES,
} from "@/lib/profile-content";
import type { Locale } from "@/lib/profile-content";
import { RadarChart } from "@/components/dashboard/RadarChart";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Jelölt eredménye | Trita", robots: { index: false } };
}

const DIM_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#8B5CF6",
  X: "#06B6D4",
  A: "#10B981",
  C: "#F59E0B",
  O: "#EF4444",
};

function getDimensionInsight(
  dim: string,
  category: "high" | "medium" | "low",
  locale: Locale
): string {
  const insights: Record<string, Record<string, Record<Locale, string>>> = {
    H: {
      high: {
        hu: "Etikus, szabálykövető. Nem hajlamos manipulációra, transzparens kommunikátor. Jó compliance, audit és bizalmi pozíciókban.",
        en: "Ethical, rule-following. Not prone to manipulation, transparent communicator. Strong in compliance, audit, and trust-based roles.",
      },
      medium: {
        hu: "Kiegyensúlyozott etikai érzék. Képes kompromisszumokra, de nem kerüli el a konfrontációt sem.",
        en: "Balanced ethical sense. Capable of compromise without avoiding confrontation.",
      },
      low: {
        hu: "Pragmatikus, eredményorientált. Képes 'eladni' és tárgyalni, de érdemes figyelni a transzparenciára csapatban.",
        en: "Pragmatic, results-oriented. Good at selling and negotiating, but watch transparency in team settings.",
      },
    },
    E: {
      high: {
        hu: "Érzelmileg érzékeny, empatikus. Jól olvas másokat, de stressz alatt lassabban regenerálódik. Strukturált visszajelzés segíti.",
        en: "Emotionally sensitive, empathetic. Reads others well but recovers slower under stress. Benefits from structured feedback.",
      },
      medium: {
        hu: "Kiegyensúlyozott érzelmi reaktivitás. Képes empátiára, de stresszhelyzetben is működőképes.",
        en: "Balanced emotional reactivity. Empathetic but functional under stress.",
      },
      low: {
        hu: "Stressztűrő, racionális döntéshozó. Jó krízishelyzetben, de a csapattagok érzelmeit néha figyelmen kívül hagyhatja.",
        en: "Stress-tolerant, rational decision-maker. Great in crises but may overlook teammates' emotions.",
      },
    },
    X: {
      high: {
        hu: "Energikus, társaságkedvelő. Természetes facilitátor és csapatépítő. Ideális ügyfélkapcsolati vagy vezetői pozícióban.",
        en: "Energetic, sociable. Natural facilitator and team builder. Ideal for client-facing or leadership roles.",
      },
      medium: {
        hu: "Rugalmasan mozog egyéni és csoportos munka között. Szituációtól függően vezet vagy háttérbe húzódik.",
        en: "Flexibly moves between solo and group work. Leads or steps back depending on the situation.",
      },
      low: {
        hu: "Mélyen fókuszáló, introvertált. Jól dolgozik önállóan, deep work-ben. Csapat megbeszéléseken lehet kevésbé aktív.",
        en: "Deeply focused, introverted. Excels in solo work and deep focus. May be less vocal in team meetings.",
      },
    },
    A: {
      high: {
        hu: "Kooperatív, konfliktuselkerülő. Kiváló csapatjátékos, de néha a saját véleményét háttérbe szorítja a harmónia kedvéért.",
        en: "Cooperative, conflict-averse. Excellent team player but may suppress own opinions to maintain harmony.",
      },
      medium: {
        hu: "Együttműködő, de képes a saját pozícióját képviselni. Jó egyensúly a harmónia és az assertivitás között.",
        en: "Collaborative but assertive when needed. Good balance between harmony and standing ground.",
      },
      low: {
        hu: "Kritikus, versengő. Nem fél konfrontálódni, jól működik versenykörnyezetben. Csapatban érdemes az együttműködési stílusra figyelni.",
        en: "Critical, competitive. Comfortable with confrontation, thrives in competitive settings. Watch collaboration style in teams.",
      },
    },
    C: {
      high: {
        hu: "Rendszerezett, precíz, megbízható. Határidőket tart, részletekre figyel. Ideális projektvezetői vagy ops pozícióban.",
        en: "Organized, precise, reliable. Meets deadlines, detail-oriented. Ideal for project management or ops roles.",
      },
      medium: {
        hu: "Elfogadható szervezettség és rugalmasság. Képes strukturáltan dolgozni, de nem merev.",
        en: "Acceptable organization with flexibility. Can work structured but not rigid.",
      },
      low: {
        hu: "Spontán, rugalmas, de kevésbé strukturált. Kreatív pozícióban erős, de projektmenedzsmentnél érdemes támogatni.",
        en: "Spontaneous, flexible but less structured. Strong in creative roles, may need support in project management.",
      },
    },
    O: {
      high: {
        hu: "Nyitott, kreatív, érdeklődő. Szeret új megközelítéseket keresni. Innovációs és stratégiai pozíciókban erős.",
        en: "Open, creative, curious. Likes exploring new approaches. Strong in innovation and strategy roles.",
      },
      medium: {
        hu: "Nyitott az újdonságra, de értékeli a bevált módszereket is. Pragmatikus újító.",
        en: "Open to novelty while valuing proven methods. Pragmatic innovator.",
      },
      low: {
        hu: "Hagyománytisztelő, bevált módszereket preferálja. Stabil, kiszámítható. Jó végrehajtói és standardizáló pozícióban.",
        en: "Traditional, prefers proven methods. Stable, predictable. Good in execution and standardization roles.",
      },
    },
  };

  return insights[dim]?.[category]?.[locale] ?? "";
}

export default async function CandidateResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; inviteId: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const [locale, { orgId, inviteId }, { team: teamParam }] = await Promise.all([
    getServerLocale(),
    params,
    searchParams,
  ]);

  const { role: memberRole } = await requireOrgContext(orgId);
  if (!hasOrgRole(memberRole, "ORG_MANAGER")) notFound();

  const isHu = locale !== "en";
  const contentLocale: Locale = locale === "en" ? "en" : "hu";

  // All teams in the org for the selector
  const orgTeams = await prisma.team.findMany({
    where: { orgId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const invite = await prisma.candidateInvite.findFirst({
    where: { id: inviteId, team: { orgId } },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      status: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      result: { select: { scores: true, testType: true } },
    },
  });

  if (!invite || !invite.result) {
    redirect(`/hiring/${orgId}`);
  }

  const candidateScores = extractDimensionScores(invite.result.scores) ?? {};
  const testType = invite.result.testType ?? "HEXACO";
  const dims = ["H", "E", "X", "A", "C", "O"];

  const profileOutput = runProfileEngine(candidateScores, testType);

  // All high/low dims for the summary block
  const highDims = dims.filter((d) => profileOutput.categories[d] === "high");
  const lowDims = dims.filter((d) => profileOutput.categories[d] === "low");

  // Selected team: searchParam → invite's team → first org team
  const selectedTeamId =
    teamParam && orgTeams.some((t) => t.id === teamParam)
      ? teamParam
      : invite.teamId && orgTeams.some((t) => t.id === invite.teamId)
        ? invite.teamId
        : orgTeams[0]?.id ?? null;

  const selectedTeam = orgTeams.find((t) => t.id === selectedTeamId) ?? null;

  // Fetch team members' scores for comparison
  let teamAvg: Record<string, number> | null = null;
  if (selectedTeamId) {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: selectedTeamId },
      select: {
        user: {
          select: {
            assessmentResults: {
              where: { isSelfAssessment: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { scores: true },
            },
          },
        },
      },
    });

    const validScores: Record<string, number>[] = teamMembers
      .map((m) => extractDimensionScores(m.user.assessmentResults[0]?.scores))
      .filter(
        (s): s is Record<string, number> =>
          !!s && dims.every((d) => typeof s[d] === "number")
      );

    if (validScores.length >= 1) {
      const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };
      for (const s of validScores) {
        for (const d of dims) sums[d] += s[d];
      }
      teamAvg = {};
      for (const d of dims) teamAvg[d] = Math.round(sums[d] / validScores.length);
    }
  }

  // Gap analysis — sorted by absolute gap descending
  const gapAnalysis = teamAvg
    ? dims
        .map((d) => ({
          dim: d,
          label: DIM_LABELS[d]?.[contentLocale] ?? d,
          candidate: candidateScores[d] ?? 0,
          team: teamAvg![d],
          gap: (candidateScores[d] ?? 0) - teamAvg![d],
        }))
        .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    : null;

  const displayName =
    invite.name ?? invite.email ?? (isHu ? "Névtelen jelölt" : "Unnamed candidate");

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        {/* Back */}
        <Link
          href={`/hiring/${orgId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? "Vissza · Felvétel" : "Back · Hiring"}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// jelölt eredménye" : "// candidate result"}
          </p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
            {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {invite.position && (
              <span className="text-sm text-ink-body">{invite.position}</span>
            )}
            {invite.team && (
              <span className="text-xs text-muted">
                {isHu ? "Hozzárendelt csapat: " : "Assigned team: "}{invite.team.name}
              </span>
            )}
          </div>
        </div>

        {/* Team selector */}
        {orgTeams.length > 0 && (
          <div className="mb-8">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              {isHu ? "Összehasonlítás csapattal" : "Compare with team"}
            </p>
            <div className="flex flex-wrap gap-2">
              {orgTeams.map((team) => {
                const isSelected = team.id === selectedTeamId;
                return (
                  <Link
                    key={team.id}
                    href={`?team=${team.id}`}
                    className={[
                      "inline-flex min-h-[36px] items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-sage bg-sage text-white"
                        : "border-sand bg-white text-ink-body hover:border-sage/40 hover:text-bronze",
                    ].join(" ")}
                  >
                    {team.name}
                    {team.id === invite.teamId && (
                      <span className={`ml-1.5 text-[10px] ${isSelected ? "opacity-70" : "text-muted"}`}>
                        ★
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            {selectedTeam && !teamAvg && (
              <p className="mt-2 text-xs text-muted">
                {isHu
                  ? `A(z) ${selectedTeam.name} csapatnak nincs befejezett értékelése.`
                  : `${selectedTeam.name} has no completed assessments.`}
              </p>
            )}
          </div>
        )}

        {/* ① VEZETŐI ÖSSZEFOGLALÓ */}
        <section className="mb-6 rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// vezetői összefoglaló" : "// manager summary"}
          </p>
          <h2 className="mb-4 font-fraunces text-xl text-ink">
            {isHu ? "Gyors áttekintés" : "Quick overview"}
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Erősségek */}
            <div className="rounded-xl bg-[rgba(26,92,58,0.06)] p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-sage">
                {isHu ? "// erősségek" : "// strengths"}
              </p>
              <div className="space-y-1.5">
                {highDims.length > 0 ? (
                  highDims.map((d) => (
                    <p key={d} className="text-sm text-ink">
                      <span className="font-semibold">{DIM_LABELS[d]?.[contentLocale] ?? d}</span>
                      <span className="text-ink-body">
                        {" — "}{CATEGORY_LABELS.high[contentLocale]}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-muted">
                    {isHu
                      ? "Kiegyensúlyozott profil, nincs kiemelkedő dimenzió"
                      : "Balanced profile, no standout dimension"}
                  </p>
                )}
              </div>
            </div>

            {/* Figyelendő területek */}
            <div className="rounded-xl bg-[rgba(200,65,10,0.06)] p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-bronze">
                {isHu ? "// figyelendő" : "// watch areas"}
              </p>
              <div className="space-y-1.5">
                {lowDims.length > 0 ? (
                  lowDims.map((d) => (
                    <p key={d} className="text-sm text-ink">
                      <span className="font-semibold">{DIM_LABELS[d]?.[contentLocale] ?? d}</span>
                      <span className="text-ink-body">
                        {" — "}{CATEGORY_LABELS.low[contentLocale]}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-muted">
                    {isHu
                      ? "Nincs kritikusan alacsony terület"
                      : "No critically low area"}
                  </p>
                )}
              </div>
            </div>

            {/* Team Fit */}
            <div className="rounded-xl bg-[rgba(99,102,241,0.06)] p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#6366F1]">
                {isHu ? "// csapat illeszkedés" : "// team fit"}
              </p>
              {gapAnalysis ? (() => {
                const avgAbsGap = Math.round(
                  gapAnalysis.reduce((sum, g) => sum + Math.abs(g.gap), 0) / gapAnalysis.length
                );
                const fitLevel =
                  avgAbsGap < 10 ? "excellent" : avgAbsGap < 20 ? "good" : "divergent";
                const fitLabels = {
                  excellent: { hu: "Kiváló illeszkedés", en: "Excellent fit", color: "var(--color-sage)" },
                  good: { hu: "Jó illeszkedés", en: "Good fit", color: "#92400e" },
                  divergent: { hu: "Eltérő profil", en: "Divergent profile", color: "var(--color-bronze)" },
                };
                const fit = fitLabels[fitLevel];
                const topGap = gapAnalysis[0];
                return (
                  <>
                    <p className="text-lg font-semibold" style={{ color: fit.color }}>
                      {isHu ? fit.hu : fit.en}
                    </p>
                    <p className="mt-1 text-xs text-ink-body">
                      {isHu
                        ? `Átlagos eltérés: ±${avgAbsGap} pont`
                        : `Average deviation: ±${avgAbsGap} points`}
                    </p>
                    {topGap && Math.abs(topGap.gap) > 15 && (
                      <p className="mt-1 text-xs text-muted">
                        {isHu
                          ? `Legnagyobb: ${topGap.label} (${topGap.gap > 0 ? "+" : ""}${topGap.gap})`
                          : `Largest: ${topGap.label} (${topGap.gap > 0 ? "+" : ""}${topGap.gap})`}
                      </p>
                    )}
                  </>
                );
              })() : (
                <p className="text-xs text-muted">
                  {isHu
                    ? "Csapat összehasonlítás nem elérhető"
                    : "Team comparison not available"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ② HEXACO PROFIL + ÉRTELMEZÉS */}
        <section className="mb-6 rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// hexaco profil" : "// hexaco profile"}
          </p>
          <h2 className="mb-6 font-fraunces text-xl text-ink">
            {isHu ? "Személyiségprofil" : "Personality profile"}
          </h2>

          <div className="flex flex-col gap-4">
            {dims.map((d) => {
              const score = Math.round(candidateScores[d] ?? 0);
              const category = profileOutput.categories[d] ?? "medium";
              const teamVal = teamAvg ? Math.round(teamAvg[d]) : null;
              const color = DIM_COLORS[d];
              const dimLabel = DIM_LABELS[d]?.[contentLocale] ?? d;
              const insight = getDimensionInsight(d, category, contentLocale);

              return (
                <div
                  key={d}
                  className="rounded-xl border border-warm-mid p-4 transition hover:bg-cream/50"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: color }}
                    >
                      {d}
                    </div>
                    <span className="text-sm font-semibold text-ink">{dimLabel}</span>
                    <span
                      className={[
                        "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        category === "high"
                          ? "bg-[rgba(26,92,58,0.08)] text-sage"
                          : category === "low"
                            ? "bg-[rgba(200,65,10,0.08)] text-bronze"
                            : "bg-warm text-ink-body",
                      ].join(" ")}
                    >
                      {score}% · {CATEGORY_LABELS[category][contentLocale]}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative mb-2 h-3 overflow-hidden rounded-full bg-warm-mid">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, background: color, opacity: 0.85 }}
                    />
                    {teamVal !== null && (
                      <div
                        className="absolute top-0 h-3 w-0.5 rounded-full bg-ink-body/40"
                        style={{ left: `${teamVal}%` }}
                        title={`${isHu ? "Csapatátlag" : "Team avg"}: ${teamVal}%`}
                      />
                    )}
                  </div>

                  {insight && (
                    <p className="text-xs leading-relaxed text-ink-warm">{insight}</p>
                  )}
                </div>
              );
            })}
          </div>

        </section>

        {/* ③ TEAM FIT VIZUALIZÁCIÓ */}
        {teamAvg && gapAnalysis && (
          <section className="mb-6 rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              {isHu ? "// csapat illeszkedés" : "// team fit"}
            </p>
            <h2 className="mb-6 font-fraunces text-xl text-ink">
              {isHu ? "Jelölt a csapatban" : "Candidate in the team"}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Radar chart — candidate vs team overlay */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[280px]">
                  <RadarChart
                    uid="candidate-vs-team"
                    dimensions={dims.map((d) => ({
                      code: d,
                      color: DIM_COLORS[d],
                      score: candidateScores[d] ?? 0,
                      observerScore: teamAvg![d],
                    }))}
                    showObserver={true}
                    selfLabel={displayName}
                    observerLabel={selectedTeam ? selectedTeam.name : (isHu ? "Csapatátlag" : "Team avg")}
                  />
                </div>
              </div>

              {/* Gap analysis */}
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-body">
                  {isHu ? "Eltérések a csapatátlagtól" : "Deviations from team average"}
                </p>
                <div className="space-y-2">
                  {gapAnalysis.map((g) => (
                    <div key={g.dim} className="flex items-center gap-3">
                      <div
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[8px] font-bold text-white"
                        style={{ background: DIM_COLORS[g.dim] }}
                      >
                        {g.dim}
                      </div>
                      <span className="w-28 truncate text-xs text-ink-body">{g.label}</span>

                      {/* Gap bar */}
                      <div className="relative flex-1">
                        <div className="h-2 w-full rounded-full bg-warm-mid">
                          <div className="absolute left-1/2 top-0 h-2 w-px bg-[#d0cbc2]" />
                          <div
                            className="absolute top-0 h-2 rounded-full transition-all"
                            style={{
                              background: g.gap > 0 ? "#3d6b5e" : "#c17f4a",
                              opacity: 0.7,
                              left: g.gap > 0 ? "50%" : `${50 + (g.gap / 100) * 50}%`,
                              width: `${Math.abs(g.gap) / 2}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span
                        className={[
                          "w-12 text-right font-mono text-xs font-semibold",
                          Math.abs(g.gap) > 20
                            ? "text-bronze"
                            : Math.abs(g.gap) > 10
                              ? "text-[#92400e]"
                              : "text-sage",
                        ].join(" ")}
                      >
                        {g.gap > 0 ? "+" : ""}{g.gap}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  {isHu
                    ? "A pozitív eltérés azt jelenti, hogy a jelölt erősebb ebben a dimenzióban. A negatív eltérés fejlesztési lehetőséget jelez."
                    : "Positive deviation means the candidate scores higher. Negative deviation suggests a growth area."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ④ MŰKÖDÉSI MINTÁK */}
        {(profileOutput.showBlock6 || profileOutput.showBlock7) && (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              {isHu ? "// működési minták" : "// behavioral patterns"}
            </p>
            <h2 className="mb-5 font-fraunces text-xl text-ink">
              {isHu ? "Jellemző működési dinamikák" : "Characteristic dynamics"}
            </h2>

            <div className="space-y-3">
              {/* Erősség pair-ek */}
              {profileOutput.block6Pairs.map((pair) => {
                const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[contentLocale] ?? "";
                return (
                  <div
                    key={pair.contentKey}
                    className="rounded-xl border border-[rgba(26,92,58,0.1)] bg-[rgba(26,92,58,0.04)] p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimA] }}
                        >
                          {pair.dimA}
                        </span>
                        <span className="text-[10px] text-muted">+</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimB] }}
                        >
                          {pair.dimB}
                        </span>
                      </div>
                      <span className="rounded-full bg-[rgba(26,92,58,0.08)] px-2 py-0.5 text-[10px] font-semibold text-sage">
                        {isHu ? "Erősség" : "Strength"}
                      </span>
                    </div>
                    {narrative && (
                      <p className="text-sm leading-relaxed text-ink-body">{narrative}</p>
                    )}
                  </div>
                );
              })}

              {/* Figyelendő pair-ek */}
              {profileOutput.block7Pairs.map((pair) => {
                const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[contentLocale] ?? "";
                return (
                  <div
                    key={pair.contentKey}
                    className="rounded-xl border border-[rgba(200,65,10,0.1)] bg-[rgba(200,65,10,0.04)] p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimA] }}
                        >
                          {pair.dimA}
                        </span>
                        <span className="text-[10px] text-muted">+</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: DIM_COLORS[pair.dimB] }}
                        >
                          {pair.dimB}
                        </span>
                      </div>
                      <span className="rounded-full bg-[rgba(200,65,10,0.08)] px-2 py-0.5 text-[10px] font-semibold text-bronze">
                        {isHu ? "Figyelendő" : "Watch area"}
                      </span>
                    </div>
                    {narrative && (
                      <p className="text-sm leading-relaxed text-ink-body">{narrative}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
