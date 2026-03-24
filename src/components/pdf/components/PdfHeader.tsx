import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface PdfHeaderProps {
  name: string;
  date: string;
  type: string;
  percentile: string;
  insight: string;
  plan: "start" | "plus" | "reflect";
  locale?: string;
  topDimensions?: string[];
  watchDimensions?: string[];
}

const PLAN_LABELS: Record<string, string> = {
  start: "Self Start",
  plus: "Self Plus",
  reflect: "Self Reflect",
};

export function PdfHeader({ name, date, type, percentile, insight, plan, locale = "hu", topDimensions = [], watchDimensions = [] }: PdfHeaderProps) {
  const isHu = locale === "hu";

  return (
    <View style={{ backgroundColor: colors.sageDark, padding: "24 32 16 32" }}>
      <Text style={{ fontFamily: "Fraunces", fontSize: 11, color: "rgba(255,255,255,0.22)", marginBottom: 10 }}>
        tri<Text style={{ color: "rgba(193,127,74,0.35)" }}>ta</Text>
      </Text>
      <Text style={{ fontSize: 6, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: 3 }}>
        {isHu ? "Személyiségprofil" : "Personality profile"}
      </Text>
      <Text style={{ fontFamily: "Fraunces", fontSize: 20, color: colors.white, marginBottom: 1 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.15)", marginBottom: 6 }}>
        {isHu ? "Felmérés:" : "Assessment:"} {date}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 13, fontStyle: "italic", color: colors.bronzeLight }}>
          {type}
        </Text>
        {percentile ? (
          <Text style={{ fontSize: 6, backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)", padding: "1.5 5", borderRadius: 3 }}>
            {percentile}
          </Text>
        ) : null}
      </View>

      {insight ? (
        <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", lineHeight: 1.45, marginTop: 4, maxWidth: 340 }}>
          {insight}
        </Text>
      ) : null}

      {/* Dimension chips */}
      {(topDimensions.length > 0 || watchDimensions.length > 0) && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 3, marginTop: 5 }}>
          {topDimensions.length > 0 && (
            <>
              <Text style={{ fontSize: 5, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(255,255,255,0.2)" }}>
                {isHu ? "Legerősebb:" : "Top:"}
              </Text>
              {topDimensions.map((d) => (
                <Text key={d} style={{ fontSize: 6, padding: "1.5 5", borderRadius: 3, backgroundColor: "rgba(61,107,94,0.3)", color: "#c8e8de" }}>
                  {d}
                </Text>
              ))}
            </>
          )}
          {watchDimensions.length > 0 && (
            <>
              <Text style={{ fontSize: 5, textTransform: "uppercase", letterSpacing: 0.8, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>
                {isHu ? "Figyelendő:" : "Watch:"}
              </Text>
              {watchDimensions.map((d) => (
                <Text key={d} style={{ fontSize: 6, padding: "1.5 5", borderRadius: 3, backgroundColor: "rgba(193,127,74,0.2)", color: "#e8a96a" }}>
                  {d}
                </Text>
              ))}
            </>
          )}
        </View>
      )}

      <Text style={{ fontSize: 5, backgroundColor: "rgba(193,127,74,0.15)", color: colors.bronzeLight, padding: "2 6", borderRadius: 3, marginTop: 5, alignSelf: "flex-start" }}>
        {PLAN_LABELS[plan]}
      </Text>
    </View>
  );
}
