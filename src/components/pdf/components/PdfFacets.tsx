import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { dimColors } from "@/lib/color-system";
import { t } from "@/lib/i18n";

interface Facet {
  label: string;
  score: number;
}

interface Dim {
  name: string;
  value: number;
  insight?: string;
  description?: string;
  /** Dimenziókód — a dimenzió és a facetjei az identitás-hue-t viselik. */
  code?: string;
  facets: Facet[];
}

export function PdfFacets({ dimensions, compact = false, locale = "hu" }: { dimensions: Dim[]; compact?: boolean; locale?: "hu" | "en" }) {
  return (
    <View style={{ marginBottom: 6 }}>
      {dimensions.map((dim, idx) => {
        const dc = dimColors(dim.code ?? "");
        const dotColor = dc.base;
        const isLast = idx === dimensions.length - 1;
        return (
          <View key={dim.name} wrap={false} style={{ marginBottom: isLast ? 0 : (compact ? 4 : 10), paddingBottom: isLast ? 0 : (compact ? 3 : 8), borderBottom: isLast ? undefined : `1 solid ${colors.cream500}` }}>
            {/* Dimension header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: compact ? 2 : 3 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dotColor }} />
              <Text style={{ fontFamily: "Fraunces", fontSize: compact ? 9 : 10, color: colors.ink }}>
                {dim.name} · {dim.value}%
              </Text>
            </View>

            {/* Short insight — hidden in compact mode to save space */}
            {!compact && dim.insight && (
              <Text style={{ fontSize: 7.5, fontWeight: 500, color: colors.ink, lineHeight: 1.35, marginBottom: 3 }}>
                {dim.insight}
              </Text>
            )}

            {/* Facet 2×2 grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
              {/* A facet a saját dimenziójának hue-ját viseli. */}
              {dim.facets.map((facet) => {
                const fColor = dc.strong;
                return (
                  <View
                    key={facet.label}
                    style={{
                      width: "48%",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      padding: "3 6",
                      backgroundColor: colors.cream300,
                      border: `1 solid ${colors.cream500}`,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 6.5, color: colors.ink500 }}>{facet.label}</Text>
                    <View style={{ width: 40, height: 2.5, backgroundColor: colors.cream500, borderRadius: 1, overflow: "hidden" }}>
                      <View style={{ width: `${facet.score}%`, height: 2.5, backgroundColor: fColor, borderRadius: 1 }} />
                    </View>
                    <Text style={{ width: 16, textAlign: "right", fontSize: 6.5, fontWeight: 600, color: fColor }}>
                      {facet.score}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* „So what?" sor (P5.4): kompakt módban a számok alá kerül a
                gyakorlati jelentés — az adatlap-jelleg oldása */}
            {compact && dim.insight ? (
              <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4, marginTop: 3 }}>
                <Text style={{ fontWeight: 600, color: colors.ink }}>{t("pdf.facetSoWhat", locale)} </Text>
                {dim.insight}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
