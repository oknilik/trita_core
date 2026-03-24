import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface RoleFitProps {
  strong: string;
  might: string;
  prep: string;
  strongRoles?: string[];
  mightRoles?: string[];
  prepRoles?: string[];
}

const TIERS = [
  { key: "strong" as const, label: { hu: "Erős illeszkedés", en: "Strong fit" }, color: colors.sage, bg: colors.sage100, labelColor: colors.sageDark, pillBg: "rgba(61,107,94,0.15)", pillText: colors.sage },
  { key: "might" as const, label: { hu: "Működhet, ha készülsz", en: "May work with preparation" }, color: colors.bronze, bg: colors.bronze100, labelColor: colors.bronzeDark, pillBg: "rgba(193,127,74,0.12)", pillText: colors.bronzeDark },
  { key: "prep" as const, label: { hu: "Ahol segít a felkészülés", en: "Where preparation helps" }, color: colors.ink300, bg: colors.cream300, labelColor: colors.ink300, pillBg: "rgba(138,138,154,0.1)", pillText: colors.ink300 },
];

export function PdfRoleFit({ strong, might, prep, strongRoles, mightRoles, prepRoles }: RoleFitProps) {
  const texts = { strong, might, prep };
  const roles = { strong: strongRoles ?? [], might: mightRoles ?? [], prep: prepRoles ?? [] };

  return (
    <View style={{ marginBottom: 14 }}>
      {TIERS.map((tier) => {
        const text = texts[tier.key];
        if (!text) return null;
        const tierRoles = roles[tier.key];
        return (
          <View
            key={tier.key}
            style={{
              borderLeft: `3 solid ${tier.color}`,
              backgroundColor: tier.bg,
              borderTopRightRadius: 5, borderBottomRightRadius: 5,
              padding: "6 10",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: tier.labelColor, marginBottom: 2 }}>
              {tier.label.hu}
            </Text>
            <Text style={{ fontSize: 7.5, color: colors.ink500, lineHeight: 1.35, marginBottom: tierRoles.length > 0 ? 4 : 0 }}>
              {text}
            </Text>
            {tierRoles.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                {tierRoles.map((r) => (
                  <Text key={r} style={{ fontSize: 6, backgroundColor: tier.pillBg, color: tier.pillText, padding: "2 5", borderRadius: 8 }}>
                    {r}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
