import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfHowYouWorkProps {
  paragraphs: string[];
  locale?: string;
}

export function PdfHowYouWork({ paragraphs, locale = "hu" }: PdfHowYouWorkProps) {
  const isHu = locale === "hu";
  const main = paragraphs[0] ?? "";
  const watch = paragraphs[1] ?? "";
  const context = paragraphs.slice(2).join(" ");

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <View style={{ flex: 1, backgroundColor: colors.sage100, borderRadius: 5, padding: "8 10", border: `1 solid rgba(61,107,94,0.15)` }}>
          <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.sageDark, marginBottom: 3 }}>
            {isHu ? "Fő mintázat" : "Key pattern"}
          </Text>
          <Text style={{ fontSize: 7.5, color: colors.sageDark, lineHeight: 1.4 }}>{main}</Text>
        </View>
        {watch ? (
          <View style={{ flex: 1, backgroundColor: colors.bronze100, borderRadius: 5, padding: "8 10", border: `1 solid rgba(193,127,74,0.15)` }}>
            <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.bronzeDark, marginBottom: 3 }}>
              {isHu ? "Figyelendő" : "Watch area"}
            </Text>
            <Text style={{ fontSize: 7.5, color: colors.ink500, lineHeight: 1.4 }}>{watch}</Text>
          </View>
        ) : null}
      </View>
      {context ? (
        <View style={{ marginTop: 5, backgroundColor: colors.white, borderRadius: 5, padding: "8 10", border: `1 solid ${colors.cream500}` }}>
          <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: colors.ink300, marginBottom: 3 }}>
            {isHu ? "Kontextus" : "Context"}
          </Text>
          <Text style={{ fontSize: 7.5, color: colors.ink500, lineHeight: 1.4 }}>{context}</Text>
        </View>
      ) : null}
    </View>
  );
}
