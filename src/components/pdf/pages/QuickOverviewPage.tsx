import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfMiniHeader } from "../components/PdfCard";
import { t } from "@/lib/i18n";
import type { ProfileReportViewModel, ReportChapterId } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// „Gyors összkép" — a riport első TARTALMI oldala (1 / N).
//
// PONTOSAN azt a három insightot hozza, amit a webes összkép (ProfileSummary):
// „Ami természetesen megy" · „Ami több figyelmet kérhet" · „Ahol a legtöbbet
// fejlődhetsz" — ugyanabból a builderből (buildProfileSummaryInsights), azonos
// sorrendben és azonos szöveggel.
//
// A korábbi külön erősség–vakfolt–nyomás–csapatszerep kéthasábos összefoglaló
// KIVEZETVE: apró, kétoszlopos, a webbel nem egyező tartalom volt, miközben az
// oldal alsó fele üresen maradt (PDF-audit 2026-08-18, P0/2, P1/12).
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  model: ProfileReportViewModel;
  /** Fejezetenkénti kezdő oldalszám a tartalomjegyzékhez (borító nélkül). */
  chapterStartPages: Record<ReportChapterId, number>;
}

export function QuickOverviewPage({ model, chapterStartPages }: Props) {
  const { locale, identity, quickOverview, chapters, appendices } = model;
  const planLabel = model.plan === "plus" ? "Plus" : "Start";

  return (
    <Page size="A4" style={s.page} bookmark={{ title: t("pdf.quickOverviewTitle", locale) }}>
      <PdfMiniHeader
        userName={identity.userName}
        planLabel={planLabel}
        date={identity.completedAt}
        locale={locale}
      />

      <View style={s.body}>
        <View wrap={false} style={{ marginBottom: 6 }}>
          <Text
            style={{
              fontSize: type.eyebrow,
              letterSpacing: type.eyebrowTracking,
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.bronze,
              marginBottom: 6,
            }}
          >
            {quickOverview.eyebrow}
          </Text>
          <Text
            style={{
              fontFamily: "Fraunces",
              fontSize: type.chapter,
              color: colors.ink,
              lineHeight: 1.18,
              maxWidth: 400,
            }}
          >
            {quickOverview.title}
          </Text>
          <Text
            style={{
              fontSize: type.body,
              color: colors.ink500,
              lineHeight: type.lineHeight.body,
              marginTop: 8,
              maxWidth: 420,
            }}
          >
            {quickOverview.body}
          </Text>
        </View>

        {/* Három insight EGYMÁS ALATT — a webes összkép sorrendjében és
            tipográfiai ritmusában; nem kéthasábos mikroszöveg. */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            border: `1 solid ${colors.sand}`,
            padding: "4 18",
            marginBottom: 4,
          }}
        >
          {quickOverview.insights.map((insight, index) => (
            <View
              key={insight.tone}
              wrap={false}
              style={{
                flexDirection: "row",
                gap: 12,
                paddingTop: index === 0 ? 16 : 15,
                paddingBottom: index === quickOverview.insights.length - 1 ? 16 : 15,
                borderTop: index === 0 ? undefined : `1 solid ${colors.sand}`,
              }}
            >
              <Text
                style={{
                  fontFamily: "Fraunces",
                  fontSize: type.caption,
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  color: colors.bronze,
                  width: 22,
                  paddingTop: 1,
                }}
              >
                {`0${index + 1}`}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: type.cardTitle,
                    fontWeight: 600,
                    color: colors.ink,
                    marginBottom: 4,
                  }}
                >
                  {insight.label}
                </Text>
                <Text
                  style={{
                    fontSize: type.body,
                    color: colors.ink500,
                    lineHeight: type.lineHeight.body,
                  }}
                >
                  {insight.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tartalomjegyzék — 01–03 oldalszámmal, alatta a mellékletek. */}
        <View
          wrap={false}
          style={{
            backgroundColor: colors.cream300,
            borderRadius: 12,
            border: `1 solid ${colors.sand}`,
            padding: "14 16",
          }}
        >
          <Text
            style={{
              fontSize: type.eyebrow,
              letterSpacing: type.eyebrowTracking,
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.bronze,
              marginBottom: 8,
            }}
          >
            {t("pdf.contentsTitle", locale)}
          </Text>
          {chapters.map((chapter) => (
            <View
              key={chapter.id}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: "Fraunces",
                  fontSize: type.caption,
                  fontWeight: 600,
                  color: colors.bronze,
                  width: 18,
                }}
              >
                {chapter.number}
              </Text>
              <Text style={{ flex: 1, fontSize: type.body, color: colors.ink }}>
                {chapter.title}
              </Text>
              <Text style={{ fontSize: type.caption, color: colors.ink300 }}>
                {chapterStartPages[chapter.id]}
              </Text>
            </View>
          ))}
          {appendices.length > 0 ? (
            <Text
              style={{
                fontSize: type.caption,
                color: colors.ink300,
                lineHeight: type.lineHeight.caption,
                marginTop: 8,
              }}
            >
              {t("pdf.contentsAppendices", locale)}: {appendices.map((a) => a.title).join(" · ")}
            </Text>
          ) : null}
        </View>
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
