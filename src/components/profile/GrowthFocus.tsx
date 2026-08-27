import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { dimColors } from "@/lib/color-system";

interface FacetEntry {
  code: string;
  label: string;
  score: number;
  dimCode: string;
  dimLabel: string;
  dimColor: string;
}

// LR-FACET: a „Szorongás" facethez nem-klinikai glossza jár — a feltétel a
// facet-KÓDRA megy (nem a lokalizált névre), ld. DimensionAccordion párja.
const ANXIETY_FACET_CODE = "anxiety";

interface GrowthFocusProps {
  /** Top 3 lowest-scored facets (pre-computed in page) */
  items: FacetEntry[];
  locale: Locale;
}

// Generic growth suggestion per dimension.
//
// PÓLUS-SZABÁLY (motor-audit v4, FIX 2): a fejlődési fókusz mindig ALACSONY
// pontszámú tételt mutat, ezért a hint a dimenzió ALSÓ pólusához szól. A
// fordított Emocionalitásnál (E) az alacsony pontszám stabilitást jelent
// — a fejlődési irány ott a támogatás/elismerés kimondása (ld.
// profile-content DIMENSION_GROWTH_TIPS.E), NEM a stresszkezelés (az a
// MAGAS emocionalitás ellenszere lenne). A kiválasztás (workstyle-content
// selectGrowthFocusItems) E-t eleve kihagyja a deficit-listából — ez a
// hint biztonsági háló, ha E-tétel mégis ide kerülne.
const GROWTH_HINT: Record<string, Record<"hu" | "en", string>> = {
  H: {
    hu: "Tudatos értékek mentén való döntéshozatal és átlátható kommunikáció.",
    en: "Value-aligned decision-making and transparent communication.",
  },
  E: {
    hu: "A támogatás és elismerés kimondása – pl. hetente egy beszélgetés zárása kimondott visszajelzéssel.",
    en: "Expressing support and acknowledgement – e.g. closing one conversation a week with explicit appreciation.",
  },
  X: {
    hu: "Társas jelenlét és láthatóság tudatos növelése.",
    en: "Consciously building social presence and visibility.",
  },
  A: {
    hu: "Együttműködési és konfliktuskezelési készségek fejlesztése.",
    en: "Developing collaboration and conflict resolution skills.",
  },
  C: {
    hu: "Szervezettség, tervezés és következetes végrehajtás fejlesztése.",
    en: "Building organization, planning, and consistent execution.",
  },
  O: {
    hu: "Kíváncsiság, tanulási kedv és kreatív gondolkodás ösztönzése.",
    en: "Encouraging curiosity, a learning mindset, and creative thinking.",
  },
  I: {
    hu: "Mások iránt való figyelem és altruista viselkedés erősítése.",
    en: "Strengthening attention to others and altruistic behavior.",
  },
};

export function GrowthFocus({ items, locale }: GrowthFocusProps) {
  const isHu = locale === "hu";

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-body">
        {isHu
          ? "Kiváló eredmények – nincs kiemelt fejlődési terület."
          : "Excellent results – no highlighted growth areas."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const hint = GROWTH_HINT[item.dimCode]?.[locale] ?? GROWTH_HINT[item.dimCode]?.hu ?? "";
        return (
          <div
            key={item.code}
            className="flex gap-4 rounded-2xl border border-sand bg-surface-card p-5"
          >
            {/* Number badge */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-fraunces text-lg font-semibold text-white"
              style={{ backgroundColor: dimColors(item.dimCode).strong }}
            >
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-ink">{item.label}</span>
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-micro uppercase tracking-widest"
                  style={{
                    backgroundColor: dimColors(item.dimCode).soft,
                    color: dimColors(item.dimCode).strong,
                    borderColor: dimColors(item.dimCode).base,
                  }}
                >
                  {item.dimLabel}
                </span>
              </div>

              {item.code === ANXIETY_FACET_CODE && (
                <p className="mt-1 text-xs leading-snug text-muted">
                  {t("results.facetAnxietyGloss", locale)}
                </p>
              )}

              {/* Score bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-sand">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.score}%`, backgroundColor: dimColors(item.dimCode).base }}
                  />
                </div>
                <span className="shrink-0 font-mono text-xs text-ink-body">
                  {item.score}%
                </span>
              </div>

              {/* Growth hint */}
              <p className="mt-2 text-sm leading-relaxed text-ink-body">{hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
