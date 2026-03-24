import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfQuickStartProps {
  plan: "start" | "plus" | "reflect";
  locale?: string;
}

export function PdfQuickStart({ plan, locale = "hu" }: PdfQuickStartProps) {
  const isHu = locale === "hu";
  const hasPlus = plan === "plus" || plan === "reflect";
  const hasReflect = plan === "reflect";

  const steps = [
    {
      text: isHu ? "Fő dimenziók részletesen" : "Dimensions in detail",
      page: hasPlus ? (isHu ? "2. oldal" : "page 2") : "Self Plus",
    },
    {
      text: isHu ? "Leginkább illő szerepkörök" : "Best fitting roles",
      page: hasPlus ? (isHu ? "2. oldal" : "page 2") : "Self Plus",
    },
    {
      text: isHu ? "Önkép vs. visszajelzés" : "Self-image vs. feedback",
      page: hasReflect ? (isHu ? "3. oldal" : "page 3") : "Self Reflect",
    },
  ];

  return (
    <View style={{ borderTop: `1 solid ${colors.cream500}`, paddingTop: 8, marginTop: 14 }}>
      <Text
        style={{
          fontSize: 7,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: colors.ink300,
          fontWeight: 600,
          marginBottom: 5,
        }}
      >
        {isHu ? "Ezt érdemes most megnézned" : "What to look at next"}
      </Text>
      {steps.map((step, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 }}>
          <Text style={{ fontSize: 8, fontWeight: 600, color: colors.sage }}>{i + 1}.</Text>
          <Text style={{ fontSize: 8, color: colors.ink500 }}>{step.text}</Text>
          <Text style={{ fontSize: 7, color: colors.ink300 }}>→ {step.page}</Text>
        </View>
      ))}
    </View>
  );
}
