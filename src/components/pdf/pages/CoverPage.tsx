import { Page, View, Text, Svg, Defs, LinearGradient, Stop, Rect, Circle } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";
import { colors } from "../styles";
import { LAYER_THEMES } from "@/lib/color-system";
import type { PdfData } from "../TritaPdf";

// A react-pdf Bookmark-típusa (a @react-pdf/types csak transitive dep, ezért
// inline): a Page bookmark propja PDF-outline bejegyzést hoz létre.
type Bookmark = string | { title: string; expanded?: boolean; top?: number; left?: number; zoom?: number };

// Archetípus-borítóoldal (UI-egységesítés F3 follow-up) — a riport „arca":
// a sötét-sage hero-nyelv (az élő eredmény-oldal és a share-kártya nyelve)
// nyomtatásban. React-pdf nem tud CSS-gradienst — SVG-vel oldjuk meg.

const c = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    position: "relative",
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "0 64",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#ffffff",
    opacity: 0.38,
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
    fontSize: 19,
    color: LAYER_THEMES.self.badgeText,
    marginBottom: 22,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 10,
    padding: "4 10",
    fontSize: 8,
    color: "#ffffff",
    opacity: 0.85,
  },
  meta: {
    position: "absolute",
    bottom: 46,
    left: 64,
    right: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 8,
    color: "#ffffff",
    opacity: 0.4,
  },
  logo: {
    fontFamily: "Fraunces",
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.85,
  },
});

export function CoverPage({ data, bookmark }: { data: PdfData; bookmark?: Bookmark }) {
  const topDims = (data.topDimensions ?? []).slice(0, 3);

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

      <View style={c.content}>
        <Text style={c.eyebrow}>
          {data.locale === "en" ? "Trita personality profile" : "Trita személyiségprofil"}
        </Text>
        <Text style={c.name}>{data.userName}</Text>
        <Text style={c.archetype}>{data.personalityType}</Text>
        {topDims.length > 0 && (
          <View style={c.chipRow}>
            {topDims.map((dim) => (
              <Text key={dim} style={c.chip}>
                {dim}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={c.meta}>
        <Text style={c.metaText}>{data.completedAt}</Text>
        <Text style={c.logo}>trita</Text>
      </View>
    </Page>
  );
}
