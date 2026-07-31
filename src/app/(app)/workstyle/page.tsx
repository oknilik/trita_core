import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import { getSelfAccessLevel } from "@/lib/access";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { BLOCK1, SECTION_TITLE } from "@/lib/profile-content";
import { getTestConfig } from "@/lib/questions";
import type { ScoreResult } from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { WorkstyleSections } from "@/components/results/WorkstyleSections";

// Munkastílus — ÖNÁLLÓ oldal (korábban az eredmény-oldal szekciói).
//
// Ez a tension-pár motor kimenete: a dimenziók EGYÜTTÁLLÁSAIBÓL épülő
// narratíva (ahogy működsz), a hozzá illő környezet és a szerep-illeszkedés.
// A riport-oldalról azért került ki, mert önmagában is hosszú olvasmány, és
// ott a dimenzió-bontás után egy második, ugyanolyan súlyú blokként ült.
//
// Belépő az eredmény-oldal alján lévő CTA-ból és közvetlen linkről.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Munkastílusom | trita" : "My work style | trita",
    robots: { index: false },
  };
}

export default async function WorkstylePage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const [latestResult, accessLevel] = await Promise.all([
    prisma.assessmentResult.findFirst({
      where: { userProfileId: profile.id, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { scores: true, testType: true },
    }),
    getSelfAccessLevel(profile.id),
  ]);

  const scores = latestResult?.scores as ScoreResult | undefined;
  // Személyiségprofil nélkül nincs mit mutatni — a kitöltés a belépő.
  if (!scores || scores.type !== "likert" || !latestResult?.testType) {
    redirect("/profile/results");
  }

  const lang = (locale === "en" ? "en" : "hu") as Locale;
  const testType = latestResult.testType as TestType;
  const config = getTestConfig(testType, lang);
  const dimScores = Object.fromEntries(
    config.dimensions
      .filter((dim) => dim.code !== "I")
      .map((dim) => [dim.code, scores.dimensions?.[dim.code] ?? 50]),
  );

  const workstyle = buildWorkstyleContent(dimScores, testType, lang);
  const isPlus = accessLevel === "self_plus";

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
    >
      <header>
        <h1 className="font-fraunces text-title text-[var(--color-text-primary)]">
          {SECTION_TITLE[lang]}
        </h1>
        <p className="mt-2 max-w-prose text-body leading-relaxed text-[var(--color-text-secondary)]">
          {BLOCK1[lang]}
        </p>
      </header>

      <WorkstyleSections
        isUnlocked={isPlus}
        howYouWork={workstyle.howYouWork}
        envItems={workstyle.envItems}
        roleFit={workstyle.roleFit}
      />
    </PlatformPageShell>
  );
}
