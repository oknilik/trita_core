import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { getButtonClassName } from "@/components/ui/primitives/Button";

interface HiringPaywallProps {
  orgId: string;
  locale: Locale;
  variant: "no-subscription" | "addon";
  planTier?: string;
  isAdmin?: boolean;
}

export function HiringPaywall({ locale, variant, isAdmin = false }: HiringPaywallProps) {
  const features = [
    {
      icon: "📧",
      title: t("hiring.featureEmailTitle", locale),
      desc: t("hiring.featureEmailDesc", locale),
    },
    {
      icon: "📊",
      title: t("hiring.featureComparisonTitle", locale),
      desc: t("hiring.featureComparisonDesc", locale),
    },
    {
      icon: "🎯",
      title: t("hiring.featureRoleFitTitle", locale),
      desc: t("hiring.featureRoleFitDesc", locale),
    },
  ];

  const isAddon = variant === "addon";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-2xl">
        {isAddon ? "🚀" : "🔒"}
      </div>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bronze">
        {isAddon
          ? "// add-on"
          : t("hiring.premiumFeature", locale)}
      </p>

      <h1 className="mb-3 font-fraunces text-3xl text-ink">
        trita Hiring
      </h1>

      <p className="mb-2 max-w-md text-sm text-ink-body leading-relaxed">
        {t("hiring.paywallDesc", locale)}
      </p>

      <p className="mb-8 text-xs text-muted">
        {isAddon
          ? t("hiring.addonPricing", locale)
          : t("hiring.noSubPricing", locale)}
      </p>

      <div className="mb-8 grid w-full max-w-lg grid-cols-1 gap-3 text-left md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-sand bg-white p-4"
          >
            <div className="mb-2 text-xl">{f.icon}</div>
            <p className="mb-1 text-[13px] font-semibold text-ink">{f.title}</p>
            <p className="text-[11px] text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {isAddon ? (
          isAdmin ? (
            <Link
              href="/contact"
              className={getButtonClassName({
                className: "px-8",
              })}
            >
              {t("hiring.activateAddon", locale)}
            </Link>
          ) : (
            <p className="max-w-sm text-center text-sm text-ink-body">
              {t("hiring.addonAdminRequired", locale)}
            </p>
          )
        ) : isAdmin ? (
          <Link
            href="/contact"
            className={getButtonClassName({
              className: "px-8",
            })}
          >
            {t("hiring.activateSubscription", locale)}
          </Link>
        ) : (
          <p className="max-w-sm text-center text-sm text-ink-body">
            {t("hiring.subscriptionAdminRequired", locale)}
          </p>
        )}
      </div>
    </div>
  );
}
