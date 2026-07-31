"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

// Karrier-ajánló — kereslet-mérés, nem értékesítés.
//
// Ez a `/career` oldal TARTALMA, amíg a modul nincs kész: a működő iránytű
// helyén áll, nem mellette. (Kapcsoló: `CAREER_MODULE_READY`.)
//
// Szigorú szabályok, mert a termék hitelességből él:
//  · az oldal KIMONDJA, hogy a funkció még nincs kész;
//  · nincs fizetési folyamat és bankkártya-mező sehol;
//  · a „nem érdekel" ugyanolyan hangsúlyos, mint az „érdekel" — különben a
//    minta felfelé torzul, és a mérés önbecsapás lesz.

interface CareerPlusPitchProps {
  price: string;
  /** Korábbi válasz (szerverről) — visszatéréskor ne kérdezzünk újra. */
  initialChoice: boolean | null;
}

type Choice = boolean | null;

export function CareerPlusPitch({ price, initialChoice }: CareerPlusPitchProps) {
  const { locale } = useLocale();
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const viewLogged = useRef(false);

  // Oldal-megtekintés: ez a tölcsér második foka (a riport-oldali CTA után). Egyszer fut le böngésző-
  // munkamenetenként; a szerver amúgy is idempotens.
  useEffect(() => {
    if (viewLogged.current) return;
    viewLogged.current = true;
    void fetch("/api/career/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "page_view" }),
    }).catch(() => {});
  }, []);

  async function answer(interested: boolean) {
    if (pending) return;
    const previous = choice;
    setChoice(interested);
    setPending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/career/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "choice", interested }),
      });
      if (!res.ok) throw new Error("SAVE_FAILED");
    } catch {
      setChoice(previous);
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  const features = [
    "results.careerPlusFeature1",
    "results.careerPlusFeature2",
    "results.careerPlusFeature3",
    "results.careerPlusFeature4",
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-[var(--color-text-primary)] p-7 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]"
        >
          <svg
            viewBox="0 0 200 200"
            className="h-[260px] w-[260px]"
            fill="none"
            stroke="var(--color-accent-primary-soft)"
            strokeWidth="1.6"
          >
            <circle cx="100" cy="100" r="86" />
            <circle cx="100" cy="100" r="62" strokeDasharray="3 7" />
            <circle cx="100" cy="100" r="34" />
            <path
              d="M100 46 L118 118 L100 106 L82 118 Z"
              fill="var(--color-accent-primary-soft)"
              stroke="none"
            />
          </svg>
        </div>

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-white/[0.12] px-3 py-1 text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
            {t("results.careerPlusBadge", locale)}
          </span>
          <h1 className="mt-3 font-fraunces text-[28px] leading-tight text-white md:text-[38px]">
            {t("results.careerPlusTitle", locale)}
          </h1>
          <p className="mt-3 max-w-prose text-body leading-relaxed text-white/[0.68]">
            {t("results.careerPlusLead", locale)}
          </p>
        </div>
      </section>

      {/* Mit tudna */}
      <section>
        <p className="mb-3 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          {t("results.careerPlusWhatTitle", locale)}
        </p>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {features.map((key) => (
            <div
              key={key}
              className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-white p-4"
            >
              <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
                {t(key, locale)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ár */}
      <section className="rounded-2xl border-[1.5px] border-[var(--color-action-primary-bg)]/25 bg-[var(--color-surface-self-accent-soft)] p-6 md:p-7">
        <p className="text-micro font-bold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
          {t("results.careerPlusPriceLabel", locale)}
        </p>
        <p className="mt-1.5 font-fraunces text-[32px] leading-none text-[var(--color-text-primary)] md:text-[40px]">
          {price}
        </p>
        <p className="mt-2.5 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.careerPlusPriceNote", locale)}
        </p>
      </section>

      {/* Döntés */}
      <section className="rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-white p-6 md:p-7">
        {choice === null ? (
          <>
            <p className="font-fraunces text-[20px] leading-snug text-[var(--color-text-primary)] md:text-[23px]">
              {t("results.careerPlusAskTitle", locale)}
            </p>
            <p className="mt-2 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.careerPlusAskNote", locale)}
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => answer(true)}
                disabled={pending}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-[var(--color-action-primary-bg-hover)] disabled:opacity-60"
              >
                {t("results.careerPlusYes", locale)}
              </button>
              {/* Ugyanakkora súly: a „nem" nélkül a minta felfelé torzulna. */}
              <button
                type="button"
                onClick={() => answer(false)}
                disabled={pending}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border-[1.5px] border-[var(--color-border-default)] bg-white px-6 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-60"
              >
                {t("results.careerPlusNo", locale)}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-fraunces text-[20px] leading-snug text-[var(--color-text-primary)] md:text-[23px]">
              {t(choice ? "results.careerPlusThanksYes" : "results.careerPlusThanksNo", locale)}
            </p>
            <p className="mt-2 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.careerPlusThanksNote", locale)}
            </p>
            <button
              type="button"
              onClick={() => setChoice(null)}
              className="mt-3 min-h-[44px] text-caption font-medium text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-text-secondary)]"
            >
              {t("results.careerPlusChangeAnswer", locale)}
            </button>
          </>
        )}

        {failed && (
          <p className="mt-3 text-caption text-[var(--color-text-muted)]">
            {t("results.careerPlusError", locale)}
          </p>
        )}
      </section>

      <p className="text-caption text-[var(--color-text-muted)]">
        <Link href="/profile/results" className="underline underline-offset-2 hover:text-[var(--color-text-secondary)]">
          {t("results.careerPlusBack", locale)}
        </Link>
      </p>
    </div>
  );
}
