"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TypeGlyph } from "@/components/type/TypeGlyph";
import {
  DIMENSION_GLYPHS,
  resolveGlyphPair,
} from "@/lib/type-glyph";
import { resolvePersonalityTypeLabel } from "@/lib/personality-type";
import { TRITAN_DIMENSIONS, type TritanDimCode } from "@/lib/tritan";
import { withHuArticle } from "@/lib/hu-grammar";
import { t, tf, type Locale } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────
// Zárható típus-tábla (2026-07-30).
//
// Zárva egy sor: indexkép + típusnév + dimenzió-pár. Nyitva a teljes
// kompozíció és a nyelvtan magyarázata — a formák és motívumok nevei a
// type-glyph.ts-ből jönnek, nincs külön szöveg-forrás.
//
// A heróban a NÉV mellett áll a kis ábra; ez a tábla adja a jelentését.
// ─────────────────────────────────────────────────────────────────────

interface TypeGlyphPlateProps {
  /** Pontozott dimenziók (TRITAN-kódok) — ebből jön a pár és az intenzitás. */
  dimensions: Array<{ code: string; score: number }>;
  locale: Locale;
  /** Nyitva induljon-e (megosztott/nyilvános nézetben ez a jó). */
  defaultOpen?: boolean;
  /**
   * "card" — önálló kártya, fejléc-sorral (típusnév + pár).
   * "heroTab" — a banner alsó szélére ülő kis fül, alatta nyíló panel.
   */
  mode?: "card" | "heroTab";
}

function dimensionName(code: string, locale: Locale): string {
  const dim = TRITAN_DIMENSIONS[code as TritanDimCode];
  if (!dim) return code;
  return locale === "hu" ? dim.hu : dim.en;
}

export function TypeGlyphPlate({
  dimensions,
  locale,
  defaultOpen = false,
  mode = "card",
}: TypeGlyphPlateProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef<HTMLElement | null>(null);
  // A portál csak kliensen létezik (SSR-en nincs document).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Nyitva: Escape zár, és a panel a képernyő közepére kerül — mobilon ez
  // teszi a lenyitott panelt a kijelző tartalmává.
  useEffect(() => {
    if (!open || mode !== "heroTab") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // A görgetés a kigördülés UTÁN fut: amíg a rács-sor animál, a panel
    // magassága még 0, ilyenkor a scrollIntoView rossz helyre visz.
    // matchMedia nem létezik minden környezetben (jsdom) — enélkül is
    // működnie kell, csak animált görgetéssel.
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => {
        panelRef.current?.scrollIntoView({
          block: "center",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      },
      reduceMotion ? 0 : 420,
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, mode]);

  const pair = resolveGlyphPair(dimensions);
  if (!pair) return null;

  const { primaryCode, secondaryCode, intensity } = pair;
  const typeLabel = resolvePersonalityTypeLabel(primaryCode, secondaryCode, locale);
  if (!typeLabel) return null;

  const primaryGlyph = DIMENSION_GLYPHS[primaryCode];
  const secondaryGlyph = DIMENSION_GLYPHS[secondaryCode];
  const pairLabel =
    primaryCode === secondaryCode
      ? dimensionName(primaryCode, locale)
      : `${dimensionName(primaryCode, locale)} × ${dimensionName(secondaryCode, locale)}`;

  // HU-ban a behelyettesített kifejezések már névelővel érkeznek
  // (hu-grammar.ts), így a sablonban nincs „a(z)” műtermék; EN-ben a
  // sablon adja a „the”-t.
  const isHu = locale === "hu";
  const article = (phrase: string) => (isHu ? withHuArticle(phrase) : phrase);
  const grammar = tf("results.glyphGrammar", locale, {
    form: article(isHu ? primaryGlyph.formName.hu : primaryGlyph.formName.en),
    primary: article(dimensionName(primaryCode, locale)),
    motif: article(isHu ? secondaryGlyph.motifName.hu : secondaryGlyph.motifName.en),
    secondary: article(dimensionName(secondaryCode, locale)),
  });

  const panel = (
    <div className="grid grid-cols-1 items-center gap-5 px-4 pb-5 pt-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <TypeGlyph
        primaryCode={primaryCode}
        secondaryCode={secondaryCode}
        typeLabel={typeLabel}
        locale={locale}
        intensity={intensity}
        variant="card"
        // Mobilon a kép nem nőhet a képernyő fölé — a panel egészének be
        // kell férnie a kijelzőbe nyitás után.
        className="mx-auto w-full max-h-[46svh] rounded-xl border border-[var(--color-border-soft)] object-contain md:max-h-none"
      />
      <div className="flex flex-col gap-1.5">
        <p className="text-body text-ink">
          {typeLabel}
          <span className="ml-1.5 text-caption italic text-muted">· {pairLabel}</span>
        </p>
        <p className="text-caption leading-relaxed text-ink-body">{grammar}</p>
      </div>
    </div>
  );

  // ── „Dosszié” mód: fül a hero alján, alóla legördülő panel ───────────
  // A fül a banner aljához tapad (a hero z-rétege felette van, ezért a fül
  // teteje becsúszik alá), a panel pedig a hero ALÓL gördül ki: a rács-sor
  // 0fr→1fr animációja adja a kicsúszás érzetét. Reduced-motion esetén
  // animáció nélkül, azonnal nyílik.
  if (mode === "heroTab") {
    return (
      <div className="relative flex flex-col">
        {/* Fókusz-fátyol: nyitva minden más elhalványul és elmosódik, a fül
            és a panel az egyetlen éles réteg. Kattintás zárja.
            Portálban megy a body-ra, mert mobilon a transzformált/szűrt
            szülők miatt a `fixed` elem nem a viewporthoz igazodott, és a
            backdrop-filter sem érvényesült. A -webkit- prefix iOS-hez kell. */}
        {open &&
          mounted &&
          createPortal(
            <div
              className="fixed inset-0 z-[45] bg-[rgba(26,26,46,0.22)]"
              style={{
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
              }}
              aria-hidden
              onClick={() => setOpen(false)}
            />,
            document.body,
          )}

        {/* Nincs fül-alakzat. A felirat a hero ALSÓ sávjában áll (negatív
            margóval visszalógva), a vékony nyíl viszont már a banner ALATT,
            a krém háttéren — ezért ott tinta-színű. Egyetlen kattintható
            elem: a feliratra is nyílik. */}
        <div className={`relative -mt-8 flex justify-center ${open ? "z-50" : "z-30"}`}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="group flex flex-col items-center gap-6 px-4"
          >
            {/* 11,5 px: a caption (13px) alatt, de a micro (10px) padló
                fölött — kis metaadat-méret, ami még kényelmesen olvasható. */}
            <span className="text-[11.5px] leading-none tracking-[0.01em] text-white/55 transition group-hover:text-white/85">
              {t("results.glyphTabLabel", locale)}
            </span>
            {/* Két hajszálvonal egy szélesebb + egy keskenyebb: irányt sugall
                (lefelé keskenyedik) anélkül, hogy nyílként hangsúlyos lenne.
                Nyitva megfordul, tehát felfelé keskenyedik. */}
            <span
              aria-hidden
              className={`flex flex-col items-center gap-[3px] opacity-60 transition-[transform,opacity] duration-[var(--motion-duration-base)] group-hover:opacity-95 motion-reduce:transition-none ${
                open ? "rotate-180" : "group-hover:translate-y-[1.5px]"
              }`}
            >
              <span
                className="block h-[1.5px] w-[22px] rounded-full"
                style={{ backgroundColor: "var(--color-text-muted)" }}
              />
              <span
                className="block h-[1.5px] w-[12px] rounded-full"
                style={{ backgroundColor: "var(--color-text-muted)" }}
              />
            </span>
          </button>
        </div>

        <div
          className={`relative grid transition-[grid-template-rows] duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-standard)] motion-reduce:transition-none ${
            open ? "z-50 grid-rows-[1fr]" : "z-10 grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <section
              ref={panelRef}
              // Mobilon a panel a képernyőbe fér (a nyitás után oda is
              // görgetünk), így a lenyitás után ez van a kijelzőn.
              className={`mt-2 max-h-[86svh] overflow-y-auto rounded-2xl border border-[var(--color-border-soft)] bg-surface-card shadow-[0_18px_44px_rgba(26,26,46,0.16)] transition-[opacity,transform] duration-[var(--motion-duration-base)] motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
              }`}
              aria-hidden={!open}
            >
              {panel}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-surface-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-cream"
      >
        <span className="flex min-w-0 items-center gap-3">
          <TypeGlyph
            primaryCode={primaryCode}
            secondaryCode={secondaryCode}
            typeLabel={typeLabel}
            locale={locale}
            intensity={intensity}
            variant="badge"
            className="h-8 w-8 shrink-0 rounded-lg border border-[var(--color-border-soft)]"
          />
          <span className="flex min-w-0 flex-col">
            <span className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
              {t("results.glyphEyebrow", locale)}
            </span>
            <span className="truncate text-body text-ink">
              {typeLabel}
              <span className="ml-1.5 text-caption italic text-muted">· {pairLabel}</span>
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-micro uppercase tracking-widest text-muted">
          {open ? t("results.glyphClose", locale) : t("results.glyphOpen", locale)}
          <span
            aria-hidden
            className={`transition-transform duration-[var(--motion-duration-base)] motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border-soft)]">{panel}</div>
      )}
    </section>
  );
}
