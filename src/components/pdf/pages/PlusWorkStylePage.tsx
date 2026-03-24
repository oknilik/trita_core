import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfNextStep } from "../components/PdfNextStep";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function PlusWorkStylePage({ data, pageNum, totalPages }: Props) {
  const pc = data.plusContent;
  if (!pc) return null;
  const isHu = true; // TODO: pass locale

  const hasReflect = data.plan === "reflect";
  const planLabel = hasReflect ? "Self Reflect" : "Self Plus";

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
        {/* How you work */}
        <View style={s.sectionDivider} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>{isHu ? "Ahogy működsz" : "How you work"}</Text>
        </View>
        <PdfHowYouWork paragraphs={pc.howYouWork} />

        {/* Role fit */}
        <View style={s.sectionDivider} />
        <View wrap={false}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sage }} />
            <Text style={s.sectionEyebrowFirst}>{isHu ? "Szerepkör-illeszkedés" : "Role fit"}</Text>
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
          <PdfTakeaways takeaways={pc.takeaways} closer={pc.closingText} />
        </View>

        {/* Next step */}
        <View wrap={false}>
          <PdfNextStep
            text={
              hasReflect
                ? (isHu
                    ? `Nézd meg az observer visszajelzéseket a ${pageNum + 1}. oldalon.`
                    : `See the observer feedback on page ${pageNum + 1}.`)
                : (isHu
                    ? "Küldj observer meghívót a Meghívók tabon, hogy lásd hogyan látnak mások."
                    : "Send an observer invite from the Invites tab to see how others see you.")
            }
          />
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
