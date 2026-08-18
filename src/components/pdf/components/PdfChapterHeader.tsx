import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";

// ─────────────────────────────────────────────────────────────────────────────
// Fejezetfejléc — a webes LinearReport fejezetkártyáinak PDF-párja
// (PDF-audit 2026-08-18, P1/9). Négy szint, ebben a sorrendben:
//   01/02/03 bronz mono sorszám · eyebrow-kérdés · Fraunces fejezetcím ·
//   egymondatos leírás · finom alsó elválasztó.
//
// Enélkül a PDF minden címe apró, széthúzott uppercase eyebrow volt: nem volt
// érzékelhető fő- és alcímszint, minden oldal ugyanolyan „sűrűnek" látszott.
// ─────────────────────────────────────────────────────────────────────────────

interface PdfChapterHeaderProps {
  /** „01" · „02" · „03"; melléklet-oldalon a lokalizált „Melléklet" felirat. */
  number: string;
  question: string;
  title: string;
  description?: string;
  /** Melléklet-fejlécen a sorszám helyett szöveges jelölő fut. */
  numberIsLabel?: boolean;
}

export function PdfChapterHeader({
  number,
  question,
  title,
  description,
  numberIsLabel = false,
}: PdfChapterHeaderProps) {
  return (
    <View wrap={false} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <Text
          style={{
            fontFamily: "Fraunces",
            fontSize: numberIsLabel ? type.caption : type.chapterNumber,
            fontWeight: 600,
            letterSpacing: numberIsLabel ? 1.6 : 0.5,
            textTransform: numberIsLabel ? "uppercase" : "none",
            color: colors.bronze,
            paddingTop: numberIsLabel ? 3 : 5,
            minWidth: numberIsLabel ? 58 : 24,
          }}
        >
          {number}
        </Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: type.eyebrow,
              letterSpacing: type.eyebrowTracking,
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.ink300,
              marginBottom: 4,
            }}
          >
            {question}
          </Text>
          <Text
            style={{
              fontFamily: "Fraunces",
              fontSize: type.chapter,
              color: colors.ink,
              lineHeight: 1.15,
            }}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={{
                fontSize: type.caption,
                color: colors.ink500,
                lineHeight: type.lineHeight.caption,
                marginTop: 6,
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ borderTop: `1 solid ${colors.sand}`, marginTop: 14 }} />
    </View>
  );
}
