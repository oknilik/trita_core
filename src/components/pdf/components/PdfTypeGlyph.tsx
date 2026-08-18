import { Svg, G, Path, Circle, Line, Rect } from "@react-pdf/renderer";
import {
  DIMENSION_GLYPHS,
  FORM_GEOMETRY,
  GLYPH_CANVAS,
  GLYPH_COLORS,
  accompaniment,
  intensityStyle,
  type GlyphMotifId,
} from "@/lib/type-glyph";

// ─────────────────────────────────────────────────────────────────────────────
// Típus-ábra PDF-ben — a webes TypeGlyph (components/type/TypeGlyph.tsx)
// react-pdf-kompatibilis párja. UGYANAZ a geometria (FORM_GEOMETRY,
// DIMENSION_GLYPHS, accompaniment) — a nyelvtan a lib-ben él, itt csak a
// renderelő különbözik: a react-pdf Svg nem tud CSS-változót, és a DOM-SVG
// kisbetűs elemeit sem ismeri.
//
// A borító eddig üres sötét-sage felület volt: a riport „arca" nem hordozta
// azt a karakterábrát, amit a felhasználó a képernyőn és a megosztó-kártyán
// lát (PDF-audit 2026-08-18, P1/13).
// ─────────────────────────────────────────────────────────────────────────────

interface PdfTypeGlyphProps {
  primaryCode: string;
  secondaryCode: string;
  /** 1–5 — a domináns dimenzió erőssége (intensityFromScore). */
  intensity?: number;
  /** Rajzolt méret pt-ban (négyzetes kivágás). */
  size?: number;
  /** Sötét felületen (borító) a tinta-vonalak világosra váltanak. */
  lineColor?: string;
  formColor?: string;
  /** Krém alaplap — sötét borítón kikapcsolva, hogy a forma beleolvadjon. */
  canvas?: boolean;
  /** Kísérőelemek (csillag, nap, ellensúly, talajvonal). */
  accompanimentVisible?: boolean;
}

function MotifElements({
  motif,
  anchor,
  strokeWidth,
  scale,
  stroke,
}: {
  motif: GlyphMotifId;
  anchor: { x: number; y: number };
  strokeWidth: number;
  scale: number;
  stroke: string;
}) {
  const common = {
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const s = (value: number) => value * scale;

  switch (motif) {
    case "scales":
      return (
        <G>
          <Line {...common} x1={anchor.x} y1={anchor.y - s(30)} x2={anchor.x} y2={anchor.y + s(10)} />
          <Line {...common} x1={anchor.x - s(36)} y1={anchor.y - s(20)} x2={anchor.x + s(36)} y2={anchor.y - s(20)} />
          <Line {...common} x1={anchor.x - s(36)} y1={anchor.y + s(6)} x2={anchor.x - s(14)} y2={anchor.y + s(6)} />
          <Line {...common} x1={anchor.x + s(14)} y1={anchor.y + s(6)} x2={anchor.x + s(36)} y2={anchor.y + s(6)} />
        </G>
      );
    case "resonance":
      return (
        <G>
          {[16, 28, 40].map((r) => (
            <Path
              key={r}
              {...common}
              d={`M ${anchor.x - s(r)} ${anchor.y + s(12)} A ${s(r)} ${s(r)} 0 0 1 ${anchor.x + s(r)} ${anchor.y + s(12)}`}
            />
          ))}
        </G>
      );
    case "bolt":
      return (
        <G>
          <Path
            {...common}
            d={`M ${anchor.x - s(32)} ${anchor.y + s(40)} L ${anchor.x - s(6)} ${anchor.y - s(4)} L ${anchor.x + s(2)} ${anchor.y + s(14)} L ${anchor.x + s(34)} ${anchor.y - s(40)}`}
          />
        </G>
      );
    case "rings":
      return (
        <G>
          <Circle {...common} cx={anchor.x - s(15)} cy={anchor.y} r={s(18)} />
          <Circle {...common} cx={anchor.x + s(15)} cy={anchor.y} r={s(18)} />
        </G>
      );
    case "rungs":
      return (
        <G>
          {[-26, 0, 26].map((dy) => (
            <Line
              key={dy}
              {...common}
              x1={anchor.x - s(36)}
              y1={anchor.y + s(dy)}
              x2={anchor.x + s(36)}
              y2={anchor.y + s(dy)}
            />
          ))}
        </G>
      );
    case "spiral":
      return (
        <G>
          <Path
            {...common}
            d={`M ${anchor.x - s(8)} ${anchor.y} a ${s(8)},${s(8)} 0 0 1 ${s(16)},0 a ${s(16)},${s(16)} 0 0 1 ${-s(32)},0 a ${s(24)},${s(24)} 0 0 1 ${s(48)},0 a ${s(32)},${s(32)} 0 0 1 ${-s(64)},0 a ${s(40)},${s(40)} 0 0 1 ${s(80)},0`}
          />
        </G>
      );
    default:
      return null;
  }
}

export function PdfTypeGlyph({
  primaryCode,
  secondaryCode,
  intensity = 3,
  size = 190,
  lineColor = GLYPH_COLORS.line,
  formColor = GLYPH_COLORS.form,
  canvas = false,
  accompanimentVisible = true,
}: PdfTypeGlyphProps) {
  const primary = DIMENSION_GLYPHS[primaryCode];
  const secondary = DIMENSION_GLYPHS[secondaryCode];
  if (!primary || !secondary) return null;

  const geometry = FORM_GEOMETRY[primary.form];
  const formScale = geometry.motifScale ?? 1;
  const style = intensityStyle(intensity);
  const isPure = primaryCode === secondaryCode;
  const parts = accompaniment(primaryCode, secondaryCode);

  // A webes "card" kivágás — a talajvonalat tartalmazza, a felirat sávját nem.
  const viewBox = "96 118 616 682";
  const formFill = style.formFill === "none" ? "none" : formColor;
  const strokeProps = style.formStroke
    ? { stroke: formColor, strokeWidth: style.formStrokeWidth }
    : {};

  return (
    <Svg width={size} height={size * (682 / 616)} viewBox={viewBox}>
      {canvas ? (
        <Rect x={0} y={0} width={GLYPH_CANVAS.width} height={GLYPH_CANVAS.height} fill={GLYPH_COLORS.canvas} />
      ) : null}

      {accompanimentVisible ? (
        <G>
          {/* Miró-csillag */}
          <Line stroke={lineColor} strokeWidth={5} strokeLinecap="round" x1={parts.star.x - 55} y1={parts.star.y} x2={parts.star.x + 55} y2={parts.star.y} />
          <Line stroke={lineColor} strokeWidth={5} strokeLinecap="round" x1={parts.star.x} y1={parts.star.y - 55} x2={parts.star.x} y2={parts.star.y + 55} />
          <Line stroke={lineColor} strokeWidth={5} strokeLinecap="round" x1={parts.star.x - 39} y1={parts.star.y - 39} x2={parts.star.x + 39} y2={parts.star.y + 39} />
          <Line stroke={lineColor} strokeWidth={5} strokeLinecap="round" x1={parts.star.x + 39} y1={parts.star.y - 39} x2={parts.star.x - 39} y2={parts.star.y + 39} />
          {/* Nap */}
          <Circle cx={parts.sun.x} cy={parts.sun.y} r={parts.sun.r} fill={GLYPH_COLORS.sun} />
        </G>
      ) : null}

      {/* Alapforma — a domináns dimenzió */}
      {geometry.path ? (
        <Path
          d={geometry.path}
          fill={formFill}
          fillOpacity={formFill === "none" ? undefined : style.formFillOpacity}
          {...strokeProps}
        />
      ) : null}
      {geometry.discs?.map((disc) => (
        <Circle
          key={`${disc.cx}-${disc.cy}-${disc.r}`}
          cx={disc.cx}
          cy={disc.cy}
          r={disc.r}
          fill={formFill}
          fillOpacity={formFill === "none" ? undefined : style.formFillOpacity}
          {...strokeProps}
        />
      ))}

      {/* Karakter-akcentus (formához kötött) */}
      {geometry.accent.kind === "ring" ? (
        <G>
          <Circle cx={geometry.accent.x} cy={geometry.accent.y} r={geometry.accent.r} fill="none" stroke={lineColor} strokeWidth={10} />
          <Circle cx={geometry.accent.x} cy={geometry.accent.y} r={8} fill={formColor} />
        </G>
      ) : (
        <Circle
          cx={geometry.accent.x}
          cy={geometry.accent.y}
          r={geometry.accent.r}
          fill={geometry.accent.color === "form" ? formColor : lineColor}
        />
      )}

      {/* Vonalmotívum — a második legerősebb dimenzió; tiszta típusnál duplázva. */}
      {isPure ? (
        <G>
          <MotifElements
            motif={secondary.motif}
            anchor={{ x: geometry.anchor.x, y: geometry.anchor.y - 42 * formScale }}
            strokeWidth={style.motifStrokeWidth + 1}
            scale={0.68 * formScale}
            stroke={lineColor}
          />
          <MotifElements
            motif={secondary.motif}
            anchor={{ x: geometry.anchor.x, y: geometry.anchor.y + 42 * formScale }}
            strokeWidth={style.motifStrokeWidth + 1}
            scale={0.68 * formScale}
            stroke={lineColor}
          />
        </G>
      ) : (
        <MotifElements
          motif={secondary.motif}
          anchor={geometry.anchor}
          strokeWidth={style.motifStrokeWidth}
          scale={formScale}
          stroke={lineColor}
        />
      )}

      {/* Ellensúly + talajvonal */}
      {accompanimentVisible ? (
        <G>
          <Circle cx={parts.counterweight.x} cy={parts.counterweight.y} r={parts.counterweight.r} fill={GLYPH_COLORS.counterweight} />
          <Path d={parts.ground} fill="none" stroke={lineColor} strokeWidth={4} strokeLinecap="round" />
        </G>
      ) : null}

      {/* Intenzitás 5: extra szikra-akcentus */}
      {style.extraSparks ? (
        <G>
          <Circle cx={geometry.anchor.x + 118} cy={geometry.anchor.y - 96} r={7} fill={formColor} />
          <Circle cx={geometry.anchor.x + 146} cy={geometry.anchor.y - 132} r={4.5} fill={lineColor} />
        </G>
      ) : null}
    </Svg>
  );
}
