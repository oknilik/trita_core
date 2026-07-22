import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfComparisonOverview, PdfComparisonBars, PdfBlindspots } from "../components/PdfComparison";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t, tf } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

export function ReflectPage({ data, pageNum, totalPages, locale }: Props) {
  const obs = data.observerData;
  if (!obs) return null;

  const matchCount = obs.dimensions.filter((d) => Math.abs(d.self - d.observer) < 10).length;
  const diffCount = obs.dimensions.length - matchCount;
  const avgGap = Math.round(
    obs.dimensions.reduce((sum, d) => sum + Math.abs(d.self - d.observer), 0) / (obs.dimensions.length || 1),
  );
  const isGoodMatch = diffCount <= 2;

  const blindspots = obs.dimensions.filter((d) => Math.abs(d.self - d.observer) >= 10);
  const noBlindspots = obs.dimensions.filter((d) => Math.abs(d.self - d.observer) < 10).map((d) => d.name);

  // Topline summary for the overview card
  const toplineSummary = (() => {
    const bigGaps = obs.dimensions
      .filter((d) => Math.abs(d.self - d.observer) >= 15)
      .sort((a, b) => Math.abs(b.self - b.observer) - Math.abs(a.self - a.observer))
      .slice(0, 2);
    if (bigGaps.length === 0) {
      return t("pdf.toplineAligned", locale);
    }
    const joiner = locale === "hu" ? " és " : " and ";
    const names = bigGaps.map((d) => d.name.toLowerCase()).join(joiner);
    return tf("pdf.toplineGapPrefix", locale, { names });
  })();

  // Build summary sentence
  const topDiff = blindspots[0];
  const summarySentence = isGoodMatch
    ? t("pdf.summaryGoodMatch", locale) + (topDiff ? tf("pdf.summaryGoodMatchDeeper", locale, { name: topDiff.name.toLowerCase() }) : "")
    : t("pdf.summaryMixed", locale);

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader userName={data.userName} planLabel="Plus" date={data.completedAt} locale={locale} />

      <View style={{ flex: 1, padding: "0 28 12" }}>
        {/* ── Önkép vs. visszajelzés ── */}
        <PdfCard eyebrow={t("pdf.selfVsFeedback", locale)}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 11, color: colors.ink, marginBottom: 6 }}>
            {t("pdf.howDoOthersSeeYou", locale)}
          </Text>

          {/* Opening callout */}
          <PdfCalloutBox variant="sage">
            <Text style={{ fontSize: 7, color: colors.sageDark, lineHeight: 1.45 }}>
              {summarySentence}
            </Text>
          </PdfCalloutBox>

          {/* Overview */}
          <PdfComparisonOverview
            isGoodMatch={isGoodMatch}
            matchCount={matchCount}
            diffCount={diffCount}
            avgGap={avgGap}
            observerCount={obs.count}
            toplineSummary={toplineSummary}
            locale={locale}
          />

          {/* Bars */}
          <PdfComparisonBars dimensions={obs.dimensions} locale={locale} />
        </PdfCard>

        {/* ── Vakfoltok ── */}
        <PdfCard>
          <PdfBlindspots blindspots={blindspots} noBlindspots={noBlindspots} locale={locale} />
        </PdfCard>

        {/* ── Összegzés ── */}
        {obs.summaryPoints.length > 0 && (
          <View wrap={false} style={{ marginBottom: 8 }}>
            <PdfTakeaways takeaways={obs.summaryPoints} locale={locale} />
          </View>
        )}

        {/* ── Mit kezdj ezzel ── */}
        <View style={{ borderTop: `1 solid ${colors.sand}`, paddingTop: 6 }}>
          <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", color: colors.ink300, fontWeight: 600, marginBottom: 3 }}>
            {t("pdf.whatToDoWithThis", locale)}
          </Text>
          <Text style={{ fontSize: 7, color: colors.ink500, lineHeight: 1.45 }}>
            {t("pdf.whatToDoDescription", locale)}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
