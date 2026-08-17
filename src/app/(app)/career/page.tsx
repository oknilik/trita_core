import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { computeCareerForProfile } from "@/lib/career/service";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import {
  CAREER_FAKE_DOOR_MODULE,
  formatPrice,
  isFakeDoorSource,
  assignPriceVariant,
} from "@/lib/fakedoor/career";
import { readFakeDoorSession } from "@/lib/fakedoor/session";
import type { CareerBackground } from "@/lib/industry-fit";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { getTestConfig } from "@/lib/questions";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import {
  extractDimensionScores,
  extractFacetScores,
  type ScoreResult,
} from "@/lib/scoring";
import type { TestType } from "@prisma/client";
import { CareerCompass } from "@/components/results/CareerCompass";
import { CareerFakeDoor } from "@/components/career/fakedoor/CareerFakeDoor";
import type { DecisionInitialState } from "@/components/career/fakedoor/DecisionPanel";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";

// Karrier-iránytű — ÖNÁLLÓ oldal (korábban a /profile/results egyik füle).
//
// KÉT ARCA VAN, a `CAREER_MODULE_READY` kapcsolótól függően:
//  · false (ma): a modul nincs kész, az oldal a kereslet-mérő fake door —
//    az a feladata, hogy megbízható választ adjon arra, van-e fizetési
//    szándék, milyen áron, és melyik problémára.
//  · true: a működő iránytű. A modul kódja addig is érintetlen marad.
//
// Az org-szintű kapcsoló (Organization.hideCareerModule) MINDKÉT arcra
// érvényes: ha rejtve van, az oldal nem létezik (404).

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

export default async function CareerPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const [locale, { userId }, params] = await Promise.all([
    getServerLocale(),
    auth(),
    searchParams,
  ]);
  if (!userId) return redirectToSignIn();

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, careerBackground: true },
  });
  if (!profile) return redirectToSignIn();

  if (await isCareerModuleHidden(profile.id)) notFound();

  const latestResult = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { scores: true, testType: true },
  });
  const scores = latestResult?.scores as ScoreResult | undefined;
  const hasSelfResult = Boolean(scores && scores.type === "likert");

  if (!CAREER_MODULE_READY) {
    return renderFakeDoor({
      locale,
      email: profile.email,
      source: params.from,
      scores: hasSelfResult ? scores : undefined,
    });
  }

  // A személyiségprofil a modul BEMENETE. Ha nincs, az oldal ugyanígy
  // megnyílik — csak a belépő gomb visz a kitöltésre a wizard indítása
  // helyett (ld. CareerCompass `hasSelfResult`).
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
    </PlatformPageShell>
  );
}

/**
 * Fake door nézet. A munkamenet-azonosítót itt csak OLVASSUK vagy generáljuk
 * — a cookie-t a kliens első hívása írja ki (szerver-komponens nem tud).
 * Ugyanez az azonosító sorsolja az ársávot, tehát a látogató visszatérve
 * ugyanazt az árat látja: máskülönben a válasza nem egy árról szólna.
 */
async function renderFakeDoor({
  locale,
  email,
  source,
  scores,
}: {
  locale: "hu" | "en";
  email: string | null;
  source?: string;
  scores?: ScoreResult;
}) {
  const { sessionId } = await readFakeDoorSession();
  const priceVariant = assignPriceVariant(sessionId);
  const resolvedSource = source && isFakeDoorSource(source) ? source : "direct";

  const existing = await prisma.fakeDoorResponse.findUnique({
    where: {
      module_sessionId: { module: CAREER_FAKE_DOOR_MODULE, sessionId },
    },
    select: { interest: true, valueGoal: true, reasonNo: true, emailOptIn: true },
  });

  // A kitöltött profilból a mintázat NEVE kell: ezzel szólítjuk meg a
  // riportból érkezőt (T12). Profil nélkül null — kitalált nevet mutatni
  // pont az ellenkezőjét üzenné annak, amit az oldal ígér.
  const ranked = scores?.dimensions
    ? Object.entries(scores.dimensions)
        .filter(([code]) => code !== "I")
        .map(([code, score]) => ({ code, score: score as number }))
    : [];
  const typeLabel = ranked.length ? resolvePersonalityTypeFromScores(ranked, locale) : null;
  const patternLabel = resolvedSource === "results" ? typeLabel : null;

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-3xl gap-8 px-4 py-10 md:gap-10"
    >
      <CareerFakeDoor
        sessionId={sessionId}
        source={resolvedSource}
        price={formatPrice(priceVariant, locale)}
        priceVariant={priceVariant}
        patternLabel={patternLabel}
        defaultEmail={email}
        initial={
          existing
            ? ({
                interest: existing.interest as "yes" | "no",
                valueGoal: existing.valueGoal,
                reasonNo: existing.reasonNo,
                emailOptIn: existing.emailOptIn,
              } as DecisionInitialState)
            : null
        }
      />
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
  // Kanonikus olvasók — az örökség-kulcsos sorokon a nyers hozzáférés üres
  // fejlődési fókuszt adott.
  const dimensionScores = extractDimensionScores(result.scores) ?? {};
  const facetScores = extractFacetScores(result.scores);
  const facets: GrowthItem[] = [];
  const dimFallback: GrowthItem[] = [];

  for (const dim of config.dimensions) {
    if (dim.code === "I") continue;
    const dimScore = dimensionScores[dim.code];
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
      // A facet-map KÉTSZINTŰ ({dimenzió: {facetKód: 0–100}}) — a korábbi
      // egyszintű `scores.facets?.[facet.code]` mindig undefined-ot adott,
      // így a facet-ág sosem tüzelt, és a fejlődési fókusz némán a
      // dimenzió-fallbackre esett vissza (a riport-oldal ugyanezt a listát
      // facet-szinten mutatja — a kettő eltért).
      const facetScore = facetScores?.[dim.code]?.[facet.code];
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
