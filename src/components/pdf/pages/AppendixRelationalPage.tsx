import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors, type } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { PdfChapterHeader } from "../components/PdfChapterHeader";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ProfileReportViewModel } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// Melléklet · Kapcsolati dinamika (PDF-audit 2026-08-18, P0/5).
//
// A „Csapatban működve" és a „Vakfoltok és nyomás alatt" blokk korábban önálló
// FŐFEJEZETKÉNT ékelődött a riportba, holott a webes három fejezetben ilyen
// formában nem szerepel — ez volt a legnagyobb PDF-only tartalmi sodródás.
// A kanonikus megoldás: a riport VÉGÉN, világosan megnevezett, profil-alapú
// BECSLÉSKÉNT jelenik meg, nem mérésként és nem főfejezetként.
// ─────────────────────────────────────────────────────────────────────────────

function SourceChip({ label, color }: { label?: string; color: string }) {
  if (!label) return null;
  return (
    <Text
      style={{
        fontSize: type.caption,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color,
        marginBottom: 3,
      }}
    >
      {label}
    </Text>
  );
}

function ItemBlock({
  items,
  accent,
  background,
  locale,
}: {
  items: { text: string; source?: string }[];
  accent: string;
  background: string;
  locale: Locale;
}) {
  void locale;
  return (
    <View>
      {items.map((item, i) => (
        <View
          key={i}
          wrap={false}
          style={{
            backgroundColor: background,
            borderLeft: `3 solid ${accent}`,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            padding: "10 12",
            marginBottom: i === items.length - 1 ? 0 : 6,
          }}
        >
          <SourceChip label={item.source} color={accent} />
          <Text style={{ fontSize: type.body, color: colors.ink, lineHeight: type.lineHeight.body }}>
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function AppendixRelationalPage({ model }: { model: ProfileReportViewModel }) {
  const { locale, identity, relational } = model;
  if (!relational) return null;
  const collab = relational.collaboration;
  const meta = model.appendices.find((a) => a.id === "relational");
  const planLabel = model.plan === "plus" ? "Plus" : "Start";

  return (
    <Page size="A4" style={s.page} bookmark={{ title: meta?.title ?? t("pdf.appendixRelationalTitle", locale) }}>
      <PdfMiniHeader
        userName={identity.userName}
        planLabel={planLabel}
        date={identity.completedAt}
        locale={locale}
      />

      <View style={s.body}>
        <PdfChapterHeader
          numberIsLabel
          number={t("pdf.appendixEyebrow", locale)}
          question={t("pdf.collabTitle", locale)}
          title={t("pdf.appendixRelationalTitle", locale)}
          description={t("pdf.appendixRelationalNote", locale)}
        />

        {collab && collab.click.length > 0 ? (
          <PdfCard eyebrow={t("pdf.collabClick", locale)}>
            <ItemBlock items={collab.click} accent={colors.sage} background={colors.sage100} locale={locale} />
          </PdfCard>
        ) : null}

        {collab && collab.friction.length > 0 ? (
          <PdfCard eyebrow={t("pdf.collabFriction", locale)}>
            <ItemBlock
              items={collab.friction}
              accent={colors.bronzeDark}
              background="rgba(193,127,74,0.06)"
              locale={locale}
            />
          </PdfCard>
        ) : null}

        {collab && collab.needs.length > 0 ? (
          <PdfCard eyebrow={t("pdf.collabNeeds", locale)}>
            <ItemBlock items={collab.needs} accent={colors.sage} background={colors.white} locale={locale} />
          </PdfCard>
        ) : null}

        {relational.pressure.length > 0 ? (
          <PdfCard eyebrow={t("pdf.pressureTitle", locale)}>
            <ItemBlock
              items={relational.pressure}
              accent={colors.bronzeDark}
              background="rgba(193,127,74,0.06)"
              locale={locale}
            />
            <Text style={{ ...s.caption, marginTop: 8 }}>{t("pdf.pressureDisclaimer", locale)}</Text>
          </PdfCard>
        ) : null}

        <PdfCard tone="muted">
          <Text style={{ ...s.caption, color: colors.ink500 }}>
            {t("pdf.collabSourceNote", locale)}
          </Text>
        </PdfCard>
      </View>

      <PdfFooter locale={locale} />
    </Page>
  );
}
