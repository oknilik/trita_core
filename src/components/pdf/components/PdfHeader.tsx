import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";

// Világos, meleg fejléc — az élő riport hero-jának tükre: krém/fehér alap,
// bronz eyebrow, Fraunces név, sage archetípus, chip-sor. (A korábbi sötét
// sáv helyett; a felülettel azonos design-nyelv.)

interface PdfHeaderProps {
  name: string;
  date: string;
  type: string;
  insight: string;
  plan: "start" | "plus";
  locale?: "hu" | "en";
  topDimensions?: string[];
  watchDimensions?: string[];
}

function Chip({ label, dot }: { label: string; dot: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2.5,
        backgroundColor: colors.white,
        border: `1 solid ${colors.sand}`,
        borderRadius: 8,
        padding: "2 6",
      }}
    >
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dot }} />
      <Text style={{ fontSize: 6.5, color: colors.ink500 }}>{label}</Text>
    </View>
  );
}

export function PdfHeader({
  name,
  date,
  type,
  insight,
  locale = "hu",
  topDimensions = [],
  watchDimensions = [],
}: PdfHeaderProps) {
  return (
    <View>
      {/* Márka-akcentus csík */}
      <View style={{ height: 4, backgroundColor: colors.sage }} />
      <View
        style={{
          backgroundColor: colors.white,
          padding: "18 32 14 32",
          borderBottom: `1 solid ${colors.sand}`,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ maxWidth: 380 }}>
            <Text style={{ fontSize: 6.5, letterSpacing: 2, textTransform: "uppercase", color: colors.bronze, marginBottom: 4, fontWeight: 600 }}>
              {"// "}{t("pdf.personalityProfile", locale)}
            </Text>
            <Text style={{ fontFamily: "Fraunces", fontSize: 21, color: colors.ink, marginBottom: 2 }}>
              {name}
            </Text>
            <Text style={{ fontSize: 6.5, color: colors.ink300, marginBottom: 7 }}>
              {t("pdf.headerAssessment", locale)} {date}
            </Text>

            {/* Ál-percentilis badge kivezetve (B17) — a típusnév önmagában áll. */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <Text style={{ fontFamily: "Fraunces", fontSize: 13, fontStyle: "italic", color: colors.sageDark }}>
                {type}
              </Text>
            </View>

            {insight ? (
              <Text style={{ fontSize: 8, color: colors.ink500, lineHeight: 1.5, marginTop: 3 }}>
                {insight}
              </Text>
            ) : null}
          </View>

          <Text style={{ fontFamily: "Fraunces", fontSize: 12, color: colors.sage }}>
            tri<Text style={{ color: colors.bronze }}>ta</Text>
          </Text>
        </View>

        {/* Dimenzió-chipek — erősségek sage, figyelendők bronz ponttal */}
        {(topDimensions.length > 0 || watchDimensions.length > 0) && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 3, marginTop: 8 }}>
            {topDimensions.map((d, i) => (
              <Chip key={`t-${i}`} label={d} dot={colors.sage} />
            ))}
            {watchDimensions.map((d, i) => (
              <Chip key={`w-${i}`} label={d} dot={colors.bronze} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
