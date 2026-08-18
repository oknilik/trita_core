import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfComparisonOverview, PdfComparisonBars, PdfBlindspots } from "../components/PdfComparison";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { PdfChapterHeader } from "../components/PdfChapterHeader";
import { t, tf } from "@/lib/i18n";
import { withHuArticle } from "@/lib/hu-grammar";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import type { ProfileReportViewModel } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// Melléklet · Külső nézőpont — MÉRT adat (a visszajelzők átlaga), ezért a
// melléklet-fejléc is így nevezi meg. Csak akkor kerül a riportba, ha a
// reveal-küszöb (n ≥ 3) teljesült.
//
// Egyezés/eltérés-kapu: a kanonikus DIFF_MIN_GAP (= round(√2·SEM)) — a
// képernyős összevetéssel és a PdfComparison sáv-kiemeléssel AZONOS küszöb.
// ─────────────────────────────────────────────────────────────────────────────

export function AppendixObserverPage({ model }: { model: ProfileReportViewModel }) {
  const { locale, identity, observer } = model;
  if (!observer) return null;

  const matchCount = observer.dimensions.filter((d) => Math.abs(d.self - d.observer) < DIFF_MIN_GAP).length;
  const diffCount = observer.dimensions.length - matchCount;
  const avgGap = Math.round(
    observer.dimensions.reduce((sum, d) => sum + Math.abs(d.self - d.observer), 0) /
      (observer.dimensions.length || 1),
  );
  const isGoodMatch = diffCount <= 2;

  const blindspots = observer.dimensions.filter((d) => Math.abs(d.self - d.observer) >= DIFF_MIN_GAP);
  const noBlindspots = observer.dimensions
    .filter((d) => Math.abs(d.self - d.observer) < DIFF_MIN_GAP)
    .map((d) => d.name);

  const toplineSummary = (() => {
    const bigGaps = [...blindspots]
      .sort((a, b) => Math.abs(b.self - b.observer) - Math.abs(a.self - a.observer))
      .slice(0, 2);
    if (bigGaps.length === 0) return t("pdf.toplineAligned", locale);
    const joiner = locale === "hu" ? " és " : " and ";
    const namesRaw = bigGaps.map((d) => d.name.toLowerCase()).join(joiner);
    const names = locale === "hu" ? withHuArticle(namesRaw) : namesRaw;
    return tf("pdf.toplineGapPrefix", locale, { names });
  })();

  const topDiff = blindspots[0];
  const summarySentence = isGoodMatch
    ? t("pdf.summaryGoodMatch", locale) +
      (topDiff
        ? tf("pdf.summaryGoodMatchDeeper", locale, {
            name:
              locale === "hu"
                ? withHuArticle(topDiff.name.toLowerCase(), { capitalize: true })
                : topDiff.name.toLowerCase(),
          })
        : "")
    : t("pdf.summaryMixed", locale);

  return (
    <Page size="A4" style={s.page} bookmark={{ title: t("pdf.appendixObserverTitle", locale) }}>
      <PdfMiniHeader
        userName={identity.userName}
        planLabel="Plus"
        date={identity.completedAt}
        locale={locale}
      />

      <View style={s.body}>
        <PdfChapterHeader
          numberIsLabel
          number={t("pdf.appendixEyebrow", locale)}
          question={t("pdf.howDoOthersSeeYou", locale)}
          title={t("pdf.appendixObserverTitle", locale)}
          description={t("pdf.appendixObserverNote", locale)}
        />

        <PdfCard eyebrow={t("pdf.selfVsFeedback", locale)}>
          <PdfCalloutBox variant="sage">
            <Text style={{ fontSize: type.body, color: colors.sageDark, lineHeight: type.lineHeight.body }}>
              {summarySentence}
            </Text>
          </PdfCalloutBox>

          <PdfComparisonOverview
            isGoodMatch={isGoodMatch}
            matchCount={matchCount}
            diffCount={diffCount}
            avgGap={avgGap}
            observerCount={observer.count}
            toplineSummary={toplineSummary}
            locale={locale}
          />

          <PdfComparisonBars dimensions={observer.dimensions} locale={locale} />
        </PdfCard>

        <PdfCard>
          <PdfBlindspots blindspots={blindspots} noBlindspots={noBlindspots} locale={locale} />
        </PdfCard>

        <PdfCard eyebrow={t("pdf.whatToDoWithThis", locale)} tone="muted">
          <Text style={{ ...s.caption, color: colors.ink500 }}>
            {t("pdf.whatToDoDescription", locale)}
          </Text>
        </PdfCard>
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
