import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfNextStep } from "../components/PdfNextStep";
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
        {/* How you work */}
        <View style={s.sectionDivider} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>{t("pdf.howYouWork", locale)}</Text>
        </View>
        <PdfHowYouWork paragraphs={pc.howYouWork} locale={locale} />

        {/* Role fit */}
        <View style={s.sectionDivider} />
        <View wrap={false}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
            <Text style={s.sectionEyebrowFirst}>{t("pdf.roleFit", locale)}</Text>
          </View>
          <PdfRoleFit
            strong={pc.roleFit.strong}
            might={pc.roleFit.might}
            prep={pc.roleFit.prep}
            strongRoles={pc.roleFit.strongRoles}
            mightRoles={pc.roleFit.mightRoles}
            prepRoles={pc.roleFit.prepRoles}
          />
        </View>

        {/* Takeaways */}
        <View wrap={false}>
          <View style={s.sectionDivider} />
          <PdfTakeaways takeaways={pc.takeaways} closer={pc.closingText} locale={locale} />
        </View>

        {/* Next step */}
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
