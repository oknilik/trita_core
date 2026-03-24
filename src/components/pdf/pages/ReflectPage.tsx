import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfComparisonOverview, PdfComparisonBars, PdfBlindspots } from "../components/PdfComparison";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function ReflectPage({ data, pageNum, totalPages }: Props) {
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

  // Build summary sentence
  const topDiff = blindspots[0];
  const summarySentence = isGoodMatch
    ? `Összességében reálisan látod magad — a legtöbb dimenzióban az önképed és mások visszajelzése közel azonos.${topDiff ? ` A${topDiff.name.startsWith("É") ? "z" : ""} ${topDiff.name.toLowerCase()} területén érdemes mélyebbre nézni.` : ""}`
    : `Néhány dimenzióban jelentős eltérés van az önképed és mások visszajelzése között. Ez nem probléma — hanem lehetőség a mélyebb önismeretre.`;

  return (
    <Page size="A4" style={s.page}>
      <View style={{ padding: "16 40 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: "rgba(26,26,46,0.2)" }}>trita</Text>
        <Text style={{ fontSize: 7, color: colors.ink300 }}>
          {data.userName} · Személyiségprofil · Self Reflect · {data.completedAt}
        </Text>
      </View>

      <View style={{ padding: "0 40 16" }}>
        {/* Section header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>Önkép vs. Visszajelzés</Text>
        </View>
        <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: colors.ink, marginBottom: 8 }}>
          Hogyan látnak mások?
        </Text>

        {/* Opening callout */}
        <PdfCalloutBox variant="sage">
          <Text style={{ fontSize: 8.5, color: colors.sageDark, lineHeight: 1.5 }}>
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
        />

        {/* Bars */}
        <PdfComparisonBars dimensions={obs.dimensions} />

        {/* Blindspots */}
        <PdfBlindspots blindspots={blindspots} noBlindspots={noBlindspots} />

        {/* Summary */}
        {obs.summaryPoints.length > 0 && (
          <PdfTakeaways takeaways={obs.summaryPoints} />
        )}

        {/* Mit kezdj ezzel? */}
        <View style={{ borderTop: `1 solid ${colors.cream500}`, paddingTop: 8, marginTop: 12 }}>
          <Text style={{ fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: colors.ink300, fontWeight: 600, marginBottom: 4 }}>
            Mit kezdj ezzel?
          </Text>
          <Text style={{ fontSize: 8, color: colors.ink500, lineHeight: 1.5 }}>
            Az eltérések nem hibák, hanem jelzések: ott érdemes mélyebbre menni, ahol te mást érzel magadról,
            mint amit mások rendszeresen látnak. Figyelj rá a következő hetekben, és kérdezd meg a visszajelzőidet,
            mire gondoltak konkrétan.
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
