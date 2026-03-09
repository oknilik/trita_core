import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import { GenerateOutputButton } from "@/components/coach/GenerateOutputButton";

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

  const coach = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!coach || coach.role !== "COACH") redirect("/dashboard");

  const relationship = await prisma.coachClientRelationship.findUnique({
    where: { coachId_clientId: { coachId: coach.id, clientId } },
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
    // Check if a cached output already exists for quick access (latest by client)
    prisma.generatedOutput.findFirst({
      where: { coachId: coach.id, clientId },
      orderBy: { createdAt: "desc" },
      select: { cacheKey: true, createdAt: true },
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

  // Observer avg scores
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

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">

        {/* Back + header */}
        <div>
          <Link
            href="/coach"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-4"
          >
            ← {isHu ? "Vissza a dashboardra" : "Back to dashboard"}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-500">{client.email}</p>
          <p className="mt-1 text-xs text-gray-400">
            {isHu ? "Kliens óta: " : "Client since: "}
            {relationship.startedAt.toLocaleDateString(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU")}
          </p>
        </div>

        {/* No assessment state */}
        {!latestAssessment || !scores || !config ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center text-sm text-gray-500">
            {isHu
              ? "A kliensnek még nincs kitöltött assessmentje."
              : "This client has not completed an assessment yet."}
          </div>
        ) : (
          <>
            {/* Scores grid */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Személyiségprofil" : "Personality Profile"}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                    {testType === "HEXACO_MODIFIED" ? "HEXACO" : testType === "BIG_FIVE" ? "BIG 5" : testType}
                  </span>
                  <span className="text-xs text-gray-400">
                    {latestAssessment.createdAt.toLocaleDateString(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {dims.map((dim, i) => {
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
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {dim.code}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {obsScore !== undefined && delta !== null && (
                            <span
                              className={`text-xs font-semibold ${Math.abs(delta) > 10 ? "text-amber-600" : "text-gray-400"}`}
                              title={isHu ? "Observer eltérés" : "Observer delta"}
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-900">{score}</span>
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
                            className="h-full rounded-full transition-all opacity-60"
                            style={{ width: `${obsScore}%`, backgroundColor: color }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              {observerAvgScores && (
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 rounded-full bg-gray-400" />
                    {isHu ? "Önértékelés" : "Self"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-6 rounded-full bg-gray-300" />
                    {isHu ? `Observer átlag (${completedObservers.length} fő)` : `Observer avg (${completedObservers.length})`}
                  </div>
                  {avgConfidence && (
                    <div className="ml-auto text-xs text-gray-400">
                      {isHu ? `Konfidencia: ${avgConfidence}/5` : `Confidence: ${avgConfidence}/5`}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Generate debrief */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                {isHu ? "AI Coaching Debrief" : "AI Coaching Debrief"}
              </h2>
              <p className="mb-4 text-sm text-gray-600">
                {isHu
                  ? "Generálj személyre szabott coaching anyagot Claude AI segítségével. Az eredmény cache-elve lesz."
                  : "Generate a personalized coaching debrief using Claude AI. The result will be cached."}
              </p>

              {cachedOutput && (
                <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {isHu
                    ? `Legutóbbi debrief: ${cachedOutput.createdAt.toLocaleDateString("hu-HU")} — `
                    : `Last debrief: ${cachedOutput.createdAt.toLocaleDateString("en-GB")} — `}
                  <Link
                    href={`/coach/outputs/${encodeURIComponent(cachedOutput.cacheKey)}`}
                    className="font-semibold underline"
                  >
                    {isHu ? "Megnyitás" : "Open"}
                  </Link>
                </div>
              )}

              <GenerateOutputButton clientId={clientId} locale={locale} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
