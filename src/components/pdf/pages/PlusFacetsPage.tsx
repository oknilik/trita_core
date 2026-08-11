import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfFacets } from "../components/PdfFacets";
import { PdfAltruism } from "../components/PdfAltruism";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t, tf } from "@/lib/i18n";
import { withHuArticle } from "@/lib/hu-grammar";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
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
    d.facets.map((f) => ({ name: f.label, value: f.score, dimName: d.name, dimCode: d.code })),
  );
  const sortedFacets = [...allFacets].sort((a, b) => b.value - a.value);
  // „Kiemelkedő" (erősség-keretezésű) lista: a fordított Emocionalitás (E)
  // facetei KIMARADNAK — a magas Félelem/Szorongás nem „kiemelkedő erősség",
  // a zöld pill hamis keretezés volt (motor-audit v6, M4b; a bottom-lista
  // pólus-szabályának tükörpárja). 2026-08-11 óta ez már nem oldal-szintű
  // kivétel: a kanonikus kapu (strengthSlotEligible) a self-felületen is
  // kizárja a E-t, tehát az oldal a közös szabályt hívja.
  const topFacets = sortedFacets
    .filter((f) => strengthSlotEligible(f.dimCode, "self"))
    .slice(0, 5);
  // Alsó (fejlődés-keretezésű) lista: a fordított Emocionalitás (E)
  // facetei kimaradnak — az alacsony Félelem/Szorongás stabilitás, nem
  // „tér a fejlődésre" (motor-audit v4, FIX 2 pólus-szabály; kanonikus kapu:
  // score-valence.deficitSlotEligible).
  const bottomFacets = sortedFacets
    .filter((f) => deficitSlotEligible(f.dimCode))
    .slice(-4)
    .reverse();

  // Build a summary sentence from top/bottom facets
  const facetSummaryText = (() => {
    const topNames = topFacets.slice(0, 3).map((f) => f.name.toLowerCase()).join(", ");
    const bottomName = bottomFacets[0]?.name.toLowerCase() ?? "";
    if (!topNames) return "";
    return tf("pdf.facetStandout", locale, { topNames }) + (bottomName ? tf("pdf.facetGrowth", locale, { bottomName }) : "");
  })();

  // Overall summary for the closing card
  const overallSummary = (() => {
    // A E a magas-összegzésből is kimarad — a facet-pillekkel (topFacets)
    // és a kanonikus kapuval konzisztensen: a zöld pillek közül kizárt
    // dimenzió nem lehet egy bekezdéssel lejjebb „a profilod erőssége".
    // Ha emiatt SEM magas, SEM alacsony tétel nem marad (pl. valakinek
    // egyedül a E megy 70 fölé), a kártya a kiegyensúlyozott-profil
    // szövegre esik vissza — cím nem marad tartalom nélkül.
    const highDims = facetDims.filter(
      (d) => d.value >= 70 && strengthSlotEligible(d.code, "self"),
    );
    // Az alacsony E nem „tudatos figyelmet érdemlő" terület (fordított
    // skála: alacsony = stabil) — a low-listából kimarad.
    const lowDims = facetDims.filter(
      (d) => d.value < 40 && deficitSlotEligible(d.code),
    );
    if (highDims.length === 0 && lowDims.length === 0) {
      return t("pdf.facetBalanced", locale);
    }
    // HU-sablonokba kész névelős alakot adunk át („az integritás", „A nyitottság") —
    // az „a(z)" sablon-műtermék helyett (hu-grammar.withHuArticle).
    const hu = locale === "hu";
    const highNamesRaw = highDims.map((d) => d.name.toLowerCase()).join(", ");
    const lowNamesRaw = lowDims.map((d) => d.name.toLowerCase()).join(", ");
    const highNames = hu ? withHuArticle(highNamesRaw) : highNamesRaw;
    if (highDims.length > 0 && lowDims.length > 0) {
      const lowNames = hu ? withHuArticle(lowNamesRaw, { capitalize: true }) : lowNamesRaw;
      return tf("pdf.facetHighAndLow", locale, { highNames, lowNames });
    }
    if (highDims.length > 0) {
      return tf("pdf.facetHighOnly", locale, { highNames });
    }
    const lowNames = hu ? withHuArticle(lowNamesRaw, { capitalize: true }) : lowNamesRaw;
    return tf("pdf.facetLowOnly", locale, { lowNames });
  })();

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader userName={data.userName} planLabel={planLabel} date={data.completedAt} locale={locale} />

      <View style={{ padding: "0 28 0" }}>
        {/* ── Alskálák részletesen — hosszú blokk, ez az egyetlen kártya,
            amely oldalhatáron törhet (wrap); a belső elemek egyben maradnak ── */}
        <PdfCard eyebrow={t("pdf.subscalesInDetail", locale)} wrap>
          {/* Top facet highlight callout */}
          {allFacets.length > 0 && (
            <View wrap={false} style={{ backgroundColor: colors.sage100, borderLeft: `2 solid ${colors.sage}`, borderTopRightRadius: 5, borderBottomRightRadius: 5, padding: "5 8", marginBottom: 6 }}>
              <Text style={{ fontSize: 6, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 700, color: colors.sageDark, marginBottom: 4 }}>
                {t("pdf.topSubscales", locale)}
              </Text>
              {/* High facets — sage pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 3 }}>
                {topFacets.map((f) => (
                  <Text key={f.name} style={{ fontSize: 6.5, padding: "2 6", borderRadius: 999, backgroundColor: "rgba(61,107,94,0.12)", color: colors.sage, fontWeight: 500 }}>
                    {f.name} {f.value}
                  </Text>
                ))}
              </View>
              {/* Low facets — bronze pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                {bottomFacets.map((f) => (
                  <Text key={f.name} style={{ fontSize: 6.5, padding: "2 6", borderRadius: 999, backgroundColor: "rgba(193,127,74,0.1)", color: colors.bronzeDark, fontWeight: 500 }}>
                    {f.name} {f.value}
                  </Text>
                ))}
              </View>
              {/* Summary sentence */}
              {facetSummaryText && (
                <Text style={{ fontSize: 7.5, color: colors.sageDark, lineHeight: 1.35 }}>
                  {facetSummaryText}
                </Text>
              )}
            </View>
          )}

          <PdfFacets dimensions={facetDims} compact locale={locale} />
        </PdfCard>

        {/* ── Altruizmus kiegészítő skála ── */}
        {data.altruism && (
          <PdfCard>
            <PdfAltruism value={data.altruism.value} description={data.altruism.description} locale={locale} />
          </PdfCard>
        )}

        {/* ── Összegzés — meleg zárókártya a korábbi sötét doboz helyett ── */}
        <View wrap={false} style={{ backgroundColor: colors.sage100, borderRadius: 8, border: `1 solid rgba(61,107,94,0.15)`, padding: "8 10" }}>
          <Text style={{ fontSize: 5.5, letterSpacing: 1, textTransform: "uppercase", color: colors.sageDark, fontWeight: 600, marginBottom: 3 }}>
            {t("pdf.whatDoesThisMeanOverall", locale)}
          </Text>
          <Text style={{ fontSize: 7.5, color: colors.sageDark, lineHeight: 1.4 }}>
            {overallSummary}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
