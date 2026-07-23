import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

export function PlusWorkStylePage({ data, pageNum, totalPages, locale }: Props) {
  const pc = data.plusContent;
  if (!pc) return null;

  const planLabel = "Plus";

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader userName={data.userName} planLabel={planLabel} date={data.completedAt} locale={locale} />

      <View style={{ flex: 1, padding: "0 28 12" }}>
        {/* ── Hogyan dolgozol ── */}
        <PdfCard eyebrow={t("pdf.howYouWork", locale)}>
          <PdfHowYouWork paragraphs={pc.howYouWork} locale={locale} />
        </PdfCard>

        {/* ── Szerep-illeszkedés ── */}
        <PdfCard eyebrow={t("pdf.roleFit", locale)} wrap={false}>
          <PdfRoleFit
            strong={pc.roleFit.strong}
            might={pc.roleFit.might}
            prep={pc.roleFit.prep}
            strongRoles={pc.roleFit.strongRoles}
            mightRoles={pc.roleFit.mightRoles}
            prepRoles={pc.roleFit.prepRoles}
          />
        </PdfCard>

        {/* ── Kulcs-tanulságok ── */}
        <View wrap={false}>
          <PdfTakeaways takeaways={pc.takeaways} closer={pc.closingText} locale={locale} />
        </View>

        {/* ── Módszertani jegyzet (javítási terv P1.6): önjellemzés,
            tendencia nem címke, környezet/stressz módosít ── */}
        <View
          wrap={false}
          style={{
            marginTop: 10,
            borderRadius: 8,
            border: "1 solid rgba(43,42,51,0.12)",
            padding: "8 10",
          }}
        >
          <Text
            style={{
              fontSize: 5,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: colors.ink300,
              fontWeight: 600,
              marginBottom: 3,
            }}
          >
            {t("pdf.methodNoteTitle", locale)}
          </Text>
          <Text style={{ fontSize: 7, color: colors.ink300, lineHeight: 1.45 }}>
            {t("pdf.methodNoteBody", locale)}
          </Text>
        </View>

      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
