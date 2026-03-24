import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfHeaderProps {
  name: string;
  date: string;
  type: string;
  percentile: string;
  insight: string;
  plan: "start" | "plus" | "reflect";
}

const PLAN_LABELS: Record<string, string> = {
  start: "Self Start",
  plus: "Self Plus",
  reflect: "Self Reflect",
};

export function PdfHeader({ name, date, type, percentile, insight, plan }: PdfHeaderProps) {
  return (
    <View style={{ backgroundColor: colors.sageDark, padding: "32 40 24 40" }}>
      <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: "rgba(255,255,255,0.22)", marginBottom: 16 }}>
        trita
      </Text>
      <Text style={{ fontSize: 7, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: 4 }}>
        A te profilod
      </Text>
      <Text style={{ fontFamily: "Fraunces", fontSize: 24, color: colors.white, marginBottom: 1 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 8 }}>
        Felmérés: {date}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 16, fontStyle: "italic", color: colors.bronzeLight }}>
          {type}
        </Text>
        {percentile ? (
          <Text style={{ fontSize: 7, backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)", padding: "2 6", borderRadius: 3 }}>
            {percentile}
          </Text>
        ) : null}
      </View>

      {insight ? (
        <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", lineHeight: 1.5, marginTop: 8, maxWidth: 340 }}>
          {insight}
        </Text>
      ) : null}

      <Text style={{ fontSize: 7, backgroundColor: "rgba(193,127,74,0.15)", color: colors.bronzeLight, padding: "2 7", borderRadius: 3, marginTop: 6, alignSelf: "flex-start" }}>
        {PLAN_LABELS[plan]}
      </Text>
    </View>
  );
}
