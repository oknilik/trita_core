import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfNextStepProps {
  text: string;
  locale?: string;
}

export function PdfNextStep({ text, locale = "hu" }: PdfNextStepProps) {
  const isHu = locale === "hu";

  return (
    <View style={{ borderTop: `1 solid ${colors.cream500}`, paddingTop: 8, marginTop: 14 }}>
      <Text
        style={{
          fontSize: 7,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.ink300,
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {isHu ? "Következő lépés" : "Next step"}
      </Text>
      <Text style={{ fontSize: 8, color: colors.sage, lineHeight: 1.4 }}>→ {text}</Text>
    </View>
  );
}
