import { requireOnboarded } from "@/lib/onboarding-guard";
import { currentUser } from "@clerk/nextjs/server";
import { getServerAuth } from "@/lib/auth-server";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { assignTestType } from "@/lib/assignTestType";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { resolveActiveSelfAssessmentCampaign } from "@/lib/campaign-steps";
import { AssessmentClient } from "./AssessmentClient";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

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
  // Identitás a bypass-tudatos helperből (élesben ugyanaz a Clerk auth());
  // a teljes Clerk-user csak az öngyógyító create-ágban kell.
  const { userId: clerkUserId } = await getServerAuth();
  if (!clerkUserId) return redirectToSignIn();

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
    where: { clerkId: clerkUserId },
    include: profileInclude,
  });

  if (!profile) {
    const user = await currentUser();
    profile = await prisma.userProfile.upsert({
      where: { clerkId: clerkUserId },
      create: {
        clerkId: clerkUserId,
        email: user?.primaryEmailAddress?.emailAddress,
      },
      update: {},
      include: profileInclude,
    });
  }

  // Központi onboarding-guard (org-tag kivétellel) — ld. lib/onboarding-guard
  await requireOnboarded(profile);

  const params = await searchParams;
  const campaignStep = await resolveActiveSelfAssessmentCampaign(
    profile.id,
    params.campaignId ? { campaignId: params.campaignId } : undefined,
  );
  const campaignId = campaignStep?.campaignId ?? null;
  // Ismeretlen, lezárt, más felhasználóhoz tartozó vagy még időzített körből
  // nem fogadunk el self-beadást. A feladatsor megmutatja az aktuális lépést.
  if (params.campaignId && campaignId !== params.campaignId) redirect("/tasks");

  // A szerver-draft ugyanahhoz a mérési körhöz tartozik, mint a megnyitott
  // kérdőív; másik kampány vagy self-serve draftja nem tölthető be.
  const scope = campaignId ? `campaign:${campaignId}` : "self";
  const draft = await prisma.assessmentDraft.findUnique({
    where: { userProfileId_scope: { userProfileId: profile.id, scope } },
  });

  // If user already has results, no draft in progress, and hasn't confirmed retake → redirect

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
          updatedAt: draft.updatedAt.getTime(),
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
      draftScope={`${profile.id}:${scope}`}
      questions={questions}
      initialDraft={initialDraft}
      clearDraft={clearDraft}
      hasTeamContext={hasTeamContext}
      campaignId={campaignId ?? undefined}
    />
  );
}
