import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfHeader } from "../components/PdfHeader";
import { PdfFooter } from "../components/PdfFooter";
import { PdfInsightPair } from "../components/PdfInsightPair";
import { PdfDimStrip } from "../components/PdfDimStrip";
import { PdfDimDetails } from "../components/PdfDimDetails";
import { PdfBelbin } from "../components/PdfBelbin";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import { t } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

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
        <Text style={s.sectionEyebrowFirst}>
          {t("pdf.overview", locale)}
        </Text>
        <PdfInsightPair strengths={data.strengthBullets} watchAreas={data.watchBullets} locale={locale} />

        {/* ── Dimenziók ── */}
        <View style={s.sectionDivider} />
        <Text style={s.sectionEyebrowFirst}>
          {t("pdf.personalityDimensions", locale)}
        </Text>
        <PdfDimStrip dimensions={data.dimensions} />

        {/* Profil karakter callout */}
        {data.profileCharacter && (
          <PdfCalloutBox variant="sage" title={t("pdf.keyProfileCharacter", locale)}>
            <Text style={{ fontSize: 7, color: colors.sageDark, lineHeight: 1.45 }}>
              {data.profileCharacter}
            </Text>
          </PdfCalloutBox>
        )}

        {/* ── Top 3 dimenzió ── */}
        <View style={s.sectionDivider} />
        <Text style={s.sectionEyebrowFirst}>
          {t("pdf.dimensionsInDetail", locale)}
        </Text>
        <PdfDimDetails dimensions={data.dimensions} />

        {/* ── Belbin ── */}
        <View style={s.sectionDivider} />
        <Text style={s.sectionEyebrowFirst}>
          {t("pdf.teamRoles", locale)}
        </Text>
        <PdfBelbin roles={data.belbinRoles} />

        {/* ── Start upsell ── */}
        {!hasPlus && (
          <>
            <View style={s.sectionDivider} />
            <View style={{ backgroundColor: colors.cream300, borderRadius: 5, padding: 8, marginBottom: 6 }}>
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
          </>
        )}

      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
