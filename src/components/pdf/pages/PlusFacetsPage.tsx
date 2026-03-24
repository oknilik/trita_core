import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfFacets } from "../components/PdfFacets";
import { PdfAltruism } from "../components/PdfAltruism";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function PlusFacetsPage({ data, pageNum, totalPages }: Props) {
  const facetDims = data.facetDimensions ?? [];
  const hasReflect = data.plan === "reflect";
  const planLabel = hasReflect ? "Self Reflect" : "Self Plus";
  const isHu = true; // TODO: pass locale

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
    return isHu
      ? `Kiemelkedő: ${topNames}. ${bottomName ? `Az alacsonyabb ${bottomName} nem hiányosság — inkább azt jelzi, merre van még tér a fejlődésre.` : ""}`
      : `Standout: ${topNames}. ${bottomName ? `Lower ${bottomName} isn't a weakness — it signals where there's room for growth.` : ""}`;
  })();

  // Overall summary for the dark box at the bottom
  const overallSummary = (() => {
    const highDims = facetDims.filter((d) => d.value >= 70);
    const lowDims = facetDims.filter((d) => d.value < 40);
    if (highDims.length === 0 && lowDims.length === 0) {
      return isHu
        ? "Kiegyensúlyozott profil — nincs szélsőségesen magas vagy alacsony dimenzió. Ez rugalmasságot jelent, de kevesebb természetes szupererőt."
        : "Balanced profile — no extremely high or low dimensions. This means flexibility, but fewer natural 'superpowers'.";
    }
    const highNames = highDims.map((d) => d.name.toLowerCase()).join(", ");
    const lowNames = lowDims.map((d) => d.name.toLowerCase()).join(", ");
    if (highDims.length > 0 && lowDims.length > 0) {
      return isHu
        ? `Profilod erőssége a(z) ${highNames} területén koncentrálódik. A(z) ${lowNames} alacsonyabb szintje nem probléma — inkább azt jelzi, hol érdemes tudatosabban működnöd.`
        : `Your profile's strength is concentrated in ${highNames}. Lower ${lowNames} isn't a problem — it signals where to operate more consciously.`;
    }
    if (highDims.length > 0) {
      return isHu
        ? `Erős, karakteres profil — a(z) ${highNames} kiemelkedő, és nincs kritikusan alacsony dimenzió.`
        : `Strong, distinctive profile — ${highNames} stands out, with no critically low dimensions.`;
    }
    return isHu
      ? `A(z) ${lowNames} alacsonyabb szintje tudatos figyelmet érdemel — ezek a területek fejlődési lehetőséget rejtenek.`
      : `Lower ${lowNames} deserves conscious attention — these areas hold growth potential.`;
  })();

  return (
    <Page size="A4" style={s.page}>
      {/* Mini header */}
      <View style={{ padding: "10 32 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `1 solid ${colors.cream500}`, paddingBottom: 5, marginBottom: 4 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: "rgba(26,26,46,0.2)" }}>
          tri<Text style={{ color: "rgba(193,127,74,0.5)" }}>ta</Text>
        </Text>
        <Text style={{ fontSize: 6, color: colors.ink300 }}>
          {data.userName} · {isHu ? "Személyiségprofil" : "Personality profile"} · {planLabel} · {data.completedAt}
        </Text>
      </View>

      <View style={{ flex: 1, padding: "0 32 12" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4, marginTop: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>{isHu ? "Alskálák részletesen" : "Subscales in detail"}</Text>
        </View>

        {/* Top facet highlight callout */}
        {allFacets.length > 0 && (
          <View style={{ backgroundColor: colors.sage100, borderLeft: `2 solid ${colors.sage}`, borderTopRightRadius: 5, borderBottomRightRadius: 5, padding: "6 8", marginBottom: 8 }}>
            <Text style={{ fontSize: 5.5, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700, color: colors.sageDark, marginBottom: 4 }}>
              {isHu ? "Kiemelkedő alskálák" : "Top subscales"}
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
            <PdfAltruism value={data.altruism.value} description={data.altruism.description} />
          </View>
        )}

        {/* Overall summary dark box */}
        <View style={{ backgroundColor: colors.ink, borderRadius: 5, padding: "8 10", marginTop: 6 }}>
          <Text style={{ fontSize: 5, letterSpacing: 1, textTransform: "uppercase", color: colors.bronzeLight, marginBottom: 3 }}>
            {isHu ? "Mit jelent ez összességében?" : "What does this mean overall?"}
          </Text>
          <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.45)", lineHeight: 1.35 }}>
            {overallSummary}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
