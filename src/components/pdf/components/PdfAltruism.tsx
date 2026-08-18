import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PdfAltruismProps {
  value: number;
  description: string;
  locale?: Locale;
}

// Kiegészítő (intersticiális) skála — a webes AltruismCard párja.
//
// A komponens CSAK akkor kerül a riportba, ha valódi, kitöltésből származó
// „I" érték létezik: a view-model kapuzza (profile-report-view-model.altruism).
// A rövid TSFI-S formában nincs ilyen item, ezért ott a szekció EL SEM
// KÉSZÜL — nem 0%-ként jelenik meg (PDF-audit 2026-08-18, P0/7).
export function PdfAltruism({ value, description, locale = "hu" }: PdfAltruismProps) {
  const dotColor = value >= 70 ? colors.sage : value >= 40 ? colors.bronze : colors.ink300;
  const barWidth = Math.max(0, Math.min(100, value));

  return (
    <View
      wrap={false}
      style={{
        backgroundColor: colors.cream300,
        borderRadius: 12,
        border: `1 solid ${colors.sand}`,
        padding: "14 16",
      }}
    >
      <Text
        style={{
          fontSize: type.eyebrow,
          letterSpacing: type.eyebrowTracking,
          textTransform: "uppercase",
          color: colors.ink300,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {t("pdf.supplementaryScale", locale)}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: dotColor }} />
        <Text style={{ flex: 1, fontSize: type.cardTitle, fontWeight: 500, color: colors.ink }}>
          {t("pdf.altruism", locale)}
        </Text>
        <View style={{ width: 60, height: 3, backgroundColor: colors.cream500, borderRadius: 1.5, overflow: "hidden" }}>
          <View style={{ width: `${barWidth}%`, height: 3, backgroundColor: dotColor, borderRadius: 1.5 }} />
        </View>
        <Text
          style={{
            fontFamily: "Fraunces",
            fontSize: type.subhead,
            color: dotColor,
            width: 24,
            textAlign: "right",
          }}
        >
          {value}
        </Text>
      </View>

      {/* A webes AltruismCard info-bannerével azonos keretezés: a skála nem
          része a hat főfaktornak, ezért nem is számít bele az átlagukba. */}
      <Text style={{ fontSize: type.body, color: colors.ink500, lineHeight: type.lineHeight.body }}>
        {description}
      </Text>
      <Text
        style={{
          fontSize: type.caption,
          color: colors.ink300,
          lineHeight: type.lineHeight.caption,
          marginTop: 6,
        }}
      >
        {t("content.altruismInfo", locale)}
      </Text>
    </View>
  );
}
