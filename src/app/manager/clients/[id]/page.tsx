import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { FadeIn } from "@/components/landing/FadeIn";
import { GenerateOutputButton } from "@/components/manager/GenerateOutputButton";
import { ClientGapAnalysis } from "@/components/manager/ClientGapAnalysis";
import type { ScoreResult } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Client Profile | Coach | Trita", robots: { index: false } };
}

const DIM_COLORS: Record<string, string> = {
  H: "#6366f1", E: "#a855f7", X: "#3b82f6",
  A: "#22c55e", C: "#f97316", O: "#ec4899",
  N: "#f43f5e",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { userId }, { id: clientId }] = await Promise.all([
    getServerLocale(),
    auth(),
    params,
  ]);
  if (!userId) redirect("/sign-in");

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!manager || manager.role !== "MANAGER") redirect("/dashboard");

  const relationship = await prisma.managerClientRelationship.findUnique({
    where: { managerId_clientId: { managerId: manager.id, clientId } },
    select: { status: true, startedAt: true },
  });

  if (!relationship || relationship.status !== "ACTIVE") notFound();

  const [client, latestAssessment, completedObservers, cachedOutput] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: clientId },
      select: { id: true, email: true, username: true, country: true, occupation: true, onboardedAt: true },
    }),
    prisma.assessmentResult.findFirst({
      where: { userProfileId: clientId, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { testType: true, scores: true, createdAt: true },
    }),
    prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: clientId, status: "COMPLETED" } },
      select: { scores: true, confidence: true, relationshipType: true },
    }),
    prisma.generatedOutput.findFirst({
      where: { managerId: manager.id, clientId },
      orderBy: { createdAt: "desc" },
      select: { cacheKey: true, createdAt: true, hitCount: true },
    }),
  ]);

  if (!client) notFound();

  const isHu = locale !== "en" && locale !== "de";
  const displayName = client.username ?? client.email ?? "—";

  const scores = latestAssessment
    ? ((latestAssessment.scores as Record<string, unknown>).dimensions as Record<string, number> | undefined)
    : undefined;

  const testType = latestAssessment?.testType as TestType | undefined;
  const config = testType ? getTestConfig(testType, locale) : null;
  const dims = config?.dimensions.filter((d) => d.code !== "I") ?? [];

  // Observer averages
  let observerAvgScores: Record<string, number> | null = null;
  let avgConfidence: number | null = null;

  if (completedObservers.length >= 1 && scores) {
    const dimKeys = Object.keys(scores);
    const sums: Record<string, number> = {};
    let confSum = 0;
    let confCount = 0;
    for (const obs of completedObservers) {
      const s = ((obs.scores as Record<string, unknown>).dimensions as Record<string, number>) ?? {};
      for (const key of dimKeys) {
        sums[key] = (sums[key] ?? 0) + (s[key] ?? 0);
      }
      if (obs.confidence != null) { confSum += obs.confidence; confCount++; }
    }
    observerAvgScores = Object.fromEntries(
      dimKeys.map((k) => [k, Math.round(sums[k] / completedObservers.length)])
    );
    if (confCount > 0) avgConfidence = Math.round((confSum / confCount) * 10) / 10;
  }

  // Facet-level divergences (requires at least 1 observer and facet data)
  type FacetDeltaEntry = {
    dimCode: string; dimLabel: string; dimColor: string;
    subCode: string; subLabel: string;
    selfScore: number; observerScore: number; delta: number;
  };
  const facetDeltas: FacetDeltaEntry[] = [];

  if (completedObservers.length >= 1 && latestAssessment && config) {
    const selfScores = latestAssessment.scores as ScoreResult;
    const obsScoresList = completedObservers.map((o) => o.scores as ScoreResult);
    const mainDims = config.dimensions.filter((d) => d.code !== "I");

    for (const dim of mainDims) {
      const dimLabel = dim.labelByLocale?.[locale as "hu" | "en" | "de"] ?? dim.label;
      for (const subType of ["facets", "aspects"] as const) {
        const subs = dim[subType];
        if (!subs) continue;
        for (const sub of subs) {
          const selfScore = selfScores[subType]?.[dim.code]?.[sub.code] ?? null;
          if (selfScore == null) continue;
          let sum = 0;
          let count = 0;
          for (const obs of obsScoresList) {
            const v = obs[subType]?.[dim.code]?.[sub.code];
            if (v != null) { sum += v; count++; }
          }
          if (count === 0) continue;
          const observerScore = Math.round(sum / count);
          facetDeltas.push({
            dimCode: dim.code,
            dimLabel,
            dimColor: dim.color,
            subCode: sub.code,
            subLabel: sub.label,
            selfScore: Math.round(selfScore),
            observerScore,
            delta: observerScore - Math.round(selfScore),
          });
        }
      }
    }
  }

  const dateLocale = locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU";

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Header */}
        <FadeIn>
          <div>
            <Link
              href="/manager"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              {isHu ? "Vissza a dashboardra" : "Back to dashboard"}
            </Link>

            <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {isHu ? "Kliens profil" : "Client profile"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-3xl">
                    {displayName}
                  </h1>
                </div>
                {client.username && (
                  <p className="mt-1 text-sm text-gray-500">{client.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {isHu ? "Kliens óta: " : "Client since: "}
                  {relationship.startedAt.toLocaleDateString(dateLocale)}
                </p>
              </div>
            </section>
          </div>
        </FadeIn>

        {/* No assessment state */}
        {!latestAssessment || !scores || !config ? (
          <FadeIn delay={0.05}>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-10 text-center">
              <p className="text-sm text-gray-400">
                {isHu
                  ? "A kliensnek még nincs kitöltött assessmentje."
                  : "This client has not completed an assessment yet."}
              </p>
            </div>
          </FadeIn>
        ) : (
          <>
            {/* Personality profile */}
            <FadeIn delay={0.05}>
              <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
                <div className="mb-6 flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {isHu ? "Személyiségprofil" : "Personality Profile"}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {latestAssessment.createdAt.toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                      {testType === "HEXACO_MODIFIED" ? "HEXACO" : testType === "BIG_FIVE" ? "BIG 5" : testType}
                    </span>
                    {completedObservers.length > 0 && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                        {isHu ? `${completedObservers.length} observer` : `${completedObservers.length} observer${completedObservers.length !== 1 ? "s" : ""}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {dims.map((dim) => {
                    const score = scores[dim.code] ?? 0;
                    const obsScore = observerAvgScores?.[dim.code];
                    const color = DIM_COLORS[dim.code] ?? "#6366f1";
                    const label = dim.labelByLocale?.[locale as "hu" | "en" | "de"] ?? dim.label;
                    const delta = obsScore !== undefined ? score - obsScore : null;

                    return (
                      <div key={dim.code} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {dim.code}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{label}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {delta !== null && (
                              <span
                                className={`text-xs font-semibold tabular-nums ${
                                  Math.abs(delta) > 10 ? "text-amber-500" : "text-gray-300"
                                }`}
                                title={isHu ? "Observer eltérés" : "Observer delta"}
                              >
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                            <span className="text-sm font-bold tabular-nums text-gray-900 w-7 text-right">{score}</span>
                          </div>
                        </div>
                        {/* Self bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${score}%`, backgroundColor: color }}
                          />
                        </div>
                        {/* Observer bar */}
                        {obsScore !== undefined && (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full opacity-50 transition-all"
                              style={{ width: `${obsScore}%`, backgroundColor: color }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {observerAvgScores && (
                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-5 rounded-full bg-gray-300" />
                      {isHu ? "Önértékelés" : "Self"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-5 rounded-full bg-gray-200" />
                      {isHu
                        ? `Observer átlag (${completedObservers.length} fő)`
                        : `Observer avg (${completedObservers.length})`}
                    </div>
                    {avgConfidence && (
                      <div className="ml-auto">
                        {isHu ? `Konfidencia: ${avgConfidence}/5` : `Confidence: ${avgConfidence}/5`}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </FadeIn>

            {/* Facet gap analysis */}
            {facetDeltas.length > 0 && (
              <FadeIn delay={0.1}>
                <ClientGapAnalysis
                  facetDeltas={facetDeltas}
                  observerCount={completedObservers.length}
                  avgConfidence={avgConfidence}
                  locale={locale}
                  isHu={isHu}
                />
              </FadeIn>
            )}

            {/* Debrief section */}
            <FadeIn delay={0.15}>
              <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
                <div className="mb-1 flex items-center gap-3">
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isHu ? "AI Coaching Debrief" : "AI Coaching Debrief"}
                  </h2>
                </div>
                <p className="mb-5 text-sm text-gray-500">
                  {isHu
                    ? "Személyre szabott coaching anyag a kliens profilja alapján. Az eredmény cache-elve lesz."
                    : "Personalized coaching debrief based on the client's profile. The result will be cached."}
                </p>

                {cachedOutput && (
                  <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-green-700">
                        {isHu ? "Legutóbbi debrief" : "Last debrief"}
                      </p>
                      <p className="text-xs text-green-600">
                        {cachedOutput.createdAt.toLocaleDateString(dateLocale)}
                        {cachedOutput.hitCount > 1 && ` · ${cachedOutput.hitCount}× ${isHu ? "megtekintve" : "viewed"}`}
                      </p>
                    </div>
                    <Link
                      href={`/manager/outputs/${encodeURIComponent(cachedOutput.cacheKey)}`}
                      className="shrink-0 min-h-[36px] inline-flex items-center rounded-lg border border-green-200 bg-white px-3 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                    >
                      {isHu ? "Megnyitás →" : "Open →"}
                    </Link>
                  </div>
                )}

                <GenerateOutputButton clientId={clientId} locale={locale} />
              </section>
            </FadeIn>
          </>
        )}

      </main>
    </div>
  );
}
