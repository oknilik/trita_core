import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, type Locale } from "@/lib/i18n";
import { buildArchetypeSimulations } from "@/lib/interaction-view";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import { resolveGlyphPair } from "@/lib/type-glyph";
import type { ScoreResult } from "@/lib/scoring";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { InteractionSection } from "@/components/results/InteractionSection";

// „Hogyan működnétek együtt?" — ÖNÁLLÓ oldal (korábban az eredmény-oldal
// utolsó szekciója).
//
// Miért került ki: ez a blokk nem a saját profilodról szól, hanem egy MÁSIK
// emberrel való dinamikáról — interaktív (archetípus-választó), és a riport
// végén ülve elveszett. Külön oldalon a saját műfaja szerint viselkedhet.
//
// A szimulációkat itt is a SZERVER számolja (mind a 30 archetípus egy
// nyelven), hogy az archetípus-váltás hálózat nélkül menjen, és az ~1000
// soros atom-tartalom ne kerüljön a kliens bundle-be.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title:
      locale === "hu" ? "Hogyan működnétek együtt? | trita" : "How you'd work together | trita",
    robots: { index: false },
  };
}

export default async function InteractionPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const latestResult = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { scores: true, testType: true },
  });

  const scores = latestResult?.scores as ScoreResult | undefined;
  // Saját profil nélkül nincs mit összevetni — a riport-oldal a belépő,
  // ott már ott van a kitöltés hívása.
  if (!scores || scores.type !== "likert" || !latestResult?.testType) {
    redirect("/profile/results");
  }

  const lang = (locale === "en" ? "en" : "hu") as Locale;
  const simulations = buildArchetypeSimulations(scores.dimensions, lang);
  // A típusnév és az ábra UGYANABBÓL a sorrendből épül (legerősebb → forma,
  // második → motívum), így az összehasonlítás két oldala azonos logikájú.
  const scoredDims = Object.entries(scores.dimensions).map(([code, score]) => ({
    code,
    score,
  }));
  const personalityType = resolvePersonalityTypeFromScores(scoredDims, lang);
  const selfGlyph = resolveGlyphPair(scoredDims);

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
    >
      <header>
        <h1 className="font-fraunces text-title text-[var(--color-text-primary)]">
          {t("results.sectionInteraction", lang)}
        </h1>
        <p className="mt-2 max-w-prose text-body leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.ctaInteractionBody", lang)}
        </p>
      </header>

      <InteractionSection
        simulations={simulations}
        selfLabel={personalityType ?? undefined}
        selfGlyph={selfGlyph ?? undefined}
        hideHeader
      />
    </PlatformPageShell>
  );
}
