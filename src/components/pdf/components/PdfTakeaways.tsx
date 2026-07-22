import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfTakeawaysProps {
  takeaways: string[];
  closer?: string;
  locale?: Locale;
}

// Meleg sage zárókártya — a korábbi sötét doboz helyett, az élő
// riport világos design-nyelvéhez igazítva.

export function PdfTakeaways({ takeaways, closer, locale = "hu" }: PdfTakeawaysProps) {
  return (
    <View style={{ backgroundColor: colors.sage100, borderRadius: 8, border: `1 solid rgba(61,107,94,0.18)`, padding: "10 12" }}>
      <Text style={{ fontSize: 5, letterSpacing: 1.2, textTransform: "uppercase", color: colors.bronzeDark, fontWeight: 600, marginBottom: 4 }}>
        {t("pdf.keyTakeaways", locale)}
      </Text>
      {takeaways.map((tw, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 4, marginBottom: 3 }}>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.sage, marginTop: 2.5 }} />
          <Text style={{ flex: 1, fontSize: 6.5, color: colors.sageDark, lineHeight: 1.4 }}>{tw}</Text>
        </View>
      ))}
      {closer && (
        <Text
          style={{
            marginTop: 6,
            paddingTop: 4,
            borderTop: `1 solid rgba(61,107,94,0.12)`,
            fontFamily: "Fraunces",
            fontSize: 6.5,
            fontStyle: "italic",
            color: colors.sageDark,
            lineHeight: 1.4,
          }}
        >
          {closer}
        </Text>
      )}
    </View>
  );
}
