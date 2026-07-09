import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfFacets } from "../components/PdfFacets";
import { PdfAltruism } from "../components/PdfAltruism";
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

  // Overall summary for the dark box at the bottom
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
      {/* Mini header */}
      <View style={{ padding: "10 32 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `1 solid ${colors.cream500}`, paddingBottom: 5, marginBottom: 4 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: "rgba(26,26,46,0.2)" }}>
          tri<Text style={{ color: "rgba(193,127,74,0.5)" }}>ta</Text>
        </Text>
        <Text style={{ fontSize: 6, color: colors.ink300 }}>
          {data.userName} · {t("pdf.personalityProfile", locale)} · {planLabel} · {data.completedAt}
        </Text>
      </View>

      <View style={{ flex: 1, padding: "0 32 12" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4, marginTop: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>{t("pdf.subscalesInDetail", locale)}</Text>
        </View>

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

        {/* Altruism supplementary scale — after all facets, visually separated */}
        {data.altruism && (
          <View style={{ marginTop: 10 }}>
            <PdfAltruism value={data.altruism.value} description={data.altruism.description} locale={locale} />
          </View>
        )}

        {/* Overall summary dark box */}
        <View style={{ backgroundColor: colors.ink, borderRadius: 5, padding: "8 10", marginTop: 6 }}>
          <Text style={{ fontSize: 5, letterSpacing: 1, textTransform: "uppercase", color: colors.bronzeLight, marginBottom: 3 }}>
            {t("pdf.whatDoesThisMeanOverall", locale)}
          </Text>
          <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.45)", lineHeight: 1.35 }}>
            {overallSummary}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
