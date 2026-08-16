import { requireOnboarded } from "@/lib/onboarding-guard";
import { currentUser } from "@clerk/nextjs/server";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { assignTestType } from "@/lib/assignTestType";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { resolveActiveCampaignIdForStep } from "@/lib/campaign-steps";
import { AssessmentClient } from "./AssessmentClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.assessmentTitle", locale),
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

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; campaignId?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Get or create user profile
  // UX-A10: a tagságokat is lekérjük — a submit utáni cél (team-roles lépés
  // vs. journey-elosztó) szerver-oldali döntés, a team-roles oldal kapujával
  // azonos feltétellel.
  const profileInclude = {
    assessmentResults: { select: { id: true }, take: 1 },
    orgMemberships: { select: { id: true }, take: 1 },
    teamMemberships: { select: { id: true }, take: 1 },
  } as const;
  let profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    include: profileInclude,
  });

  if (!profile) {
    profile = await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      },
      update: {},
      include: profileInclude,
    });
  }

  // Központi onboarding-guard (org-tag kivétellel) — ld. lib/onboarding-guard
  await requireOnboarded(profile);

  // Load existing draft (if any)
  const draft = await prisma.assessmentDraft.findUnique({
    where: { userProfileId: profile.id },
  });

  // If user already has results, no draft in progress, and hasn't confirmed retake → redirect
  const params = await searchParams;
  const campaignId = params.campaignId
    ? await resolveActiveCampaignIdForStep(profile.id, "OBSERVER_360", {
        campaignId: params.campaignId,
      })
    : null;
  // Ismeretlen, lezárt, más felhasználóhoz tartozó vagy még időzített körből
  // nem fogadunk el self-beadást. A feladatsor megmutatja az aktuális lépést.
  if (params.campaignId && !campaignId) redirect("/tasks");

  if (
    profile.assessmentResults.length > 0 &&
    !draft &&
    !campaignId &&
    params.confirmed !== "true"
  ) {
    redirect("/profile/results?retake=true");
  }

  // Assign test type if not assigned yet
  let testType = profile.testType;
  if (!testType) {
    testType = await assignTestType(profile.id);
  }
  const locale = await getServerLocale();
  const config = getTestConfig(testType, locale, DEFAULT_ASSESSMENT_FORM);

  const initialDraft =
    draft && draft.testType === testType
      ? {
          answers: draft.answers as Record<string, number>,
          currentPage: draft.currentPage,
        }
      : undefined;

  // Fresh retake: confirmed=true but no server draft → clear stale localStorage
  const clearDraft = (params.confirmed === "true" || Boolean(campaignId)) && !draft;

  const questions = config.questions.map((q) => ({ id: q.id, text: q.text }));

  // UX-A10: ugyanaz a feltétel, mint a team-roles oldal kapujában (isTeamUser).
  const hasTeamContext =
    profile.orgMemberships.length > 0 || profile.teamMemberships.length > 0;

  return (
    <AssessmentClient
      testType={testType}
      testName={config.name}
      totalQuestions={config.questions.length}
      draftScope={profile.id}
      questions={questions}
      initialDraft={initialDraft}
      clearDraft={clearDraft}
      hasTeamContext={hasTeamContext}
      campaignId={campaignId ?? undefined}
    />
  );
}
