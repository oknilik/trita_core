"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import {
  ENV_ROW_POLES,
  ENV_ROW_SHORT_LABELS,
  resolveEnvLevel,
  resolveEnvRowKey,
  type EnvLevel,
} from "@/lib/profile-content";

interface EnvItem {
  label: string;
  value: string;
  /** F3-hedge: a pólus-ítélet a 65/70 (ill. 30/35) egyet-nem-értési sávban —
   *  a bold szint-szó „Inkább …" alakot kap (getEnvRows adja). */
  hedged?: boolean;
}

interface IdealEnvironmentSectionProps {
  items: EnvItem[];
  isUnlocked: boolean;
  /** A befoglaló felület már kiírja a szekció címét (ld. HowYouWorkSection). */
  hideHeading?: boolean;
}

// A sor kanonikus kulcsát és szintjét a profile-content visszafejtői adják
// (resolveEnvRowKey / resolveEnvLevel) — ugyanabból a forrásból, amiből a
// getEnvRows a sorokat építi. A korábbi helyi érték-prefix parser szűkebb
// leképezés volt: a Kultúra-sor „Értékvezérelt/Teljesítményalapú" kezdetét
// nem ismerte, és tévesen „Közepes" bold címkét mutatott (motor-audit v3 #11).

// A marker pozíciója a kanonikus szintből — nem szöveg-parse-olásból.
function levelPosition(level: EnvLevel | null): number {
  if (level === "high") return 80;
  if (level === "low") return 20;
  return 50;
}

function getDescription(value: string): string {
  const dashIdx = value.indexOf(" – ");
  const dashIdx2 = value.indexOf(" – ");
  const idx = dashIdx2 >= 0 ? dashIdx2 : dashIdx;
  return idx >= 0 ? value.slice(idx + 3).trim() : value;
}

export function IdealEnvironmentSection({
  items,
  isUnlocked,
  hideHeading = false,
}: IdealEnvironmentSectionProps) {
  const { locale } = useLocale();

  if (!isUnlocked || items.length === 0) return null;

  return (
    <div className={hideHeading ? undefined : "py-8"}>
      {!hideHeading && (
        <div className="mb-4 flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
          <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("results.envEyebrow", locale)}
          </p>
        </div>
      )}

      <div className={hideHeading ? "flex flex-col gap-2.5" : "mt-4 flex flex-col gap-2.5"}>
        {items.map((item) => {
          const envKey = resolveEnvRowKey(item.label);
          const level = envKey ? resolveEnvLevel(envKey, item.value) : null;
          const polePair = envKey ? ENV_ROW_POLES[envKey] : null;
          const poles = polePair
            ? { low: polePair.low[locale], high: polePair.high[locale] }
            : { low: "", high: "" };
          // Bold szint-szó a kanonikus kulcs+szint táblából; ismeretlen sorra
          // semleges „Közepes" — ugyanaz a defenzív alapérték, mint korábban.
          // Hedge-sávban (F3, getEnvRows.hedged) a kemény szint-szó helyett
          // „Inkább magas" / „Leaning fast" stb. — így a pólus-chip nem mond
          // ellent az egy görgetésre lévő strip 70/40-es címkéjének.
          const canonicalLabel =
            envKey && level
              ? ENV_ROW_SHORT_LABELS[envKey][level][locale]
              : t("content.envLabelMedium", locale);
          const shortLabel = item.hedged
            ? tf("results.envLeaningLabel", locale, {
                label: canonicalLabel.toLocaleLowerCase(locale === "hu" ? "hu" : "en"),
              })
            : canonicalLabel;
          const pos = levelPosition(level);
          const desc = getDescription(item.value);

          return (
            <div
              key={item.label}
              className="flex flex-col gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-surface-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="text-xs font-medium text-[var(--color-text-primary)] sm:w-[130px] sm:shrink-0">
                {item.label}
              </span>
              <div className="min-w-0 flex-1">
                {/* Track container — marker centered on track via flex */}
                <div className="flex items-center" style={{ height: 10 }}>
                  <div className="relative h-1 w-full rounded-sm bg-[var(--color-border-default)]">
                    <div
                      className="absolute top-1/2 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm"
                      style={{
                        left: `clamp(5px, ${pos}%, calc(100% - 5px))`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: pos >= 65 ? "var(--color-action-primary-bg)" : pos <= 35 ? "var(--color-text-muted)" : "var(--color-accent-primary)",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-micro text-[var(--color-text-muted)]">{poles.low}</span>
                  <span className="text-micro text-[var(--color-text-muted)]">{poles.high}</span>
                </div>
              </div>
              <span className="text-note text-[var(--color-text-muted)] sm:w-[180px] sm:shrink-0 sm:text-right">
                <strong className="text-[var(--color-text-primary)]">{shortLabel}</strong> – {desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
