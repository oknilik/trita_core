import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { computeCareerForProfile } from "@/lib/career/service";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { CAREER_PROBE_ENABLED } from "@/lib/career/deep-probe";
import type { CareerBackground } from "@/lib/industry-fit";
import { getTestConfig } from "@/lib/questions";
import type { ScoreResult } from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { CareerCompass } from "@/components/results/CareerCompass";
import { CareerPlusCta } from "@/components/results/career/CareerPlusCta";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";

// Karrier-iránytű — ÖNÁLLÓ oldal (korábban a /profile/results egyik füle).
//
// Miért került ki: a modul saját, több lépéses folyamattal dolgozik, és a
// riport-fülek közé zsúfolva mindkettő sűrűbb lett a kelleténél. Külön
// oldalként a fejléc-navigációból is elérhető, és megosztható a linkje.
//
// Az org-szintű kapcsoló (Organization.hideCareerModule) itt is érvényes: ha
// rejtve van, az oldal NEM létezik (404) — a navigáció ugyanezt a szabályt
// használja, így nem mutat linket egy nem létező oldalra.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Karrier-iránytű | trita" : "Career compass | trita",
    robots: { index: false },
  };
}

interface GrowthItem {
  code: string;
  label: string;
  score: number;
  dimCode: string;
  dimLabel: string;
  dimColor: string;
}

export default async function CareerPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, careerBackground: true },
  });
  if (!profile) redirect("/sign-in");

  if (await isCareerModuleHidden(profile.id)) notFound();

  const latestResult = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { scores: true, testType: true },
  });

  // A személyiségprofil a modul BEMENETE. Ha nincs, az oldal ugyanígy
  // megnyílik — csak a belépő gomb visz a kitöltésre a wizard indítása
  // helyett (ld. CareerCompass `hasSelfResult`).
  const scores = latestResult?.scores as ScoreResult | undefined;
  const hasSelfResult = Boolean(scores && scores.type === "likert");

  const storedBackground = profile.careerBackground as
    | (CareerBackground & { status?: string })
    | null;

  const careerResult =
    hasSelfResult && storedBackground?.status
      ? await computeCareerForProfile(profile.id, {
          limit: 18,
          currentIndustry: storedBackground.currentIndustry ?? null,
          status: storedBackground.status as "studying" | "working" | "switching" | null,
          industries: storedBackground.interests ?? [],
        })
      : null;

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
    >
      <section>
        <DashboardSectionHeader label={t("results.ccTitle", locale)} className="mb-4" />
        <CareerCompass
          initialBackground={profile.careerBackground as CareerBackground | null}
          initialResult={careerResult}
          growthFocusItems={hasSelfResult ? buildGrowthItems(latestResult, locale) : []}
          hasSelfResult={hasSelfResult}
        />
      </section>

      {/* Kereslet-mérés a mély rétegre. Csak kitöltött profillal mutatjuk:
          profil nélkül a felhasználó még az alap-iránytűt sem látta, egy
          készülő bővítményről kérdezni értelmetlen lenne. */}
      {CAREER_PROBE_ENABLED && hasSelfResult && <CareerPlusCta />}
    </PlatformPageShell>
  );
}

/**
 * Fejlődési fókusz: a leggyengébb facetek, facet-adat híján a leggyengébb
 * dimenziók. Ugyanaz a logika, mint a riport-oldalon — a modul ezt a blokkot
 * a wizard végén használja.
 */
function buildGrowthItems(
  result: { scores: unknown; testType: string | null } | null,
  locale: "hu" | "en",
): GrowthItem[] {
  const scores = result?.scores as ScoreResult | undefined;
  if (!scores || scores.type !== "likert" || !result?.testType) return [];

  const config = getTestConfig(result.testType as TestType, locale);
  const facets: GrowthItem[] = [];
  const dimFallback: GrowthItem[] = [];

  for (const dim of config.dimensions) {
    if (dim.code === "I") continue;
    const dimScore = scores.dimensions?.[dim.code];
    if (typeof dimScore !== "number") continue;

    if (dimScore < 60) {
      dimFallback.push({
        code: dim.code,
        label: dim.label,
        score: dimScore,
        dimCode: dim.code,
        dimLabel: dim.label,
        dimColor: dim.color,
      });
    }

    for (const facet of dim.facets ?? []) {
      const facetScore = scores.facets?.[facet.code];
      if (typeof facetScore !== "number" || facetScore >= 60) continue;
      facets.push({
        code: facet.code,
        label: facet.label,
        score: facetScore,
        dimCode: dim.code,
        dimLabel: dim.label,
        dimColor: dim.color,
      });
    }
  }

  const byScore = (a: GrowthItem, b: GrowthItem) => a.score - b.score;
  return (facets.length > 0 ? facets.sort(byScore) : dimFallback.sort(byScore)).slice(0, 3);
}
