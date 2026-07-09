import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfNextStepProps {
  text: string;
  locale?: Locale;
}

export function PdfNextStep({ text, locale = "hu" }: PdfNextStepProps) {
  return (
    <View style={{ borderTop: `1 solid ${colors.cream500}`, paddingTop: 6, marginTop: 10 }}>
      <Text
        style={{
          fontSize: 6,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.ink300,
          fontWeight: 600,
          marginBottom: 2,
        }}
      >
        {t("pdf.nextStep", locale)}
      </Text>
      <Text style={{ fontSize: 7, color: colors.sage, lineHeight: 1.4 }}>→ {text}</Text>
    </View>
  );
}
