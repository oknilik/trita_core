import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfDimStrip } from "../components/PdfDimStrip";
import { t, tf } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

// ─────────────────────────────────────────────────────────────────────
// Executive summary oldal (javítási terv 2026-07, P3.1) — a riport
// legelső tartalmi oldala: 30 másodperc alatt átlátható kép.
// Erősségek · vakfoltok · nyomás alatt · csapatban · fejlődési fókusz —
// minden adat a már meglévő content-pipeline-ból jön, itt csak
// összerendezzük.
// ─────────────────────────────────────────────────────────────────────

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

function SummarySection({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text
        style={{
          fontSize: 6,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          color,
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function BulletLine({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 2.5 }}>
      <Text style={{ fontSize: 7.5, color, marginRight: 4 }}>•</Text>
      <Text style={{ fontSize: 7.5, color: colors.ink, lineHeight: 1.4, flex: 1 }}>{text}</Text>
    </View>
  );
}

export function SummaryPage({ data, pageNum, totalPages, locale }: Props) {
  const pc = data.plusContent;
  const strengths = (data.strengthBullets ?? []).slice(0, 3);
  const blindspots = (pc?.pressureParts ?? []).map((p) => p.blindspot).filter(Boolean).slice(0, 2);
  const stress = (pc?.pressureParts ?? []).map((p) => p.stress).filter(Boolean).slice(0, 2);
  const primaryRole = data.teamRoleRoles?.[0];
  const growth = pc?.growthTip;

  const teamLine = primaryRole
    ? tf("pdf.summaryTeamLine", locale, { role: primaryRole.name }) +
      (primaryRole.subtitle ? ` (${primaryRole.subtitle})` : "")
    : "";

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader userName={data.userName} planLabel="Plus" date={data.completedAt} locale={locale} />

      <View style={{ padding: "0 28 0" }}>
        <PdfCard eyebrow={t("pdf.summaryPageTitle", locale)}>
          {/* Archetípus + felütés: történet (P5.6), fallbackként tagline —
              „az emberek történeteket jegyeznek meg, nem adatokat" */}
          <Text style={{ fontFamily: "Fraunces", fontSize: 13, color: colors.ink, marginBottom: 2 }}>
            {data.personalityType}
          </Text>
          {data.archetypeStory ? (
            <Text
              style={{
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontSize: 8.5,
                color: colors.bronzeDark,
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              {data.archetypeStory}
            </Text>
          ) : data.heroInsight ? (
            <Text style={{ fontSize: 8, color: colors.ink500, lineHeight: 1.45, marginBottom: 8 }}>
              {data.heroInsight}
            </Text>
          ) : null}

          {/* Kompakt dimenzió-sáv — 6 szám egy pillantásra */}
          <PdfDimStrip dimensions={data.dimensions} locale={locale} />

          {/* Két hasáb: bal = erősségek + vakfoltok, jobb = nyomás + csapat + fejlődés */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              {strengths.length > 0 && (
                <SummarySection label={t("pdf.summaryStrengths", locale)} color={colors.sageDark}>
                  {strengths.map((b, i) => (
                    <BulletLine key={i} text={b} color={colors.sage} />
                  ))}
                </SummarySection>
              )}
              {blindspots.length > 0 && (
                <SummarySection label={t("pdf.summaryBlindspots", locale)} color={colors.bronzeDark}>
                  {blindspots.map((b, i) => (
                    <BulletLine key={i} text={b} color={colors.bronzeDark} />
                  ))}
                </SummarySection>
              )}
            </View>

            <View style={{ flex: 1 }}>
              {stress.length > 0 && (
                <SummarySection label={t("pdf.summaryUnderPressure", locale)} color={colors.bronzeDark}>
                  {stress.map((b, i) => (
                    <BulletLine key={i} text={b} color={colors.bronzeDark} />
                  ))}
                </SummarySection>
              )}
              {teamLine ? (
                <SummarySection label={t("pdf.summaryInTeam", locale)} color={colors.sageDark}>
                  <Text style={{ fontSize: 7.5, color: colors.ink, lineHeight: 1.4 }}>{teamLine}</Text>
                </SummarySection>
              ) : null}
              {growth ? (
                <SummarySection label={t("pdf.growthTitle", locale)} color={colors.sageDark}>
                  <Text style={{ fontSize: 7.5, color: colors.ink, lineHeight: 1.4 }}>{growth}</Text>
                </SummarySection>
              ) : null}
            </View>
          </View>

          {/* Lábjegyzet: hova nyúlj a részletekért */}
          <Text style={{ fontSize: 6, color: colors.ink300, lineHeight: 1.4, marginTop: 4 }}>
            {t("pdf.summaryFootnote", locale)}
          </Text>
        </PdfCard>

        {/* ── Ahogy működsz — a munkastílus-oldalról ide emelve, hogy az
            összefoglaló oldal teljes legyen (tördelési audit 2026-07-29) ── */}
        {pc?.howYouWork?.length ? (
          <PdfCard eyebrow={t("pdf.howYouWork", locale)}>
            <PdfHowYouWork paragraphs={pc.howYouWork} locale={locale} />
          </PdfCard>
        ) : null}
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
