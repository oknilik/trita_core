import { Page, View, Text } from "@react-pdf/renderer";
import { s, colors } from "../styles";
import { PdfFooter } from "../components/PdfFooter";
import { PdfCard, PdfMiniHeader } from "../components/PdfCard";
import { t } from "@/lib/i18n";
import type { PdfData } from "../TritaPdf";

// ─────────────────────────────────────────────────────────────────────
// „Csapatban működve" oldal (P4.2 v1) — a riport együttműködés-fejezete:
// természetes partnerek, lehetséges súrlódások, és ami kihozza a
// legjobbat. Dimenzió-szintű, profil-alapú becslés — a forrás-jegyzet
// a Trita csapat-nézete felé mutat (terv:
// docs/product/riport-egyuttmukodes-fejezet-terv.md).
// ─────────────────────────────────────────────────────────────────────

interface Props {
  data: PdfData;
  pageNum: number;
  totalPages: number;
  locale: "hu" | "en";
}

function SourceChip({ label, color }: { label?: string; color: string }) {
  if (!label) return null;
  return (
    <Text
      style={{
        fontSize: 5,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color,
        marginBottom: 2,
      }}
    >
      {label}
    </Text>
  );
}

export function CollabPage({ data, pageNum, totalPages, locale }: Props) {
  const collab = data.plusContent?.collaboration;
  if (!collab) return null;

  return (
    <Page size="A4" style={s.page}>
      <PdfMiniHeader userName={data.userName} planLabel="Plus" date={data.completedAt} locale={locale} />

      <View style={{ flex: 1, padding: "0 28 12" }}>
        {/* ── Természetes partnerek ── */}
        {collab.click.length > 0 && (
          <PdfCard eyebrow={t("pdf.collabClick", locale)}>
            {collab.click.map((item, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.sage100,
                  borderLeft: `2 solid ${colors.sage}`,
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                  padding: "6 8",
                  marginBottom: i === collab.click.length - 1 ? 0 : 5,
                }}
              >
                <SourceChip label={item.source} color={colors.sageDark} />
                <Text style={{ fontSize: 7, color: colors.ink, lineHeight: 1.45 }}>{item.text}</Text>
              </View>
            ))}
          </PdfCard>
        )}

        {/* ── Lehetséges súrlódások ── */}
        {collab.friction.length > 0 && (
          <PdfCard eyebrow={t("pdf.collabFriction", locale)}>
            {collab.friction.map((item, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "rgba(193,127,74,0.06)",
                  borderLeft: `2 solid ${colors.bronzeDark}`,
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                  padding: "6 8",
                  marginBottom: i === collab.friction.length - 1 ? 0 : 5,
                }}
              >
                <SourceChip label={item.source} color={colors.bronzeDark} />
                <Text style={{ fontSize: 7, color: colors.ink, lineHeight: 1.45 }}>{item.text}</Text>
              </View>
            ))}
          </PdfCard>
        )}

        {/* ── Ami kihozza belőled a legjobbat ── */}
        {collab.needs.length > 0 && (
          <PdfCard eyebrow={t("pdf.collabNeeds", locale)}>
            {collab.needs.map((item, i) => (
              <View key={i} style={{ marginBottom: i === collab.needs.length - 1 ? 0 : 5 }}>
                <SourceChip label={item.source} color={colors.sageDark} />
                <Text style={{ fontSize: 7, color: colors.ink, lineHeight: 1.45 }}>{item.text}</Text>
              </View>
            ))}
          </PdfCard>
        )}

        {/* ── Forrás-jegyzet: becslés + híd a csapat-nézet felé ── */}
        <View
          wrap={false}
          style={{
            marginTop: 2,
            borderRadius: 8,
            border: "1 solid rgba(43,42,51,0.12)",
            padding: "8 10",
          }}
        >
          <Text style={{ fontSize: 7, color: colors.ink300, lineHeight: 1.45 }}>
            {t("pdf.collabSourceNote", locale)}
          </Text>
        </View>
      </View>
      <PdfFooter pageNum={pageNum} totalPages={totalPages} locale={locale} />
    </Page>
  );
}
