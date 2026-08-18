import { View, Text, Svg, Polygon, Line, Circle, Text as SvgText } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { dimColors } from "@/lib/color-system";
import { poleAwareDimensionLabel } from "@/lib/profile-content";
import type { ReportDimensionView } from "@/lib/profile-report-view-model";

// Az élő riport radar-chartjának PDF-megfelelője: hatszög-háló a hat
// dimenzióval, a kanonikus HEXACO-sorrendben (H · E · X · A · C · O).
//
// SZÍN = IDENTITÁS (2026-08-11): a sáv és az érték-szám a dimenzió kanonikus
// hue-ját viseli; a korábbi tier-rámpa értékelést vitt egy leíró skálára.

export function PdfRadarChart({ dims, size = 190 }: { dims: ReportDimensionView[]; size?: number }) {
  const n = dims.length || 6;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 18;

  const point = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPoints = (r: number) =>
    dims.map((_, i) => point(i, r).map((v) => v.toFixed(2)).join(",")).join(" ");
  const valuePoints = dims
    .map((d, i) =>
      point(i, (R * Math.max(0, Math.min(100, d.value))) / 100)
        .map((v) => v.toFixed(2))
        .join(","),
    )
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
      <Polygon points={valuePoints} fill={colors.sage} fillOpacity={0.16} stroke={colors.sage} strokeWidth={1.4} />
      {/* Csúcspontok */}
      {dims.map((d, i) => {
        const [x, y] = point(i, (R * Math.max(0, Math.min(100, d.value))) / 100);
        return <Circle key={i} cx={x} cy={y} r={1.8} fill={colors.sage} />;
      })}
      {/* Tengely-címkék — a felület radarjának egybetűs HEXACO-jelei */}
      {dims.map((d, i) => {
        const [x, y] = point(i, R + 11);
        return (
          <SvgText
            key={i}
            x={x}
            y={y + 3}
            textAnchor="middle"
            fill={colors.ink500}
            style={{ fontFamily: "Fraunces", fontSize: 9, fontWeight: 600 }}
          >
            {d.shortName}
          </SvgText>
        );
      })}
    </Svg>
  );
}

/**
 * A radar melletti soros lista — a webes áttekintő fejezet 1:1 párja:
 * dimenziónév · pólus-tudatos szint-badge · pontszám · sáv.
 */
export function PdfDimensionList({
  dims,
  locale = "hu",
}: {
  dims: ReportDimensionView[];
  locale?: "hu" | "en";
}) {
  return (
    <View style={{ flexDirection: "column", gap: 9 }}>
      {dims.map((d) => {
        const dc = dimColors(d.code);
        return (
          <View key={d.code}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: dc.base }} />
              <Text style={{ flex: 1, fontSize: type.cardTitle, fontWeight: 500, color: colors.ink }}>
                {d.name}
              </Text>
              <Text
                style={{
                  fontSize: type.caption,
                  fontWeight: 600,
                  backgroundColor: dc.soft,
                  color: dc.strong,
                  padding: "2 6",
                  borderRadius: 3,
                }}
              >
                {poleAwareDimensionLabel(d.code, d.value, locale)}
              </Text>
              <Text
                style={{
                  width: 22,
                  textAlign: "right",
                  fontFamily: "Fraunces",
                  fontSize: type.subhead,
                  color: dc.strong,
                }}
              >
                {d.value}
              </Text>
            </View>
            <View
              style={{
                marginLeft: 11,
                marginTop: 4,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: colors.cream500,
              }}
            >
              <View
                style={{
                  width: `${Math.max(0, Math.min(100, d.value))}%`,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: dc.base,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
