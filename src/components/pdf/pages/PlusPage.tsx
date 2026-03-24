import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfFacets } from "../components/PdfFacets";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTakeaways } from "../components/PdfTakeaways";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import { PdfNextStep } from "../components/PdfNextStep";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function PlusPage({ data, pageNum, totalPages }: Props) {
  const pc = data.plusContent;
  if (!pc) return null;

  const hasReflect = data.plan === "reflect";
  const isHu = true; // TODO: pass locale
  const planLabel = hasReflect ? "Self Reflect" : "Self Plus";

  return (
    <Page size="A4" style={s.page}>
      {/* Mini header */}
      <View style={{ padding: "14 40 0", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `1 solid ${colors.cream500}`, paddingBottom: 8, marginBottom: 4 }}>
        <Text style={{ fontFamily: "Fraunces", fontSize: 11, color: "rgba(26,26,46,0.15)" }}>trita</Text>
        <Text style={{ fontSize: 7, color: colors.ink300 }}>
          {data.userName} · {isHu ? "Személyiségprofil" : "Personality profile"} · {planLabel} · {data.completedAt}
        </Text>
      </View>

      <View style={{ padding: "0 40 16" }}>
        {/* ── Alskálák ── */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4, marginTop: 10 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>
            {isHu ? "Alskálák (25 facet)" : "Subscales (25 facets)"}
          </Text>
        </View>
        <PdfFacets dimensions={data.facetDimensions ?? []} />

        {/* Callout boxes */}
        {data.workplaceInsight && (
          <PdfCalloutBox variant="sage" title={isHu ? "Munkahelyi jelentés" : "Workplace insight"}>
            <Text style={{ fontSize: 8, color: colors.sageDark, lineHeight: 1.45 }}>
              {data.workplaceInsight}
            </Text>
          </PdfCalloutBox>
        )}
        {data.riskInsight && (
          <PdfCalloutBox variant="bronze" title={isHu ? "Lehetséges kockázat" : "Potential risk"}>
            <Text style={{ fontSize: 8, color: colors.bronzeDark, lineHeight: 1.45 }}>
              {data.riskInsight}
            </Text>
          </PdfCalloutBox>
        )}

        {/* ── Ahogy működsz ── */}
        <View style={s.divider} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>
            {isHu ? "Ahogy működsz" : "How you operate"}
          </Text>
        </View>
        <PdfHowYouWork paragraphs={pc.howYouWork} />

        {/* ── Szerepkör ── */}
        <View style={s.divider} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={s.sectionEyebrowFirst}>
            {isHu ? "Szerepkör-illeszkedés" : "Role fit"}
          </Text>
        </View>
        <PdfRoleFit
          strong={pc.roleFit.strong}
          might={pc.roleFit.might}
          prep={pc.roleFit.prep}
          strongRoles={pc.roleFit.strongRoles}
          mightRoles={pc.roleFit.mightRoles}
          prepRoles={pc.roleFit.prepRoles}
        />

        {/* ── Legfontosabbak ── */}
        <View style={s.divider} />
        <PdfTakeaways takeaways={pc.takeaways} closer={pc.closingText} />

        {/* ── Következő lépés ── */}
        <PdfNextStep
          text={
            hasReflect
              ? (isHu ? "Nézd meg az observer visszajelzéseket a 3. oldalon." : "Check observer feedback on page 3.")
              : (isHu ? "Küldj observer meghívót a Meghívók tabon, hogy lásd hogyan látnak mások." : "Send observer invitations to see how others perceive you.")
          }
        />
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
