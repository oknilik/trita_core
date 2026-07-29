import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";

interface RoleFitProps {
  strong: string;
  might: string;
  prep: string;
  /** A második legerősebb dimenzió árnyaló mondata (P2.2). */
  secondary?: string;
  strongRoles?: string[];
  mightRoles?: string[];
  prepRoles?: string[];
  locale?: "hu" | "en";
}

const TIERS = [
  { key: "strong" as const, label: { hu: "Erős illeszkedés", en: "Strong fit" }, color: colors.sage, bg: colors.sage100, labelColor: colors.sageDark, pillBg: "rgba(61,107,94,0.15)", pillText: colors.sage },
  { key: "might" as const, label: { hu: "Működhet, ha készülsz", en: "May work with preparation" }, color: colors.bronze, bg: colors.bronze100, labelColor: colors.bronzeDark, pillBg: "rgba(193,127,74,0.12)", pillText: colors.bronzeDark },
  { key: "prep" as const, label: { hu: "Ahol segít a felkészülés", en: "Where preparation helps" }, color: colors.ink300, bg: colors.cream300, labelColor: colors.ink300, pillBg: "rgba(138,138,154,0.1)", pillText: colors.ink300 },
];

export function PdfRoleFit({ strong, might, prep, secondary, strongRoles, mightRoles, prepRoles, locale = "hu" }: RoleFitProps) {
  const texts = { strong, might, prep };
  const roles = { strong: strongRoles ?? [], might: mightRoles ?? [], prep: prepRoles ?? [] };

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Másodlagos dimenzió árnyalása — a családon belüli differenciálás (P2.2) */}
      {secondary ? (
        <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.4, marginBottom: 4, fontFamily: "Fraunces", fontStyle: "italic" }}>
          {secondary}
        </Text>
      ) : null}
      {TIERS.map((tier) => {
        const text = texts[tier.key];
        if (!text) return null;
        const tierRoles = roles[tier.key];
        return (
          <View
            key={tier.key}
            style={{
              borderLeft: `2.5 solid ${tier.color}`,
              backgroundColor: tier.bg,
              borderTopRightRadius: 4, borderBottomRightRadius: 4,
              padding: "4 8",
              marginBottom: 3,
            }}
          >
            <Text style={{ fontSize: 5.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: tier.labelColor, marginBottom: 1.5 }}>
              {tier.label[locale]}
            </Text>
            <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.35, marginBottom: tierRoles.length > 0 ? 3 : 0 }}>
              {text}
            </Text>
            {tierRoles.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                {tierRoles.map((r) => (
                  <Text key={r} style={{ fontSize: 6, backgroundColor: tier.pillBg, color: tier.pillText, padding: "1.5 4", borderRadius: 6 }}>
                    {r}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
      {/* Disclaimer (P2.2): a személyiség csak egy tényező */}
      <Text style={{ fontSize: 6, color: colors.ink300, lineHeight: 1.4, marginTop: 3 }}>
        {t("pdf.roleFitDisclaimer", locale)}
      </Text>
    </View>
  );
}
