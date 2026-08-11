import { View, Text } from "@react-pdf/renderer";
// Note: unicode icons like ℹ don't render in react-pdf; use View-based icons instead
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfAltruismProps {
  value: number;
  description: string;
  locale?: Locale;
}

export function PdfAltruism({ value, description, locale = "hu" }: PdfAltruismProps) {
  const dotColor = value >= 70 ? colors.sage : value >= 40 ? colors.bronze : colors.ink300;
  // A webes AltruismCard-dal azonos sávpadló: 0%-nál a nulla szélességű sáv
  // adathibának/renderelési hibának látszik, nem szándékos alacsony értéknek.
  // (A pontozás 2026-08-11 óta nem ír koholt 0-t, de egy VALÓDI 0 továbbra is
  // előfordulhat — annak is látszania kell.)
  const barWidth = Math.max(0, Math.min(100, value));

  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontSize: 6.5, letterSpacing: 1.5, textTransform: "uppercase", color: colors.ink300, fontWeight: 600, marginBottom: 3 }}>
        {t("pdf.supplementaryScale", locale)}
      </Text>
      <View style={{ backgroundColor: colors.cream300, borderRadius: 4, padding: "5 8", border: `1 solid ${colors.cream500}` }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cream500, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 5.5, fontWeight: 700, color: colors.ink300 }}>i</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dotColor }} />
            <Text style={{ fontSize: 8, fontWeight: 500, color: colors.ink }}>
              {t("pdf.altruism", locale)}
            </Text>
          </View>
          <View style={{ width: 50, height: 3, backgroundColor: colors.cream500, borderRadius: 2, overflow: "hidden" }}>
            <View style={{ width: `${Math.max(barWidth, 2)}%`, height: 3, backgroundColor: dotColor, borderRadius: 2 }} />
          </View>
          <Text style={{ fontSize: 7.5, fontWeight: 600, color: dotColor, width: 20, textAlign: "right" }}>{value}%</Text>
        </View>
        {/* A webes AltruismCard info-bannerével azonos keretezés: a skála nem
            része a hat főfaktornak, ezért nem is számít bele az átlagukba.
            Enélkül a PDF-ben egy hetedik dimenziónak látszott. */}
        <Text style={{ fontSize: 6, color: colors.ink300, lineHeight: 1.35, marginBottom: 2 }}>
          {t("content.altruismInfo", locale)}
        </Text>
        <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.35 }}>{description}</Text>
      </View>
    </View>
  );
}
