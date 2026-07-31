import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { isCareerModuleHidden } from "@/lib/career/module-visibility";
import {
  CAREER_PROBE_ENABLED,
  CAREER_PROBE_KIND,
  CAREER_PROBE_PRICE_HUF,
} from "@/lib/career/deep-probe";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { CareerPlusPitch } from "@/components/results/career/CareerPlusPitch";

// Karrier-plusz ajánló — kereslet-mérés a még NEM létező mély rétegre.
//
// Az oldal önmagában is elmondja, mit tudna a funkció és mennyibe kerülne,
// majd egyetlen kérdést tesz fel: érdekelne-e. Nincs fizetési folyamat.
//
// A tölcsér három foka (`cta_view` → `page_view` → `choice`) a
// `deep-probe.ts`-ben van dokumentálva; a lemorzsolódás ezekből olvasható ki.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Karrier-mélyítés | trita" : "Career deep-dive | trita",
    robots: { index: false },
  };
}

export default async function CareerPlusPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  if (!CAREER_PROBE_ENABLED) notFound();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // Ugyanaz a kapu, mint a karrier-oldalé: ahol az org kikapcsolta a modult,
  // ott az ajánló sem létezhet.
  if (await isCareerModuleHidden(profile.id)) notFound();

  const previousChoice = await prisma.feedback.findUnique({
    where: {
      userProfileId_kind_targetKey: {
        userProfileId: profile.id,
        kind: CAREER_PROBE_KIND,
        targetKey: "choice",
      },
    },
    select: { rating: true },
  });

  const price = new Intl.NumberFormat(locale === "hu" ? "hu-HU" : "en-GB", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(CAREER_PROBE_PRICE_HUF);

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-3xl gap-8 px-4 py-10 md:gap-10"
    >
      <CareerPlusPitch
        price={price}
        initialChoice={
          previousChoice?.rating == null ? null : previousChoice.rating === 1
        }
      />
    </PlatformPageShell>
  );
}
