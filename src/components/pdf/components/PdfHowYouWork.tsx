import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfHowYouWorkProps {
  paragraphs: string[];
  locale?: Locale;
}

export function PdfHowYouWork({ paragraphs, locale = "hu" }: PdfHowYouWorkProps) {
  const main = paragraphs[0] ?? "";
  const watch = paragraphs[1] ?? "";
  const context = paragraphs.slice(2).join(" ");

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <View style={{ flex: 1, backgroundColor: colors.sage100, borderRadius: 4, padding: "6 8", border: `1 solid rgba(61,107,94,0.15)` }}>
          <Text style={{ fontSize: 5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.sageDark, marginBottom: 2 }}>
            {t("pdf.keyPattern", locale)}
          </Text>
          <Text style={{ fontSize: 6.5, color: colors.sageDark, lineHeight: 1.4 }}>{main}</Text>
        </View>
        {watch ? (
          <View style={{ flex: 1, backgroundColor: colors.bronze100, borderRadius: 4, padding: "6 8", border: `1 solid rgba(193,127,74,0.15)` }}>
            <Text style={{ fontSize: 5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.bronzeDark, marginBottom: 2 }}>
              {t("pdf.watchArea", locale)}
            </Text>
            <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4 }}>{watch}</Text>
          </View>
        ) : null}
      </View>
      {context ? (
        <View style={{ marginTop: 4, backgroundColor: colors.white, borderRadius: 4, padding: "6 8", border: `1 solid ${colors.cream500}` }}>
          <Text style={{ fontSize: 5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.ink300, marginBottom: 2 }}>
            {t("pdf.context", locale)}
          </Text>
          <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4 }}>{context}</Text>
        </View>
      ) : null}
    </View>
  );
}
