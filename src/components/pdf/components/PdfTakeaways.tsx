import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfTakeawaysProps {
  takeaways: string[];
  closer?: string;
}

export function PdfTakeaways({ takeaways, closer }: PdfTakeawaysProps) {
  return (
    <View style={{ backgroundColor: colors.ink, borderRadius: 7, padding: 12 }}>
      <Text style={{ fontSize: 6, letterSpacing: 1.2, textTransform: "uppercase", color: colors.bronzeLight, marginBottom: 4 }}>
        A legfontosabbak
      </Text>
      {takeaways.map((t, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 4, marginBottom: 3 }}>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.sageLight, marginTop: 4 }} />
          <Text style={{ flex: 1, fontSize: 7.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{t}</Text>
        </View>
      ))}
      {closer && (
        <Text
          style={{
            marginTop: 5,
            paddingTop: 4,
            borderTop: "1 solid rgba(255,255,255,0.05)",
            fontFamily: "Fraunces",
            fontSize: 7.5,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.25)",
            lineHeight: 1.35,
          }}
        >
          {closer}
        </Text>
      )}
    </View>
  );
}
