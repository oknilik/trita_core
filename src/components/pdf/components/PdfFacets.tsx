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

export function PdfFacets({ dimensions }: { dimensions: Dim[] }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {dimensions.map((dim) => {
        const tier = getDimensionTier(dim.value);
        const dotColor = tier === "high" ? colors.sage : tier === "mid" ? colors.bronze : colors.ink300;
        return (
          <View key={dim.name} style={{ marginBottom: 10 }}>
            {/* Dimension header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dotColor }} />
              <Text style={{ fontSize: 9, fontWeight: 600, color: colors.ink }}>
                {dim.name} · {dim.value}%
              </Text>
            </View>

            {/* Insight + description */}
            {dim.insight && (
              <Text style={{ fontSize: 7.5, fontWeight: 500, color: colors.ink, lineHeight: 1.35, marginBottom: 2 }}>
                {dim.insight}
              </Text>
            )}
            {dim.description && (
              <Text style={{ fontSize: 7, color: colors.ink300, lineHeight: 1.35, marginBottom: 4 }}>
                {dim.description}
              </Text>
            )}

            {/* Facet 2×2 grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
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
                      gap: 6,
                      padding: "5 7",
                      backgroundColor: colors.cream300,
                      border: `1 solid ${colors.cream500}`,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 7.5, color: colors.ink500 }}>{facet.label}</Text>
                    <View style={{ width: 45, height: 3, backgroundColor: colors.cream500, borderRadius: 2, overflow: "hidden" }}>
                      <View style={{ width: `${facet.score}%`, height: 3, backgroundColor: fColor, borderRadius: 2 }} />
                    </View>
                    <Text style={{ width: 18, textAlign: "right", fontSize: 7, fontWeight: 600, color: fColor }}>
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
