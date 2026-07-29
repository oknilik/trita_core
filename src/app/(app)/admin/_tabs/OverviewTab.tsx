import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { t, type Locale } from "@/lib/i18n";
import { AdminStatCard } from "@/app/(app)/admin/_components/AdminStatCard";
import { AdminMetricsGrid } from "@/app/(app)/admin/_components/AdminMetricsGrid";
import { AdminTrendChart } from "@/app/(app)/admin/_components/AdminTrendChart";
import { AdminRangeFilter, AdminSegmentFilter, type AdminRange, type AdminSegment } from "@/app/(app)/admin/_components/AdminRangeFilter";

// Legkorábbi rekord-dátum (fallback: most) — kérés-idejű, szándékos.
function resolveEarliest(a?: Date, b?: Date): Date {
  const now = Date.now();
  return new Date(Math.min(a?.getTime() ?? now, b?.getTime() ?? now));
}

// Kérés-idejű időbélyegek a statisztika-ablakokhoz — szándékos.
function getStatWindows() {
  const now = Date.now();
  return {
    sevenDaysAgo: new Date(now - 7 * 24 * 60 * 60 * 1000),
    thirtyDaysAgo: new Date(now - 30 * 24 * 60 * 60 * 1000),
  };
}

// Vezérlő fül — KPI-k + gyorsműveletek
// Időszak-bucketolás a trend-charthoz: 7d/30d napi, 90d heti, all havi.
function buildBuckets(range: AdminRange, earliest: Date) {
  const DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const fmtDay = (d: Date) => d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
  const fmtMonth = (d: Date) => d.toLocaleDateString("hu-HU", { year: "2-digit", month: "short" });

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    const starts = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * DAY);
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return { starts, labels: starts.map(fmtDay), windowStart: starts[0] };
  }
  if (range === "90d") {
    const weeks = 13;
    const starts = Array.from({ length: weeks }, (_, i) => {
      const d = new Date(now.getTime() - (weeks - 1 - i) * 7 * DAY);
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return { starts, labels: starts.map(fmtDay), windowStart: starts[0] };
  }
  // all: havi bucketok az első rekordtól (max 24 hónap vissza).
  const first = new Date(Math.max(earliest.getTime(), now.getTime() - 24 * 30 * DAY));
  const starts: Date[] = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= end) {
    starts.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (starts.length === 0) starts.push(end);
  return { starts, labels: starts.map(fmtMonth), windowStart: starts[0] };
}

function bucketCounts(dates: Date[], starts: Date[]): number[] {
  const counts = new Array(starts.length).fill(0);
  for (const d of dates) {
    // Az utolsó olyan bucket, aminek a kezdete <= d.
    let idx = -1;
    for (let i = 0; i < starts.length; i++) {
      if (starts[i].getTime() <= d.getTime()) idx = i;
      else break;
    }
    if (idx >= 0) counts[idx] += 1;
  }
  return counts;
}

export async function OverviewTab({ locale, range, segment }: { locale: Locale; range: AdminRange; segment: AdminSegment }) {
  const { sevenDaysAgo, thirtyDaysAgo } = getStatWindows();

  const [userStats, assessmentStats, invitationStats, feedbackStats, newInquiryCount] =
    await Promise.all([
      (async () => {
        const currentYear = new Date().getFullYear();

        const total = await prisma.userProfile.count({
          where: { deleted: false },
        });
        const new7d = await prisma.userProfile.count({
          where: { deleted: false, createdAt: { gte: sevenDaysAgo } },
        });
        const new30d = await prisma.userProfile.count({
          where: { deleted: false, createdAt: { gte: thirtyDaysAgo } },
        });

        const ageStats = await prisma.userProfile.aggregate({
          where: { deleted: false, birthYear: { not: null } },
          _avg: { birthYear: true },
          _min: { birthYear: true },
          _max: { birthYear: true },
        });

        const avgAge = ageStats._avg.birthYear
          ? Math.round(currentYear - ageStats._avg.birthYear)
          : null;
        const minAge = ageStats._max.birthYear
          ? currentYear - ageStats._max.birthYear
          : null;
        const maxAge = ageStats._min.birthYear
          ? currentYear - ageStats._min.birthYear
          : null;

        const birthYears = await prisma.userProfile.findMany({
          where: { deleted: false, birthYear: { not: null } },
          select: { birthYear: true },
        });

        let medianAge = null;
        if (birthYears.length > 0) {
          const sortedBirthYears = birthYears
            .map((u: { birthYear: number | null }) => u.birthYear!)
            .sort((a: number, b: number) => a - b);
          const mid = Math.floor(sortedBirthYears.length / 2);
          const medianBirthYear =
            sortedBirthYears.length % 2 === 0
              ? (sortedBirthYears[mid - 1] + sortedBirthYears[mid]) / 2
              : sortedBirthYears[mid];
          medianAge = Math.round(currentYear - medianBirthYear);
        }

        return { total, new7d, new30d, avgAge, medianAge, minAge, maxAge };
      })(),

      (async () => {
        const [total, observerTotal] = await Promise.all([
          prisma.assessmentResult.count(),
          prisma.observerAssessment.count(),
        ]);
        return { total, observerTotal };
      })(),

      (async () => {
        const total = await prisma.observerInvitation.count({
          where: { status: { in: ["PENDING", "COMPLETED"] } },
        });
        const byStatus = await prisma.observerInvitation.groupBy({
          by: ["status"],
          _count: { id: true },
          where: { status: { in: ["PENDING", "COMPLETED"] } },
        });
        return { total, byStatus };
      })(),

      (async () => {
        // KPI-hoz elég a darabszám — a részletes bontás a Visszajelzések fülön.
        const [satisfactionCount, dimensionCount] = await Promise.all([
          prisma.feedback.count({ where: { kind: "satisfaction" } }),
          prisma.feedback.count({ where: { kind: "dimension" } }),
        ]);
        return { satisfactionCount, dimensionCount };
      })(),

      prisma.inquiry.count({ where: { status: "NEW" } }),
    ]);

  // ── Trend-adatok az időszak-szűrő szerint ──────────────────────────
  const [firstUser, firstResult] = await Promise.all([
    prisma.userProfile.findFirst({
      where: { deleted: false },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.assessmentResult.findFirst({
      where: { isSelfAssessment: true },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);
  const earliest = resolveEarliest(firstUser?.createdAt, firstResult?.createdAt);
  const { starts, labels, windowStart } = buildBuckets(range, earliest);
  // Kohorsz-bontás (self vs szervezeti): aktív org-tagság dönt.
  const [regRows, resultRows, orgMemberRows] = await Promise.all([
    prisma.userProfile.findMany({
      where: { deleted: false, createdAt: { gte: windowStart } },
      select: { id: true, createdAt: true },
    }),
    prisma.assessmentResult.findMany({
      where: { isSelfAssessment: true, createdAt: { gte: windowStart } },
      select: { userProfileId: true, createdAt: true },
    }),
    prisma.organizationMember.findMany({
      where: { leftAt: null },
      select: { userId: true },
    }),
  ]);
  const orgUserIds = new Set(orgMemberRows.map((m) => m.userId));
  const inSegment = (profileId: string | null) => {
    if (segment === "all") return true;
    const isOrg = profileId !== null && orgUserIds.has(profileId);
    return segment === "org" ? isOrg : !isOrg;
  };
  const regDatesSeg = regRows.filter((r) => inSegment(r.id)).map((r) => r.createdAt);
  const resultDatesSeg = resultRows
    .filter((r) => inSegment(r.userProfileId))
    .map((r) => r.createdAt);
  const regSeries = bucketCounts(regDatesSeg, starts);
  const resultSeries = bucketCounts(resultDatesSeg, starts);
  const regInWindow = regSeries.reduce((a, b) => a + b, 0);
  const resultsInWindow = resultSeries.reduce((a, b) => a + b, 0);
  // Bontott összegek a fejléc-összegzőhöz (mindig láthatók, szegmenstől
  // függetlenül — így az „egyben" nézetben is látszik a self/szervezeti arány).
  const regSelfTotal = regRows.filter((r) => !orgUserIds.has(r.id)).length;
  const regOrgTotal = regRows.length - regSelfTotal;

  // Derived metrics
  const growthRate =
    userStats.total > 0
      ? Math.round((userStats.new30d / userStats.total) * 100)
      : 0;

  const completedInvites =
    invitationStats.byStatus.find(
      (s: { status: string; _count: { id: number } }) => s.status === "COMPLETED"
    )?._count.id ?? 0;
  const conversionRate =
    invitationStats.total > 0
      ? Math.round((completedInvites / invitationStats.total) * 100)
      : 0;

  const selfCount = assessmentStats.total;
  const observerCount = assessmentStats.observerTotal;

  // Szelíd teszt-CTA: az adminnak nem kötelező a teszt — csak felajánljuk.
  const { userId: adminClerkId } = await getServerAuth();
  const adminProfile = adminClerkId
    ? await prisma.userProfile.findUnique({
        where: { clerkId: adminClerkId },
        select: { id: true },
      })
    : null;
  const adminHasSelfResult = adminProfile
    ? Boolean(
        await prisma.assessmentResult.findFirst({
          where: { userProfileId: adminProfile.id, isSelfAssessment: true },
          select: { id: true },
        }),
      )
    : true;

  return (
    <>
      {/* Dashboard-sorrend (2026-07-28): a legfontosabb metrikák FELÜL,
          kiemelve — a gyorsműveletek és a teszt-CTA alattuk. */}
      <p className="mb-3 font-mono text-micro uppercase tracking-widest text-muted">
        {"// kulcs-metrikák"}
      </p>
      <AdminMetricsGrid>
        <AdminStatCard
          title={t("admin.totalUsers", locale)}
          value={userStats.total}
          subtitle={
            userStats.avgAge !== null
              ? `${t("admin.avgAge", locale)}: ${userStats.avgAge} | ${t("admin.medianAge", locale)}: ${userStats.medianAge} | ${t("admin.ageRange", locale)}: ${userStats.minAge}-${userStats.maxAge}`
              : `${t("admin.new7days", locale)}: ${userStats.new7d} | ${t("admin.new30days", locale)}: ${userStats.new30d}`
          }
          trend={{ value: growthRate, period: "30d" }}
        />
        <AdminStatCard
          title={t("admin.totalAssessments", locale)}
          value={assessmentStats.total}
          subtitle={`Self: ${selfCount} | Observer: ${observerCount}`}
        />
        <AdminStatCard
          title="Összes élő meghívó"
          value={invitationStats.total}
          subtitle={`${t("admin.conversionRate", locale)}: ${conversionRate}%`}
        />
        <AdminStatCard
          title={t("admin.totalFeedback", locale)}
          value={feedbackStats.satisfactionCount + feedbackStats.dimensionCount}
          subtitle={`Satisfaction: ${feedbackStats.satisfactionCount} | Dimension: ${feedbackStats.dimensionCount}`}
        />
      </AdminMetricsGrid>

      {/* ── Trend-szekció: időszak-szűrő + idősor-chart ── */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-micro uppercase tracking-widest text-muted">
          {"// trendek"}
        </p>
        <div className="flex flex-wrap gap-2">
          <AdminSegmentFilter active={segment} range={range} />
          <AdminRangeFilter active={range} segment={segment} />
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-sand bg-white p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-body font-semibold text-ink">
            Regisztrációk és kitöltések
            {segment !== "all" ? (
              <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-ink-body">
                {segment === "self" ? "csak self" : "csak szervezeti"}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted">
            Az időszakban:{" "}
            <span className="font-semibold tabular-nums text-ink">{regInWindow}</span>{" "}
            regisztráció{" "}
            <span className="tabular-nums">
              ({regSelfTotal} self · {regOrgTotal} szervezeti)
            </span>{" "}
            ·{" "}
            <span className="font-semibold tabular-nums text-ink">{resultsInWindow}</span>{" "}
            kitöltés
          </p>
        </div>
        <AdminTrendChart
          labels={labels}
          series={[
            { name: "Regisztráció", color: "#217a55", values: regSeries },
            { name: "Kitöltés", color: "#c17f4a", values: resultSeries },
          ]}
        />
      </div>

      <p className="mb-3 font-mono text-micro uppercase tracking-widest text-muted">
        {"// gyorsműveletek"}
      </p>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/org/new"
          className="group rounded-2xl border border-sage/40 bg-sage/5 p-5 transition hover:-translate-y-0.5 hover:border-sage"
        >
          <p className="text-body font-semibold text-ink group-hover:text-sage-dark">
            + Új szervezet
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-body">
            Ügyfél-org létrehozása és admin meghívása.
          </p>
        </Link>
        <Link
          href="/admin?tab=inquiries"
          className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
            newInquiryCount > 0
              ? "border-amber-300 bg-amber-50/60 hover:border-amber-400"
              : "border-sand bg-white hover:border-sage/40"
          }`}
        >
          <p className="text-body font-semibold text-ink group-hover:text-bronze">
            Kérdések{newInquiryCount > 0 ? ` (${newInquiryCount} új)` : ""}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-body">
            Beérkezett megkeresések és felhasználói kérdések.
          </p>
        </Link>
        <Link
          href="/admin?tab=orgs"
          className="group rounded-2xl border border-sand bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/40"
        >
          <p className="text-body font-semibold text-ink group-hover:text-bronze">
            Szervezetek kezelése
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-body">
            Hozzáférések, tanácsadó-kiosztás, kreditek.
          </p>
        </Link>
      </div>
      {!adminHasSelfResult && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body font-semibold text-ink">
              A saját HEXACO-profilod még nincs kitöltve
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-body">
              Nem kötelező — de ha szeretnéd látni a saját mintázatodat, ~10 perc.
            </p>
          </div>
          <Link
            href="/assessment"
            className="inline-flex min-h-[40px] shrink-0 items-center rounded-lg border border-sand bg-white px-4 text-caption font-semibold text-ink-body transition hover:border-sage/40 hover:text-ink"
          >
            Teszt indítása →
          </Link>
        </div>
      )}
    </>
  );
}
