"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { TypeGlyph, TypeMotifMark } from "@/components/type/TypeGlyph";
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
// A paletta (Warm Editorial) SZÁNDÉKOSAN oldal-lokális `--fd-*` változó:
// a platform token-rendszere sage/bronz alapú, ezt a mérőoldalt viszont
// külön arculat viszi. Így a design-token szinkron-teszt sem sérül.

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
    /** A típusnév — az ábra alt-szövege ebből épül, tehát akkor is kell,
     *  ha a hero nem szólítja meg vele a látogatót. */
    label: string;
  } | null;
  defaultEmail: string | null;
  initial: DecisionInitialState | null;
}

const PALETTE = {
  "--fd-terracotta": "#c8410a",
  "--fd-cream": "#f5f0e8",
  "--fd-mustard": "#d9a441",
  "--fd-deep": "#1f3a5f",
} as React.CSSProperties;

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

  return (
    <div style={PALETTE} className="flex flex-col gap-10">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="fd-rise relative overflow-hidden rounded-2xl border-[1.5px] border-[var(--fd-mustard)]/45 bg-[var(--fd-cream)] p-7 md:p-10">
        <div className="relative z-10 max-w-[32rem]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--fd-terracotta)] px-3 py-1 text-micro font-semibold uppercase tracking-widest text-white">
              {t("fakeDoor.badge", locale)}
            </span>
            <span className="text-micro font-semibold uppercase tracking-widest text-[var(--fd-deep)]/70">
              {t("fakeDoor.eyebrow", locale)}
            </span>
          </div>

          <h1 className="mt-4 font-fraunces text-[30px] leading-[1.12] text-[var(--fd-deep)] md:text-[42px]">
            {t("fakeDoor.heroTitle", locale)}
          </h1>
          <p className="mt-4 max-w-prose text-body leading-relaxed text-[var(--fd-deep)]/80">
            {t("fakeDoor.heroLead", locale)}
          </p>
          <p className="mt-3 inline-block border-l-[3px] border-[var(--fd-terracotta)] pl-3 text-caption font-semibold text-[var(--fd-terracotta)]">
            {t("fakeDoor.heroPositioning", locale)}
          </p>

          {/* T12: a riportból érkezőt a SAJÁT mintázata fogadja. A releváns
              ajánlatra adott igen többet ér mért szándékként. */}
          {patternLabel && (
            <p className="mt-4 text-caption text-[var(--fd-deep)]/70">
              {tf("fakeDoor.heroPersonal", locale, { pattern: patternLabel })}
            </p>
          )}
        </div>

        {/* A SAJÁT karakter-ábrája — ugyanaz a típus-ábra, amit a riportban
            lát, ugyanabból az SVG-nyelvtanból. Nem díszítés: azt mondja ki,
            hogy a modul EBBŐL indulna. */}
        {/* A SAJÁT karakter-ábrája, keret és alaplap nélkül: a forma a hero
            hátterébe olvad. Halványítva és nagyban, a szöveg alá futva —
            hangulat, nem illusztráció. Mobilon a szöveg ALATT áll, mert
            oldalt nem férne el olvashatóan. */}
        {glyph && (
          <TypeGlyph
            primaryCode={glyph.primaryCode}
            secondaryCode={glyph.secondaryCode}
            typeLabel={glyph.label}
            locale={locale}
            intensity={glyph.intensity}
            variant="badge"
            canvas={false}
            className="pointer-events-none mx-auto mt-4 block h-[220px] w-[220px] opacity-45 md:absolute md:-right-4 md:top-1/2 md:z-0 md:mt-0 md:h-[380px] md:w-[380px] md:-translate-y-1/2 md:opacity-40"
          />
        )}
      </section>

      {/* ── „Wow" ────────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-1">
        <p className="border-l-[3px] border-[var(--fd-mustard)] pl-5 font-fraunces text-[21px] leading-relaxed text-[var(--color-text-primary)] md:text-[25px]">
          {t("fakeDoor.wow", locale)}
        </p>
      </section>

      {/* ── Mit kapnál ───────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-2">
        <p className="mb-3 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          {t("fakeDoor.whatTitle", locale)}
        </p>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.lead}
              className="flex gap-3 rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-white p-4"
            >
              <TypeMotifMark
                code={card.motif}
                strokeWidth={7}
                className="mt-0.5 h-7 w-7 shrink-0 stroke-[var(--fd-terracotta)] [&>g]:stroke-[var(--fd-terracotta)]"
              />
              <div>
                <p className="text-body font-bold text-[var(--fd-deep)]">
                  {t(card.lead, locale)}
                </p>
                <p className="mt-1 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
                  {t(card.body, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mire épül ────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-3">
        <p className="mb-2.5 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          {t("fakeDoor.trustTitle", locale)}
        </p>
        <ul className="flex flex-wrap gap-x-2.5 gap-y-2 text-caption text-[var(--color-text-secondary)]">
          {["trustItem1", "trustItem2", "trustItem3", "trustItem4"].map((key) => (
            <li
              key={key}
              className="rounded-full border border-[var(--color-border-soft)] px-3 py-1"
            >
              {t(`fakeDoor.${key}`, locale)}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Ár ───────────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-4 rounded-2xl border-[1.5px] border-[var(--fd-mustard)] bg-[var(--fd-cream)] p-6 md:p-7">
        <p className="text-micro font-bold uppercase tracking-wide text-[#9a6a12]">
          {t("fakeDoor.priceLabel", locale)}
        </p>
        {/* Nincs count-up: egy nem létező termék oldalán a numerikus
            teátralitás pont a hitelességet vinné el. */}
        <p className="mt-1.5 font-fraunces text-[34px] leading-none text-[var(--fd-deep)] md:text-[44px]">
          {price}
        </p>
        <p className="mt-2.5 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
          {t("fakeDoor.priceFraming", locale)}{" "}
          <span className="text-[var(--color-text-muted)]">
            {t("fakeDoor.priceNoCard", locale)}
          </span>
        </p>
      </section>

      {/* ── Döntés ───────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-5 rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-white p-6 md:p-7">
        <DecisionPanel
          sessionId={sessionId}
          source={source}
          priceVariant={priceVariant}
          defaultEmail={defaultEmail}
          initial={initial}
        />
      </section>

      <p className="text-caption text-[var(--color-text-muted)]">
        <Link
          href="/profile/results"
          className="underline underline-offset-2 hover:text-[var(--fd-terracotta)]"
        >
          {t("fakeDoor.back", locale)}
        </Link>
      </p>
    </div>
  );
}
