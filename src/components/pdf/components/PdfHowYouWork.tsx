import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
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

function Block({
  label,
  text,
  labelColor,
  textColor,
  background,
  border,
}: {
  label: string;
  text: string;
  labelColor: string;
  textColor: string;
  background: string;
  border: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: background,
        borderRadius: 10,
        padding: "12 14",
        border: `1 solid ${border}`,
      }}
    >
      <Text
        style={{
          fontSize: type.eyebrow,
          letterSpacing: type.eyebrowTracking,
          textTransform: "uppercase",
          fontWeight: 600,
          color: labelColor,
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: type.body, color: textColor, lineHeight: type.lineHeight.body }}>
        {text}
      </Text>
    </View>
  );
}

export function PdfHowYouWork({ parts, locale = "hu" }: PdfHowYouWorkProps) {
  const watch = parts.watch ?? "";
  // Semleges „Jellemző mintázat" kártya (tone: "note", fordított skála) – a
  // felülettel azonos slot, hogy a PDF és a képernyő ne csússzon szét.
  const notes = parts.notes.join(" ");
  const context = parts.context.join(" ");

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Block
          label={t("pdf.keyPattern", locale)}
          text={parts.main}
          labelColor={colors.sageDark}
          textColor={colors.sageDark}
          background={colors.sage100}
          border={colors.sage200}
        />
        {watch ? (
          <Block
            label={t("pdf.watchArea", locale)}
            text={watch}
            labelColor={colors.bronzeDark}
            textColor={colors.ink500}
            background={colors.bronze100}
            border={colors.bronze200}
          />
        ) : null}
      </View>
      {notes ? (
        <View style={{ marginTop: 8 }}>
          <Block
            label={t("pdf.patternNote", locale)}
            text={notes}
            labelColor={colors.ink500}
            textColor={colors.ink500}
            background={colors.cream300}
            border={colors.sand}
          />
        </View>
      ) : null}
      {context ? (
        <View style={{ marginTop: 8 }}>
          <Block
            label={t("pdf.context", locale)}
            text={context}
            labelColor={colors.ink300}
            textColor={colors.ink500}
            background={colors.white}
            border={colors.cream500}
          />
        </View>
      ) : null}
    </View>
  );
}
