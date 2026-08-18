import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { PdfChapterHeader } from "../components/PdfChapterHeader";
import { PdfHowYouWork } from "../components/PdfHowYouWork";
import { PdfIdealEnvironment } from "../components/PdfIdealEnvironment";
import { PdfRoleFit } from "../components/PdfRoleFit";
import { PdfTeamRoles } from "../components/PdfTeamRoles";
import { t } from "@/lib/i18n";
import type { ProfileReportViewModel } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// 03 · Munkastílus és fejlődés — a webes fejezet PDF-párja, ugyanabban a
// sorrendben: Ahogy működsz → Ideális környezet → Szerepkör-illeszkedés →
// Csapatszerepek → Fejlődési fókusz (háromlépcsős akcióterv).
//
// A fejezet TÖRHET oldalhatáron (a kártyák nem), így nem keletkezik
// félüres oldal, és nem is préselődik minden egyetlen lapra (P1/12).
// ─────────────────────────────────────────────────────────────────────────────

export function ChapterWorkStylePage({ model }: { model: ProfileReportViewModel }) {
  const { locale, identity, workstyle } = model;
  const chapter = model.chapters[2];
  const planLabel = model.plan === "plus" ? "Plus" : "Start";
  const growth = workstyle.growthPlan;

  return (
    <Page size="A4" style={s.page} bookmark={{ title: `${chapter.number} · ${chapter.title}` }}>
      <PdfMiniHeader
        userName={identity.userName}
        planLabel={planLabel}
        date={identity.completedAt}
        locale={locale}
      />

      <View style={s.body}>
        <PdfChapterHeader
          number={chapter.number}
          question={chapter.question}
          title={chapter.title}
          description={chapter.description}
        />

        {workstyle.howYouWorkParts?.main ? (
          <PdfCard eyebrow={t("pdf.howYouWork", locale)}>
            <PdfHowYouWork parts={workstyle.howYouWorkParts} locale={locale} />
          </PdfCard>
        ) : null}

        {/* Ideális környezet — a webes IdealEnvironmentSection; a PdfData
            korábban elejtette ezt a szekciót (P0/4). */}
        {workstyle.envItems.length > 0 ? (
          <PdfCard eyebrow={t("pdf.idealEnvironment", locale)}>
            <PdfIdealEnvironment items={workstyle.envItems} locale={locale} />
            <Text style={{ ...s.caption, marginTop: 10 }}>
              {t("pdf.idealEnvironmentNote", locale)}
            </Text>
          </PdfCard>
        ) : null}

        {workstyle.roleFit ? (
          <PdfCard eyebrow={t("pdf.roleFit", locale)}>
            <PdfRoleFit roleFit={workstyle.roleFit} locale={locale} />
          </PdfCard>
        ) : null}

        {workstyle.teamRoles.length > 0 ? (
          <PdfCard eyebrow={t("results.sectionRoles", locale)}>
            <PdfTeamRoles
              roles={workstyle.teamRoles}
              locale={locale}
              showScores={!workstyle.teamRoleEstimated}
            />
          </PdfCard>
        ) : null}

        {/* Fejlődési fókusz: viselkedés → reflexió → mérés */}
        {growth || workstyle.growthTip ? (
          <PdfCard
            eyebrow={
              t("results.sectionGrowth", locale) + (growth?.source ? ` · ${growth.source}` : "")
            }
            tone="sage"
          >
            <Text
              style={{
                fontSize: type.body,
                color: colors.sageDark,
                lineHeight: type.lineHeight.body,
                marginBottom: growth ? 10 : 0,
              }}
            >
              {growth ? t("results.growthIntro", locale) : workstyle.growthTip}
            </Text>
            {growth
              ? (
                  [
                    ["pdf.growthBehavior", growth.behavior],
                    ["pdf.growthReflection", growth.reflection],
                    ["pdf.growthChallenge", growth.challenge],
                  ] as const
                ).map(([labelKey, text], i) => (
                  <View key={labelKey} style={{ flexDirection: "row", gap: 8, marginBottom: i === 2 ? 0 : 7 }}>
                    <Text
                      style={{
                        width: 118,
                        fontSize: type.caption,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                        color: colors.sageDark,
                        paddingTop: 1,
                      }}
                    >
                      {t(labelKey, locale)}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: type.body,
                        color: colors.sageDark,
                        lineHeight: type.lineHeight.body,
                      }}
                    >
                      {text}
                    </Text>
                  </View>
                ))
              : null}
          </PdfCard>
        ) : null}

        {/* Módszertani jegyzet: önjellemzés, tendencia nem címke */}
        <PdfCard eyebrow={t("pdf.methodNoteTitle", locale)} tone="muted">
          <Text style={{ ...s.caption, color: colors.ink500 }}>
            {t("pdf.methodNoteBody", locale)}
          </Text>
        </PdfCard>

        {model.plan === "start" ? (
          <PdfCard eyebrow="Plus · €9" title={t("pdf.wantToGoDeeper", locale)} tone="muted">
            <Text style={{ ...s.bodyText }}>{t("pdf.upsellDescription", locale)}</Text>
            <Text style={{ ...s.caption, marginTop: 6 }}>
              trita.io/profile → {t("pdf.upsellUnlock", locale)}
            </Text>
          </PdfCard>
        ) : null}
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
