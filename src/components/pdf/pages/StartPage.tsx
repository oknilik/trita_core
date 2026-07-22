import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfHeader } from "../components/PdfHeader";
import { PdfFooter } from "../components/PdfFooter";
import { PdfInsightPair } from "../components/PdfInsightPair";
import { PdfDimStrip } from "../components/PdfDimStrip";
import { PdfDimDetails } from "../components/PdfDimDetails";
import { PdfTeamRoles } from "../components/PdfTeamRoles";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import { CardEyebrow } from "../components/PdfCard";
import { t } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

// Az élő riport tükre: krém vásznon fehér kártya-szekciók, bronz
// eyebrow-fejlécekkel (a felület DashboardPanel + SectionHeader párja).

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

export function StartPage({ data, pageNum, totalPages, locale }: Props) {
  const hasPlus = data.plan === "plus";

  return (
    <Page size="A4" style={s.page}>
      <PdfHeader
        name={data.userName}
        date={data.completedAt}
        type={data.personalityType}
        percentile={data.percentile}
        insight={data.heroInsight}
        plan={data.plan}
        locale={locale}
        topDimensions={data.topDimensions}
        watchDimensions={data.watchDimensions}
      />
      <View style={s.body}>
        {/* ── Áttekintés ── */}
        <View style={s.card}>
          <CardEyebrow label={t("pdf.overview", locale)} />
          <PdfInsightPair strengths={data.strengthBullets} watchAreas={data.watchBullets} locale={locale} />
        </View>

        {/* ── Dimenziók ── */}
        <View style={s.card}>
          <CardEyebrow label={t("pdf.personalityDimensions", locale)} />
          <PdfDimStrip dimensions={data.dimensions} />

          {/* Profil karakter callout */}
          {data.profileCharacter && (
            <PdfCalloutBox variant="sage" title={t("pdf.keyProfileCharacter", locale)}>
              <Text style={{ fontSize: 7, color: colors.sageDark, lineHeight: 1.45 }}>
                {data.profileCharacter}
              </Text>
            </PdfCalloutBox>
          )}
        </View>

        {/* ── Top 3 dimenzió részletesen ── */}
        <View style={s.card}>
          <CardEyebrow label={t("pdf.dimensionsInDetail", locale)} />
          <PdfDimDetails dimensions={data.dimensions} />
        </View>

        {/* ── Csapatszerepek ── */}
        <View style={s.card}>
          <CardEyebrow label={t("pdf.teamRoles", locale)} />
          <PdfTeamRoles roles={data.teamRoleRoles} />
        </View>

        {/* ── Start upsell ── */}
        {!hasPlus && (
          <View style={{ backgroundColor: colors.cream300, borderRadius: 8, border: `1 solid ${colors.sand}`, padding: "8 10" }}>
            <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: colors.ink, marginBottom: 3 }}>
              {t("pdf.wantToGoDeeper", locale)}
            </Text>
            <View>
              <Text style={{ fontSize: 6, fontWeight: 600, color: colors.bronze, marginBottom: 2 }}>Plus · €9</Text>
              <Text style={{ fontSize: 6, color: colors.ink500, lineHeight: 1.4 }}>
                {t("pdf.upsellDescription", locale)}
              </Text>
            </View>
            <Text style={{ fontSize: 5, color: colors.ink300, marginTop: 3 }}>trita.io/profile → {t("pdf.upsellUnlock", locale)}</Text>
          </View>
        )}
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
