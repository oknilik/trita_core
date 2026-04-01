import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfFooterProps {
  pageNum: number;
  totalPages: number;
  locale?: Locale;
}

export function PdfFooter({ pageNum, totalPages, locale = "hu" }: PdfFooterProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "6 32",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 5,
        color: colors.ink300,
        borderTop: `0.5 solid ${colors.cream500}`,
      }}
    >
      <Text style={{ fontFamily: "Fraunces", fontSize: 6, color: "var(--color-action-primary-bg)" }}>
        tri<Text style={{ color: "var(--color-accent-primary)" }}>ta</Text>
      </Text>
      <Text>trita.io · {t("pdf.footerTagline", locale)}</Text>
      <Text>
        {pageNum} / {totalPages}
      </Text>
    </View>
  );
}
