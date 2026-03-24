import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfInsightPairProps {
  strengths: string[];
  watchAreas: string[];
  locale?: string;
}

export function PdfInsightPair({ strengths, watchAreas, locale = "hu" }: PdfInsightPairProps) {
  const isHu = locale === "hu";

  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
      <View style={{ flex: 1, backgroundColor: colors.sage100, borderRadius: 6, padding: "8 10", border: `1 solid rgba(61,107,94,0.1)` }}>
        <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, color: colors.sageDark, marginBottom: 4 }}>
          {isHu ? "Erősségeid" : "Your strengths"}
        </Text>
        {strengths.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 4, marginBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, color: colors.sage }}>•</Text>
            <Text style={{ fontSize: 7.5, color: colors.ink500, lineHeight: 1.4 }}>{s}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1, backgroundColor: colors.bronze100, borderRadius: 6, padding: "8 10", border: `1 solid rgba(193,127,74,0.1)` }}>
        <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, color: colors.bronzeDark, marginBottom: 4 }}>
          {isHu ? "Figyelendő" : "Watch areas"}
        </Text>
        {watchAreas.map((w, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 4, marginBottom: 2.5 }}>
            <Text style={{ fontSize: 7.5, color: colors.bronze }}>•</Text>
            <Text style={{ fontSize: 7.5, color: colors.ink500, lineHeight: 1.4 }}>{w}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
