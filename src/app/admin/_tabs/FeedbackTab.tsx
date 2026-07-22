import { prisma } from "@/lib/prisma";
import { AdminFeedbackSection } from "@/app/admin/_components/AdminFeedbackSection";

// Visszajelzések fül — szerep-kalibráció + érdeklődés-jelzések + elégedettség
// (utóbbi a megszűnt Kutatás fülről költözött ide)
export async function FeedbackTab() {
  const [roleFitRows, interestRows, satisfactionRows, dimensionRows] = await Promise.all([
    prisma.feedback.findMany({
      where: { kind: "role_fit" },
      select: { targetKey: true, rating: true, payload: true },
    }),
    prisma.feedback.findMany({
      where: { kind: "feature_interest" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        targetKey: true,
        createdAt: true,
        userProfile: { select: { email: true, username: true } },
      },
    }),
    prisma.feedback.findMany({
      where: { kind: "satisfaction" },
      select: { rating: true, payload: true },
    }),
    prisma.feedback.findMany({
      where: { kind: "dimension" },
      select: { targetKey: true, rating: true },
    }),
  ]);

  const avg = (nums: number[]) =>
    nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  const round1 = (v: number | null) => (v == null ? 0 : Math.round(v * 10) / 10);
  const satPayload = (row: { payload: unknown }) =>
    (row.payload ?? {}) as {
      observerFeedbackUsefulness?: number | null;
      siteUsefulness?: number | null;
    };
  const satisfactionSummary = {
    count: satisfactionRows.length,
    avgAgreement: round1(avg(
      satisfactionRows.map((r) => r.rating).filter((v): v is number => v != null),
    )),
    avgObserverUsefulness: round1(avg(
      satisfactionRows
        .map((r) => satPayload(r).observerFeedbackUsefulness)
        .filter((v): v is number => v != null),
    )),
    avgSiteUsefulness: round1(avg(
      satisfactionRows
        .map((r) => satPayload(r).siteUsefulness)
        .filter((v): v is number => v != null),
    )),
  };

  // targetKey: "<assessmentResultId>:<dimCode>" → dimenziónkénti átlag
  const dimMap = new Map<string, { sum: number; count: number }>();
  for (const row of dimensionRows) {
    const dimCode = (row.targetKey ?? "").split(":")[1] ?? "?";
    const entry = dimMap.get(dimCode) ?? { sum: 0, count: 0 };
    entry.sum += row.rating ?? 0;
    entry.count += 1;
    dimMap.set(dimCode, entry);
  }
  const dimensionAverages = [...dimMap.entries()]
    .map(([dimensionCode, { sum, count }]) => ({
      dimensionCode,
      avgRating: count ? Math.round((sum / count) * 10) / 10 : 0,
      count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  // soronkénti feldolgozás → szerepenkénti aggregát
  // (targetKey: "<industryKey>:<roleKey>", payload.verdict, rating = fitScore)
  const aggregateMap = new Map<
    string,
    { industryKey: string; roleKey: string; accurate: number; inaccurate: number; scoreSum: number; total: number }
  >();
  for (const row of roleFitRows) {
    const [industryKey = "?", roleKey = "?"] = (row.targetKey ?? "").split(":");
    const key = `${industryKey}:${roleKey}`;
    const entry =
      aggregateMap.get(key) ??
      { industryKey, roleKey, accurate: 0, inaccurate: 0, scoreSum: 0, total: 0 };
    const verdict = (row.payload as { verdict?: string } | null)?.verdict;
    if (verdict === "accurate") entry.accurate += 1;
    else entry.inaccurate += 1;
    entry.scoreSum += row.rating ?? 0;
    entry.total += 1;
    aggregateMap.set(key, entry);
  }
  const roleFitAggregates = [...aggregateMap.values()]
    .map((entry) => ({
      industryKey: entry.industryKey,
      roleKey: entry.roleKey,
      accurate: entry.accurate,
      inaccurate: entry.inaccurate,
      avgFitScore: entry.total > 0 ? Math.round(entry.scoreSum / entry.total) : 0,
    }))
    .sort((a, b) => b.accurate + b.inaccurate - (a.accurate + a.inaccurate));

  return (
    <AdminFeedbackSection
      roleFitAggregates={roleFitAggregates}
      interests={interestRows.map((row) => ({
        id: row.id,
        featureKey: row.targetKey ?? "?",
        createdAt: row.createdAt.toISOString(),
        email: row.userProfile.email,
        username: row.userProfile.username,
      }))}
      satisfactionSummary={satisfactionSummary}
      dimensionAverages={dimensionAverages}
    />
  );
}
