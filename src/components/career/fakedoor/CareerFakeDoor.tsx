"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { TypeMotifMark } from "@/components/type/TypeGlyph";
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
  defaultEmail: string | null;
  initial: DecisionInitialState | null;
}

/**
 * A hero tervlapja. Zsálya tinta világos papíron — a rács és a keret
 * ugyanabból a színből, különböző erősséggel, hogy milliméterpapír-hatást
 * adjon a lap.
 */
const SHEET = {
  ink: "var(--color-sage-dark)",
  /**
   * A bélyegző SZÁNDÉKOSAN nem a lap tintája: zsálya alapon a zsálya
   * bélyegző beleolvad, pedig ez az oldal legfontosabb állítása. Meleg
   * bronz a hideg papíron — kiugrik, és a palettában marad.
   *
   * Miért nem a sima bronz (#c17f4a): ezen a papíron csak 2,7:1-et ad. A
   * mélyebb árnyalat (bronze-700) 5,0:1 — ez már olvasható.
   */
  stamp: "var(--color-bronze-700)",
  paper: "var(--color-sage-soft)",
  line: "rgba(45,90,78,0.18)",
  strong: "rgba(45,90,78,0.34)",
} as const;

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
    <div className="flex flex-col gap-8 md:gap-10">
      {/* ── Hero: TERVLAP ────────────────────────────────────────────
          Milliméterpapír, sarok-illesztőjelek, elforgatott bélyegző és
          rajzszám-blokk. A „még nem kész" állapotot nem egy apró címke
          mondja ki, hanem maga a forma — aki ránéz, nem hiszi késznek.
          Mérőoldalon ez a legőszintébb felület, és a mért szándék
          minőségét is védi.

          Zsálya tintával: a self-felület zöldje. A karakter-ábra
          SZÁNDÉKOSAN nincs a lapon — a rács, a bélyegző és a
          rajzszám-blokk együtt már elég erős motívum, az ábra csak zajt
          vitt bele. */}
      <section
        className="fd-rise relative overflow-hidden rounded-[20px] border px-6 py-8 md:px-10 md:py-11"
        style={
          {
            background: SHEET.paper,
            borderColor: SHEET.ink,
          } as React.CSSProperties
        }
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              `repeating-linear-gradient(0deg, ${SHEET.line} 0 1px, transparent 1px 16px)`,
              `repeating-linear-gradient(90deg, ${SHEET.line} 0 1px, transparent 1px 16px)`,
              `repeating-linear-gradient(0deg, ${SHEET.strong} 0 1px, transparent 1px 80px)`,
              `repeating-linear-gradient(90deg, ${SHEET.strong} 0 1px, transparent 1px 80px)`,
            ].join(","),
          }}
        />

        {/* Sarok-illesztőjelek — műszaki rajz nyelvtana. */}
        {["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"].map(
          (position) => (
            <span
              key={position}
              aria-hidden
              className={`absolute h-3 w-3 opacity-60 ${position}`}
            >
              <svg viewBox="0 0 12 12" fill="none" stroke={SHEET.ink} strokeWidth="1">
                <path d="M6 0v12M0 6h12" />
              </svg>
            </span>
          ),
        )}

        {/* Bélyegző: ez az első, amit a szem elkap. */}
        <span
          className="absolute right-5 top-6 rotate-[-7deg] rounded-md border-2 bg-white/40 px-3 py-1.5 text-micro font-bold uppercase tracking-widest md:right-10"
          style={{ borderColor: SHEET.stamp, color: SHEET.stamp }}
        >
          {t("fakeDoor.badge", locale)}
        </span>

        <div className="relative max-w-[38rem]">
          <span
            className="font-mono text-micro uppercase tracking-widest"
            style={{ color: SHEET.ink }}
          >
            {t("fakeDoor.eyebrow", locale)}
          </span>
          <h1 className="mt-3 max-w-[16ch] font-fraunces text-fluid-title tracking-tight text-ink">
            {t("fakeDoor.heroTitle", locale)}
          </h1>
          <p className="mt-4 max-w-[34rem] text-[17px] leading-relaxed text-ink-body md:text-[19px]">
            {t("fakeDoor.heroLead", locale)}
          </p>
          {/* Kimondva, nem csak jelzésként: a bélyegzőt át lehet siklani, ezt
              a mondatot nem. A mérés csak akkor tisztességes, ha a válaszadó
              tudja, hogy nem létező funkcióról nyilatkozik. */}
          <p
            className="mt-5 inline-block border-t border-dashed pt-3 text-caption font-semibold"
            style={{ borderColor: SHEET.ink, color: SHEET.ink }}
          >
            {t("fakeDoor.badgeNote", locale)}
          </p>
          {/* T12: a riportból érkezőt a SAJÁT mintázata fogadja. */}
          {patternLabel && (
            <p className="mt-2 text-caption text-muted">
              {tf("fakeDoor.heroPersonal", locale, { pattern: patternLabel })}
            </p>
          )}
        </div>

        {/* Rajzszám-blokk: műszaki rajzok sarok-táblája. Csak IGAZ adat. */}
        <div
          className="relative mt-7 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 font-mono text-micro uppercase tracking-widest"
          style={{ borderColor: SHEET.ink, color: SHEET.ink }}
        >
          <span>Modul: {t("fakeDoor.eyebrow", locale)}</span>
          <span>Állapot: terv</span>
          <span>Döntés: mérés alatt</span>
        </div>
      </section>

      {/* ── „Wow" ────────────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-1">
        <p className="max-w-[46rem] border-l-[3px] border-bronze pl-5 font-fraunces text-[23px] leading-[1.35] text-ink md:pl-7 md:text-[30px]">
          {t("fakeDoor.wow", locale)}
        </p>
      </section>

      {/* ── Mit kapnál ───────────────────────────────────────────── */}
      <section className="fd-rise fd-delay-2">
        <SectionEyebrow variant="clean" className="mb-3">
          {t("fakeDoor.whatTitle", locale)}
        </SectionEyebrow>
        {/* Az első és az utolsó kártya két hasábot fog át, a két középső
            osztozik: egy négy egyforma dobozból álló rács akkor is laposan
            olvasódik, ha a tartalma jó. */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CARDS.map((card, index) => (
            <div
              key={card.lead}
              className={`relative overflow-hidden rounded-2xl border border-sand bg-white p-5 md:p-6 ${
                index === 0 || index === CARDS.length - 1 ? "md:col-span-2" : ""
              }`}
            >
              {/* Nagy motívum-vízjel: a típus-ábra nyelvtanából, nem ikon-készletből. */}
              <TypeMotifMark
                code={card.motif}
                strokeWidth={6}
                className="pointer-events-none absolute -bottom-6 -right-4 h-32 w-32 stroke-bronze opacity-[0.09] [&>g]:stroke-bronze"
              />
              <div className="relative">
                <span className="font-fraunces text-[15px] text-bronze">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 font-fraunces text-[19px] leading-snug text-ink md:text-[22px]">
                  {t(card.lead, locale)}
                </p>
                <p className="mt-1.5 max-w-prose text-caption leading-relaxed text-ink-body">
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

      {/* ── Záró horgony: ár + döntés EGY kompozícióban ──────────
          Ez az oldal csúcspontja, ezért ez a második sötét tömeg a hero
          után. Külön halvány dobozokban a legfontosabb pillanat volt a
          leggyengébb. A forma-vezérlők a VILÁGOS testben maradnak: sötét
          alapon a csúszka és a rádiógombok olvashatósága romlana. */}
      <section className="fd-rise fd-delay-4 overflow-hidden rounded-2xl border border-sand">
        {/* Semleges ink alap (ugyanaz a sötét, mint a láblécé), NEM agyag: a
            hero mostantól zsálya tervlap, mellette az agyag két külön
            akcentus-családot vitt volna egy oldalra. Az ink egyikkel sem
            versenyez. */}
        <div className="relative overflow-hidden bg-gradient-to-b from-ink to-ink-body px-6 py-7 md:px-8 md:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-white/[0.03]"
          />
          <div className="relative">
            <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
              {t("fakeDoor.priceLabel", locale)}
            </p>
            {/* Nincs count-up: egy nem létező termék oldalán a numerikus
                teátralitás pont a hitelességet vinné el. */}
            <p className="mt-2 font-fraunces text-[40px] leading-none text-white md:text-[52px]">
              {price}
            </p>
            <p className="mt-3 max-w-prose text-caption leading-relaxed text-white/[0.72]">
              {t("fakeDoor.priceFraming", locale)}
            </p>
            {/* A „most nem fizetsz" nem lábjegyzet: ez az oldal legfontosabb
                ígérete, és ez tartja a mérést tisztességesnek. Pipa + saját
                sáv, hogy elolvasás nélkül is látszódjon. */}
            <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-white/[0.08] px-3.5 py-2.5 text-caption leading-relaxed text-[var(--color-accent-primary-soft)]">
              <svg
                viewBox="0 0 20 20"
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 10.5 8 14.5 16 6" />
              </svg>
              <span>{t("fakeDoor.priceNoCard", locale)}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8">
          <DecisionPanel
            sessionId={sessionId}
            source={source}
            priceVariant={priceVariant}
            defaultEmail={defaultEmail}
            initial={initial}
          />
        </div>
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
