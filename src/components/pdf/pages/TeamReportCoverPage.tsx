import {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { PdfWordmark } from "../components/PdfWordmark";

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
  metaText: { fontSize: type.caption, color: colors.white, opacity: 0.5 },
  eyebrow: {
    fontSize: type.caption,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.white,
    opacity: 0.5,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Fraunces",
    fontSize: 34,
    color: colors.white,
    lineHeight: 1.12,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 20,
    color: colors.bronzeLight,
    marginBottom: 14,
  },
  body: {
    maxWidth: 390,
    fontSize: type.body,
    lineHeight: type.lineHeight.body,
    color: colors.white,
    opacity: 0.78,
  },
});

export function TeamReportCoverPage({
  title,
  publishedDate,
  isHu,
}: {
  title: string;
  publishedDate: string | null;
  isHu: boolean;
}) {
  return (
    <Page
      size="A4"
      style={c.page}
      bookmark={{ title: isHu ? "Csapatriport" : "Team report", expanded: true }}
    >
      <View style={c.bg}>
        <Svg style={{ width: 595, height: 842 }} width={595} height={842} viewBox="0 0 595 842">
          <Defs>
            <LinearGradient id="team-cover-bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.sage} />
              <Stop offset="0.58" stopColor={colors.sageDark} />
              <Stop offset="1" stopColor={colors.sageDark} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="595" height="842" fill="url(#team-cover-bg)" />
          <Circle cx="520" cy="92" r="170" fill={colors.white} fillOpacity="0.025" />
          <Circle cx="72" cy="770" r="220" fill={colors.white} fillOpacity="0.02" />
          <Circle cx="540" cy="700" r="90" fill={colors.bronzeLight} fillOpacity="0.04" />

          {/* Kapcsolódó pontok: szervezeti háló, ugyanazzal a nyugodt
              geometriai nyelvvel, mint az egyéni riport karakterábrája. */}
          <Line x1="222" y1="270" x2="298" y2="220" stroke={colors.white} strokeWidth="2" />
          <Line x1="298" y1="220" x2="376" y2="280" stroke={colors.white} strokeWidth="2" />
          <Line x1="222" y1="270" x2="276" y2="344" stroke={colors.white} strokeWidth="2" />
          <Line x1="276" y1="344" x2="376" y2="280" stroke={colors.white} strokeWidth="2" />
          <Line x1="298" y1="220" x2="276" y2="344" stroke={colors.white} strokeWidth="2" />
          <Circle cx="222" cy="270" r="14" fill={colors.bronzeLight} />
          <Circle cx="298" cy="220" r="19" fill={colors.bronze100} />
          <Circle cx="376" cy="280" r="13" fill={colors.white} />
          <Circle cx="276" cy="344" r="18" fill={colors.sageLight} />
          <Circle cx="338" cy="326" r="5" fill={colors.bronzeLight} />
        </Svg>
      </View>

      <View style={c.frame}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <PdfWordmark size={18} color={colors.white} dotColor={colors.bronzeLight} />
          <Text style={c.metaText}>{isHu ? "Szervezeti riport" : "Organization report"}</Text>
        </View>

        <View />

        <View>
          <Text style={c.eyebrow}>
            {isHu ? "trita szervezeti intelligencia" : "trita organization intelligence"}
          </Text>
          <Text style={c.title}>{title}</Text>
          <Text style={c.subtitle}>{isHu ? "Közös működés, látható mintázatok" : "Shared work, visible patterns"}</Text>
          <Text style={c.body}>
            {isHu
              ? "Aggregált csapatkép a közös erőforrásokról, kapcsolati dinamikáról és a következő fejlesztési lépésekről."
              : "An aggregate team picture of shared strengths, relational dynamics, and the next development steps."}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Text style={c.metaText}>{publishedDate ?? ""}</Text>
          <Text style={c.metaText}>trita.io</Text>
        </View>
      </View>
    </Page>
  );
}
