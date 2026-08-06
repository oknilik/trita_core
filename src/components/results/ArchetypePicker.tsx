"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { TypeGlyph, TypeMotifMark } from "@/components/type/TypeGlyph";
import { DIMENSION_GLYPHS } from "@/lib/type-glyph";
import { TRITAN_DIMENSIONS, TRITAN_ORDER, type TritanDimCode } from "@/lib/tritan";
import { personalityAdjective, personalityNoun } from "@/lib/personality-type";

// Archetípus-választó ÁBRÁKKAL.
//
// Miért nem legördülő: a karakter-ábra nyelvtana pontosan az, amit itt
// választani kell — a LEGERŐSEBB dimenzió adja a nagy FORMÁT, a második a
// benne futó MOTÍVUMOT. Két szöveges listából ez nem látszik; csempékből
// viszont maga a választás mutatja meg, mi épül belőle.
//
// Natív rádiógombokkal megy (vizuálisan elrejtve): így a billentyűzet-
// kezelés és a képernyőolvasó ingyen van, nem kell radiogroup-mintát
// kézzel megírni.

interface ArchetypePickerProps {
  dominant: TritanDimCode;
  secondary: TritanDimCode;
  onDominantChange: (dim: TritanDimCode) => void;
  onSecondaryChange: (dim: TritanDimCode) => void;
}

// min-w-0 + a címkéken break-words: 320-360px-en a 3 oszlopos rács cellája
// ~70-85px, a hosszú magyar dimenzió-nevek („Lelkiismeretesség") különben
// kilógnának a csempe keretéből a szomszéd sávjába.
const TILE_BASE =
  "flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl border-[1.5px] p-2.5 text-center transition";
const TILE_IDLE =
  "border-[var(--color-border-soft)] bg-white hover:border-[var(--color-border-default)]";
const TILE_ACTIVE =
  "border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] shadow-[0_2px_10px_rgba(0,0,0,0.05)]";

export function ArchetypePicker({
  dominant,
  secondary,
  onDominantChange,
  onSecondaryChange,
}: ArchetypePickerProps) {
  const { locale } = useLocale();
  const lang = locale === "hu" ? "hu" : "en";

  const dimName = (dim: TritanDimCode) =>
    lang === "hu" ? TRITAN_DIMENSIONS[dim].hu : TRITAN_DIMENSIONS[dim].en;

  return (
    <div className="mb-5 flex flex-col gap-4">
      {/* ELSŐDLEGES — a nagy forma. */}
      <fieldset>
        <legend className="mb-1.5 text-caption font-semibold text-[var(--color-text-primary)]">
          {t("results.interactionPickDominant", locale)}
        </legend>
        <p className="mb-2 text-micro text-[var(--color-text-muted)]">
          {t("results.interactionPickDominantHint", locale)}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {TRITAN_ORDER.map((dim) => {
            const active = dim === dominant;
            return (
              <label key={dim} className={`${TILE_BASE} ${active ? TILE_ACTIVE : TILE_IDLE}`}>
                <input
                  type="radio"
                  name="archetype-dominant"
                  value={dim}
                  checked={active}
                  onChange={() => onDominantChange(dim)}
                  className="sr-only"
                />
                {/* Azonos elsődleges/másodlagos kód = TISZTA forma, motívum
                    nélkül: pontosan azt mutatja, amit ez a választás ad. */}
                <TypeGlyph
                  primaryCode={dim}
                  secondaryCode={dim}
                  typeLabel={personalityNoun(dim, locale) ?? dimName(dim)}
                  locale={lang}
                  intensity={active ? 4 : 2}
                  variant="badge"
                  className="h-12 w-12 md:h-14 md:w-14"
                />
                <span className="max-w-full break-words text-caption font-semibold leading-tight text-[var(--color-text-primary)]">
                  {personalityNoun(dim, locale) ?? dimName(dim)}
                </span>
                <span className="max-w-full break-words text-micro leading-tight text-[var(--color-text-muted)]">
                  {dimName(dim)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* MÁSODLAGOS — a formán belül futó motívum. */}
      <fieldset>
        <legend className="mb-1.5 text-caption font-semibold text-[var(--color-text-primary)]">
          {t("results.interactionPickSecondary", locale)}
        </legend>
        <p className="mb-2 text-micro text-[var(--color-text-muted)]">
          {t("results.interactionPickSecondaryHint", locale)}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TRITAN_ORDER.filter((dim) => dim !== dominant).map((dim) => {
            const active = dim === secondary;
            return (
              <label key={dim} className={`${TILE_BASE} ${active ? TILE_ACTIVE : TILE_IDLE}`}>
                <input
                  type="radio"
                  name="archetype-secondary"
                  value={dim}
                  checked={active}
                  onChange={() => onSecondaryChange(dim)}
                  className="sr-only"
                />
                {/* Csak a motívum: a második dimenzió hozzájárulása az ábrához. */}
                <TypeMotifMark
                  code={dim}
                  className={`h-10 w-10 md:h-11 md:w-11 ${
                    active
                      ? "text-[var(--color-accent-self-deep)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                  title={DIMENSION_GLYPHS[dim]?.motifName[lang]}
                />
                <span className="max-w-full break-words text-caption font-semibold leading-tight text-[var(--color-text-primary)]">
                  {personalityAdjective(dim, locale) ?? dimName(dim)}
                </span>
                <span className="max-w-full break-words text-micro leading-tight text-[var(--color-text-muted)]">
                  {dimName(dim)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
