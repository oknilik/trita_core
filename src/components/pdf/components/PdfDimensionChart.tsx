import { View, Text, Svg, Polygon, Line, Circle, Text as SvgText } from "@react-pdf/renderer";
import { colors } from "../styles";
import { getDimensionTier } from "@/lib/dimension-utils";
import { DIMENSION_COLORS, type DimCode } from "@/lib/color-system";

// Az élő riport radar-chartjának PDF-megfelelője: hatszög-háló a
// TRITAN-dimenziókkal + kompakt sávok. A dims tömb a kanonikus
// TRITAN-sorrendben érkezik (X · E · H · C · A · O).

interface Dim {
  name: string;
  shortName: string;
  value: number;
  /** Belső dimenziókód (H/E/…) — a kanonikus hue lookupjához. */
  code?: string;
}

const tierColor = (tier: string) =>
  tier === "high" ? colors.sage : tier === "mid" ? colors.bronze : colors.ink300;

// A sáv a dimenzió kanonikus STRONG színét kapja (print-en is ≥4.5 fehéren);
// kód híján (örökség-hívó) a tier-szín a fallback. A tier-jelölés (érték-
// szám színe) változatlanul sage/bronz/ink300.
const barColor = (code: string | undefined, tier: string) =>
  (code && DIMENSION_COLORS[code as DimCode]?.strong) || tierColor(tier);

function RadarSvg({ dims, size }: { dims: Dim[]; size: number }) {
  const n = dims.length || 6;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 15;

  const point = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPoints = (r: number) =>
    dims.map((_, i) => point(i, r).map((v) => v.toFixed(2)).join(",")).join(" ");
  const valuePoints = dims
    .map((d, i) => point(i, (R * Math.max(0, Math.min(100, d.value))) / 100).map((v) => v.toFixed(2)).join(","))
    .join(" ");

  return (
    <Svg width={size} height={size}>
      {/* Háló-gyűrűk */}
      <Polygon points={ringPoints(R)} fill={colors.cream} stroke={colors.sand} strokeWidth={0.8} />
      {[0.75, 0.5, 0.25].map((f) => (
        <Polygon key={f} points={ringPoints(R * f)} fill="none" stroke={colors.sand} strokeWidth={0.6} />
      ))}
      {/* Tengelyek */}
      {dims.map((_, i) => {
        const [x, y] = point(i, R);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={colors.sand} strokeWidth={0.6} />;
      })}
      {/* Érték-poligon */}
      <Polygon
        points={valuePoints}
        fill={colors.sage}
        fillOpacity={0.16}
        stroke={colors.sage}
        strokeWidth={1.2}
      />
      {/* Csúcspontok */}
      {dims.map((d, i) => {
        const [x, y] = point(i, (R * Math.max(0, Math.min(100, d.value))) / 100);
        return <Circle key={i} cx={x} cy={y} r={1.6} fill={colors.sage} />;
      })}
      {/* Tengely-címkék — a felület radarjának egybetűs HEXACO-jelei */}
      {dims.map((d, i) => {
        const [x, y] = point(i, R + 10);
        return (
          <SvgText
            key={i}
            x={x}
            y={y + 2.5}
            textAnchor="middle"
            fill={colors.ink500}
            style={{ fontFamily: "Fraunces", fontSize: 8, fontWeight: 600 }}
          >
            {d.shortName}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export function PdfDimensionChart({ dims }: { dims: Dim[] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
      {/* Radar — látványelem, az élő riporttal azonos */}
      <RadarSvg dims={dims} size={150} />

      {/* Kompakt sávok — dimenziónként érték + szint-szín */}
      <View style={{ flex: 1 }}>
        {dims.map((d) => {
          const tier = getDimensionTier(d.value);
          const tc = tierColor(tier);
          return (
            <View key={d.name} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <Text style={{ width: 62, fontSize: 6.5, color: colors.ink500 }}>{d.name}</Text>
              <View style={{ flex: 1, height: 3, backgroundColor: colors.cream300, borderRadius: 1.5 }}>
                <View style={{ width: `${Math.max(0, Math.min(100, d.value))}%`, height: 3, backgroundColor: barColor(d.code, tier), borderRadius: 1.5 }} />
              </View>
              <Text style={{ width: 16, fontFamily: "Fraunces", fontSize: 8, color: tc, textAlign: "right" }}>
                {d.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
