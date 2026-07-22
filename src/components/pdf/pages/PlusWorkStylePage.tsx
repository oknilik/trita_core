import { Page, View } from "@react-pdf/renderer";
import { s } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfNextStep } from "../components/PdfNextStep";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t, tf } from "@/lib/i18n";
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

        {/* ── Következő lépés ── */}
        <View wrap={false}>
          <PdfNextStep
            text={
              data.observerData
                ? tf("pdf.nextStepObserverPage", locale, { page: String(pageNum + 1) })
                : t("pdf.nextStepSendInvite", locale)
            }
            locale={locale}
          />
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
