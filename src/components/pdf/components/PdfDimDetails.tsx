import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { getDimensionTier } from "@/lib/dimension-utils";

interface Dim {
  name: string;
  value: number;
  description: string;
}

interface PdfDimDetailsProps {
  dimensions: Dim[];
  previewOnly?: boolean;
  hasPlus?: boolean;
}

export function PdfDimDetails({ dimensions, previewOnly = false, hasPlus = false }: PdfDimDetailsProps) {
  const sorted = [...dimensions].sort((a, b) => b.value - a.value);
  const displayed = previewOnly ? sorted.slice(0, 3) : dimensions;
  const rest = previewOnly ? dimensions.length - 3 : 0;

  return (
    <View style={{ marginBottom: 6 }}>
      {displayed.map((dim) => {
        const tier = getDimensionTier(dim.value);
        const dotColor = tier === "high" ? colors.sage : tier === "mid" ? colors.bronze : colors.ink300;
        return (
          <View
            key={dim.name}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 4,
              padding: "4 6",
              borderRadius: 4,
              backgroundColor: colors.cream300,
              marginBottom: 2,
            }}
          >
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dotColor, marginTop: 3 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, fontWeight: 500, color: colors.ink }}>
                {dim.name} · {dim.value}%
              </Text>
              <Text style={{ fontSize: 6, color: colors.ink300, lineHeight: 1.35, marginTop: 1 }}>
                {dim.description}
              </Text>
            </View>
          </View>
        );
      })}
      {rest > 0 && (
        <Text style={{ fontSize: 6.5, color: colors.sage, marginTop: 2, fontWeight: 500 }}>
          + {rest} további dimenzió → {hasPlus ? "lásd 2. oldal" : "Self Plus csomagban"}
        </Text>
      )}
    </View>
  );
}
