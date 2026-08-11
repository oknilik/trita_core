import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, type Locale } from "@/lib/i18n";
import {
  buildArchetypeSimulations,
  buildPairSimulation,
} from "@/lib/interaction-view";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { extractDimensionScores, type ScoreResult } from "@/lib/scoring";
import { resolveCompareInviteState } from "@/lib/compare-invite";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { InteractionSection } from "@/components/results/InteractionSection";
import {
  CompareInviteCard,
  type SerializedCompareInvite,
} from "@/components/results/CompareInviteCard";
import {
  PairInteractionView,
  type PairGlyphInfo,
} from "@/components/results/PairInteractionView";

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

export default async function InteractionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  // UX-B10: saját eredmény nélkül nem néma redirect (az emailből érkező
  // magyarázat nélkül pattant vissza) — címzett állapot-oldal CTA-val.
  if (!scores || scores.type !== "likert" || !latestResult?.testType) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 text-center md:p-10">
          <h1 className="font-fraunces text-[26px] leading-tight tracking-tight text-ink">
            {t("results.compareNeedResultTitle", locale)}
          </h1>
          <p className="mt-3 text-caption leading-relaxed text-ink-body">
            {t("results.compareNeedResultBody", locale)}
          </p>
          <a
            href="/assessment"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-6 text-caption font-bold text-[var(--color-text-on-accent)] transition-all hover:-translate-y-px hover:brightness-[1.06]"
          >
            {t("results.compareNeedResultCta", locale)}
          </a>
        </div>
      </main>
    );
  }

  const lang = (locale === "en" ? "en" : "hu") as Locale;
  // Kanonikus olvasó: a 2026-08-11 előtt mentett sorok örökség-kulcsokat
  // hordoznak, az archetípus-/glyph-feloldók viszont HEXACO-betűre
  // illesztenek — nyers olvasással a régi kitöltő üres típuscímkét és
  // glyph nélküli oldalt kapott.
  const selfDims = extractDimensionScores(latestResult.scores) ?? {};
  const simulations = buildArchetypeSimulations(selfDims, lang);
  // A típusnév és az ábra UGYANABBÓL a sorrendből épül (legerősebb → forma,
  // második → motívum), így az összehasonlítás két oldala azonos logikájú.
  const scoredDims = Object.entries(selfDims).map(([code, score]) => ({
    code,
    score,
  }));
  const personalityType = resolvePersonalityTypeFromScores(scoredDims, lang);
  const selfGlyph = resolveGlyphPair(scoredDims);

  // ── Valódi páros mód (B1): meghívó-lista + kiválasztott pár ────────────
  const now = new Date();
  const rawInvites = await prisma.compareInvite.findMany({
    where: { OR: [{ inviterId: profile.id }, { partnerId: profile.id }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      status: true,
      createdAt: true,
      acceptedAt: true,
      expiresAt: true,
      inviterId: true,
      partnerId: true,
      inviter: { select: { username: true } },
      partner: { select: { username: true } },
    },
  });
  const compareInvites: SerializedCompareInvite[] = rawInvites.map((inv) => {
    const isInviter = inv.inviterId === profile.id;
    return {
      id: inv.id,
      token: isInviter ? inv.token : null,
      state: resolveCompareInviteState(inv, now),
      role: isInviter ? "inviter" : "partner",
      otherName: isInviter
        ? (inv.partner?.username ?? null)
        : (inv.inviter?.username ?? null),
      createdAt: inv.createdAt.toISOString(),
      acceptedAt: inv.acceptedAt?.toISOString() ?? null,
      expiresAt: inv.expiresAt.toISOString(),
    };
  });

  // Kiválasztott pár: csak ACCEPTED, csak résztvevőnek. A partner pontszámai
  // a szerveren maradnak — a kliens a szimuláció szövegét + a glyph-párt kapja.
  const sp = (await searchParams) ?? {};
  const pairId = typeof sp.pair === "string" ? sp.pair : null;
  let pairView: {
    self: PairGlyphInfo;
    other: PairGlyphInfo;
    otherName: string;
    sim: ReturnType<typeof buildPairSimulation>;
  } | null = null;

  if (pairId) {
    const pair = rawInvites.find(
      (inv) => inv.id === pairId && resolveCompareInviteState(inv, now) === "ACCEPTED",
    );
    const otherId = pair
      ? pair.inviterId === profile.id
        ? pair.partnerId
        : pair.inviterId
      : null;
    if (pair && otherId) {
      const otherResult = await prisma.assessmentResult.findFirst({
        where: { userProfileId: otherId, isSelfAssessment: true },
        orderBy: { createdAt: "desc" },
        select: { scores: true },
      });
      const otherScores = otherResult?.scores as ScoreResult | undefined;
      const otherDimScores = extractDimensionScores(otherResult?.scores);
      if (otherScores && otherScores.type === "likert" && otherDimScores) {
        const otherDims = Object.entries(otherDimScores).map(
          ([code, score]) => ({ code, score }),
        );
        const otherGlyph = resolveGlyphPair(otherDims);
        const otherLabel = resolvePersonalityTypeFromScores(otherDims, lang);
        if (selfGlyph && personalityType && otherGlyph && otherLabel) {
          const isInviter = pair.inviterId === profile.id;
          pairView = {
            self: { ...selfGlyph, label: personalityType },
            other: { ...otherGlyph, label: otherLabel },
            otherName:
              (isInviter ? pair.partner?.username : pair.inviter?.username) ??
              t("results.comparePartnerFallback", lang),
            sim: buildPairSimulation(selfDims, otherDimScores, lang),
          };
        }
      }
    }
  }

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
    >
      <header>
        <h1 className="font-fraunces text-title text-[var(--color-text-primary)]">
          {t("results.sectionInteraction", lang)}
        </h1>
        {/* UX-B13: a saját, erre az oldalra írt intro — nem a CTA-kártya
            szövegének ismétlése. */}
        <p className="mt-2 max-w-prose text-body leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.interactionIntro", lang)}
        </p>
      </header>

      {pairView ? (
        <PairInteractionView
          self={pairView.self}
          other={pairView.other}
          otherName={pairView.otherName}
          sim={pairView.sim}
        />
      ) : (
        <>
          <CompareInviteCard invites={compareInvites} />

          <InteractionSection
            simulations={simulations}
            selfLabel={personalityType ?? undefined}
            selfGlyph={selfGlyph ?? undefined}
            hideHeader
          />
        </>
      )}
    </PlatformPageShell>
  );
}
