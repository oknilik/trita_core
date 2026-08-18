import { View, Text } from "@react-pdf/renderer";
import { colors, type } from "../styles";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  ENV_ROW_POLES,
  ENV_ROW_SHORT_LABELS,
  resolveEnvLevel,
  resolveEnvRowKey,
  type EnvLevel,
} from "@/lib/profile-content";
import type { ReportEnvItem } from "@/lib/profile-report-view-model";

// ─────────────────────────────────────────────────────────────────────────────
// „Ideális környezet" — a webes IdealEnvironmentSection PDF-párja.
//
// A tartalom (envItems) eddig CSAK a képernyőn jelent meg: a PdfData típusa
// nem is vitte át, így a riport egy teljes webes szekciót ejtett el
// (PDF-audit 2026-08-18, P0/4). A sor kanonikus kulcsát és szintjét itt is a
// profile-content visszafejtői adják — ugyanabból a forrásból, amiből a
// getEnvRows a sorokat építi, tehát a PDF és a képernyő ugyanazt a szint-
// címkét mutatja.
// ─────────────────────────────────────────────────────────────────────────────

function levelPosition(level: EnvLevel | null): number {
  if (level === "high") return 80;
  if (level === "low") return 20;
  return 50;
}

function getDescription(value: string): string {
  const dashIdx = value.indexOf(" – ");
  const dashIdx2 = value.indexOf(" — ");
  const idx = dashIdx2 >= 0 ? dashIdx2 : dashIdx;
  return idx >= 0 ? value.slice(idx + 3).trim() : value;
}

export function PdfIdealEnvironment({
  items,
  locale = "hu",
}: {
  items: ReportEnvItem[];
  locale?: Locale;
}) {
  if (items.length === 0) return null;

  return (
    <View>
      {items.map((item, i) => {
        const envKey = resolveEnvRowKey(item.label);
        const level = envKey ? resolveEnvLevel(envKey, item.value) : null;
        const polePair = envKey ? ENV_ROW_POLES[envKey] : null;
        const poles = polePair
          ? { low: polePair.low[locale], high: polePair.high[locale] }
          : { low: "", high: "" };
        const canonicalLabel =
          envKey && level
            ? ENV_ROW_SHORT_LABELS[envKey][level][locale]
            : t("content.envLabelMedium", locale);
        // Hedge-sávban (F3) „Inkább …" alak — a képernyővel azonos szabály.
        const shortLabel = item.hedged
          ? tf("results.envLeaningLabel", locale, {
              label: canonicalLabel.toLocaleLowerCase(locale === "hu" ? "hu" : "en"),
            })
          : canonicalLabel;
        const pos = levelPosition(level);
        const markerColor =
          pos >= 65 ? colors.sage : pos <= 35 ? colors.ink300 : colors.bronze;

        return (
          <View
            key={item.label}
            wrap={false}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderRadius: 10,
              border: `1 solid ${colors.sand}`,
              backgroundColor: colors.white,
              padding: "9 12",
              marginBottom: i === items.length - 1 ? 0 : 6,
            }}
          >
            <Text
              style={{
                width: 88,
                fontSize: type.caption,
                fontWeight: 600,
                color: colors.ink,
              }}
            >
              {item.label}
            </Text>

            <View style={{ flex: 1 }}>
              <View
                style={{
                  position: "relative",
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: colors.cream500,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: `${pos}%`,
                    marginLeft: -3,
                    top: -1.5,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: markerColor,
                    border: `1 solid ${colors.white}`,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ fontSize: type.caption, color: colors.ink300 }}>{poles.low}</Text>
                <Text style={{ fontSize: type.caption, color: colors.ink300 }}>{poles.high}</Text>
              </View>
            </View>

            <Text
              style={{
                width: 150,
                fontSize: type.caption,
                color: colors.ink500,
                lineHeight: type.lineHeight.caption,
                textAlign: "right",
              }}
            >
              <Text style={{ fontWeight: 600, color: colors.ink }}>{shortLabel}</Text>
              {" — "}
              {getDescription(item.value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
