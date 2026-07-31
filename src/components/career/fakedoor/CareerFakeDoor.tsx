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
      className="h-16 w-16 shrink-0 rounded-xl border border-white/20 md:h-[104px] md:w-[104px]"
    />
  ) : null;

  // Ugyanaz az ábra MÁSODIK szerepben: nagy, levágott vízjel az agyag
  // alapon. Nem a lemez halványabb mása — az a horgony marad teljes
  // erőben; ez mélységet ad a felületnek, hogy a hero ne sík doboz legyen.
  const glyphWatermark = glyph ? (
    <TypeGlyph
      primaryCode={glyph.primaryCode}
      secondaryCode={glyph.secondaryCode}
      typeLabel={glyph.label}
      locale={locale}
      intensity={glyph.intensity}
      variant="badge"
      canvas={false}
      className="pointer-events-none absolute -bottom-16 -right-10 hidden h-[420px] w-[420px] opacity-[0.09] md:block"
    />
  ) : null;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <SurfaceHero
        className="fd-rise"
        variant="career"
        contentClassName="relative"
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
            <h1 className="min-w-0 font-fraunces text-fluid-title tracking-tight text-white">
              {t("fakeDoor.heroTitle", locale)}
            </h1>
          </div>
        }
        body={
          <p className="max-w-[620px] text-[17px] leading-relaxed text-white/[0.72] md:text-[19px]">
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
        footer={glyphWatermark}
      />

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
        {/* Az első kártya szélesebb: egy négy egyforma dobozból álló rács
            mindig laposan olvasódik, akármilyen szép a tartalma. */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CARDS.map((card, index) => (
            <div
              key={card.lead}
              className={`relative overflow-hidden rounded-2xl border border-sand bg-white p-5 md:p-6 ${
                index === 0 ? "md:col-span-2" : ""
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
        <div
          className="relative overflow-hidden px-6 py-7 md:px-8 md:py-8"
          style={{ background: CAREER_THEME.background }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-white/[0.03]"
          />
          <div className="relative">
            <p
              className="font-mono text-micro uppercase tracking-widest"
              style={{ color: CAREER_THEME.badgeText }}
            >
              {t("fakeDoor.priceLabel", locale)}
            </p>
            {/* Nincs count-up: egy nem létező termék oldalán a numerikus
                teátralitás pont a hitelességet vinné el. */}
            <p className="mt-2 font-fraunces text-[40px] leading-none text-white md:text-[52px]">
              {price}
            </p>
            <p className="mt-3 max-w-prose text-caption leading-relaxed text-white/[0.72]">
              {t("fakeDoor.priceFraming", locale)}{" "}
              <span className="text-white/[0.5]">{t("fakeDoor.priceNoCard", locale)}</span>
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
