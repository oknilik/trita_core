import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfComparisonOverview, PdfComparisonBars, PdfBlindspots } from "../components/PdfComparison";
import { PdfTakeaways } from "../components/PdfTakeaways";
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

  return (
    <Page size="A4" style={s.page}>
      <View style={{ padding: "16 40 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: "rgba(26,26,46,0.2)" }}>trita</Text>
        <Text style={{ fontSize: 7, color: colors.ink300 }}>
          {data.userName} · Személyiségprofil · Self Reflect · {data.completedAt}
        </Text>
      </View>

      <View style={{ padding: "0 40 16" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>Önkép vs. Visszajelzés</Text>
        </View>
        <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: colors.ink, marginBottom: 10 }}>
          Hogyan látnak mások?
        </Text>

        <PdfComparisonOverview
          isGoodMatch={isGoodMatch}
          matchCount={matchCount}
          diffCount={diffCount}
          avgGap={avgGap}
          observerCount={obs.count}
        />
        <PdfComparisonBars dimensions={obs.dimensions} />
        <PdfBlindspots blindspots={blindspots} noBlindspots={noBlindspots} />
        <PdfTakeaways takeaways={obs.summaryPoints} />
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
