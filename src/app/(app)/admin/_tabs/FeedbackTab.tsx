import { prisma } from "@/lib/prisma";
import { getOccupation } from "@/lib/career/catalog";
import { calibrateFeedback, type FeedbackRow } from "@/lib/career/calibration";
import { AdminFeedbackSection } from "@/app/(app)/admin/_components/AdminFeedbackSection";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

// Visszajelzések fül — szerep-kalibráció + érdeklődés-jelzések + elégedettség
// (utóbbi a megszűnt Kutatás fülről költözött ide)
export async function FeedbackTab() {
  const careerActive = isPortfolioSurfaceActive("career");
  const fakedoorActive = isPortfolioSurfaceActive("fakedoor");
  const [roleFitRows, interestRows, satisfactionRows, dimensionRows] = await Promise.all([
    careerActive
      ? prisma.feedback.findMany({
          where: { kind: "role_fit" },
          select: { targetKey: true, rating: true, payload: true },
        })
      : Promise.resolve([]),
    fakedoorActive
      ? prisma.feedback.findMany({
          where: { kind: "feature_interest" },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            targetKey: true,
            createdAt: true,
            userProfile: { select: { email: true, username: true } },
          },
        })
      : Promise.resolve([]),
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

  // soronkénti feldolgozás → foglalkozásonkénti aggregát.
  // targetKey a v2 óta az O*NET-SOC kód; a régi sorok „<iparág>:<szerep>"
  // alakúak — azokat legacy-ként jelöljük, hogy a kalibrációnál elváljanak.
  const aggregateMap = new Map<
    string,
    { occupationId: string; legacy: boolean; accurate: number; inaccurate: number; scoreSum: number; total: number }
  >();
  for (const row of roleFitRows) {
    const key = row.targetKey ?? "?";
    const legacy = key.includes(":");
    const entry =
      aggregateMap.get(key) ??
      { occupationId: key, legacy, accurate: 0, inaccurate: 0, scoreSum: 0, total: 0 };
    const verdict = (row.payload as { verdict?: string } | null)?.verdict;
    if (verdict === "accurate") entry.accurate += 1;
    else entry.inaccurate += 1;
    entry.scoreSum += row.rating ?? 0;
    entry.total += 1;
    aggregateMap.set(key, entry);
  }
  // F3-kalibráció: Wilson-féle alsó korlát, hogy a kis mintás „100% találó"
  // ne tűnjön bizonyítéknak, és csak elég adatnál jelezzünk felülvizsgálandót.
  const calibrationRows: FeedbackRow[] = [];
  for (const row of roleFitRows) {
    const key = row.targetKey ?? "";
    if (!key || key.includes(":")) continue;
    const verdict = (row.payload as { verdict?: string } | null)?.verdict;
    calibrationRows.push({
      occupationId: key,
      verdict: verdict === "accurate" ? "accurate" : "inaccurate",
      fitScore: row.rating ?? 0,
    });
  }
  const calibrationByOccupation = new Map(
    calibrateFeedback(calibrationRows).map((entry) => [entry.occupationId, entry]),
  );

  const roleFitAggregates = [...aggregateMap.values()]
    .map((entry) => {
      const calibration = calibrationByOccupation.get(entry.occupationId);
      return {
        occupationId: entry.occupationId,
        label: entry.legacy
          ? `${entry.occupationId} (régi katalógus)`
          : (getOccupation(entry.occupationId)?.hu ?? entry.occupationId),
        accurate: entry.accurate,
        inaccurate: entry.inaccurate,
        avgFitScore: entry.total > 0 ? Math.round(entry.scoreSum / entry.total) : 0,
        wilsonLow: calibration ? Math.round(calibration.wilsonLow * 100) : null,
        belowChance: calibration?.belowChance ?? false,
      };
    })
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
