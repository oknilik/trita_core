import type { Locale } from "@/lib/i18n";
import { TierCard } from "./TierCard";

const copy: Record<
  Locale,
  {
    intro: string;
    scanName: string;
    scanDesc: string;
    scanFeatures: string[];
    scanCta: string;
    diveName: string;
    diveDesc: string;
    diveFeatures: string[];
    diveBadge: string;
    diveCta: string;
    advisoryNote: string;
  }
> = {
  hu: {
    intro: "Egyszeri csapatfelmérés — előfizetés nélkül, amikor szükséged van rá.",
    scanName: "Team Scan",
    scanDesc: "Csapatmintázat és dinamika egy felmérésből.",
    scanFeatures: [
      "Csapat heatmap és mintázatelemzés",
      "Erők és potenciális feszültségpontok",
      "Leadership összefoglaló",
      "Akcióajánlások csapatonként",
    ],
    scanCta: "Megveszem · €490",
    diveName: "Team Deep Dive",
    diveDesc: "Mély elemzés, beépített tanácsadói konzultációval.",
    diveFeatures: [
      "Minden Team Scan tartalom",
      "1 beépített tanácsadói konzultáció (90 perc)",
      "Fejlesztési roadmap és prioritások",
      "90 napos akcióterv",
    ],
    diveBadge: "Teljes csomag",
    diveCta: "Megveszem · €990",
    advisoryNote:
      "A tanácsadói konzultáció a csapateredmények alapján, személyre szabva zajlik.",
  },
  en: {
    intro: "One-time team assessment — no subscription, whenever you need it.",
    scanName: "Team Scan",
    scanDesc: "Team pattern and dynamics from a single assessment.",
    scanFeatures: [
      "Team heatmap and pattern analysis",
      "Strengths and potential friction points",
      "Leadership summary",
      "Action recommendations per team",
    ],
    scanCta: "Buy · €490",
    diveName: "Team Deep Dive",
    diveDesc: "Deep analysis with a built-in advisory consultation.",
    diveFeatures: [
      "Everything in Team Scan",
      "1 built-in advisory consultation (90 min)",
      "Development roadmap and priorities",
      "90-day action plan",
    ],
    diveBadge: "Full package",
    diveCta: "Buy · €990",
    advisoryNote:
      "The advisory consultation is tailored to your team's results.",
  },
};

export function TeamTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const c = copy[locale] ?? copy.hu;

  return (
    <div>
      <p className="mb-6 text-sm text-[#5a5650]">{c.intro}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TierCard
          eyebrow={locale === "hu" ? "csapat · egyszeri" : "team · one-time"}
          name={c.scanName}
          price="€490"
          priceSub={locale === "hu" ? "egyszeri" : "one-time"}
          description={c.scanDesc}
          features={c.scanFeatures}
          ctaLabel={c.scanCta}
          ctaHref={isLoggedIn ? "/dashboard" : "/sign-up"}
          ctaVariant="outline"
        />
        <TierCard
          eyebrow={locale === "hu" ? "csapat · egyszeri" : "team · one-time"}
          name={c.diveName}
          badge={c.diveBadge}
          price="€990"
          priceSub={locale === "hu" ? "egyszeri" : "one-time"}
          description={c.diveDesc}
          features={c.diveFeatures}
          ctaLabel={c.diveCta}
          ctaHref={isLoggedIn ? "/dashboard" : "/sign-up"}
          ctaVariant="primary"
          highlighted
        />
      </div>
      <p className="mt-4 text-xs text-[#a09a90]">{c.advisoryNote}</p>
    </div>
  );
}
