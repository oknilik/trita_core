import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { dimColors } from "@/lib/color-system";

interface Dim {
  name: string;
  value: number;
  description: string;
  /** Dimenziókód — a pötty identitás-színéhez (szín ≠ értékelés). */
  code?: string;
}

interface PdfDimDetailsProps {
  dimensions: Dim[];
  previewOnly?: boolean;
  hasPlus?: boolean;
  locale?: "hu" | "en";
}

export function PdfDimDetails({ dimensions, previewOnly = false, hasPlus = false, locale = "hu" }: PdfDimDetailsProps) {
  const sorted = [...dimensions].sort((a, b) => b.value - a.value);
  const displayed = previewOnly ? sorted.slice(0, 3) : dimensions;
  const rest = previewOnly ? dimensions.length - 3 : 0;

  const restNote =
    locale === "hu"
      ? `+ ${rest} további dimenzió → ${hasPlus ? "lásd a következő oldalt" : "Self Plus csomagban"}`
      : `+ ${rest} more dimensions → ${hasPlus ? "see the next page" : "in the Self Plus plan"}`;

  return (
    <View style={{ marginBottom: 2 }}>
      {displayed.map((dim) => {
        const dotColor = dimColors(dim.code ?? "").base;
        return (
          <View
            key={dim.name}
            wrap={false}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 4,
              padding: "5 7",
              borderRadius: 4,
              backgroundColor: colors.cream300,
              marginBottom: 3,
            }}
          >
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dotColor, marginTop: 3 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7.5, fontWeight: 500, color: colors.ink }}>
                {dim.name} · {dim.value}%
              </Text>
              <Text style={{ fontSize: 6.5, color: colors.ink300, lineHeight: 1.35, marginTop: 1 }}>
                {dim.description}
              </Text>
            </View>
          </View>
        );
      })}
      {rest > 0 && (
        <Text style={{ fontSize: 6.5, color: colors.sage, marginTop: 2, fontWeight: 500 }}>
          {restNote}
        </Text>
      )}
    </View>
  );
}
