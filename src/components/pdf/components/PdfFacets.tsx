import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { getDimensionTier } from "@/lib/dimension-utils";

interface Facet {
  label: string;
  score: number;
}

interface Dim {
  name: string;
  value: number;
  insight?: string;
  description?: string;
  facets: Facet[];
}

export function PdfFacets({ dimensions, compact = false }: { dimensions: Dim[]; compact?: boolean }) {
  return (
    <View style={{ marginBottom: 6 }}>
      {dimensions.map((dim, idx) => {
        const tier = getDimensionTier(dim.value);
        const dotColor = tier === "high" ? colors.sage : tier === "mid" ? colors.bronze : colors.ink300;
        const isLast = idx === dimensions.length - 1;
        return (
          <View key={dim.name} wrap={false} style={{ marginBottom: isLast ? 0 : (compact ? 6 : 10), paddingBottom: isLast ? 0 : (compact ? 4 : 8), borderBottom: isLast ? undefined : `1 solid ${colors.cream500}` }}>
            {/* Dimension header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: compact ? 2 : 3 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dotColor }} />
              <Text style={{ fontFamily: "Fraunces", fontSize: compact ? 9 : 10, color: colors.ink }}>
                {dim.name} · {dim.value}%
              </Text>
            </View>

            {/* Short insight — hidden in compact mode to save space */}
            {!compact && dim.insight && (
              <Text style={{ fontSize: 7, fontWeight: 500, color: colors.ink, lineHeight: 1.35, marginBottom: 3 }}>
                {dim.insight}
              </Text>
            )}

            {/* Facet 2×2 grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
              {dim.facets.map((facet) => {
                const fTier = getDimensionTier(facet.score);
                const fColor = fTier === "high" ? colors.sage : fTier === "mid" ? colors.bronze : colors.ink300;
                return (
                  <View
                    key={facet.label}
                    style={{
                      width: "48%",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      padding: "4 6",
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
          </View>
        );
      })}
    </View>
  );
}
