"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import {
  hasAssessmentDraftInStorage,
  readAssessmentDraftFromStorage,
} from "@/lib/assessment-draft";
import {
  computeGuestTeaserScores,
  type TeaserScoringMetaItem,
} from "@/lib/guest-teaser";
import {
  resolvePersonalityTypeLabel,
  type PersonalityLocale,
} from "@/lib/personality-type";
import { intensityFromScore } from "@/lib/type-glyph";
import { TRITAN_DIMENSIONS, type TritanDimCode } from "@/lib/tritan";
import { TryTeaserCard, type TeaserTopDim } from "./TryTeaserCard";

interface TryCompleteClientProps {
  /** Item-id → dimenzió + fordítottság a szerverről — a kérdésbank maga nem kerül a kliensre. */
  scoringMeta: TeaserScoringMetaItem[];
}

export function TryCompleteClient({ scoringMeta }: TryCompleteClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { locale } = useLocale();
  const [hasDraft, setHasDraft] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<number, number> | null>(null);

  // localStorage csak kliensen olvasható — hydration-biztos minta, szándékos.
  useEffect(() => {
    const draftExists = hasAssessmentDraftInStorage("TRITAN");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasDraft(draftExists);
    if (draftExists) {
      const snapshot = readAssessmentDraftFromStorage({ testType: "TRITAN" });
      setAnswers(snapshot?.answers ?? null);
    }
  }, []);

  useEffect(() => {
    if (hasDraft === false) router.replace("/try");
  }, [hasDraft, router]);

  // If already signed in, go claim the results
  useEffect(() => {
    if (isSignedIn) router.replace("/try/claim");
  }, [isSignedIn, router]);

  // Teaser-adatok — hiányos/érvénytelen draftnál null, ilyenkor a korábbi
  // (teaser nélküli) záróképernyő renderel.
  const teaser = useMemo(() => {
    const scores = computeGuestTeaserScores(scoringMeta, answers);
    if (!scores || scores.ranked.length < 2) return null;

    const [primary, secondary] = scores.ranked;
    const personalityLocale: PersonalityLocale = locale === "hu" ? "hu" : "en";
    const typeLabel = resolvePersonalityTypeLabel(
      primary.code,
      secondary.code,
      personalityLocale,
    );
    if (!typeLabel) return null;

    const dimLabel = (code: string): string => {
      const entry = TRITAN_DIMENSIONS[code as TritanDimCode];
      return entry ? entry[personalityLocale] : code;
    };
    const dimLetter = (code: string): string =>
      TRITAN_DIMENSIONS[code as TritanDimCode]?.letter ?? code;

    const topDims: TeaserTopDim[] = scores.ranked.slice(0, 2).map((d) => ({
      code: d.code,
      letter: dimLetter(d.code),
      label: dimLabel(d.code),
      score: d.score,
    }));

    return {
      typeLabel,
      primaryCode: primary.code,
      secondaryCode: secondary.code,
      intensity: intensityFromScore(primary.score),
      dimensionLabel: `${dimLabel(primary.code)} × ${dimLabel(secondary.code)}`,
      topDims,
    };
  }, [scoringMeta, answers, locale]);

  if (hasDraft !== true) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="font-fraunces mb-8 inline-flex text-2xl font-black tracking-tight text-ink"
        >
          <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
        </Link>

        {/* UX-A14: ünneplés csak TELJES kitöltésnél — félkész draftnál
            folytatásra hívunk, nem regisztrációra "semmiért". */}
        {teaser ? (
          <div className="mb-6">
            <p className="mb-1 text-3xl">🎉</p>
            <h1 className="font-fraunces text-2xl text-ink">
              {t("tryComplete.doneTitle", locale)}
            </h1>
            <p className="mt-2 text-body leading-relaxed text-ink-body">
              {t("tryComplete.doneBody", locale)}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="font-fraunces text-2xl text-ink">
              {t("tryComplete.partialTitle", locale)}
            </h1>
            <p className="mt-2 text-body leading-relaxed text-ink-body">
              {t("tryComplete.partialBody", locale)}
            </p>
            <Link
              href="/try"
              className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-6 text-body font-bold text-white shadow-md transition-all hover:-translate-y-px hover:brightness-[1.06]"
            >
              {t("tryComplete.partialCta", locale)}
            </Link>
          </div>
        )}

        {/* Azonnali eredmény-ízelítő — az érték egy szelete a regisztrációs
            fal ELŐTT; a teljes riport a claim után nyílik meg. */}
        {teaser ? (
          <div className="mb-6">
            <TryTeaserCard
              typeLabel={teaser.typeLabel}
              primaryCode={teaser.primaryCode}
              secondaryCode={teaser.secondaryCode}
              intensity={teaser.intensity}
              dimensionLabel={teaser.dimensionLabel}
              topDims={teaser.topDims}
              locale={locale}
            />
          </div>
        ) : null}

        {/* CTA buttons — csak teljes kitöltésnél: félkész drafttal a claim
            úgyis elutasítaná a hiányos válaszkészletet. */}
        {teaser ? (
          <>
            <div className="flex flex-col gap-3">
              <Link
                href="/sign-up?redirect_url=/try/claim"
                className="flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-6 text-body font-bold text-white shadow-md shadow-[var(--color-accent-primary)]/20 transition-all hover:-translate-y-px hover:brightness-[1.06]"
              >
                {t("tryComplete.registerCta", locale)}
              </Link>

              <Link
                href="/sign-in?redirect_url=/try/claim"
                className="flex min-h-[52px] items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-white px-6 text-body font-medium text-ink-body transition-colors hover:border-[var(--color-accent-primary)]/40 hover:text-[var(--color-accent-primary)]"
              >
                {t("tryComplete.loginCta", locale)}
              </Link>
            </div>

            <p className="mt-3 text-center">
              <Link
                href="/try?review=1"
                className="text-xs text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-text-secondary)]"
              >
                {t("tryComplete.reviewAnswers", locale)}
              </Link>
            </p>

            <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
              {t("tryComplete.teaserBrowserNote", locale)}
            </p>
          </>
        ) : null}

        {/* Privacy note */}
        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
          {t("tryComplete.privacyNote", locale)}
          {" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--color-text-secondary)]">
            {t("tryComplete.privacyLink", locale)}
          </Link>
        </p>
      </div>
    </div>
  );
}
