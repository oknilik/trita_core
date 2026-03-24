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
  const isHu = true; // TODO: pass locale

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
      return isHu
        ? "Az önképed és mások visszajelzése a legtöbb dimenzióban közel azonos — reálisan látod magad."
        : "Your self-image and others' feedback align closely in most dimensions — you see yourself realistically.";
    }
    const names = bigGaps.map((d) => d.name.toLowerCase()).join(isHu ? " és " : " and ");
    return isHu
      ? `A legnagyobb eltérés a(z) ${names} területén látszik. Érdemes ezekre különösen odafigyelni.`
      : `The biggest gaps appear in ${names}. These are worth paying close attention to.`;
  })();

  // Build summary sentence
  const topDiff = blindspots[0];
  const summarySentence = isGoodMatch
    ? (isHu
        ? `Összességében reálisan látod magad — a legtöbb dimenzióban az önképed és mások visszajelzése közel azonos.${topDiff ? ` A${topDiff.name.startsWith("É") ? "z" : ""} ${topDiff.name.toLowerCase()} területén érdemes mélyebbre nézni.` : ""}`
        : `Overall, you see yourself realistically — your self-image and others' feedback are closely aligned in most dimensions.${topDiff ? ` It's worth looking deeper at ${topDiff.name.toLowerCase()}.` : ""}`)
    : (isHu
        ? "Néhány dimenzióban jelentős eltérés van az önképed és mások visszajelzése között. Ez nem probléma — hanem lehetőség a mélyebb önismeretre."
        : "There are significant gaps in some dimensions between your self-image and others' feedback. This isn't a problem — it's an opportunity for deeper self-awareness.");

  return (
    <Page size="A4" style={s.page}>
      <View style={{ padding: "10 32 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `1 solid ${colors.cream500}`, paddingBottom: 5, marginBottom: 4 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: "rgba(26,26,46,0.2)" }}>tri<Text style={{ color: "rgba(193,127,74,0.5)" }}>ta</Text></Text>
        <Text style={{ fontSize: 6, color: colors.ink300 }}>
          {data.userName} · {isHu ? "Személyiségprofil" : "Personality profile"} · Self Reflect · {data.completedAt}
        </Text>
      </View>

      <View style={{ flex: 1, padding: "0 32 12" }}>
        {/* Section header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>{isHu ? "Önkép vs. Visszajelzés" : "Self-image vs. Feedback"}</Text>
        </View>
        <Text style={{ fontFamily: "Fraunces", fontSize: 11, color: colors.ink, marginBottom: 6 }}>
          {isHu ? "Hogyan látnak mások?" : "How do others see you?"}
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
          isHu={isHu}
        />

        {/* Bars */}
        <PdfComparisonBars dimensions={obs.dimensions} isHu={isHu} />

        {/* Blindspots */}
        <PdfBlindspots blindspots={blindspots} noBlindspots={noBlindspots} isHu={isHu} />

        {/* Summary */}
        {obs.summaryPoints.length > 0 && (
          <PdfTakeaways takeaways={obs.summaryPoints} />
        )}

        {/* What to do with this */}
        <View style={{ borderTop: `1 solid ${colors.cream500}`, paddingTop: 6, marginTop: 8 }}>
          <Text style={{ fontSize: 6, letterSpacing: 1, textTransform: "uppercase", color: colors.ink300, fontWeight: 600, marginBottom: 3 }}>
            {isHu ? "Mit kezdj ezzel?" : "What to do with this?"}
          </Text>
          <Text style={{ fontSize: 7, color: colors.ink500, lineHeight: 1.45 }}>
            {isHu
              ? "Az eltérések nem hibák, hanem jelzések: ott érdemes mélyebbre menni, ahol te mást érzel magadról, mint amit mások rendszeresen látnak. Figyelj rá a következő hetekben, és kérdezd meg a visszajelzőidet, mire gondoltak konkrétan."
              : "Differences aren't mistakes — they're signals. It's worth going deeper where your self-perception differs from what others consistently see. Pay attention in the coming weeks and ask your observers what they had in mind specifically."}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
