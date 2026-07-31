"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { TypeGlyph, TypeMotifMark } from "@/components/type/TypeGlyph";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  DecisionPanel,
  type DecisionInitialState,
} from "@/components/career/fakedoor/DecisionPanel";

// Karrier-iránytű fake door — MÉRŐESZKÖZ, nem termékoldal.
//
// Az oldal feladata három kérdés megválaszolása: van-e fizetési szándék,
// milyen áron, és melyik problémát oldaná meg. Ami ezt nem szolgálja, az
// nincs itt.
//
// Két tiltás, amit egyetlen blokk sem sérthet meg:
//  · Nincs kitalált szám. Se „84% illeszkedés", se sávdiagram — a
//    módszertan küszöbalapú, egy numerikus előnézet olyan terméket ígérne,
//    amit nem szállítunk, és pont a módszertani pozíciót rombolná.
//  · Nincs túlállított kutatási háttér. n=189 önmagában elég erős.
//
// VIZUÁLIS NYELV (2026-07-31): a platform saját tokenjei, semmi külön
// paletta. A korábbi „Warm Editorial" (terrakotta + mélykék + saját krém)
// három ponton súrolta a márkát: a kék sehol nem szerepel a self-felületen,
// a terrakotta olyan közel volt a bronzhoz, hogy elrontott bronznak
// olvasódott, a saját krém pedig két árnyalattal mellément. A hero ugyanaz
// a SurfaceHero, mint a riporton — így a mérés a termék folytatásának
// látszik, nem ráragasztott landingnek.

interface CareerFakeDoorProps {
  sessionId: string;
  source: string;
  price: string;
  /** A mutatott ár számként — az ár-csúszka felső határa. */
  priceVariant: number;
  /** Kész személyiségprofil típusneve — csak a riportból érkezőnél mutatjuk. */
  patternLabel: string | null;
  /**
   * A felhasználó SAJÁT karakter-ábrája (típus-ábra nyelvtan: domináns
   * dimenzió = alapforma, második = motívum). Profil nélkül null — kitalált
   * ábrát mutatni pont az ellenkezőjét üzenné annak, amit az oldal ígér.
   */
  glyph: {
    primaryCode: string;
    secondaryCode: string;
    intensity: number;
    /** A típusnév — az ábra alt-szövege ebből épül. */
    label: string;
  } | null;
  defaultEmail: string | null;
  initial: DecisionInitialState | null;
}

/** A karrier-felület hero-témája — a badge-ek innen veszik a színt. */
const CAREER_THEME = SURFACE_HERO_THEME.career;

/** A négy kártya a tengelymotívumokat kapja ikonként — nincs emoji. */
const CARDS = [
  { lead: "fakeDoor.card1Lead", body: "fakeDoor.card1Body", motif: "TEMP" },
  { lead: "fakeDoor.card2Lead", body: "fakeDoor.card2Body", motif: "ADAP" },
  { lead: "fakeDoor.card3Lead", body: "fakeDoor.card3Body", motif: "THOR" },
  { lead: "fakeDoor.card4Lead", body: "fakeDoor.card4Body", motif: "OPEN" },
];

export function CareerFakeDoor({
  sessionId,
  source,
  price,
  priceVariant,
  patternLabel,
  glyph,
  defaultEmail,
  initial,
}: CareerFakeDoorProps) {
  const { locale } = useLocale();
  const logged = useRef(false);

  // Megtekintés = a konverzió nevezője. Kliensről megy, hogy az előtöltés és
  // a robotok ne hígítsák; ez a hívás írja ki a munkamenet-cookie-t is.
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void fetch("/api/career/fakedoor/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, source }),
    }).catch(() => {});
  }, [sessionId, source]);

  // A SAJÁT karakter-ábrája, TELJES erővel, világos lapon — ugyanúgy, ahogy a
  // riport-heróban. Sötét alapon nem kell tompítani: a kontraszt az alapból
  // jön, nem az átlátszóságból. Ez az egyetlen elem az oldalon, ami tényleg
  // a felhasználóé — kifakítva pont a lényegét veszítené el.
  const glyphPlate = glyph ? (
    <TypeGlyph
      primaryCode={glyph.primaryCode}
      secondaryCode={glyph.secondaryCode}
      typeLabel={glyph.label}
      locale={locale}
      intensity={glyph.intensity}
      variant="badge"
      className="h-16 w-16 shrink-0 rounded-xl border border-white/20 md:h-[84px] md:w-[84px]"
    />
  ) : null;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <SurfaceHero
        className="fd-rise"
        variant="career"
        eyebrow={
          <span className="rounded-full bg-white/[0.12] px-3 py-1 text-micro font-semibold uppercase tracking-widest text-white/70">
            {t("fakeDoor.eyebrow", locale)}
          </span>
        }
        badge={
          // A készülő-funkció jelzés bronzban: ez az oldal egyetlen hangos
          // vizuális állítása, és az őszinteségi keret hordozója.
          <span
            className="rounded-full px-3 py-1 text-micro font-semibold uppercase tracking-widest"
            style={{ background: CAREER_THEME.badgeBg, color: CAREER_THEME.badgeText }}
          >
            {t("fakeDoor.badge", locale)}
          </span>
        }
        title={
          <div className="flex items-start gap-4">
            {glyphPlate}
            <h1 className="min-w-0 font-fraunces text-[26px] leading-[1.14] tracking-tight text-white md:text-[36px]">
              {t("fakeDoor.heroTitle", locale)}
            </h1>
          </div>
        }
        body={
          <p className="max-w-[620px] text-body leading-relaxed text-white/[0.72]">
            {t("fakeDoor.heroLead", locale)}
          </p>
        }
        summary={
          // T12: a riportból érkezőt a SAJÁT mintázata fogadja. A releváns
          // ajánlatra adott igen többet ér mért szándékként.
          patternLabel
            ? tf("fakeDoor.heroPersonal", locale, { pattern: patternLabel })
            : undefined
        }
        chips={
          <span
            className="rounded-full px-3 py-1.5 text-caption font-semibold"
            style={{ background: CAREER_THEME.badgeBg, color: CAREER_THEME.badgeText }}
          >
            {t("fakeDoor.heroPositioning", locale)}
          </span>
        }
      />

      {/* ── „Wow" ────────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-1">
        <p className="border-l-[3px] border-bronze pl-5 font-fraunces text-[21px] leading-relaxed text-ink md:text-[25px]">
          {t("fakeDoor.wow", locale)}
        </p>
      </section>

      {/* ── Mit kapnál ───────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-2">
        <SectionEyebrow variant="clean" className="mb-3">
          {t("fakeDoor.whatTitle", locale)}
        </SectionEyebrow>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.lead}
              className="flex gap-3 rounded-2xl border border-sand bg-white p-4"
            >
              <TypeMotifMark
                code={card.motif}
                strokeWidth={7}
                className="mt-0.5 h-7 w-7 shrink-0 stroke-bronze [&>g]:stroke-bronze"
              />
              <div>
                <p className="text-body font-bold text-ink">{t(card.lead, locale)}</p>
                <p className="mt-1 max-w-prose text-caption leading-relaxed text-ink-body">
                  {t(card.body, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mire épül ────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-3">
        <SectionEyebrow variant="clean" className="mb-2.5">
          {t("fakeDoor.trustTitle", locale)}
        </SectionEyebrow>
        <ul className="flex flex-wrap gap-x-2.5 gap-y-2 text-caption text-ink-body">
          {["trustItem1", "trustItem2", "trustItem3", "trustItem4"].map((key) => (
            <li key={key} className="rounded-full border border-sand px-3 py-1">
              {t(`fakeDoor.${key}`, locale)}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Ár ───────────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-4 rounded-2xl border border-bronze-edge bg-bronze-soft/40 p-6 md:p-7">
        <SectionEyebrow>{t("fakeDoor.priceLabel", locale)}</SectionEyebrow>
        {/* Nincs count-up: egy nem létező termék oldalán a numerikus
            teátralitás pont a hitelességet vinné el. */}
        <p className="mt-1.5 font-fraunces text-[34px] leading-none text-ink md:text-[44px]">
          {price}
        </p>
        <p className="mt-2.5 max-w-prose text-caption leading-relaxed text-ink-body">
          {t("fakeDoor.priceFraming", locale)}{" "}
          <span className="text-muted">{t("fakeDoor.priceNoCard", locale)}</span>
        </p>
      </section>

      {/* ── Döntés ───────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-5 rounded-2xl border border-sand bg-white p-6 md:p-7">
        <DecisionPanel
          sessionId={sessionId}
          source={source}
          priceVariant={priceVariant}
          defaultEmail={defaultEmail}
          initial={initial}
        />
      </section>

      <p className="text-caption text-muted">
        <Link
          href="/profile/results"
          className="underline underline-offset-2 hover:text-ink-body"
        >
          {t("fakeDoor.back", locale)}
        </Link>
      </p>
    </div>
  );
}
