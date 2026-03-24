import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { getDimensionTier, getDimensionLabel } from "@/lib/dimension-utils";

interface Dim {
  name: string;
  shortName: string;
  value: number;
}

const tierColor = (tier: string) =>
  tier === "high" ? colors.sage : tier === "mid" ? colors.bronze : colors.ink300;
const tierBg = (tier: string) =>
  tier === "high" ? colors.sage100 : tier === "mid" ? colors.bronze100 : colors.cream300;

export function PdfDimStrip({ dimensions }: { dimensions: Dim[] }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 14, border: `1 solid ${colors.cream500}`, borderRadius: 4 }}>
      {dimensions.map((dim, i) => {
        const tier = getDimensionTier(dim.value);
        const tc = tierColor(tier);
        return (
          <View
            key={dim.name}
            style={{
              flex: 1,
              padding: "8 6",
              alignItems: "center",
              borderRight: i < dimensions.length - 1 ? `1 solid ${colors.cream500}` : undefined,
            }}
          >
            <Text style={{ fontSize: 6.5, color: colors.ink300, marginBottom: 3 }}>{dim.shortName}</Text>
            <Text style={{ fontFamily: "Fraunces", fontSize: 16, color: tc, marginBottom: 3 }}>{dim.value}</Text>
            <Text
              style={{
                fontSize: 5.5,
                fontWeight: 600,
                backgroundColor: tierBg(tier),
                color: tc,
                padding: "1.5 4",
                borderRadius: 2,
                marginBottom: 3,
              }}
            >
              {getDimensionLabel(dim.value, "hu")}
            </Text>
            <View style={{ width: "80%", height: 2, backgroundColor: colors.cream500, borderRadius: 1 }}>
              <View
                style={{
                  width: `${dim.value}%`,
                  height: 2,
                  backgroundColor: tc,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
