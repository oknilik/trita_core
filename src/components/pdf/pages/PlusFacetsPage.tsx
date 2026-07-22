import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfFacets } from "../components/PdfFacets";
import { PdfAltruism } from "../components/PdfAltruism";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t, tf } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

export function PlusFacetsPage({ data, pageNum, totalPages, locale }: Props) {
  const facetDims = data.facetDimensions ?? [];
  const planLabel = "Plus";

  // Collect all facets across dimensions for the highlight callout
  const allFacets = facetDims.flatMap((d) =>
    d.facets.map((f) => ({ name: f.label, value: f.score, dimName: d.name })),
  );
  const sortedFacets = [...allFacets].sort((a, b) => b.value - a.value);
  const topFacets = sortedFacets.slice(0, 5);
  const bottomFacets = sortedFacets.slice(-4).reverse();

  // Build a summary sentence from top/bottom facets
  const facetSummaryText = (() => {
    const topNames = topFacets.slice(0, 3).map((f) => f.name.toLowerCase()).join(", ");
    const bottomName = bottomFacets[0]?.name.toLowerCase() ?? "";
    if (!topNames) return "";
    return tf("pdf.facetStandout", locale, { topNames }) + (bottomName ? tf("pdf.facetGrowth", locale, { bottomName }) : "");
  })();

  // Overall summary for the closing card
  const overallSummary = (() => {
    const highDims = facetDims.filter((d) => d.value >= 70);
    const lowDims = facetDims.filter((d) => d.value < 40);
    if (highDims.length === 0 && lowDims.length === 0) {
      return t("pdf.facetBalanced", locale);
    }
    const highNames = highDims.map((d) => d.name.toLowerCase()).join(", ");
    const lowNames = lowDims.map((d) => d.name.toLowerCase()).join(", ");
    if (highDims.length > 0 && lowDims.length > 0) {
      return tf("pdf.facetHighAndLow", locale, { highNames, lowNames });
    }
    if (highDims.length > 0) {
      return tf("pdf.facetHighOnly", locale, { highNames });
    }
    return tf("pdf.facetLowOnly", locale, { lowNames });
  })();

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader userName={data.userName} planLabel={planLabel} date={data.completedAt} locale={locale} />

      <View style={{ flex: 1, padding: "0 28 12" }}>
        {/* ── Alskálák részletesen ── */}
        <PdfCard eyebrow={t("pdf.subscalesInDetail", locale)}>
          {/* Top facet highlight callout */}
          {allFacets.length > 0 && (
            <View style={{ backgroundColor: colors.sage100, borderLeft: `2 solid ${colors.sage}`, borderTopRightRadius: 5, borderBottomRightRadius: 5, padding: "6 8", marginBottom: 8 }}>
              <Text style={{ fontSize: 5.5, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700, color: colors.sageDark, marginBottom: 4 }}>
                {t("pdf.topSubscales", locale)}
              </Text>
              {/* High facets — sage pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 3 }}>
                {topFacets.map((f) => (
                  <Text key={f.name} style={{ fontSize: 6, padding: "2 6", borderRadius: 999, backgroundColor: "rgba(61,107,94,0.12)", color: colors.sage, fontWeight: 500 }}>
                    {f.name} {f.value}
                  </Text>
                ))}
              </View>
              {/* Low facets — bronze pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                {bottomFacets.map((f) => (
                  <Text key={f.name} style={{ fontSize: 6, padding: "2 6", borderRadius: 999, backgroundColor: "rgba(193,127,74,0.1)", color: colors.bronzeDark, fontWeight: 500 }}>
                    {f.name} {f.value}
                  </Text>
                ))}
              </View>
              {/* Summary sentence */}
              {facetSummaryText && (
                <Text style={{ fontSize: 7, color: colors.sageDark, lineHeight: 1.35 }}>
                  {facetSummaryText}
                </Text>
              )}
            </View>
          )}

          <PdfFacets dimensions={facetDims} compact />
        </PdfCard>

        {/* ── Altruizmus kiegészítő skála ── */}
        {data.altruism && (
          <PdfCard>
            <PdfAltruism value={data.altruism.value} description={data.altruism.description} locale={locale} />
          </PdfCard>
        )}

        {/* ── Összegzés — meleg zárókártya a korábbi sötét doboz helyett ── */}
        <View style={{ backgroundColor: colors.sage100, borderRadius: 8, border: `1 solid rgba(61,107,94,0.15)`, padding: "8 10" }}>
          <Text style={{ fontSize: 5, letterSpacing: 1, textTransform: "uppercase", color: colors.sageDark, fontWeight: 600, marginBottom: 3 }}>
            {t("pdf.whatDoesThisMeanOverall", locale)}
          </Text>
          <Text style={{ fontSize: 7, color: colors.sageDark, lineHeight: 1.4 }}>
            {overallSummary}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
