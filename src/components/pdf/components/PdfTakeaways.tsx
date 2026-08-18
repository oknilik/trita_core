import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfTakeawaysProps {
  takeaways: string[];
  locale?: Locale;
}

// Meleg sage zárókártya — az élő riport KeyTakeawaysSection párja.
export function PdfTakeaways({ takeaways, locale = "hu" }: PdfTakeawaysProps) {
  return (
    <View
      style={{
        backgroundColor: colors.sage100,
        borderRadius: 12,
        border: `1 solid ${colors.sage200}`,
        padding: "14 16",
      }}
    >
      <Text
        style={{
          fontSize: type.eyebrow,
          letterSpacing: type.eyebrowTracking,
          textTransform: "uppercase",
          color: colors.bronzeDark,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {t("pdf.keyTakeaways", locale)}
      </Text>
      {takeaways.map((tw, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", gap: 7, marginBottom: i === takeaways.length - 1 ? 0 : 6 }}
        >
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.sage, marginTop: 5 }} />
          <Text
            style={{
              flex: 1,
              fontSize: type.body,
              color: colors.sageDark,
              lineHeight: type.lineHeight.body,
            }}
          >
            {tw}
          </Text>
        </View>
      ))}
    </View>
  );
}
