import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface CompDim {
  name: string;
  self: number;
  observer: number;
}

export function PdfComparisonOverview({
  isGoodMatch,
  matchCount,
  diffCount,
  avgGap,
  observerCount,
}: {
  isGoodMatch: boolean;
  matchCount: number;
  diffCount: number;
  avgGap: number;
  observerCount: number;
}) {
  return (
    <View style={{ borderRadius: 6, border: `1 solid ${colors.cream500}`, padding: 10, marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isGoodMatch ? colors.sage100 : colors.bronze100,
          }}
        >
          <Text style={{ fontSize: 10, color: isGoodMatch ? colors.sage : colors.bronze }}>
            {isGoodMatch ? "✓" : "⚠"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 10, color: colors.ink }}>
            {isGoodMatch ? "Összességében jó egyezés" : "Vegyes kép — van mit felfedezni"}
          </Text>
          <Text style={{ fontSize: 7, color: colors.ink300, lineHeight: 1.3, marginTop: 1 }}>
            {observerCount} observer visszajelzés alapján
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "5 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 14, color: colors.sage }}>{matchCount}</Text>
          <Text style={{ fontSize: 6, color: colors.ink300, marginTop: 1 }}>egyező</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "5 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 14, color: colors.bronze }}>{diffCount}</Text>
          <Text style={{ fontSize: 6, color: colors.ink300, marginTop: 1 }}>eltérő</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "5 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 14, color: colors.ink }}>{avgGap}%</Text>
          <Text style={{ fontSize: 6, color: colors.ink300, marginTop: 1 }}>átl. eltérés</Text>
        </View>
      </View>
    </View>
  );
}

export function PdfComparisonBars({ dimensions }: { dimensions: CompDim[] }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sage }} />
          <Text style={{ fontSize: 6, color: colors.ink300 }}>Te</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.bronzeLight }} />
          <Text style={{ fontSize: 6, color: colors.ink300 }}>Mások</Text>
        </View>
      </View>

      {dimensions.map((dim) => {
        const gap = Math.abs(dim.self - dim.observer);
        const hasGap = gap >= 10;
        return (
          <View
            key={dim.name}
            style={{
              padding: "5 7",
              borderRadius: 4,
              backgroundColor: hasGap ? colors.bronze100 : colors.white,
              border: `1 solid ${hasGap ? "rgba(193,127,74,0.2)" : colors.cream500}`,
              marginBottom: 3,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 8, fontWeight: 500, color: colors.ink }}>{dim.name}</Text>
              <Text
                style={{
                  fontSize: 6.5,
                  fontWeight: 500,
                  color: gap < 10 ? colors.sageDark : colors.bronzeDark,
                  backgroundColor: gap < 10 ? colors.sage100 : colors.bronze100,
                  padding: "1 4",
                  borderRadius: 2,
                }}
              >
                ±{gap} pont
              </Text>
            </View>
            {/* Self bar */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <Text style={{ width: 28, fontSize: 6, color: colors.ink300 }}>Te</Text>
              <View style={{ flex: 1, height: 3, backgroundColor: colors.cream500, borderRadius: 1 }}>
                <View style={{ width: `${dim.self}%`, height: 3, backgroundColor: colors.sage, borderRadius: 1 }} />
              </View>
              <Text style={{ width: 16, textAlign: "right", fontSize: 6.5, fontWeight: 600, color: colors.sage }}>{dim.self}</Text>
            </View>
            {/* Observer bar */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ width: 28, fontSize: 6, color: colors.ink300 }}>Mások</Text>
              <View style={{ flex: 1, height: 3, backgroundColor: colors.cream500, borderRadius: 1 }}>
                <View style={{ width: `${dim.observer}%`, height: 3, backgroundColor: colors.bronzeLight, borderRadius: 1 }} />
              </View>
              <Text style={{ width: 16, textAlign: "right", fontSize: 6.5, fontWeight: 600, color: colors.bronze }}>{dim.observer}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function PdfBlindspots({
  blindspots,
  noBlindspots,
}: {
  blindspots: { name: string; self: number; observer: number }[];
  noBlindspots: string[];
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      {blindspots.map((bs) => (
        <View
          key={bs.name}
          style={{
            borderLeft: `3 solid ${colors.bronze}`,
            backgroundColor: colors.bronze100,
            borderTopRightRadius: 5, borderBottomRightRadius: 5,
            padding: "5 8",
            marginBottom: 3,
          }}
        >
          <Text style={{ fontSize: 6, fontWeight: 600, textTransform: "uppercase", color: colors.bronzeDark, marginBottom: 1 }}>
            Lehetséges vakfolt
          </Text>
          <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: colors.ink }}>
            {bs.name} — {bs.observer > bs.self ? "mások erősebbnek látnak" : "mások gyengébbnek látnak"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
            <Text style={{ fontSize: 6, color: colors.ink300 }}>Önértékelés: {bs.self}</Text>
            <Text style={{ fontSize: 6, color: colors.ink300 }}>Observer: {bs.observer}</Text>
          </View>
        </View>
      ))}
      {noBlindspots.length > 0 && (
        <View
          style={{
            borderLeft: `3 solid ${colors.sage}`,
            backgroundColor: colors.sage100,
            borderTopRightRadius: 5, borderBottomRightRadius: 5,
            padding: "5 8",
          }}
        >
          <Text style={{ fontSize: 6, fontWeight: 600, textTransform: "uppercase", color: colors.sageDark, marginBottom: 1 }}>
            Nincs vakfolt
          </Text>
          <Text style={{ fontSize: 8, color: colors.ink }}>{noBlindspots.join(", ")}</Text>
          <Text style={{ fontSize: 7, color: colors.sageDark, marginTop: 1 }}>
            Ezekben a dimenziókban reálisan látod magad.
          </Text>
        </View>
      )}
    </View>
  );
}
