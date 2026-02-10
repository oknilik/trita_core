import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { assignTestType } from "@/lib/assignTestType";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { AssessmentClient } from "./AssessmentClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("meta.assessmentTitle", locale) };
}

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Get or create user profile
  let profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    include: { assessmentResults: { select: { id: true }, take: 1 } },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      },
      include: { assessmentResults: { select: { id: true }, take: 1 } },
    });
  }

  // Redirect to onboarding if demographics not yet collected
  if (!profile.onboardedAt) {
    redirect("/onboarding");
  }

  // If user already has results and hasn't confirmed retake, redirect to dashboard
  const params = await searchParams;
  if (profile.assessmentResults.length > 0 && params.confirmed !== "true") {
    redirect("/dashboard?retake=true");
  }

  // Assign test type if not assigned yet
  let testType = profile.testType;
  if (!testType) {
    testType = await assignTestType(profile.id);
  }

  const locale = await getServerLocale();
  const config = getTestConfig(testType, locale);

  return (
    <AssessmentClient
      testType={testType}
      testName={config.name}
      format={config.format}
      questions={config.questions}
    />
  );
}
