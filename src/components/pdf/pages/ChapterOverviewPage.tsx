import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { PdfChapterHeader } from "../components/PdfChapterHeader";
import { PdfRadarChart, PdfDimensionList } from "../components/PdfDimensionChart";
import { t } from "@/lib/i18n";
import type { ProfileReportViewModel } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// 01 · Áttekintés — a webes fejezet PDF-párja: radar, hat dimenziós sávlista
// szint-címkékkel, rövid radar-magyarázat, profil-karakter.
//
// Az archetípust és a hero-insightot NEM ismétli: az a borító dolga (P0/6).
// ─────────────────────────────────────────────────────────────────────────────

export function ChapterOverviewPage({ model }: { model: ProfileReportViewModel }) {
  const { locale, identity, overview } = model;
  const chapter = model.chapters[0];
  const planLabel = model.plan === "plus" ? "Plus" : "Start";

  return (
    <Page
      size="A4"
      style={s.page}
      bookmark={{ title: `${chapter.number} · ${chapter.title}` }}
    >
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

        {/* Radar + sávlista két külön kártyán: a webes kétoszlopos áttekintés
            A4-en függőlegesen ritmizálva – a korábbi egyetlen, felső harmadba
            zsúfolt blokk helyett (P1/12). */}
        <PdfCard eyebrow={t("pdf.personalityDimensions", locale)} title={t("pdf.overviewRadarTitle", locale)}>
          <View style={{ alignItems: "center", paddingVertical: 2 }}>
            <PdfRadarChart dims={overview.dimensions} size={196} />
          </View>
          <Text style={{ ...s.caption, marginTop: 8 }}>{overview.radarNote}</Text>
        </PdfCard>

        <PdfCard eyebrow={overview.stripLabel}>
          <PdfDimensionList dims={overview.dimensions} locale={locale} />
        </PdfCard>

        {overview.profileCharacter ? (
          <PdfCard eyebrow={t("pdf.keyProfileCharacter", locale)} tone="sage">
            <Text
              style={{
                fontSize: type.body,
                color: colors.sageDark,
                lineHeight: type.lineHeight.body,
              }}
            >
              {overview.profileCharacter}
            </Text>
          </PdfCard>
        ) : null}
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
