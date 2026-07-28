import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { t, type Locale } from "@/lib/i18n";
import { AdminStatCard } from "@/app/(app)/admin/_components/AdminStatCard";
import { AdminMetricsGrid } from "@/app/(app)/admin/_components/AdminMetricsGrid";

// Kérés-idejű időbélyegek a statisztika-ablakokhoz — szándékos.
function getStatWindows() {
  const now = Date.now();
  return {
    sevenDaysAgo: new Date(now - 7 * 24 * 60 * 60 * 1000),
    thirtyDaysAgo: new Date(now - 30 * 24 * 60 * 60 * 1000),
  };
}

// Vezérlő fül — KPI-k + gyorsműveletek
export async function OverviewTab({ locale }: { locale: Locale }) {
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

      <p className="mb-3 mt-8 font-mono text-micro uppercase tracking-widest text-muted">
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
              A saját TRITAN-profilod még nincs kitöltve
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
