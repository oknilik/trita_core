import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfComparisonOverview, PdfComparisonBars, PdfBlindspots } from "../components/PdfComparison";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
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
      <View style={{ padding: "10 32 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `1 solid ${colors.cream500}`, paddingBottom: 5, marginBottom: 4 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: "rgba(26,26,46,0.2)" }}>tri<Text style={{ color: "rgba(193,127,74,0.5)" }}>ta</Text></Text>
        <Text style={{ fontSize: 6, color: colors.ink300 }}>
          {data.userName} · {t("pdf.personalityProfile", locale)} · Plus · {data.completedAt}
        </Text>
      </View>

      <View style={{ flex: 1, padding: "0 32 12" }}>
        {/* Section header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>{t("pdf.selfVsFeedback", locale)}</Text>
        </View>
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

        {/* Blindspots */}
        <PdfBlindspots blindspots={blindspots} noBlindspots={noBlindspots} locale={locale} />

        {/* Summary */}
        {obs.summaryPoints.length > 0 && (
          <PdfTakeaways takeaways={obs.summaryPoints} locale={locale} />
        )}

        {/* What to do with this */}
        <View style={{ borderTop: `1 solid ${colors.cream500}`, paddingTop: 6, marginTop: 8 }}>
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
