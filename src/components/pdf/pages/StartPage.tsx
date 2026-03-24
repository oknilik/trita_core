import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfHeader } from "../components/PdfHeader";
import { PdfFooter } from "../components/PdfFooter";
import { PdfInsightPair } from "../components/PdfInsightPair";
import { PdfDimStrip } from "../components/PdfDimStrip";
import { PdfDimDetails } from "../components/PdfDimDetails";
import { PdfBelbin } from "../components/PdfBelbin";
import { PdfCalloutBox } from "../components/PdfCalloutBox";
import { PdfQuickStart } from "../components/PdfQuickStart";
import type { PdfData } from "../TritaPdf";

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
}

export function StartPage({ data, pageNum, totalPages }: Props) {
  const hasPlus = data.plan === "plus" || data.plan === "reflect";
  const isHu = true; // TODO: pass locale

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
        {/* ── Áttekintés ── */}
        <Text style={s.sectionEyebrowFirst}>
          {isHu ? "Áttekintés" : "Overview"}
        </Text>
        <PdfInsightPair strengths={data.strengthBullets} watchAreas={data.watchBullets} />

        {/* ── Dimenziók ── */}
        <View style={s.divider} />
        <Text style={s.sectionEyebrowFirst}>
          {isHu ? "HEXACO dimenziók" : "HEXACO dimensions"}
        </Text>
        <PdfDimStrip dimensions={data.dimensions} />

        {/* Profil karakter callout */}
        {data.profileCharacter && (
          <PdfCalloutBox variant="sage" title={isHu ? "Fő profil karakter" : "Key profile character"}>
            <Text style={{ fontSize: 8.5, color: colors.sageDark, lineHeight: 1.5 }}>
              {data.profileCharacter}
            </Text>
          </PdfCalloutBox>
        )}

        {/* ── Top 3 dimenzió ── */}
        <View style={s.divider} />
        <Text style={s.sectionEyebrowFirst}>
          {isHu ? "Dimenziók részletesen" : "Dimensions in detail"}
        </Text>
        <PdfDimDetails dimensions={data.dimensions} previewOnly={true} hasPlus={hasPlus} />

        {/* ── Belbin ── */}
        <View style={s.divider} />
        <Text style={s.sectionEyebrowFirst}>
          {isHu ? "Csapatszerepek (Belbin)" : "Team roles (Belbin)"}
        </Text>
        <PdfBelbin roles={data.belbinRoles} />

        {/* ── Start upsell ── */}
        {!hasPlus && (
          <>
            <View style={s.divider} />
            <View style={{ backgroundColor: colors.cream300, borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <Text style={{ fontFamily: "Fraunces", fontSize: 10, color: colors.ink, marginBottom: 4 }}>
                {isHu ? "Mélyebbre mennél?" : "Want to go deeper?"}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 7, fontWeight: 600, color: colors.bronze, marginBottom: 2 }}>Self Plus · €7</Text>
                  <Text style={{ fontSize: 7, color: colors.ink500, lineHeight: 1.4 }}>
                    {isHu
                      ? "Értsd meg, mi van a fő dimenzióid mögött — mely minták mozgatnak, milyen szerepkörök illenek hozzád."
                      : "Understand what's behind your dimensions — patterns, matching roles."}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 7, fontWeight: 600, color: colors.sage, marginBottom: 2 }}>Self Reflect · €12</Text>
                  <Text style={{ fontSize: 7, color: colors.ink500, lineHeight: 1.4 }}>
                    {isHu
                      ? "Lásd, hogyan látnak mások — és hol tér el az önképed a visszajelzésektől."
                      : "See how others see you — and where your self-image diverges."}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 6, color: colors.ink300, marginTop: 4 }}>trita.io/profile → {isHu ? "feloldás" : "unlock"}</Text>
            </View>
          </>
        )}

        {/* ── Ezt érdemes megnézned ── */}
        <PdfQuickStart plan={data.plan} />
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}
