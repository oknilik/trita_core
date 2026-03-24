import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { getDimensionTier } from "@/lib/dimension-utils";

interface Dim {
  name: string;
  value: number;
  description: string;
}

export function PdfDimDetails({ dimensions }: { dimensions: Dim[] }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {dimensions.map((dim) => {
        const tier = getDimensionTier(dim.value);
        const dotColor = tier === "high" ? colors.sage : tier === "mid" ? colors.bronze : colors.ink300;
        return (
          <View
            key={dim.name}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 5,
              padding: "5 7",
              borderRadius: 4,
              backgroundColor: colors.cream300,
              marginBottom: 3,
            }}
          >
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dotColor, marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8.5, fontWeight: 500, color: colors.ink }}>
                {dim.name} · {dim.value}%
              </Text>
              <Text style={{ fontSize: 7.5, color: colors.ink300, lineHeight: 1.35, marginTop: 1 }}>
                {dim.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
