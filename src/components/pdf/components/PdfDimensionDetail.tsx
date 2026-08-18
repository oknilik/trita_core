import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { dimColors } from "@/lib/color-system";
import { poleAwareDimensionLabel } from "@/lib/profile-content";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ReportDimensionView } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// Egy dimenzió részletesen — a webes DimensionAccordion nyitott állapotának
// párja: érték, pólus-tudatos szint-címke, értelmezés, majd az alskálák.
//
// EGY kártya = EGY tartalmi egység (P1/11), és egy kártya nem törik ketté
// oldalhatáron (wrap={false}) — a fejezet viszont törhet (P1/12).
// ─────────────────────────────────────────────────────────────────────────────

export function PdfDimensionDetail({
  dim,
  locale = "hu",
}: {
  dim: ReportDimensionView;
  locale?: Locale;
}) {
  const dc = dimColors(dim.code);

  return (
    <View
      wrap={false}
      style={{
        backgroundColor: colors.white,
        borderRadius: 12,
        border: `1 solid ${colors.sand}`,
        padding: "14 16",
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: dc.base }} />
        <Text style={{ flex: 1, fontFamily: "Fraunces", fontSize: type.subhead, color: colors.ink }}>
          {dim.name}
        </Text>
        <Text
          style={{
            fontSize: type.caption,
            fontWeight: 600,
            backgroundColor: dc.soft,
            color: dc.strong,
            padding: "2 7",
            borderRadius: 3,
          }}
        >
          {poleAwareDimensionLabel(dim.code, dim.value, locale)}
        </Text>
        <Text style={{ fontFamily: "Fraunces", fontSize: type.section, color: dc.strong }}>
          {dim.value}
        </Text>
      </View>

      <View style={{ height: 3, borderRadius: 1.5, backgroundColor: colors.cream500, marginBottom: 9 }}>
        <View
          style={{
            width: `${Math.max(0, Math.min(100, dim.value))}%`,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: dc.base,
          }}
        />
      </View>

      {dim.insight ? (
        <Text
          style={{
            fontSize: type.body,
            color: colors.ink,
            lineHeight: type.lineHeight.body,
            marginBottom: dim.facets.length > 0 ? 10 : 0,
          }}
        >
          {dim.insight}
        </Text>
      ) : null}

      {dim.facets.length > 0 ? (
        <View>
          <Text
            style={{
              fontSize: type.eyebrow,
              letterSpacing: type.eyebrowTracking,
              textTransform: "uppercase",
              fontWeight: 600,
              color: colors.ink300,
              marginBottom: 6,
            }}
          >
            {t("pdf.dimensionSubscales", locale)}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
            {dim.facets.map((facet) => (
              <View
                key={facet.code || facet.label}
                style={{
                  width: "48%",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  padding: "5 8",
                  backgroundColor: colors.cream300,
                  border: `1 solid ${colors.cream500}`,
                  borderRadius: 6,
                }}
              >
                <Text style={{ flex: 1, fontSize: type.caption, color: colors.ink500 }}>
                  {facet.label}
                </Text>
                <View
                  style={{
                    width: 34,
                    height: 3,
                    backgroundColor: colors.cream500,
                    borderRadius: 1.5,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.max(0, Math.min(100, facet.score))}%`,
                      height: 3,
                      backgroundColor: dc.strong,
                      borderRadius: 1.5,
                    }}
                  />
                </View>
                <Text
                  style={{
                    width: 16,
                    textAlign: "right",
                    fontSize: type.caption,
                    fontWeight: 600,
                    color: dc.strong,
                  }}
                >
                  {facet.score}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
