import {
  DIMENSION_GLYPHS,
  FORM_GEOMETRY,
  GLYPH_CANVAS,
  GLYPH_COLORS_CSS,
  accompaniment,
  glyphDescription,
  intensityStyle,
  type GlyphMotifId,
} from "@/lib/type-glyph";

// ─────────────────────────────────────────────────────────────────────
// Típus-ábra (Miró-nyelvtan, trita paletta) — ld. src/lib/type-glyph.ts.
//
//   nagy bronz alapforma = DOMINÁNS dimenzió (ki vagy)
//   vékony tinta-motívum = MÁSODIK legerősebb dimenzió (hogyan)
//   egyező pár („tiszta" típus) = a motívum duplázva, felerősítve
//
// Állandó kísérőelemek adják a családi azonosságot: tinta-csillag, nap,
// egyetlen sage ellensúlypont, vándorló talajvonal. Pozíciójuk a
// típus-párból determinisztikus (accompaniment()).
//
// Nincs kliens-állapot — szerver-komponensben és kliensben is renderel.
// ─────────────────────────────────────────────────────────────────────

type GlyphVariant = "hero" | "card" | "badge";

const VIEWBOX: Record<GlyphVariant, string> = {
  hero: `0 0 ${GLYPH_CANVAS.width} ${GLYPH_CANVAS.height}`,
  // A card-kivágás a talajvonalat is tartalmazza (családi elem), a felirat
  // sávját nem – a nevet a körülvevő UI adja.
  card: "96 118 616 682",
  badge: "296 246 348 348",
};

interface TypeGlyphProps {
  /** Domináns dimenzió belső kódja (H/E/X/A/C/O). */
  primaryCode: string;
  /** Második legerősebb dimenzió kódja. Egyezés = „tiszta" típus. */
  secondaryCode: string;
  /** A típus neve – feliratként (hero) és aria-labelben. */
  typeLabel: string;
  /** Alcím a hero-változatban, pl. „Extraverzió × Nyitottság”. */
  dimensionLabel?: string;
  locale?: "hu" | "en";
  /** 1–5; a domináns dimenzió erőssége (intensityFromScore()). */
  intensity?: number;
  /**
   * S3-hedge: a másodlagos dimenzió megnevezése bizonytalan
   * (personality-type.isSecondaryUncertain) – az aria-label ilyenkor
   * rendezetlen párként írja le a két dimenziót, erősorrend-állítás nélkül
   * (a látható tábla/címke ugyanígy degradál).
   */
  secondaryUncertain?: boolean;
  variant?: GlyphVariant;
  /**
   * Kitöltött krém alaplap. Alapból igen (kártya-szerű ábra); ha a
   * befoglaló felületnek saját háttere van, false-szal a forma beleolvad
   * – így nem lesz „doboz a dobozban" hatás.
   */
  canvas?: boolean;
  className?: string;
}

function motifElements(
  motif: GlyphMotifId,
  anchor: { x: number; y: number },
  strokeWidth: number,
  scale: number,
  opacity: number,
): React.ReactNode {
  const stroke = GLYPH_COLORS_CSS.line;
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity,
  };
  const s = (value: number) => value * scale;

  switch (motif) {
    case "scales":
      return (
        <g {...common}>
          <line x1={anchor.x} y1={anchor.y - s(30)} x2={anchor.x} y2={anchor.y + s(10)} />
          <line
            x1={anchor.x - s(36)}
            y1={anchor.y - s(20)}
            x2={anchor.x + s(36)}
            y2={anchor.y - s(20)}
          />
          <line
            x1={anchor.x - s(36)}
            y1={anchor.y + s(6)}
            x2={anchor.x - s(14)}
            y2={anchor.y + s(6)}
          />
          <line
            x1={anchor.x + s(14)}
            y1={anchor.y + s(6)}
            x2={anchor.x + s(36)}
            y2={anchor.y + s(6)}
          />
        </g>
      );
    case "resonance":
      return (
        <g {...common}>
          {[16, 28, 40].map((r) => (
            <path
              key={r}
              d={`M ${anchor.x - s(r)} ${anchor.y + s(12)} A ${s(r)} ${s(r)} 0 0 1 ${anchor.x + s(r)} ${anchor.y + s(12)}`}
            />
          ))}
        </g>
      );
    case "bolt":
      return (
        <g {...common}>
          <path
            d={`M ${anchor.x - s(32)} ${anchor.y + s(40)} L ${anchor.x - s(6)} ${anchor.y - s(4)} L ${anchor.x + s(2)} ${anchor.y + s(14)} L ${anchor.x + s(34)} ${anchor.y - s(40)}`}
          />
        </g>
      );
    case "rings":
      return (
        <g {...common}>
          <circle cx={anchor.x - s(15)} cy={anchor.y} r={s(18)} />
          <circle cx={anchor.x + s(15)} cy={anchor.y} r={s(18)} />
        </g>
      );
    case "rungs":
      return (
        <g {...common}>
          {[-26, 0, 26].map((dy) => (
            <line
              key={dy}
              x1={anchor.x - s(36)}
              y1={anchor.y + s(dy)}
              x2={anchor.x + s(36)}
              y2={anchor.y + s(dy)}
            />
          ))}
        </g>
      );
    case "spiral":
      return (
        <g {...common}>
          <path
            d={`M ${anchor.x - s(8)} ${anchor.y} a ${s(8)},${s(8)} 0 0 1 ${s(16)},0 a ${s(16)},${s(16)} 0 0 1 ${-s(32)},0 a ${s(24)},${s(24)} 0 0 1 ${s(48)},0 a ${s(32)},${s(32)} 0 0 1 ${-s(64)},0 a ${s(40)},${s(40)} 0 0 1 ${s(80)},0`}
          />
        </g>
      );
  }
}

/**
 * Csak a vonalmotívum, átlátszó alapon – legendához, szövegközi
 * jelöléshez, dimenzió-fejlécekhez. A motívum a MÁSODLAGOS dimenziót
 * jelöli a nyelvtanban.
 */
export function TypeMotifMark({
  code,
  strokeWidth = 5.5,
  className,
  title,
}: {
  code: string;
  strokeWidth?: number;
  className?: string;
  title?: string;
}) {
  const dimension = DIMENSION_GLYPHS[code];
  if (!dimension) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={title ?? dimension.motifName.hu}
    >
      {motifElements(dimension.motif, { x: 60, y: 60 }, strokeWidth, 1, 1)}
    </svg>
  );
}

export function TypeGlyph({
  primaryCode,
  secondaryCode,
  typeLabel,
  dimensionLabel,
  locale = "hu",
  intensity = 3,
  secondaryUncertain = false,
  variant = "card",
  canvas = true,
  className,
}: TypeGlyphProps) {
  const primary = DIMENSION_GLYPHS[primaryCode];
  const secondary = DIMENSION_GLYPHS[secondaryCode];
  if (!primary || !secondary) return null;

  const geometry = FORM_GEOMETRY[primary.form];
  const formScale = geometry.motifScale ?? 1;
  const style = intensityStyle(intensity);
  const isPure = primaryCode === secondaryCode;
  const parts = accompaniment(primaryCode, secondaryCode);
  const showAccompaniment = variant !== "badge";
  const showCaption = variant === "hero";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEWBOX[variant]}
      className={className}
      role="img"
      aria-label={glyphDescription(
        primaryCode,
        secondaryCode,
        typeLabel,
        locale,
        secondaryUncertain,
      )}
    >
      {canvas && (
        <rect
          x="0"
          y="0"
          width={GLYPH_CANVAS.width}
          height={GLYPH_CANVAS.height}
          fill={GLYPH_COLORS_CSS.canvas}
        />
      )}

      {showAccompaniment && (
        <>
          {/* Miró-csillag */}
          <g
            stroke={GLYPH_COLORS_CSS.line}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.9}
          >
            <line x1={parts.star.x - 55} y1={parts.star.y} x2={parts.star.x + 55} y2={parts.star.y} />
            <line x1={parts.star.x} y1={parts.star.y - 55} x2={parts.star.x} y2={parts.star.y + 55} />
            <line
              x1={parts.star.x - 39}
              y1={parts.star.y - 39}
              x2={parts.star.x + 39}
              y2={parts.star.y + 39}
            />
            <line
              x1={parts.star.x + 39}
              y1={parts.star.y - 39}
              x2={parts.star.x - 39}
              y2={parts.star.y + 39}
            />
          </g>
          {/* Nap */}
          <circle cx={parts.sun.x} cy={parts.sun.y} r={parts.sun.r} fill={GLYPH_COLORS_CSS.sun} />
        </>
      )}

      {/* Alapforma – a domináns dimenzió */}
      {geometry.path && (
        <path
          d={geometry.path}
          fill={style.formFill}
          fillOpacity={style.formFill === "none" ? undefined : style.formFillOpacity}
          stroke={style.formStroke ?? undefined}
          strokeWidth={style.formStroke ? style.formStrokeWidth : undefined}
        />
      )}
      {geometry.discs?.map((disc) => (
        <circle
          key={`${disc.cx}-${disc.cy}-${disc.r}`}
          cx={disc.cx}
          cy={disc.cy}
          r={disc.r}
          fill={style.formFill}
          fillOpacity={style.formFill === "none" ? undefined : style.formFillOpacity}
          stroke={style.formStroke ?? undefined}
          strokeWidth={style.formStroke ? style.formStrokeWidth : undefined}
        />
      ))}

      {/* Karakter-akcentus (formához kötött) */}
      {geometry.accent.kind === "ring" ? (
        <>
          <circle
            cx={geometry.accent.x}
            cy={geometry.accent.y}
            r={geometry.accent.r}
            fill="none"
            stroke={GLYPH_COLORS_CSS.line}
            strokeWidth={10}
          />
          <circle cx={geometry.accent.x} cy={geometry.accent.y} r={8} fill={GLYPH_COLORS_CSS.form} />
        </>
      ) : (
        <circle
          cx={geometry.accent.x}
          cy={geometry.accent.y}
          r={geometry.accent.r}
          fill={geometry.accent.color === "form" ? GLYPH_COLORS_CSS.form : GLYPH_COLORS_CSS.line}
        />
      )}

      {/* Vonalmotívum – a második legerősebb dimenzió.
          Tiszta típusnál (domináns = második) a motívum duplázva és
          felerősítve jelenik meg: két kisebb példány egymás alatt,
          vastagabb vonallal. */}
      {isPure ? (
        <>
          {motifElements(
            secondary.motif,
            { x: geometry.anchor.x, y: geometry.anchor.y - 42 * formScale },
            style.motifStrokeWidth + 1,
            0.68 * formScale,
            1,
          )}
          {motifElements(
            secondary.motif,
            { x: geometry.anchor.x, y: geometry.anchor.y + 42 * formScale },
            style.motifStrokeWidth + 1,
            0.68 * formScale,
            1,
          )}
        </>
      ) : (
        motifElements(secondary.motif, geometry.anchor, style.motifStrokeWidth, formScale, 1)
      )}

      {/* Ellensúly + talajvonal */}
      {showAccompaniment && (
        <>
          <circle
            cx={parts.counterweight.x}
            cy={parts.counterweight.y}
            r={parts.counterweight.r}
            fill={GLYPH_COLORS_CSS.counterweight}
          />
          <path
            d={parts.ground}
            fill="none"
            stroke={GLYPH_COLORS_CSS.line}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </>
      )}

      {/* Intenzitás 5: extra szikra-akcentus */}
      {style.extraSparks && (
        <>
          <circle cx={geometry.anchor.x + 118} cy={geometry.anchor.y - 96} r={7} fill={GLYPH_COLORS_CSS.form} />
          <circle cx={geometry.anchor.x + 146} cy={geometry.anchor.y - 132} r={4.5} fill={GLYPH_COLORS_CSS.line} />
        </>
      )}

      {showCaption && (
        <>
          <text
            x="112"
            y="834"
            fontFamily="Fraunces, Georgia, 'Times New Roman', serif"
            fontSize="21"
            letterSpacing="5"
            fill={GLYPH_COLORS_CSS.caption}
          >
            {typeLabel.toUpperCase()}
          </text>
          {dimensionLabel && (
            <text
              x="112"
              y="862"
              fontFamily="Fraunces, Georgia, 'Times New Roman', serif"
              fontSize="15"
              fontStyle="italic"
              fill={GLYPH_COLORS_CSS.captionAccent}
            >
              {dimensionLabel}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
