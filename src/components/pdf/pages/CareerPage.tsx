import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

// ─────────────────────────────────────────────────────────────────────
// Karrier-iránytű oldal (karrier-modul felújítás, 2026-07-29) — a webes
// eredmény exportja: top irányok konfidencia-sávval, fejlődési fókusz,
// módszertani keret. Csak akkor kerül a riportba, ha a user kitöltötte
// a Karrier-iránytű wizardot (van career-adat).
// ─────────────────────────────────────────────────────────────────────

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

function tierLabel(score: number, locale: "hu" | "en"): { text: string; color: string } {
  if (score >= 70) return { text: t("results.ccTierStrong", locale), color: colors.sageDark };
  if (score >= 55) return { text: t("results.ccTierGood", locale), color: colors.ink };
  return { text: t("results.ccTierConditional", locale), color: colors.bronze };
}

export function CareerPage({ data, pageNum, totalPages, locale }: Props) {
  const career = data.career;
  if (!career) return null;

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader
        userName={data.userName}
        planLabel={t("pdf.careerPageTitle", locale)}
        date={data.completedAt}
        locale={locale}
      />
      <View style={s.body}>
        <PdfCard eyebrow={t("pdf.careerTopDirections", locale)}>
          {career.roles.map((role, i) => {
            const tier = tierLabel(role.score, locale);
            return (
              <View
                key={role.name}
                style={{
                  marginBottom: i === career.roles.length - 1 ? 0 : 7,
                  paddingBottom: i === career.roles.length - 1 ? 0 : 7,
                  borderBottom:
                    i === career.roles.length - 1 ? undefined : `0.5 solid ${colors.sand}`,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: "Fraunces", fontSize: 10.5, color: colors.ink }}>
                      {i + 1}. {role.name}
                    </Text>
                    <Text style={{ fontSize: 7.5, color: colors.ink500, marginTop: 1 }}>
                      {role.industry}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 8, fontWeight: 600, color: tier.color }}>
                      {tier.text}
                    </Text>
                    <Text style={{ fontSize: 6.5, color: colors.ink500, marginTop: 1 }}>
                      {role.bandLow}–{role.bandHigh}%
                    </Text>
                  </View>
                </View>
                {/* Sáv-vizualizáció: halvány zóna a konfidencia-sávnak, teli a pontszámig */}
                <View
                  style={{
                    marginTop: 4,
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
                  <Text style={{ fontSize: 7.5, color: colors.ink500, lineHeight: 1.45, marginTop: 3 }}>
                    {role.why}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </PdfCard>

        {career.developNote ? (
          <PdfCard eyebrow={t("pdf.careerDevelop", locale)}>
            <Text style={{ fontSize: 8, color: colors.ink, lineHeight: 1.5 }}>
              {career.developNote}
            </Text>
          </PdfCard>
        ) : null}

        <PdfCard eyebrow={t("pdf.careerMethod", locale)}>
          <Text style={{ fontSize: 6.5, color: colors.ink500, lineHeight: 1.5 }}>
            {t("results.ccMethodBody3", locale)}
          </Text>
        </PdfCard>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
