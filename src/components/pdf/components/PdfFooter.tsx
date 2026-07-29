import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfFooterProps {
  /** @deprecated — az oldalszám dinamikus (render prop), a props csak kompatibilitás miatt marad. */
  pageNum?: number;
  /** @deprecated */
  totalPages?: number;
  locale?: Locale;
}

// Fixed lábléc dinamikus oldalszámmal: ha egy szekció átcsúszik a
// következő oldalra, a számozás és a lábléc ott is helyes marad.

export function PdfFooter({ locale = "hu" }: PdfFooterProps) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "6 32",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 5.5,
        color: colors.ink300,
        borderTop: `0.5 solid ${colors.sand}`,
      }}
    >
      <Text style={{ fontFamily: "Fraunces", fontSize: 6.5, color: colors.sage }}>
        tri<Text style={{ color: colors.bronze }}>ta</Text>
      </Text>
      <Text>trita.io · {t("pdf.footerTagline", locale)}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}
