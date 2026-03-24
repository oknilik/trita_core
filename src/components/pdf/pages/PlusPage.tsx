import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfFacets } from "../components/PdfFacets";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTakeaways } from "../components/PdfTakeaways";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function PlusPage({ data, pageNum, totalPages }: Props) {
  const pc = data.plusContent;
  if (!pc) return null;

  return (
    <Page size="A4" style={s.page}>
      {/* Mini header */}
      <View style={{ padding: "16 40 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: "rgba(26,26,46,0.2)" }}>trita</Text>
        <Text style={{ fontSize: 7, color: colors.ink300 }}>
          {data.userName} · Személyiségprofil · Self Plus · {data.completedAt}
        </Text>
      </View>

      <View style={{ padding: "0 40 16" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>Alskálák (25 facet)</Text>
        </View>
        <PdfFacets dimensions={data.facetDimensions ?? []} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>Ahogy működsz</Text>
        </View>
        <PdfHowYouWork paragraphs={pc.howYouWork} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrow}>Szerepkör-illeszkedés</Text>
        </View>
        <PdfRoleFit
          strong={pc.roleFit.strong}
          might={pc.roleFit.might}
          prep={pc.roleFit.prep}
          strongRoles={pc.roleFit.strongRoles}
          mightRoles={pc.roleFit.mightRoles}
          prepRoles={pc.roleFit.prepRoles}
        />

        <PdfTakeaways takeaways={pc.takeaways} closer={pc.closingText} />
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
