import { View, Text } from "@react-pdf/renderer";
import { colors } from "../styles";
import { t } from "@/lib/i18n";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import type { Locale } from "@/lib/i18n";

interface CompDim {
  name: string;
  self: number;
  observer: number;
}

// Eltérés-kapu: a kanonikus DIFF_MIN_GAP (= round(√2·SEM)) — a ReflectPage
// számlálóival/vakfolt-listájával és a képernyős összevetéssel azonos küszöb
// (a korábbi 12 egy oldalon belül mondott ellent a 10-es vágásnak; motor-audit
// v6, M5). A 20-as lépcső a kapu FELETTI magnitúdó-rámpa (medium → large),
// nem mérési-hiba döntés.

// ─── Delta indicator ──────────────────────────────────────────────────────────

function DeltaIndicator({ selfValue, observerValue }: { selfValue: number; observerValue: number }) {
  const gap = Math.abs(selfValue - observerValue);
  const selfHigher = selfValue > observerValue;
  const direction = selfHigher ? "↓" : "↑";

  const level = gap >= 20 ? "large" : gap >= DIFF_MIN_GAP ? "medium" : "small";
  // Bronz-magnitúdó-rámpa (sageLight → bronze → bronze700): a nagy önkép-
  // külsőkép eltérés „figyelemre érdemes vakfolt", nem hiba — a korábbi
  // tégla-piros szégyen-jelzés kivezetve (color-system EVAL-elv).
  const badgeColors = {
    large: { bg: colors.bronze100, color: colors.bronze700 },
    medium: { bg: colors.bronze100, color: colors.bronzeDark },
    small: { bg: colors.sage100, color: colors.sageDark },
  };
  const barColors = { large: colors.bronze700, medium: colors.bronze, small: colors.sageLight };
  const barWidth = { large: "70%", medium: "40%", small: "15%" };

  return (
    <View style={{ width: 50, alignItems: "center" }}>
      {/* A gap sima eltérés-szám (irányát a nyíl adja) — a ± jel 2026-08-11
          óta nem jelenik meg a felületen (mérési-hiba jelölésnek olvasható). */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 1, padding: "1.5 4", borderRadius: 3, backgroundColor: badgeColors[level].bg }}>
        {level !== "small" && (
          <Text style={{ fontSize: 9.5, color: badgeColors[level].color }}>{direction}</Text>
        )}
        <Text style={{ fontSize: 8, fontWeight: 600, color: badgeColors[level].color }}>{gap}</Text>
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
  locale = "hu",
}: {
  isGoodMatch: boolean;
  matchCount: number;
  diffCount: number;
  avgGap: number;
  observerCount: number;
  toplineSummary?: string;
  locale?: Locale;
}) {
  return (
    <View style={{ borderRadius: 5, border: `1 solid ${colors.cream500}`, padding: 8, marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: toplineSummary ? 3 : 6 }}>
        {/* Állapot-jel View-ból, NEM unicode ikonból: sem a DM Sans, sem a
            Fraunces nem tartalmaz U+2713 / U+26A0 glyphet, ezért a korábbi
            „✓ / ⚠" karakterek a böngészőben tofuként jelentek meg, node-ban
            (persona-dosszié, snapshot-készlet) pedig a szövegréteg-mérésnél
            elszálltak. Ugyanaz a minta, mint a PdfAltruism info-jelénél. */}
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
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: isGoodMatch ? 4 : 1.5,
              backgroundColor: isGoodMatch ? colors.sage : colors.bronze,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 11, color: colors.ink }}>
            {isGoodMatch
              ? t("pdf.overallGoodMatch", locale)
              : t("pdf.mixedPicture", locale)}
          </Text>
          <Text style={{ fontSize: 8, color: colors.ink300, lineHeight: 1.3, marginTop: 1 }}>
            {observerCount} {t("pdf.observerResponses", locale)}
          </Text>
        </View>
      </View>
      {toplineSummary && (
        <Text style={{ fontSize: 9.5, color: colors.ink500, lineHeight: 1.45, marginBottom: 6 }}>
          {toplineSummary}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: 4 }}>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "4 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 15, color: colors.sage }}>{matchCount}</Text>
          <Text style={{ fontSize: 8, color: colors.ink300, marginTop: 1 }}>{t("pdf.matching", locale)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "4 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 15, color: colors.bronze }}>{diffCount}</Text>
          <Text style={{ fontSize: 8, color: colors.ink300, marginTop: 1 }}>{t("pdf.different", locale)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.cream300, borderRadius: 4, padding: "4 0", alignItems: "center" }}>
          <Text style={{ fontFamily: "Fraunces", fontSize: 15, color: colors.ink }}>{avgGap}%</Text>
          <Text style={{ fontSize: 8, color: colors.ink300, marginTop: 1 }}>{t("pdf.avgGap", locale)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Comparison bars — sorted by gap, with delta indicator ────────────────────

export function PdfComparisonBars({ dimensions, locale = "hu" }: { dimensions: CompDim[]; locale?: Locale }) {
  // Sort by largest gap first
  const sorted = [...dimensions].sort((a, b) => Math.abs(b.self - b.observer) - Math.abs(a.self - a.observer));

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.sage }} />
          <Text style={{ fontSize: 8, color: colors.ink300 }}>{t("pdf.you", locale)}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.bronzeLight }} />
          <Text style={{ fontSize: 8, color: colors.ink300 }}>{t("pdf.others", locale)}</Text>
        </View>
      </View>

      {sorted.map((dim) => {
        const gap = Math.abs(dim.self - dim.observer);
        const isGap = gap >= DIFF_MIN_GAP;
        return (
          <View
            key={dim.name}
            wrap={false}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              padding: "7 9",
              borderRadius: 5,
              marginBottom: 3,
              backgroundColor: isGap ? colors.bronze100 : colors.cream300,
              borderLeft: `2 solid ${isGap ? colors.bronze : colors.sage}`,
            }}
          >
            {/* Dimension name */}
            <View style={{ width: 104, flexShrink: 0 }}>
              <Text style={{ fontSize: 9.5, fontWeight: 500, color: colors.ink }}>{dim.name}</Text>
            </View>

            {/* Paired bars */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 }}>
                <Text style={{ fontSize: 8, color: colors.ink300, width: 24 }}>{t("pdf.you", locale)}</Text>
                <View style={{ flex: 1, height: 3.5, backgroundColor: colors.cream500, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ width: `${dim.self}%`, height: 3.5, backgroundColor: colors.sage, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 14, textAlign: "right", fontSize: 8, fontWeight: 600, color: colors.sage }}>{dim.self}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontSize: 8, color: colors.ink300, width: 24 }}>{t("pdf.others", locale)}</Text>
                <View style={{ flex: 1, height: 3.5, backgroundColor: colors.cream500, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ width: `${dim.observer}%`, height: 3.5, backgroundColor: colors.bronzeLight, borderRadius: 2 }} />
                </View>
                <Text style={{ width: 14, textAlign: "right", fontSize: 8, fontWeight: 600, color: colors.bronze }}>{dim.observer}</Text>
              </View>
            </View>

            {/* Delta indicator */}
            <DeltaIndicator selfValue={dim.self} observerValue={dim.observer} />
          </View>
        );
      })}
    </View>
  );
}

// ─── Blindspot labels ─────────────────────────────────────────────────────────

function getBlindspotLabel(self: number, observer: number, locale: Locale): string {
  const gap = Math.abs(self - observer);
  const selfHigher = self > observer;
  if (gap >= 20) {
    return selfHigher
      ? t("pdf.blindspotSignificantSelfHigher", locale)
      : t("pdf.blindspotSignificantObsHigher", locale);
  }
  // A „mérsékelt" sáv alja a kapu maga — a vakfolt-lista a ReflectPage-en
  // DIFF_MIN_GAP-nél vág, így a "slight" ág oda már nem jut el (defenzív).
  if (gap >= DIFF_MIN_GAP) {
    return selfHigher
      ? t("pdf.blindspotModSelfHigher", locale)
      : t("pdf.blindspotModObsHigher", locale);
  }
  return t("pdf.blindspotSlight", locale);
}

export function PdfBlindspots({
  blindspots,
  noBlindspots,
  locale = "hu",
}: {
  blindspots: { name: string; self: number; observer: number }[];
  noBlindspots: string[];
  locale?: Locale;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      {blindspots.map((bs) => (
        <View
          key={bs.name}
          wrap={false}
          style={{
            borderLeft: `2.5 solid ${colors.bronze}`,
            backgroundColor: colors.bronze100,
            borderTopRightRadius: 4, borderBottomRightRadius: 4,
            padding: "4 7",
            marginBottom: 2,
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", color: colors.bronzeDark, marginBottom: 1 }}>
            {getBlindspotLabel(bs.self, bs.observer, locale)}
          </Text>
          <Text style={{ fontFamily: "Fraunces", fontSize: 9.5, color: colors.ink }}>
            {bs.name} — {bs.observer > bs.self
              ? t("pdf.othersRateHigher", locale)
              : t("pdf.othersRateLower", locale)}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 1 }}>
            <Text style={{ fontSize: 8, color: colors.ink300 }}>{t("pdf.selfAssessment", locale)}: {bs.self}</Text>
            <Text style={{ fontSize: 8, color: colors.ink300 }}>Observer: {bs.observer}</Text>
          </View>
        </View>
      ))}
      {noBlindspots.length > 0 && (
        <View
          wrap={false}
          style={{
            borderLeft: `2.5 solid ${colors.sage}`,
            backgroundColor: colors.sage100,
            borderTopRightRadius: 4, borderBottomRightRadius: 4,
            padding: "4 7",
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", color: colors.sageDark, marginBottom: 1 }}>
            {t("pdf.noBlindSpots", locale)}
          </Text>
          <Text style={{ fontSize: 9.5, color: colors.ink }}>{noBlindspots.join(", ")}</Text>
          <Text style={{ fontSize: 8, color: colors.sageDark, marginTop: 1 }}>
            {t("pdf.noBlindSpotsDesc", locale)}
          </Text>
        </View>
      )}
    </View>
  );
}
