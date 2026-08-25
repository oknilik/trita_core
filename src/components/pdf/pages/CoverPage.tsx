import { Page, View, Text, Svg, Defs, LinearGradient, Stop, Rect, Circle } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { LAYER_THEMES } from "@/lib/color-system";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { PdfWordmark } from "../components/PdfWordmark";
import { PdfTypeGlyph } from "../components/PdfTypeGlyph";
import { t } from "@/lib/i18n";
import type { ProfileReportViewModel } from "@/lib/profile-report-view-model";

// A react-pdf Bookmark-típusa (a @react-pdf/types csak transitive dep, ezért
// inline): a Page bookmark propja PDF-outline bejegyzést hoz létre.
type Bookmark = string | { title: string; expanded?: boolean; top?: number; left?: number; zoom?: number };

// ─────────────────────────────────────────────────────────────────────────────
// Borító — a webes/megosztó hero valódi párja (PDF-audit 2026-08-18, P1/13):
// sötét-sage felület + a KARAKTERÁBRA (PdfTypeGlyph, ugyanaz a nyelvtan, mint
// a képernyőn), ugyanaz az eyebrow / név / archetípus / hero-insight, és a
// kanonikus trita szójel (PdfWordmark).
//
// A borító számozáson kívül van: nincs rajta lábléc, és az oldalszámozás az
// első TARTALMI oldalon indul 1 / N-nel (PdfFooter.coverPages).
//
// Ez az EGYETLEN hely, ahol az identitás és az archetípus elsődleges — a
// belső oldalak nem ismétlik meg (P0/6).
// ─────────────────────────────────────────────────────────────────────────────

const c = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    position: "relative",
  },
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  frame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: "48 56 44 56",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: type.caption,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#ffffff",
    opacity: 0.45,
    marginBottom: 10,
  },
  name: {
    fontFamily: "Fraunces",
    fontSize: 34,
    color: "#ffffff",
    marginBottom: 6,
  },
  archetype: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 20,
    color: LAYER_THEMES.self.badgeText,
    marginBottom: 12,
  },
  insight: {
    fontSize: type.body,
    color: "#ffffff",
    opacity: 0.8,
    lineHeight: type.lineHeight.body,
    maxWidth: 380,
    marginBottom: 18,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "4 10",
    fontSize: type.caption,
    color: "#ffffff",
    opacity: 0.88,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metaText: { fontSize: type.caption, color: "#ffffff", opacity: 0.45 },
});

export function CoverPage({
  model,
  bookmark,
}: {
  model: ProfileReportViewModel;
  bookmark?: Bookmark;
}) {
  const { identity, locale } = model;
  const topDims = identity.topDimensions.slice(0, 3);
  const glyph = resolveGlyphPair(identity.glyphDimensions);

  return (
    <Page size="A4" style={c.page} bookmark={bookmark}>
      {/* Sötét-sage gradiens háttér + halvány dekor-körök.
          A position:absolute a wrapper View-n van, mert az Svg elem a
          react-pdf-ben nem veszi fel — flow-ban maradva átlökné a
          tartalmat a következő oldalra. */}
      <View style={c.bg}>
        <Svg style={{ width: 595, height: 842 }} width={595} height={842} viewBox="0 0 595 842">
          <Defs>
            <LinearGradient id="cover-bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={LAYER_THEMES.self.heroFrom} />
              <Stop offset="0.55" stopColor={colors.sageDark} />
              <Stop offset="1" stopColor={LAYER_THEMES.self.heroTo} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="595" height="842" fill="url(#cover-bg)" />
          <Circle cx="520" cy="90" r="170" fill="#ffffff" fillOpacity="0.025" />
          <Circle cx="80" cy="760" r="220" fill="#ffffff" fillOpacity="0.02" />
          <Circle cx="540" cy="700" r="90" fill={LAYER_THEMES.self.badgeText} fillOpacity="0.04" />
        </Svg>
      </View>

      <View style={c.frame}>
        {/* Fejléc-sáv: kanonikus szójel + a riport megnevezése */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <PdfWordmark size={18} color="#ffffff" dotColor={LAYER_THEMES.self.badgeText} />
          <Text style={c.metaText}>{t("pdf.personalityProfile", locale)}</Text>
        </View>

        {/* Karakterábra — ugyanaz a nyelvtan, mint a képernyőn és a share-kártyán */}
        {glyph ? (
          <View style={{ alignItems: "center", marginTop: 4, marginBottom: 4 }}>
            <PdfTypeGlyph
              primaryCode={glyph.primaryCode}
              secondaryCode={glyph.secondaryCode}
              intensity={glyph.intensity}
              size={230}
              lineColor="#ffffff"
              formColor={LAYER_THEMES.self.badgeText}
              canvas={false}
            />
          </View>
        ) : null}

        <View>
          <Text style={c.eyebrow}>
            {locale === "en" ? "trita personality profile" : "trita személyiségprofil"}
          </Text>
          <Text style={c.name}>{identity.userName}</Text>
          <Text style={c.archetype}>{identity.personalityType}</Text>
          {identity.heroInsight ? <Text style={c.insight}>{identity.heroInsight}</Text> : null}
          {topDims.length > 0 ? (
            <View style={c.chipRow}>
              {topDims.map((dim) => (
                <Text key={dim} style={c.chip}>
                  {dim}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={c.metaRow}>
          <Text style={c.metaText}>{identity.completedAt}</Text>
          <Text style={c.metaText}>trita.io</Text>
        </View>
      </View>
    </Page>
  );
}
