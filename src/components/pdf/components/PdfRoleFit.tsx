import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { t } from "@/lib/i18n";
import type { ReportRoleFit } from "@/lib/profile-report-view-model";

const TIERS = [
  {
    key: "strong" as const,
    label: { hu: "Erős illeszkedés", en: "Strong fit" },
    color: colors.sage,
    bg: colors.sage100,
    labelColor: colors.sageDark,
    pillBg: "rgba(61,107,94,0.15)",
    pillText: colors.sage,
  },
  {
    key: "might" as const,
    label: { hu: "Működhet, ha készülsz", en: "May work with preparation" },
    color: colors.bronze,
    bg: colors.bronze100,
    labelColor: colors.bronzeDark,
    pillBg: "rgba(193,127,74,0.12)",
    pillText: colors.bronzeDark,
  },
  {
    key: "prep" as const,
    label: { hu: "Ahol segít a felkészülés", en: "Where preparation helps" },
    color: colors.ink300,
    bg: colors.cream300,
    labelColor: colors.ink300,
    pillBg: "rgba(138,138,154,0.1)",
    pillText: colors.ink300,
  },
];

export function PdfRoleFit({
  roleFit,
  locale = "hu",
}: {
  roleFit: ReportRoleFit;
  locale?: "hu" | "en";
}) {
  const texts = { strong: roleFit.strong, might: roleFit.might, prep: roleFit.prep };
  const roles = {
    strong: roleFit.strongRoles ?? [],
    might: roleFit.mightRoles ?? [],
    prep: roleFit.prepRoles ?? [],
  };

  return (
    <View>
      {/* Másodlagos dimenzió árnyalása — a családon belüli differenciálás (P2.2) */}
      {roleFit.secondary ? (
        <Text
          style={{
            fontSize: type.body,
            color: colors.ink500,
            lineHeight: type.lineHeight.body,
            marginBottom: 8,
            fontFamily: "Fraunces",
            fontStyle: "italic",
          }}
        >
          {roleFit.secondary}
        </Text>
      ) : null}
      {TIERS.map((tier) => {
        const text = texts[tier.key];
        if (!text) return null;
        const tierRoles = roles[tier.key];
        return (
          <View
            key={tier.key}
            wrap={false}
            style={{
              borderLeft: `3 solid ${tier.color}`,
              backgroundColor: tier.bg,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              padding: "10 12",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: type.eyebrow,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: type.eyebrowTracking,
                color: tier.labelColor,
                marginBottom: 4,
              }}
            >
              {tier.label[locale]}
            </Text>
            <Text
              style={{
                fontSize: type.body,
                color: colors.ink500,
                lineHeight: type.lineHeight.body,
                marginBottom: tierRoles.length > 0 ? 6 : 0,
              }}
            >
              {text}
            </Text>
            {tierRoles.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                {tierRoles.map((r) => (
                  <Text
                    key={r}
                    style={{
                      fontSize: type.caption,
                      backgroundColor: tier.pillBg,
                      color: tier.pillText,
                      padding: "2 6",
                      borderRadius: 8,
                    }}
                  >
                    {r}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      {/* Disclaimer: a személyiség csak egy tényező */}
      <Text
        style={{
          fontSize: type.caption,
          color: colors.ink300,
          lineHeight: type.lineHeight.caption,
          marginTop: 6,
        }}
      >
        {t("pdf.roleFitDisclaimer", locale)}
      </Text>
    </View>
  );
}
