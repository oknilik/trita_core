import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { getSelfAccessLevel } from "@/lib/access";
import type { ScoreResult } from "@/lib/scoring";
import { InvitationStatus, type TestType } from "@prisma/client";
import type { AccessLevel } from "@/lib/access";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { DashboardAutoRefresh } from "@/components/dashboard/DashboardAutoRefresh";
import { RetakeButton } from "@/components/dashboard/RetakeButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profilod | trita",
  robots: { index: false },
};

type ProfileLevel = "start" | "plus" | "reflect";

function toProfileLevel(level: AccessLevel): ProfileLevel {
  if (level === "self_reflect") return "reflect";
  if (level === "self_plus") return "plus";
  return "start";
}

function getInsight(
  score: number,
  insights: { low: string; mid: string; high: string },
): string {
  const range = score < 40 ? "low" : score < 70 ? "mid" : "high";
  return insights[range];
}

type TabId = "results" | "comparison" | "invites";

export default async function ProfileResultsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) redirect("/sign-in");

  const [
    latestResult,
    accessLevelRaw,
    completedObserverAssessments,
    sentInvitationsRaw,
    receivedInvitationsRaw,
    draft,
    researchSurveyRecord,
  ] = await Promise.all([
    prisma.assessmentResult.findFirst({
      where: { userProfileId: profile.id, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, scores: true, testType: true, createdAt: true },
    }),
    getSelfAccessLevel(profile.id),
    prisma.observerAssessment.findMany({
      where: {
        invitation: {
          inviterId: profile.id,
          status: InvitationStatus.COMPLETED,
        },
      },
      select: { scores: true },
    }),
    prisma.observerInvitation.findMany({
      where: { inviterId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        completedAt: true,
        observerEmail: true,
        assessment: { select: { relationshipType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.observerInvitation.findMany({
      where: { observerProfileId: profile.id },
      select: {
        id: true,
        token: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        completedAt: true,
        inviter: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessmentDraft.findUnique({
      where: { userProfileId: profile.id },
      select: { answers: true, testType: true },
    }),
    prisma.researchSurvey.findFirst({
      where: { userProfileId: profile.id },
      select: { id: true },
    }),
  ]);

  if (!latestResult) redirect("/assessment");

  const scores = latestResult.scores as ScoreResult;
  if (scores.type !== "likert") redirect("/assessment");

  const testType = latestResult.testType as TestType;
  const config = getTestConfig(testType, locale);
  const accessLevel = toProfileLevel(accessLevelRaw);

  // ── Draft info ─────────────────────────────────────────────────────────────
  const draftAnsweredCount = draft
    ? Object.keys(draft.answers as Record<string, number>).length
    : 0;
  const draftTotalQuestions = config.questions.length;
  const hasResearchSurvey = Boolean(researchSurveyRecord);
  const pendingInvitesCount = sentInvitationsRaw.filter(
    (inv) => inv.status === "PENDING",
  ).length;

  // ── Build serialized dimensions ────────────────────────────────────────────
  const completedObservers = completedObserverAssessments.map(
    (e) => e.scores as ScoreResult,
  );
  const hasObserverData = completedObservers.length >= 2;

  const mainDimCodes = config.dimensions
    .filter((d) => d.code !== "I")
    .map((d) => d.code);

  const observerAvg: Record<string, number> = {};
  if (hasObserverData) {
    for (const code of mainDimCodes) {
      let sum = 0;
      let count = 0;
      for (const obs of completedObservers) {
        if (obs.type === "likert" && obs.dimensions[code] != null) {
          sum += obs.dimensions[code];
          count++;
        }
      }
      observerAvg[code] = count > 0 ? Math.round(sum / count) : 0;
    }
  }

  const dimensions = config.dimensions.map((dim) => {
    const score = scores.dimensions[dim.code] ?? 0;
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string;
      mid: string;
      high: string;
    };
    return {
      code: dim.code,
      label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
      labelByLocale: dim.labelByLocale,
      color: dim.color,
      score,
      insight: getInsight(score, insights),
      description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
      descriptionByLocale: dim.descriptionByLocale,
      insights: dim.insights,
      insightsByLocale: dim.insightsByLocale,
      observerScore: hasObserverData ? (observerAvg[dim.code] ?? undefined) : undefined,
      facets: (dim.facets ?? []).map((f) => ({
        code: f.code,
        label: (f.labelByLocale?.[locale] ?? f.label) as string,
        score: scores.facets?.[dim.code]?.[f.code] ?? 0,
      })),
      aspects: (dim.aspects ?? []).map((a) => ({
        code: a.code,
        label: (a.labelByLocale?.[locale] ?? a.label) as string,
        score: scores.aspects?.[dim.code]?.[a.code] ?? 0,
      })),
    };
  });

  // ── Growth focus ───────────────────────────────────────────────────────────
  const mainDimensions = dimensions.filter((d) => d.code !== "I");

  interface GrowthItem {
    code: string;
    label: string;
    score: number;
    dimCode: string;
    dimLabel: string;
    dimColor: string;
  }

  const allFacets: GrowthItem[] = [];
  for (const dim of mainDimensions) {
    for (const f of dim.facets) {
      allFacets.push({
        code: f.code,
        label: f.label,
        score: f.score,
        dimCode: dim.code,
        dimLabel: dim.label,
        dimColor: dim.color,
      });
    }
  }
  const growthItems = allFacets
    .filter((f) => f.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const growthFallback: GrowthItem[] = mainDimensions
    .filter((d) => d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => ({
      code: d.code,
      label: d.label,
      score: d.score,
      dimCode: d.code,
      dimLabel: d.label,
      dimColor: d.color,
    }));

  const growthFocusItems = growthItems.length >= 1 ? growthItems : growthFallback;

  // ── Serialize invitations ──────────────────────────────────────────────────
  const sentInvitations = sentInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    observerEmail: inv.observerEmail ?? null,
    relationship: inv.assessment?.relationshipType ?? null,
  }));

  const receivedInvitations = receivedInvitationsRaw.map((inv) => ({
    id: inv.id,
    token: inv.token,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    completedAt: inv.completedAt?.toISOString() ?? null,
    inviterUsername: inv.inviter?.username ?? null,
  }));

  // ── Active tab from searchParams ───────────────────────────────────────────
  const resolvedParams = await searchParams;
  const tabParam = resolvedParams?.tab;
  const initialTab: TabId =
    tabParam === "comparison" ? "comparison" :
    tabParam === "invites" ? "invites" :
    "results";

  const displayName =
    profile.username ?? profile.email ?? (locale === "hu" ? "Felhasználó" : "User");

  return (
    <main className="min-h-dvh bg-cream">
      <DashboardAutoRefresh
        pendingInvites={pendingInvitesCount}
        completedObserver={completedObservers.length}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 md:gap-14">

        <div className="flex justify-end">
          <RetakeButton />
        </div>

        <ProfileTabs
          name={displayName}
          assessmentDate={latestResult.createdAt.toISOString()}
          accessLevel={accessLevel}
          initialTab={initialTab}
          assessmentResultId={latestResult.id}
          dimensions={dimensions}
          growthFocusItems={growthFocusItems}
          hasObserverData={hasObserverData}
          observerCount={completedObservers.length}
          sentInvitations={sentInvitations}
          receivedInvitations={receivedInvitations}
          hasResearchSurvey={hasResearchSurvey}
          occupationStatus={null}
          hasDraft={Boolean(draft)}
          draftAnsweredCount={draftAnsweredCount}
          draftTotalQuestions={draftTotalQuestions}
          pendingInvitesCount={pendingInvitesCount}
        />

      </div>
    </main>
  );
}
