import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FadeIn } from "@/components/landing/FadeIn";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { AdminTableSection } from "@/app/admin/_components/AdminTableSection";
import { AdminMetricsGrid } from "@/app/admin/_components/AdminMetricsGrid";
import { AdminReminderSection } from "@/app/admin/_components/AdminReminderSection";
import { AdminDraftReminderSection } from "@/app/admin/_components/AdminDraftReminderSection";
import { AdminOrgAccessSection } from "@/app/admin/_components/AdminOrgAccessSection";
import { AdminFeedbackSection } from "@/app/admin/_components/AdminFeedbackSection";
import { AdminTabNav } from "@/app/admin/_components/AdminTabNav";
import { AdminConsultantsSection } from "@/app/admin/_components/AdminConsultantsSection";
import { sanitizeOrgBillingProfile } from "@/lib/org-billing";
import { getTestConfig } from "@/lib/questions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.adminTitle", locale),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const locale = await getServerLocale();
  const { tab } = await searchParams;
  const activeTab =
    tab === "research" ||
    tab === "reminders" ||
    tab === "orgs" ||
    tab === "feedback" ||
    tab === "consultants" ||
    tab === "ops"
      ? tab
      : "overview";

  // Szerver-komponens: kérés-idejű időbélyeg a statisztika-ablakokhoz — szándékos.
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  // ── Tanácsadók fül — platform-szintű tanácsadó-onboarding ──
  if (activeTab === "consultants") {
    const orgs = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return (
      <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
            <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
              {t("admin.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-ink-body">{t("admin.subtitle", locale)}</p>
          </FadeIn>
          <FadeIn delay={0.05}>
            <Suspense>
              <AdminTabNav />
            </Suspense>
          </FadeIn>
          <FadeIn delay={0.1}>
            <AdminConsultantsSection orgs={orgs} />
          </FadeIn>
        </div>
      </main>
    );
  }

  // ── Működés gyűjtőfül — üzemeltetési nézetek belépői ──
  if (activeTab === "ops") {
    const opsCards = [
      {
        href: "/admin?tab=feedback",
        title: "Visszajelzések",
        desc: "Szerep-kalibráció és érdeklődés-jelzések a felhasználóktól.",
      },
      {
        href: "/admin?tab=reminders",
        title: "Emlékeztetők",
        desc: "Kitöltési emlékeztetők és piszkozat-követés.",
      },
      {
        href: "/admin?tab=research",
        title: "Kutatás",
        desc: "Kérdésbank-statisztikák és kutatási bontások.",
      },
    ];
    return (
      <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
            <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
              {t("admin.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-ink-body">{t("admin.subtitle", locale)}</p>
          </FadeIn>
          <FadeIn delay={0.05}>
            <Suspense>
              <AdminTabNav />
            </Suspense>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {opsCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-2xl border border-sand bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sage/40"
                >
                  <p className="text-[15px] font-semibold text-ink group-hover:text-bronze">
                    {card.title} →
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-body">{card.desc}</p>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </main>
    );
  }

  // Feedback tab — szerep-kalibráció + érdeklődés-jelzések
  if (activeTab === "feedback") {
    const [roleFitRows, interestRows] = await Promise.all([
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
    ]);

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
      <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
            <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
              {t("admin.title", locale)}
            </h1>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Suspense>
              <AdminTabNav />
            </Suspense>
          </FadeIn>

          <FadeIn delay={0.1}>
            <AdminFeedbackSection
              roleFitAggregates={roleFitAggregates}
              interests={interestRows.map((row) => ({
                id: row.id,
                featureKey: row.targetKey ?? "?",
                createdAt: row.createdAt.toISOString(),
                email: row.userProfile.email,
                username: row.userProfile.username,
              }))}
            />
          </FadeIn>
        </div>
      </main>
    );
  }

  // Orgs tab — manual access provisioning (consulting mode)
  if (activeTab === "orgs") {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        billingProfile: true,
        createdAt: true,
        _count: { select: { members: { where: { role: { not: "ORG_CONSULTANT" } } } } },
        subscription: {
          select: {
            status: true,
            planType: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            candidateCredits: true,
          },
        },
        members: {
          where: { role: "ORG_CONSULTANT" },
          select: {
            userId: true,
            user: { select: { email: true, username: true } },
          },
        },
      },
    });

    return (
      <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
            <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
              {t("admin.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-ink-body">
              {t("admin.subtitle", locale)}
            </p>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Suspense>
              <AdminTabNav />
            </Suspense>
          </FadeIn>

          <FadeIn delay={0.1}>
            <AdminOrgAccessSection
              orgs={orgs.map((org) => ({
                id: org.id,
                name: org.name,
                status: org.status,
                billingProfile: sanitizeOrgBillingProfile(org.billingProfile),
                createdAt: org.createdAt.toISOString(),
                memberCount: org._count.members,
                consultants: org.members.map((m) => ({
                  userId: m.userId,
                  email: m.user.email,
                  username: m.user.username,
                })),
                subscription: org.subscription
                  ? {
                      status: org.subscription.status,
                      planType: org.subscription.planType,
                      trialEndsAt: org.subscription.trialEndsAt?.toISOString() ?? null,
                      currentPeriodEnd:
                        org.subscription.currentPeriodEnd?.toISOString() ?? null,
                      candidateCredits: org.subscription.candidateCredits,
                    }
                  : null,
              }))}
            />
          </FadeIn>
        </div>
      </main>
    );
  }

  // Reminders tab — only fetch what's needed
  if (activeTab === "reminders") {
    const [pendingReminders, recentlyCompletedInvitations, incompleteDrafts, recentlyCompletedDrafts] =
      await Promise.all([
        prisma.observerInvitation.findMany({
          where: {
            status: "PENDING",
            observerEmail: { not: null },
            expiresAt: { gt: new Date() },
            createdAt: { lt: threeDaysAgo },
          },
          select: {
            id: true,
            observerEmail: true,
            observerName: true,
            createdAt: true,
            reminderCount: true,
            lastReminderSentAt: true,
            inviter: { select: { username: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        }),

        // Recently completed invitations (last 7 days — shown as gray "Már kész")
        prisma.observerInvitation.findMany({
          where: {
            status: "COMPLETED",
            observerEmail: { not: null },
            completedAt: { gt: sevenDaysAgo },
            createdAt: { lt: threeDaysAgo },
          },
          select: {
            id: true,
            observerEmail: true,
            observerName: true,
            createdAt: true,
            reminderCount: true,
            lastReminderSentAt: true,
            inviter: { select: { username: true, email: true } },
          },
          orderBy: { completedAt: "desc" },
          take: 5,
        }),

        // Incomplete drafts (no completed assessment, 1+ day old, user has email)
        prisma.assessmentDraft.findMany({
          where: {
            updatedAt: { lt: oneDayAgo },
            userProfile: {
              deleted: false,
              email: { not: null },
              assessmentResults: { none: {} },
            },
          },
          select: {
            id: true,
            testType: true,
            answers: true,
            currentPage: true,
            updatedAt: true,
            draftReminderCount: true,
            lastDraftReminderSentAt: true,
            userProfile: { select: { email: true, username: true, locale: true } },
          },
          orderBy: { updatedAt: "asc" },
        }),

        // Recently completed drafts (finished meanwhile — shown as gray "Már kész")
        prisma.assessmentDraft.findMany({
          where: {
            updatedAt: { lt: oneDayAgo, gt: thirtyDaysAgo },
            userProfile: {
              deleted: false,
              email: { not: null },
              assessmentResults: { some: {} },
            },
          },
          select: {
            id: true,
            testType: true,
            answers: true,
            currentPage: true,
            updatedAt: true,
            draftReminderCount: true,
            lastDraftReminderSentAt: true,
            userProfile: { select: { email: true, username: true, locale: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
      ]);

    // Question counts per test type (for progress display) — egyetlen aktív instrumentum
    const questionCounts: Record<string, number> = {
      TRITAN: getTestConfig("TRITAN").questions.length,
    };

    return (
      <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
            <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
              {t("admin.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-ink-body">
              {t("admin.subtitle", locale)}
            </p>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Suspense>
              <AdminTabNav />
            </Suspense>
          </FadeIn>

          <FadeIn delay={0.1}>
            <AdminDraftReminderSection
              drafts={[
                ...incompleteDrafts.map((d) => ({
                  id: d.id,
                  email: d.userProfile.email!,
                  username: d.userProfile.username,
                  testType: d.testType,
                  answeredCount: Object.keys(d.answers as Record<string, number>).length,
                  totalCount: questionCounts[d.testType] ?? 0,
                  updatedAt: d.updatedAt.toISOString(),
                  draftReminderCount: d.draftReminderCount,
                  lastDraftReminderSentAt: d.lastDraftReminderSentAt?.toISOString() ?? null,
                })),
                ...recentlyCompletedDrafts.map((d) => ({
                  id: d.id,
                  email: d.userProfile.email!,
                  username: d.userProfile.username,
                  testType: d.testType,
                  answeredCount: Object.keys(d.answers as Record<string, number>).length,
                  totalCount: questionCounts[d.testType] ?? 0,
                  updatedAt: d.updatedAt.toISOString(),
                  draftReminderCount: d.draftReminderCount,
                  lastDraftReminderSentAt: d.lastDraftReminderSentAt?.toISOString() ?? null,
                  completedMeanwhile: true as const,
                })),
              ]}
            />
          </FadeIn>

          <FadeIn delay={0.15}>
            <AdminReminderSection
              invitations={[
                ...pendingReminders.map((inv) => ({
                  id: inv.id,
                  observerEmail: inv.observerEmail!,
                  observerName: inv.observerName,
                  createdAt: inv.createdAt.toISOString(),
                  reminderCount: inv.reminderCount,
                  lastReminderSentAt: inv.lastReminderSentAt?.toISOString() ?? null,
                  inviter: {
                    username: inv.inviter.username,
                    email: inv.inviter.email ?? "",
                  },
                })),
                ...recentlyCompletedInvitations.map((inv) => ({
                  id: inv.id,
                  observerEmail: inv.observerEmail!,
                  observerName: inv.observerName,
                  createdAt: inv.createdAt.toISOString(),
                  reminderCount: inv.reminderCount,
                  lastReminderSentAt: inv.lastReminderSentAt?.toISOString() ?? null,
                  inviter: {
                    username: inv.inviter.username,
                    email: inv.inviter.email ?? "",
                  },
                  completedMeanwhile: true as const,
                })),
              ]}
            />
          </FadeIn>
        </div>
      </main>
    );
  }

  // Overview + Research: fetch all data in parallel
  const [userStats, assessmentStats, invitationStats, feedbackStats] =
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
        const total = await prisma.assessmentResult.count();
        const byTestType = await prisma.assessmentResult.groupBy({
          by: ["testType"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        });
        const observerTotal = await prisma.observerAssessment.count();
        const byUserTestType = await prisma.userProfile.groupBy({
          by: ["testType"],
          _count: { id: true },
          where: { deleted: false, testType: { not: null } },
          orderBy: { _count: { id: "desc" } },
        });
        return { total, byTestType, observerTotal, byUserTestType };
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
        const [pendingEmail, completedEmail] = await Promise.all([
          prisma.observerInvitation.count({
            where: { status: "PENDING", observerEmail: { not: null } },
          }),
          prisma.observerInvitation.count({
            where: { status: "COMPLETED", observerEmail: { not: null } },
          }),
        ]);
        return { total, byStatus, pendingEmail, completedEmail };
      })(),

      (async () => {
        // Egységes Feedback-modellből (kind: satisfaction / dimension) —
        // pilot-lépték: memóriában aggregálunk.
        const [satisfactionRows, dimensionRows] = await Promise.all([
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
        const satPayload = (row: { payload: unknown }) =>
          (row.payload ?? {}) as {
            observerFeedbackUsefulness?: number | null;
            siteUsefulness?: number | null;
          };
        const avgScores = {
          _avg: {
            agreementScore: avg(
              satisfactionRows.map((r) => r.rating).filter((v): v is number => v != null)
            ),
            observerFeedbackUsefulness: avg(
              satisfactionRows
                .map((r) => satPayload(r).observerFeedbackUsefulness)
                .filter((v): v is number => v != null)
            ),
            siteUsefulness: avg(
              satisfactionRows
                .map((r) => satPayload(r).siteUsefulness)
                .filter((v): v is number => v != null)
            ),
          },
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
        const dimensionAvgTritan = [...dimMap.entries()]
          .map(([dimensionCode, { sum, count }]) => ({
            dimensionCode,
            _avg: { accuracyRating: count ? sum / count : null },
            _count: { id: count },
          }))
          .sort(
            (a, b) => (b._avg.accuracyRating ?? 0) - (a._avg.accuracyRating ?? 0)
          );

        return {
          satisfactionCount: satisfactionRows.length,
          avgScores,
          dimensionCount: dimensionRows.length,
          dimensionAvgTritan,
        };
      })(),
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

  const pendingInvites =
    invitationStats.byStatus.find(
      (s: { status: string; _count: { id: number } }) => s.status === "PENDING"
    )?._count.id ?? 0;
  const pendingLink = pendingInvites - invitationStats.pendingEmail;
  const completedLink = completedInvites - invitationStats.completedEmail;

  const selfCount = assessmentStats.total;
  const observerCount = assessmentStats.observerTotal;

  const avgAgreement = feedbackStats.avgScores._avg.agreementScore
    ? Math.round(feedbackStats.avgScores._avg.agreementScore * 10) / 10
    : 0;
  const avgObserverUsefulness = feedbackStats.avgScores._avg.observerFeedbackUsefulness
    ? Math.round(feedbackStats.avgScores._avg.observerFeedbackUsefulness * 10) / 10
    : 0;
  const avgSiteUsefulness = feedbackStats.avgScores._avg.siteUsefulness
    ? Math.round(feedbackStats.avgScores._avg.siteUsefulness * 10) / 10
    : 0;

  // Szelíd teszt-CTA: az adminnak nem kötelező a teszt — csak felajánljuk.
  const { userId: adminClerkId } = await import("@/lib/auth-server").then((m) =>
    m.getServerAuth(),
  );
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
    <main className="min-h-dvh bg-cream px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">{"// admin"}</p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
            {t("admin.title", locale)}
          </h1>
          <p className="mt-2 text-sm text-ink-body">
            {t("admin.subtitle", locale)}
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Suspense>
            <AdminTabNav />
          </Suspense>
        </FadeIn>

        {/* ── Overview tab ── */}
        {activeTab === "overview" && (
          <FadeIn delay={0.08}>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/org/new"
                className="group rounded-2xl border border-sage/40 bg-sage/5 p-5 transition hover:-translate-y-0.5 hover:border-sage"
              >
                <p className="text-[15px] font-semibold text-ink group-hover:text-sage-dark">
                  + Új szervezet
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-body">
                  Ügyfél-org létrehozása és admin meghívása.
                </p>
              </Link>
              <Link
                href="/admin?tab=consultants"
                className="group rounded-2xl border border-sand bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/40"
              >
                <p className="text-[15px] font-semibold text-ink group-hover:text-bronze">
                  Tanácsadó meghívása
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-body">
                  Onboardolás a tritára + szervezet-kiosztás.
                </p>
              </Link>
              <Link
                href="/admin?tab=orgs"
                className="group rounded-2xl border border-sand bg-white p-5 transition hover:-translate-y-0.5 hover:border-sage/40"
              >
                <p className="text-[15px] font-semibold text-ink group-hover:text-bronze">
                  Szervezetek kezelése
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-body">
                  Hozzáférések, tanácsadó-kiosztás, kreditek.
                </p>
              </Link>
            </div>
            {!adminHasSelfResult && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-sand bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-ink">
                    A saját TRITAN-profilod még nincs kitöltve
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-body">
                    Nem kötelező — de ha szeretnéd látni a saját mintázatodat, ~10 perc.
                  </p>
                </div>
                <Link
                  href="/assessment"
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-lg border border-sand bg-white px-4 text-[13px] font-semibold text-ink-body transition hover:border-sage/40 hover:text-ink"
                >
                  Teszt indítása →
                </Link>
              </div>
            )}
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
          </FadeIn>
        )}

        {/* ── Research tab ── */}
        {activeTab === "research" && (
          <>
            {/* Test Type Breakdown */}
            <FadeIn delay={0.1}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AdminTableSection
                  title={t("admin.assessmentsTitle", locale)}
                  description="Assessment results by test type"
                  rows={assessmentStats.byTestType.map(
                    (item: { testType: string | null; _count: { id: number } }) => ({
                      label: item.testType ?? "Unknown",
                      value: item._count.id,
                    })
                  )}
                />
                <AdminTableSection
                  title="Assigned Test Types"
                  description="Users assigned per test type"
                  rows={assessmentStats.byUserTestType.map(
                    (item: { testType: string | null; _count: { id: number } }) => ({
                      label: item.testType ?? "Unknown",
                      value: item._count.id,
                    })
                  )}
                />
              </div>
            </FadeIn>

            {/* Invitation Status */}
            <FadeIn delay={0.2}>
              <div className="mt-6">
                <AdminTableSection
                  title={t("admin.invitationsTitle", locale)}
                  rows={invitationStats.byStatus.map(
                    (item: { status: string; _count: { id: number } }) => {
                      const statusColors: Record<string, string> = {
                        COMPLETED: "var(--color-action-primary-bg)",
                        PENDING: "var(--color-accent-primary)",
                      };
                      const emailCount =
                        item.status === "PENDING"
                          ? invitationStats.pendingEmail
                          : item.status === "COMPLETED"
                            ? invitationStats.completedEmail
                            : null;
                      const linkCount =
                        item.status === "PENDING"
                          ? pendingLink
                          : item.status === "COMPLETED"
                            ? completedLink
                            : null;
                      return {
                        label: t(
                          `common.status${item.status.charAt(0)}${item.status.slice(1).toLowerCase()}`,
                          locale
                        ),
                        value: item._count.id,
                        subtitle:
                          emailCount !== null
                            ? `Email: ${emailCount} | Link: ${linkCount}`
                            : undefined,
                        color: statusColors[item.status] ?? "var(--color-visual-gradient-indigo)",
                      };
                    }
                  )}
                />
              </div>
            </FadeIn>


            {/* Feedback Insights */}
            <FadeIn delay={0.4}>
              <div className="mt-6 rounded-xl border border-sand bg-white p-6">
                <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted">
                  {t("admin.feedbackTitle", locale)}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-sand bg-cream p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      Agreement (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {avgAgreement}/5
                    </p>
                  </div>
                  <div className="rounded-lg border border-sand bg-cream p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      Observer Usefulness (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {avgObserverUsefulness}/5
                    </p>
                  </div>
                  <div className="rounded-lg border border-sand bg-cream p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      Site Usefulness (Avg)
                    </p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {avgSiteUsefulness}/5
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
                    Dimension Accuracy — TRITAN
                  </h3>
                  <div className="space-y-2">
                    {feedbackStats.dimensionAvgTritan.length > 0 ? (
                      feedbackStats.dimensionAvgTritan.map(
                        (dim: {
                          dimensionCode: string;
                          _avg: { accuracyRating: number | null };
                          _count: { id: number };
                        }) => (
                          <div
                            key={dim.dimensionCode}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium text-ink-body">
                              {dim.dimensionCode}
                            </span>
                            <span className="text-ink">
                              {dim._avg.accuracyRating
                                ? Math.round(dim._avg.accuracyRating * 10) / 10
                                : 0}
                              /5{" "}
                              <span className="text-muted">
                                ({dim._count.id})
                              </span>
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-xs text-muted">No feedback yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          </>
        )}
      </div>
    </main>
  );
}
