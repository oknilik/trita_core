import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfTakeawaysProps {
  takeaways: string[];
  closer?: string;
  locale?: string;
}

export function PdfTakeaways({ takeaways, closer, locale = "hu" }: PdfTakeawaysProps) {
  const isHu = locale === "hu";
  return (
    <View style={{ backgroundColor: colors.ink, borderRadius: 7, padding: "14 14" }}>
      <Text style={{ fontSize: 6, letterSpacing: 1.2, textTransform: "uppercase", color: colors.bronzeLight, marginBottom: 6 }}>
        {isHu ? "A legfontosabbak" : "Key takeaways"}
      </Text>
      {takeaways.map((t, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 5, marginBottom: 4 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.sage, marginTop: 3 }} />
          <Text style={{ flex: 1, fontSize: 7.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>{t}</Text>
        </View>
      ))}
      {closer && (
        <Text
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: `1 solid rgba(255,255,255,0.06)`,
            fontFamily: "Fraunces",
            fontSize: 7.5,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.28)",
            lineHeight: 1.4,
          }}
        >
          {closer}
        </Text>
      )}
    </View>
  );
}
