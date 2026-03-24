import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";

interface CompDim {
  name: string;
  self: number;
  observer: number;
}

// ─── Delta indicator ──────────────────────────────────────────────────────────

function DeltaIndicator({ selfValue, observerValue, isHu = true }: { selfValue: number; observerValue: number; isHu?: boolean }) {
  const gap = Math.abs(selfValue - observerValue);
  const selfHigher = selfValue > observerValue;
  const direction = selfHigher ? "↓" : "↑";

  const level = gap >= 20 ? "large" : gap >= 12 ? "medium" : "small";
  const badgeColors = {
    large: { bg: "rgba(192,57,43,0.08)", color: "#c0392b" },
    medium: { bg: colors.bronze100, color: colors.bronzeDark },
    small: { bg: colors.sage100, color: colors.sageDark },
  };
  const barColors = { large: "#c0392b", medium: colors.bronze, small: colors.sageLight };
  const barWidth = { large: "70%", medium: "40%", small: "15%" };

  return (
    <View style={{ width: 50, alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 1, padding: "1.5 4", borderRadius: 3, backgroundColor: badgeColors[level].bg }}>
        {level !== "small" && (
          <Text style={{ fontSize: 7, color: badgeColors[level].color }}>{direction}</Text>
        )}
        <Text style={{ fontSize: 6, fontWeight: 600, color: badgeColors[level].color }}>±{gap}</Text>
      </View>
      <View style={{ width: 36, height: 2.5, backgroundColor: colors.cream500, borderRadius: 1, marginTop: 2, overflow: "hidden" }}>
        <View style={{ width: barWidth[level], height: 2.5, backgroundColor: barColors[level], borderRadius: 1 }} />
      </View>
    </View>
  );
}

// ─── Overview card ────────────────────────────────────────────────────────────

export function PdfComparisonOverview({
  isGoodMatch,
  matchCount,
  diffCount,
  avgGap,
  observerCount,
  toplineSummary,
  isHu = true,
}: {
  isGoodMatch: boolean;
  matchCount: number;
  diffCount: number;
  avgGap: number;
  observerCount: number;
  toplineSummary?: string;
  isHu?: boolean;
}) {
  return (
    <View style={{ borderRadius: 5, border: `1 solid ${colors.cream500}`, padding: 8, marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: toplineSummary ? 3 : 6 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isGoodMatch ? colors.sage100 : colors.bronze100,
          }}
        >
          <Text style={{ fontSize: 8, color: isGoodMatch ? colors.sage : colors.bronze }}>
            {isGoodMatch ? "✓" : "⚠"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 9, color: colors.ink }}>
            {isGoodMatch
              ? (isHu ? "Összességében jó egyezés" : "Overall good match")
              : (isHu ? "Vegyes kép — van mit felfedezni" : "Mixed picture — worth exploring")}
          </Text>
          <Text style={{ fontSize: 6, color: colors.ink300, lineHeight: 1.3, marginTop: 1 }}>
            {observerCount} {isHu ? "observer visszajelzés alapján" : "observer responses"}
          </Text>
        </View>
      </View>
      {toplineSummary && (
        <Text style={{ fontSize: 7, color: colors.ink500, lineHeight: 1.45, marginBottom: 6 }}>
          {toplineSummary}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: 4 }}>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "4 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 12, color: colors.sage }}>{matchCount}</Text>
          <Text style={{ fontSize: 5, color: colors.ink300, marginTop: 1 }}>{isHu ? "egyező" : "matching"}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "4 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 12, color: colors.bronze }}>{diffCount}</Text>
          <Text style={{ fontSize: 5, color: colors.ink300, marginTop: 1 }}>{isHu ? "eltérő" : "different"}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "4 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 12, color: colors.ink }}>{avgGap}%</Text>
          <Text style={{ fontSize: 5, color: colors.ink300, marginTop: 1 }}>{isHu ? "átl. eltérés" : "avg. gap"}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Comparison bars — sorted by gap, with delta indicator ────────────────────

export function PdfComparisonBars({ dimensions, isHu = true }: { dimensions: CompDim[]; isHu?: boolean }) {
  // Sort by largest gap first
  const sorted = [...dimensions].sort((a, b) => Math.abs(b.self - b.observer) - Math.abs(a.self - a.observer));

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.sage }} />
          <Text style={{ fontSize: 5, color: colors.ink300 }}>{isHu ? "Te" : "You"}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.bronzeLight }} />
          <Text style={{ fontSize: 5, color: colors.ink300 }}>{isHu ? "Mások" : "Others"}</Text>
        </View>
      </View>

      {sorted.map((dim) => {
        const gap = Math.abs(dim.self - dim.observer);
        const isGap = gap >= 12;
        return (
          <View
            key={dim.name}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              padding: "5 8",
              borderRadius: 5,
              marginBottom: 3,
              backgroundColor: isGap ? colors.bronze100 : colors.cream300,
              borderLeft: `2 solid ${isGap ? colors.bronze : colors.sage}`,
            }}
          >
            {/* Dimension name */}
            <View style={{ width: 80, flexShrink: 0 }}>
              <Text style={{ fontSize: 7, fontWeight: 500, color: colors.ink }}>{dim.name}</Text>
            </View>

            {/* Paired bars */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 }}>
                <Text style={{ fontSize: 5, color: colors.ink300, width: 24 }}>{isHu ? "Te" : "You"}</Text>
                <View style={{ flex: 1, height: 3.5, backgroundColor: colors.cream500, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ width: `${dim.self}%`, height: 3.5, backgroundColor: colors.sage, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 14, textAlign: "right", fontSize: 6, fontWeight: 600, color: colors.sage }}>{dim.self}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontSize: 5, color: colors.ink300, width: 24 }}>{isHu ? "Mások" : "Others"}</Text>
                <View style={{ flex: 1, height: 3.5, backgroundColor: colors.cream500, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ width: `${dim.observer}%`, height: 3.5, backgroundColor: colors.bronzeLight, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 14, textAlign: "right", fontSize: 6, fontWeight: 600, color: colors.bronze }}>{dim.observer}</Text>
              </View>
            </View>

            {/* Delta indicator */}
            <DeltaIndicator selfValue={dim.self} observerValue={dim.observer} isHu={isHu} />
          </View>
        );
      })}
    </View>
  );
}

// ─── Blindspot labels ─────────────────────────────────────────────────────────

function getBlindspotLabel(self: number, observer: number, isHu: boolean): string {
  const gap = Math.abs(self - observer);
  const selfHigher = self > observer;
  if (gap >= 20) {
    return selfHigher
      ? (isHu ? "Jelentős eltérés — te erősebbnek látod magad" : "Significant gap — you rate yourself higher")
      : (isHu ? "Jelentős eltérés — mások erősebbnek látnak" : "Significant gap — others rate you higher");
  }
  if (gap >= 15) {
    return selfHigher
      ? (isHu ? "Mások máshogy érzékelik" : "Others perceive it differently")
      : (isHu ? "Érdemes utánanézni" : "Worth investigating");
  }
  return isHu ? "Enyhe eltérés" : "Slight difference";
}

export function PdfBlindspots({
  blindspots,
  noBlindspots,
  isHu = true,
}: {
  blindspots: { name: string; self: number; observer: number }[];
  noBlindspots: string[];
  isHu?: boolean;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      {blindspots.map((bs) => (
        <View
          key={bs.name}
          style={{
            borderLeft: `2.5 solid ${colors.bronze}`,
            backgroundColor: colors.bronze100,
            borderTopRightRadius: 4, borderBottomRightRadius: 4,
            padding: "4 7",
            marginBottom: 2,
          }}
        >
          <Text style={{ fontSize: 5, fontWeight: 600, textTransform: "uppercase", color: colors.bronzeDark, marginBottom: 1 }}>
            {getBlindspotLabel(bs.self, bs.observer, isHu)}
          </Text>
          <Text style={{ fontFamily: "Fraunces", fontSize: 8, color: colors.ink }}>
            {bs.name} — {bs.observer > bs.self
              ? (isHu ? "mások erősebbnek látnak" : "others rate you higher")
              : (isHu ? "mások gyengébbnek látnak" : "others rate you lower")}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 1 }}>
            <Text style={{ fontSize: 5, color: colors.ink300 }}>{isHu ? "Önértékelés" : "Self"}: {bs.self}</Text>
            <Text style={{ fontSize: 5, color: colors.ink300 }}>Observer: {bs.observer}</Text>
          </View>
        </View>
      ))}
      {noBlindspots.length > 0 && (
        <View
          style={{
            borderLeft: `2.5 solid ${colors.sage}`,
            backgroundColor: colors.sage100,
            borderTopRightRadius: 4, borderBottomRightRadius: 4,
            padding: "4 7",
          }}
        >
          <Text style={{ fontSize: 5, fontWeight: 600, textTransform: "uppercase", color: colors.sageDark, marginBottom: 1 }}>
            {isHu ? "Nincs vakfolt" : "No blind spots"}
          </Text>
          <Text style={{ fontSize: 7, color: colors.ink }}>{noBlindspots.join(", ")}</Text>
          <Text style={{ fontSize: 6, color: colors.sageDark, marginTop: 1 }}>
            {isHu ? "Ezekben a dimenziókban reálisan látod magad." : "You see yourself realistically in these dimensions."}
          </Text>
        </View>
      )}
    </View>
  );
}
