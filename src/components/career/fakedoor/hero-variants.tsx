import { TypeGlyph } from "@/components/type/TypeGlyph";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { t } from "@/lib/i18n";

// Hero-variánsok a karrier mérőoldalhoz — DÖNTÉSHEZ, nem szállításra.
//
// Csak a `/career/hero-preview` fejlesztői oldal használja őket. Amelyik
// nyer, az beköltözik a CareerFakeDoor-ba, a többi törlődik: nem hagyunk
// öt félkész herót a kódban.
//
// Mindegyik ugyanazt a tartalmat viszi (státusz, cím, alcím, mintázat,
// pozicionálás), hogy tényleg a FORMÁT lehessen összehasonlítani.

const THEME = SURFACE_HERO_THEME.career;

export interface HeroVariantProps {
  locale: "hu" | "en";
  glyph: { primaryCode: string; secondaryCode: string; intensity: number; label: string };
  patternLabel: string | null;
}

function StatusBadge({ locale, dark = false }: { locale: "hu" | "en"; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-micro font-bold uppercase tracking-widest"
      style={
        dark
          ? { background: "#3c2119", color: THEME.badgeText }
          : { background: THEME.badgeText, color: "#3c2119" }
      }
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: dark ? THEME.badgeText : "#3c2119" }}
      />
      {t("fakeDoor.badge", locale)}
    </span>
  );
}

function Glyph({
  glyph,
  locale,
  className,
  canvas = true,
}: HeroVariantProps & { className?: string; canvas?: boolean }) {
  return (
    <TypeGlyph
      primaryCode={glyph.primaryCode}
      secondaryCode={glyph.secondaryCode}
      typeLabel={glyph.label}
      locale={locale}
      intensity={glyph.intensity}
      variant="badge"
      canvas={canvas}
      className={className}
    />
  );
}

/** A — a jelenlegi állapot, kontrollként. */
export function HeroA(props: HeroVariantProps) {
  const { locale, patternLabel } = props;
  return (
    <SurfaceHero
      variant="career"
      contentClassName="relative"
      eyebrow={
        <span className="rounded-full bg-white/[0.12] px-3 py-1 text-micro font-semibold uppercase tracking-widest text-white/70">
          {t("fakeDoor.eyebrow", locale)}
        </span>
      }
      badge={<StatusBadge locale={locale} />}
      title={
        <h1 className="max-w-[17ch] font-fraunces text-fluid-title tracking-tight text-white">
          {t("fakeDoor.heroTitle", locale)}
        </h1>
      }
      meta={
        <p className="mt-1 text-caption font-semibold" style={{ color: THEME.badgeText }}>
          {t("fakeDoor.badgeNote", locale)}
        </p>
      }
      body={
        <p className="max-w-[620px] text-[17px] leading-relaxed text-white/[0.72] md:text-[19px]">
          {t("fakeDoor.heroLead", locale)}
        </p>
      }
      summary={patternLabel ?? undefined}
      chips={
        <span
          className="rounded-full px-3 py-1.5 text-caption font-semibold"
          style={{ background: THEME.badgeBg, color: THEME.badgeText }}
        >
          {t("fakeDoor.heroPositioning", locale)}
        </span>
      }
      footer={
        <Glyph
          {...props}
          canvas={false}
          className="pointer-events-none absolute -bottom-12 -right-10 h-[280px] w-[280px] opacity-[0.10] md:-bottom-16 md:h-[420px] md:w-[420px] md:opacity-[0.09]"
        />
      }
    />
  );
}

/**
 * B — teljes szélességű szalag, magazin-nyitány.
 * A hero kifut a tartalomsávból, a cím a display-léptéken, az ábra élesen
 * levágva a jobb szélen. A lap nem „kártyát" mutat, hanem CÍMLAPOT.
 */
export function HeroB(props: HeroVariantProps) {
  const { locale, glyph, patternLabel } = props;
  return (
    <section
      className="relative -mx-4 overflow-hidden px-4 py-10 md:-mx-8 md:px-8 md:py-14"
      style={{ background: THEME.background }}
    >
      <Glyph
        {...props}
        canvas={false}
        className="pointer-events-none absolute -right-24 top-1/2 h-[460px] w-[460px] -translate-y-1/2 opacity-[0.18] md:-right-16 md:h-[620px] md:w-[620px]"
      />
      <div className="relative max-w-[46rem]">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge locale={locale} />
          <span className="text-micro font-semibold uppercase tracking-widest text-white/60">
            {t("fakeDoor.eyebrow", locale)}
          </span>
        </div>
        <h1 className="mt-5 font-fraunces text-fluid-display tracking-tight text-white">
          {t("fakeDoor.heroTitle", locale)}
        </h1>
        <p className="mt-4 max-w-[38rem] text-[18px] leading-relaxed text-white/[0.74] md:text-[20px]">
          {t("fakeDoor.heroLead", locale)}
        </p>
        <p className="mt-5 text-caption font-semibold" style={{ color: THEME.badgeText }}>
          {t("fakeDoor.badgeNote", locale)}
        </p>
        {patternLabel && (
          <p className="mt-1 text-caption text-white/50">{patternLabel}</p>
        )}
      </div>
      <span className="sr-only">{glyph.label}</span>
    </section>
  );
}

/**
 * C — osztott kártya: agyag szövegmező + krém ábramező.
 * Az ábra teljes erővel, saját mezőben főszereplő — nem háttér, nem bélyeg.
 */
export function HeroC(props: HeroVariantProps) {
  const { locale, glyph, patternLabel } = props;
  return (
    <section className="grid overflow-hidden rounded-[28px] md:grid-cols-[1.1fr_0.9fr]">
      <div className="px-6 py-8 md:px-9 md:py-11" style={{ background: THEME.background }}>
        <StatusBadge locale={locale} />
        <h1 className="mt-4 font-fraunces text-fluid-title tracking-tight text-white">
          {t("fakeDoor.heroTitle", locale)}
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-white/[0.72]">
          {t("fakeDoor.heroLead", locale)}
        </p>
        <p className="mt-4 text-caption font-semibold" style={{ color: THEME.badgeText }}>
          {t("fakeDoor.badgeNote", locale)}
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 bg-cream px-6 py-8">
        <Glyph {...props} className="h-[180px] w-[180px] rounded-2xl md:h-[210px] md:w-[210px]" />
        <p className="text-center font-fraunces text-[19px] text-ink">{glyph.label}</p>
        <p className="max-w-[22ch] text-center text-caption text-ink-body">
          {patternLabel ?? t("fakeDoor.heroPositioning", locale)}
        </p>
      </div>
    </section>
  );
}

/**
 * D — világos, tipográfia-vezérelt. RADIKÁLISAN más: nincs sötét tömb.
 * Krém alap, óriási Fraunces cím, hajszálvonalak, sok levegő. A hangsúly
 * a mondaton van, nem a felületen — „csendes magabiztosság".
 */
export function HeroD(props: HeroVariantProps) {
  const { locale, glyph, patternLabel } = props;
  return (
    <section className="border-y border-sand py-10 md:py-14">
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusBadge locale={locale} dark />
        <span className="text-micro font-semibold uppercase tracking-widest text-muted">
          {t("fakeDoor.eyebrow", locale)}
        </span>
      </div>
      <div className="mt-6 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="max-w-[15ch] font-fraunces text-fluid-display tracking-tight text-ink">
            {t("fakeDoor.heroTitle", locale)}
          </h1>
          <p className="mt-5 max-w-[38rem] text-[18px] leading-relaxed text-ink-body md:text-[20px]">
            {t("fakeDoor.heroLead", locale)}
          </p>
          <p className="mt-5 border-l-2 border-bronze pl-3 text-caption font-semibold text-bronze-dark">
            {t("fakeDoor.badgeNote", locale)}
          </p>
          {patternLabel && <p className="mt-3 text-caption text-muted">{patternLabel}</p>}
        </div>
        <Glyph
          {...props}
          className="hidden h-[132px] w-[132px] shrink-0 rounded-2xl border border-sand md:block"
        />
      </div>
      <span className="sr-only">{glyph.label}</span>
    </section>
  );
}

/**
 * E — „építkezés": a KÉSZÜLŐ állapot maga a vizuális főmotívum.
 * Finom rácsvonalak, szaggatott keret, elforgatott bélyegző. A mérés
 * szempontjából ez a legőszintébb: ránézésre látszik, hogy ez még terv.
 */
export function HeroE(props: HeroVariantProps) {
  const { locale, glyph, patternLabel } = props;
  return (
    <section
      className="relative overflow-hidden rounded-[28px] border-2 border-dashed px-6 py-9 md:px-10 md:py-12"
      style={{
        background: THEME.background,
        borderColor: "rgba(246,211,177,0.35)",
      }}
    >
      {/* Milliméterpapír-rács: tervrajz-hangulat, nagyon halkan. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px)",
        }}
      />
      <Glyph
        {...props}
        canvas={false}
        className="pointer-events-none absolute -bottom-14 -left-10 h-[320px] w-[320px] opacity-[0.10]"
      />

      {/* Bélyegző: elforgatva, keretben — a státusz nem apró jelzés, hanem
          az első dolog, amit a szem elkap. */}
      <span
        className="absolute right-4 top-6 rotate-[-8deg] rounded-lg border-2 px-3 py-1.5 text-micro font-bold uppercase tracking-widest md:right-8"
        style={{ borderColor: THEME.badgeText, color: THEME.badgeText }}
      >
        {t("fakeDoor.badge", locale)}
      </span>

      <div className="relative max-w-[40rem]">
        <span className="font-mono text-micro uppercase tracking-widest text-white/50">
          {t("fakeDoor.eyebrow", locale)}
        </span>
        <h1 className="mt-3 font-fraunces text-fluid-title tracking-tight text-white">
          {t("fakeDoor.heroTitle", locale)}
        </h1>
        <p className="mt-4 max-w-[36rem] text-[17px] leading-relaxed text-white/[0.72] md:text-[19px]">
          {t("fakeDoor.heroLead", locale)}
        </p>
        <p
          className="mt-5 inline-block border-t border-dashed pt-3 text-caption font-semibold"
          style={{ borderColor: "rgba(246,211,177,0.4)", color: THEME.badgeText }}
        >
          {t("fakeDoor.badgeNote", locale)}
        </p>
        {patternLabel && <p className="mt-2 text-caption text-white/50">{patternLabel}</p>}
      </div>
      <span className="sr-only">{glyph.label}</span>
    </section>
  );
}


/**
 * F/G — TERVLAP. Világos, papír-szerű felület: milliméterpapír-rács, sarok-
 * illesztőjelek, alul rajzszám-blokk, sarokban bélyegző.
 *
 * Miért működik ez a mérőoldalon: a „még nem kész" állapotot nem egy apró
 * címke mondja ki, hanem MAGA A FORMA. Aki ránéz, nem hiszi késznek — ez a
 * mérés tisztességének a vizuális megfelelője.
 *
 * Két színben, mindkettő a meglévő palettából: zsálya (a self-felület
 * színe) és pala kék (az org-felületé).
 */
function BlueprintHero({
  props,
  ink,
  paper,
  line,
  strong,
}: {
  props: HeroVariantProps;
  /** Akcentus: keret, bélyegző, rajzszám-blokk. */
  ink: string;
  /** Papír alapszín. */
  paper: string;
  /** Finom rácsvonal. */
  line: string;
  /** Erős (10-es) rácsvonal. */
  strong: string;
}) {
  const { locale, glyph, patternLabel } = props;
  const corner = "absolute h-3 w-3 opacity-60";
  return (
    <section
      className="relative overflow-hidden rounded-[20px] border px-6 py-8 md:px-10 md:py-11"
      style={{ background: paper, borderColor: ink, "--sheet-ink": ink } as React.CSSProperties}
    >
      {/* Milliméterpapír: finom rács + minden ötödik vonal erősebb. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 16px)`,
            `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 16px)`,
            `repeating-linear-gradient(0deg, ${strong} 0 1px, transparent 1px 80px)`,
            `repeating-linear-gradient(90deg, ${strong} 0 1px, transparent 1px 80px)`,
          ].join(","),
        }}
      />

      {/* Sarok-illesztőjelek — technikai rajz nyelvtan. */}
      {[
        "left-3 top-3",
        "right-3 top-3",
        "left-3 bottom-3",
        "right-3 bottom-3",
      ].map((position) => (
        <span key={position} aria-hidden className={`${corner} ${position}`}>
          <svg viewBox="0 0 12 12" fill="none" stroke={ink} strokeWidth="1">
            <path d="M6 0v12M0 6h12" />
          </svg>
        </span>
      ))}

      {/* A típus-ábra a lapra rajzolt tárgy: nagyon halkan, hogy a rács és a
          szöveg maradjon az első réteg. (Vonalas motívum-változatot is
          próbáltunk fölé — az a méretben hosszú vonalakká esett szét, és
          idegen vonalzó-nyomoknak látszott.) */}
      <Glyph
        {...props}
        canvas={false}
        className="pointer-events-none absolute -bottom-10 -right-8 h-[300px] w-[300px] opacity-[0.09] md:h-[380px] md:w-[380px]"
      />

      {/* Bélyegző: elforgatva, kettős kerettel — ez az első, amit a szem elkap. */}
      <span
        className="absolute right-5 top-6 rotate-[-7deg] rounded-md border-2 px-3 py-1.5 text-micro font-bold uppercase tracking-widest md:right-10"
        style={{ borderColor: ink, color: ink }}
      >
        {t("fakeDoor.badge", locale)}
      </span>

      <div className="relative max-w-[38rem]">
        <span className="font-mono text-micro uppercase tracking-widest" style={{ color: ink }}>
          {t("fakeDoor.eyebrow", locale)}
        </span>
        <h1 className="mt-3 max-w-[16ch] font-fraunces text-fluid-title tracking-tight text-ink">
          {t("fakeDoor.heroTitle", locale)}
        </h1>
        <p className="mt-4 max-w-[34rem] text-[17px] leading-relaxed text-ink-body md:text-[19px]">
          {t("fakeDoor.heroLead", locale)}
        </p>
        <p
          className="mt-5 inline-block border-t border-dashed pt-3 text-caption font-semibold"
          style={{ borderColor: ink, color: ink }}
        >
          {t("fakeDoor.badgeNote", locale)}
        </p>
        {patternLabel && <p className="mt-2 text-caption text-muted">{patternLabel}</p>}
      </div>

      {/* Rajzszám-blokk: műszaki rajzok sarok-táblája. Csak IGAZ adatot ír ki. */}
      <div
        className="relative mt-7 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 font-mono text-micro uppercase tracking-widest"
        style={{ borderColor: ink, color: ink }}
      >
        <span>Modul: {t("fakeDoor.eyebrow", locale)}</span>
        <span>Állapot: terv</span>
        <span>Döntés: mérés alatt</span>
      </div>
      <span className="sr-only">{glyph.label}</span>
    </section>
  );
}

/** F — tervlap zsályában (a self-felület színe). */
export function HeroF(props: HeroVariantProps) {
  return (
    <BlueprintHero
      props={props}
      ink="#3d6b5e"
      paper="#f2f7f5"
      line="rgba(61,107,94,0.10)"
      strong="rgba(61,107,94,0.20)"
    />
  );
}

/** G — tervlap pala kékben (az org-felület színe). */
export function HeroG(props: HeroVariantProps) {
  return (
    <BlueprintHero
      props={props}
      ink="#2f4863"
      paper="#f1f4f8"
      line="rgba(47,72,99,0.10)"
      strong="rgba(47,72,99,0.20)"
    />
  );
}

export const HERO_VARIANTS = [
  {
    id: "A",
    name: "Jelenlegi — agyag kártya",
    note: "Kontroll. Kártya, vízjel-ábra, tömör badge.",
    Component: HeroA,
  },
  {
    id: "B",
    name: "Címlap — teljes szélességű szalag",
    note: "Kifut a tartalomsávból, display-léptékű cím, élesen levágott ábra. A leghangosabb.",
    Component: HeroB,
  },
  {
    id: "C",
    name: "Osztott — szöveg + ábramező",
    note: "Az ábra teljes erővel, saját krém mezőben főszereplő. Kétszínű kontraszt.",
    Component: HeroC,
  },
  {
    id: "D",
    name: "Világos — tipográfia-vezérelt",
    note: "Nincs sötét tömb. Krém alap, óriási cím, sok levegő. Csendes magabiztosság.",
    Component: HeroD,
  },
  {
    id: "E",
    name: "Építkezés — sötét tervrajz + bélyegző",
    note: "A készülő állapot a főmotívum: rács, szaggatott keret, elforgatott bélyegző.",
    Component: HeroE,
  },
  {
    id: "F",
    name: "Tervlap — zsálya",
    note: "Világos milliméterpapír a self-felület zöldjében: illesztőjelek, bélyegző, rajzszám-blokk.",
    Component: HeroF,
  },
  {
    id: "G",
    name: "Tervlap — pala kék",
    note: "Ugyanaz az org-felület kékjében. Hűvösebb, technikaibb.",
    Component: HeroG,
  },
] as const;
