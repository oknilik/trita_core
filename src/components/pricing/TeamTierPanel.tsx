import type { Locale } from "@/lib/i18n";
import { getTeamPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

const introText: Record<Locale, string> = {
  hu: "Előfizetéses csapathozzáférés — önkép és observer visszajelzés, csapat dashboard.",
  en: "Team subscription access — self-assessment and observer feedback, team dashboard.",
};

const trialNote: Record<Locale, string> = {
  hu: "Éves számlázásnál kedvezőbb havi díj. 14 napos próba kártyaadat nélkül.",
  en: "Annual billing offers a lower monthly rate. 14-day trial, no card required.",
};

const ctaLabel: Record<Locale, string> = {
  hu: "Kipróbálom 14 napig",
  en: "Try free for 14 days",
};

export function TeamTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getTeamPricingPlans(locale);

  return (
    <div>
      <p className="mb-6 text-sm text-ink-body">{introText[locale] ?? introText.hu}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <TierCard
            key={plan.id}
            eyebrow={locale === "hu" ? "csapat · előfizetés" : "team · subscription"}
            name={plan.name}
            badge={plan.badge}
            price={plan.price}
            priceSub={plan.perMonth}
            description={plan.description}
            features={plan.features}
            ctaLabel={ctaLabel[locale] ?? ctaLabel.hu}
            ctaHref={isLoggedIn ? "/billing/checkout?plan=team_annual" : plan.ctaHref}
            ctaVariant={plan.id === "team" ? "primary" : "outline"}
            highlighted={plan.id === "team"}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">{trialNote[locale] ?? trialNote.hu}</p>
    </div>
  );
}
