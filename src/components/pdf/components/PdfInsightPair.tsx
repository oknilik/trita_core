import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfInsightPairProps {
  strengths: string;
  watchAreas: string;
}

export function PdfInsightPair({ strengths, watchAreas }: PdfInsightPairProps) {
  return (
    <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
      <View style={{ flex: 1, backgroundColor: colors.sage100, borderRadius: 5, padding: "8 10", border: `1 solid rgba(61,107,94,0.15)` }}>
        <Text style={{ fontSize: 6, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, color: colors.sageDark, marginBottom: 3 }}>
          Erősségeid
        </Text>
        <Text style={{ fontSize: 8, color: colors.ink500, lineHeight: 1.4 }}>{strengths}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.bronze100, borderRadius: 5, padding: "8 10", border: `1 solid rgba(193,127,74,0.15)` }}>
        <Text style={{ fontSize: 6, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, color: colors.bronzeDark, marginBottom: 3 }}>
          Figyelendő
        </Text>
        <Text style={{ fontSize: 8, color: colors.ink500, lineHeight: 1.4 }}>{watchAreas}</Text>
      </View>
    </View>
  );
}
