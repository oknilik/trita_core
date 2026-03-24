import { Page, View, Text } from "@react-pdf/renderer";
import { s } from "../styles";
import { PdfHeader } from "../components/PdfHeader";
import { PdfFooter } from "../components/PdfFooter";
import { PdfInsightPair } from "../components/PdfInsightPair";
import { PdfDimStrip } from "../components/PdfDimStrip";
import { PdfDimDetails } from "../components/PdfDimDetails";
import { PdfBelbin } from "../components/PdfBelbin";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function StartPage({ data, pageNum, totalPages }: Props) {
  return (
    <Page size="A4" style={s.page}>
      <PdfHeader
        name={data.userName}
        date={data.completedAt}
        type={data.personalityType}
        percentile={data.percentile}
        insight={data.heroInsight}
        plan={data.plan}
      />
      <View style={s.body}>
        <Text style={s.sectionEyebrow}>Áttekintés</Text>
        <PdfInsightPair strengths={data.strengths} watchAreas={data.watchAreas} />
        <Text style={s.sectionEyebrow}>HEXACO dimenziók</Text>
        <PdfDimStrip dimensions={data.dimensions} />
        <Text style={s.sectionEyebrow}>Dimenziók részletesen</Text>
        <PdfDimDetails dimensions={data.dimensions} />
        <Text style={s.sectionEyebrow}>Csapatszerepek (Belbin)</Text>
        <PdfBelbin roles={data.belbinRoles} />
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
