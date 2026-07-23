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

        {/* ── Vakfoltok és nyomás alatti működés (P2.1) — hipotézisek,
            forrás-dimenzió chippel (P5.2: a „miért" kimondása) ── */}
        {(pc.pressure?.length ?? 0) > 0 && (
          <PdfCard eyebrow={t("pdf.pressureTitle", locale)} wrap={false}>
            {/* pressure és pressureParts párhuzamos tömbök (ugyanabból a
                ciklusból épülnek) — a szöveg a teljes, prefixelt mondatpár,
                a chip a strukturált forrásból jön */}
            {pc.pressure!.map((text, idx) => ({ text, source: pc.pressureParts?.[idx]?.source })).map((item, i, arr) => (
              <View
                key={i}
                style={{
                  backgroundColor: "rgba(193,127,74,0.06)",
                  borderLeft: `2 solid ${colors.bronzeDark}`,
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                  padding: "6 8",
                  marginBottom: i === arr.length - 1 ? 0 : 5,
                }}
              >
                {item.source ? (
                  <Text
                    style={{
                      fontSize: 5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      color: colors.bronzeDark,
                      marginBottom: 2,
                    }}
                  >
                    {item.source}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 7, color: colors.ink, lineHeight: 1.45 }}>{item.text}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 5.5, color: colors.ink300, marginTop: 4, lineHeight: 1.4 }}>
              {t("pdf.pressureDisclaimer", locale)}
            </Text>
          </PdfCard>
        )}

        {/* ── Szerep-illeszkedés ── */}
        <PdfCard eyebrow={t("pdf.roleFit", locale)} wrap={false}>
          <PdfRoleFit
            strong={pc.roleFit.strong}
            might={pc.roleFit.might}
            prep={pc.roleFit.prep}
            secondary={pc.roleFit.secondary}
            strongRoles={pc.roleFit.strongRoles}
            mightRoles={pc.roleFit.mightRoles}
            prepRoles={pc.roleFit.prepRoles}
            locale={locale}
          />
        </PdfCard>

        {/* ── Kulcs-tanulságok ── */}
        <View wrap={false}>
          <PdfTakeaways takeaways={pc.takeaways} closer={pc.closingText} locale={locale} />
        </View>

        {/* ── Fejlődési fókusz (P2.4, P5.5): viselkedés → reflexió → mérés ── */}
        {pc.growthPlan || pc.growthTip ? (
          <View
            wrap={false}
            style={{
              backgroundColor: colors.sage100,
              borderLeft: `2 solid ${colors.sage}`,
              borderTopRightRadius: 5,
              borderBottomRightRadius: 5,
              padding: "6 8",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 5,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: colors.sageDark,
                fontWeight: 600,
                marginBottom: 3,
              }}
            >
              {t("pdf.growthTitle", locale)}
              {pc.growthPlan?.source ? ` · ${pc.growthPlan.source}` : ""}
            </Text>
            {pc.growthPlan ? (
              (
                [
                  ["pdf.growthBehavior", pc.growthPlan.behavior],
                  ["pdf.growthReflection", pc.growthPlan.reflection],
                  ["pdf.growthChallenge", pc.growthPlan.challenge],
                ] as const
              ).map(([labelKey, text], i) => (
                <View key={labelKey} style={{ flexDirection: "row", marginBottom: i === 2 ? 0 : 3 }}>
                  <Text
                    style={{
                      width: 92,
                      fontSize: 5.5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: colors.sageDark,
                      marginTop: 0.5,
                    }}
                  >
                    {t(labelKey, locale)}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 7, color: colors.sageDark, lineHeight: 1.45 }}>
                    {text}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 7, color: colors.sageDark, lineHeight: 1.45 }}>
                {pc.growthTip}
              </Text>
            )}
          </View>
        ) : null}

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
