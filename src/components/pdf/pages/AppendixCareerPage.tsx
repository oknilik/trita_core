import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { PdfChapterHeader } from "../components/PdfChapterHeader";
import { t } from "@/lib/i18n";
import type { ProfileReportViewModel } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// Melléklet · Karrier-iránytű — a webes eredmény exportja: top irányok
// konfidencia-sávval, fejlődési fókusz, módszertani keret. Csak akkor kerül a
// riportba, ha a user kitöltötte a Karrier-iránytű wizardot.
// ─────────────────────────────────────────────────────────────────────────────

// A sáv-tudatos szint-címke (motor-audit v9): erősebb állítást csak akkor
// teszünk, ha a konfidencia-sáv ALJA is a vágás felett van; különben eggyel
// óvatosabb szint megy ki. A webes kártya ugyanezt a szabályt követi.
function tierLabel(
  score: number,
  bandLow: number,
  locale: "hu" | "en",
): { text: string; color: string } {
  const low = Number.isFinite(bandLow) ? bandLow : score;
  if (score >= 70 && low >= 70) {
    return { text: t("results.ccTierStrong", locale), color: colors.sageDark };
  }
  if (score >= 55 && low >= 55) {
    return { text: t("results.ccTierGood", locale), color: colors.ink };
  }
  return { text: t("results.ccTierConditional", locale), color: colors.bronze };
}

export function AppendixCareerPage({ model }: { model: ProfileReportViewModel }) {
  const { locale, identity, career } = model;
  if (!career) return null;

  return (
    <Page size="A4" style={s.page} bookmark={{ title: t("pdf.appendixCareerTitle", locale) }}>
      <PdfMiniHeader
        userName={identity.userName}
        planLabel={t("pdf.careerPageTitle", locale)}
        date={identity.completedAt}
        locale={locale}
      />

      <View style={s.body}>
        <PdfChapterHeader
          numberIsLabel
          number={t("pdf.appendixEyebrow", locale)}
          question={t("pdf.careerTopDirections", locale)}
          title={t("pdf.appendixCareerTitle", locale)}
          description={t("pdf.appendixCareerNote", locale)}
        />

        <PdfCard eyebrow={t("pdf.careerTopDirections", locale)} wrap>
          {career.roles.map((role, i) => {
            const tier = tierLabel(role.score, role.bandLow, locale);
            const isLast = i === career.roles.length - 1;
            return (
              <View
                key={role.name}
                wrap={false}
                style={{
                  marginBottom: isLast ? 0 : 11,
                  paddingBottom: isLast ? 0 : 11,
                  borderBottom: isLast ? undefined : `0.5 solid ${colors.sand}`,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ fontFamily: "Fraunces", fontSize: type.subhead, color: colors.ink }}>
                      {i + 1}. {role.name}
                    </Text>
                    {role.industry ? (
                      <Text style={{ fontSize: type.caption, color: colors.ink500, marginTop: 2 }}>
                        {role.industry}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: type.cardTitle, fontWeight: 600, color: tier.color }}>
                      {tier.text}
                    </Text>
                    <Text style={{ fontSize: type.caption, color: colors.ink500, marginTop: 2 }}>
                      {role.bandLow}–{role.bandHigh}%
                    </Text>
                  </View>
                </View>
                {/* Sáv-vizualizáció: halvány zóna a konfidencia-sávnak, teli a pontszámig */}
                <View
                  style={{
                    marginTop: 6,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.sand,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      left: `${role.bandLow}%`,
                      width: `${role.bandHigh - role.bandLow}%`,
                      top: 0,
                      bottom: 0,
                      backgroundColor: colors.sage,
                      opacity: 0.3,
                    }}
                  />
                  <View
                    style={{
                      width: `${role.score}%`,
                      height: "100%",
                      borderRadius: 2,
                      backgroundColor: colors.sage,
                    }}
                  />
                </View>
                {role.why ? (
                  <Text
                    style={{
                      fontSize: type.body,
                      color: colors.ink500,
                      lineHeight: type.lineHeight.body,
                      marginTop: 5,
                    }}
                  >
                    {role.why}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </PdfCard>

        {career.developNote ? (
          <PdfCard eyebrow={t("pdf.careerDevelop", locale)}>
            <Text style={{ ...s.bodyText, color: colors.ink }}>{career.developNote}</Text>
          </PdfCard>
        ) : null}

        <PdfCard eyebrow={t("pdf.careerMethod", locale)} tone="muted">
          <Text style={{ ...s.caption, color: colors.ink500 }}>
            {t("results.ccMethodBody3", locale)}
          </Text>
        </PdfCard>
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
