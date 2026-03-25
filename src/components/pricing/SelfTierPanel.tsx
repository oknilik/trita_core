import type { Locale } from "@/lib/i18n";
import { getSelfPricingPlans } from "@/lib/pricing";
import { TierCard } from "./TierCard";

const introText: Record<Locale, string> = {
  hu: "Ismerd meg magad mélyebben — egyszeri vásárlások, a saját ritmusodban.",
  en: "Get to know yourself deeper — one-time purchases, at your own pace.",
};

const eyebrows: Record<Locale, { free: string; paid: string }> = {
  hu: { free: "self · ingyenes", paid: "self · egyszeri" },
  en: { free: "self · free", paid: "self · one-time" },
};

const ctaLabels: Record<Locale, { free: string; paid: string }> = {
  hu: { free: "Kezdem ingyen", paid: "Megveszem" },
  en: { free: "Start free", paid: "Buy now" },
};

export function SelfTierPanel({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const plans = getSelfPricingPlans(locale);
  const labels = ctaLabels[locale] ?? ctaLabels.hu;
  const eb = eyebrows[locale] ?? eyebrows.hu;

  return (
    <div>
      <p className="mb-6 text-sm text-[#4a4a5e]">{introText[locale] ?? introText.hu}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const isFree = plan.id === "self_start";
          const isFeatured = plan.id === "self_plus";
          return (
            <TierCard
              key={plan.id}
              eyebrow={isFree ? eb.free : eb.paid}
              name={plan.name}
              badge={plan.badge}
              price={plan.price}
              priceSub={plan.seats}
              description={plan.description}
              features={plan.features}
              ctaLabel={isFree ? labels.free : labels.paid}
              ctaHref={isLoggedIn ? "/profile/results" : plan.ctaHref}
              ctaVariant={isFeatured ? "primary" : "outline"}
              highlighted={isFeatured}
            />
          );
        })}
      </div>
    </div>
  );
}
