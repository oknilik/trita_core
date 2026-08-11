import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { HowYouWorkParts } from "@/lib/workstyle-content";

interface PdfHowYouWorkProps {
  /**
   * Nevesített slotok (workstyle-content, FIX 3) — a „Figyelendő" kártya csak
   * valódi risk-párnál renderel, a pozicionális [1]-találgatás kivezetve.
   */
  parts: HowYouWorkParts;
  locale?: Locale;
}

export function PdfHowYouWork({ parts, locale = "hu" }: PdfHowYouWorkProps) {
  const main = parts.main;
  const watch = parts.watch ?? "";
  // Semleges „Jellemző mintázat" kártya (tone: "note", fordított skála) — a
  // felülettel azonos slot, hogy a PDF és a képernyő ne csússzon szét.
  const notes = parts.notes.join(" ");
  const context = parts.context.join(" ");

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <View style={{ flex: 1, backgroundColor: colors.sage100, borderRadius: 4, padding: "6 8", border: `1 solid rgba(61,107,94,0.15)` }}>
          <Text style={{ fontSize: 5.5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.sageDark, marginBottom: 2 }}>
            {t("pdf.keyPattern", locale)}
          </Text>
          <Text style={{ fontSize: 6.5, color: colors.sageDark, lineHeight: 1.4 }}>{main}</Text>
        </View>
        {watch ? (
          <View style={{ flex: 1, backgroundColor: colors.bronze100, borderRadius: 4, padding: "6 8", border: `1 solid rgba(193,127,74,0.15)` }}>
            <Text style={{ fontSize: 5.5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.bronzeDark, marginBottom: 2 }}>
              {t("pdf.watchArea", locale)}
            </Text>
            <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4 }}>{watch}</Text>
          </View>
        ) : null}
      </View>
      {notes ? (
        <View style={{ marginTop: 4, backgroundColor: colors.cream300, borderRadius: 4, padding: "6 8", border: `1 solid ${colors.sand}` }}>
          <Text style={{ fontSize: 5.5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.ink500, marginBottom: 2 }}>
            {t("pdf.patternNote", locale)}
          </Text>
          <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4 }}>{notes}</Text>
        </View>
      ) : null}
      {context ? (
        <View style={{ marginTop: 4, backgroundColor: colors.white, borderRadius: 4, padding: "6 8", border: `1 solid ${colors.cream500}` }}>
          <Text style={{ fontSize: 5.5, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.ink300, marginBottom: 2 }}>
            {t("pdf.context", locale)}
          </Text>
          <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4 }}>{context}</Text>
        </View>
      ) : null}
    </View>
  );
}
