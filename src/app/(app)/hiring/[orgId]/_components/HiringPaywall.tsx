import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";

interface HiringPaywallProps {
  orgId: string;
  locale: Locale;
  variant: "no-subscription" | "addon";
  planTier?: string;
  isAdmin?: boolean;
}

// Jelölt-felület kapu (2026-08-05 vizuális frissítés): terrakotta akcentes,
// DashboardPanel-alapú feature-kártyák; a CTA-k változatlanul a /contact-ra
// mutatnak (tanácsadás-vezérelt modell).
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
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-candidate)] to-[var(--color-layer-candidate-hero-to)] text-2xl shadow-[0_14px_30px_rgba(109,56,38,0.25)]">
        <span aria-hidden>{isAddon ? "🚀" : "🔒"}</span>
      </div>

      <SectionEyebrow tone="bronze" className="mb-2">
        {isAddon
          ? t("hiring.addonEyebrow", locale)
          : t("hiring.premiumFeature", locale)}
      </SectionEyebrow>

      <h1 className="mb-3 font-fraunces text-3xl text-ink">
        trita Hiring
      </h1>

      <p className="mb-2 max-w-md text-caption leading-relaxed text-ink-body">
        {t("hiring.paywallDesc", locale)}
      </p>

      <p className="mb-8 text-[12px] text-muted">
        {isAddon
          ? t("hiring.addonPricing", locale)
          : t("hiring.noSubPricing", locale)}
      </p>

      <div className="mb-8 grid w-full max-w-lg grid-cols-1 gap-3 text-left md:grid-cols-3">
        {features.map((f) => (
          <DashboardPanel key={f.title} className="relative overflow-hidden p-4">
            <span
              aria-hidden
              className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-accent-candidate-mid"
            />
            <div aria-hidden className="mb-2 text-xl">{f.icon}</div>
            <p className="mb-1 text-caption font-semibold text-ink">{f.title}</p>
            <p className="text-[11px] leading-relaxed text-muted">{f.desc}</p>
          </DashboardPanel>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {isAddon ? (
          isAdmin ? (
            <Link
              href="/contact"
              className={getButtonClassName({
                className:
                  "bg-accent-candidate px-8 text-[var(--color-text-on-candidate)] hover:bg-accent-candidate-strong",
              })}
            >
              {t("hiring.activateAddon", locale)}
            </Link>
          ) : (
            <p className="max-w-sm text-center text-caption text-ink-body">
              {t("hiring.addonAdminRequired", locale)}
            </p>
          )
        ) : isAdmin ? (
          <Link
            href="/contact"
            className={getButtonClassName({
              className:
                "bg-accent-candidate px-8 text-[var(--color-text-on-candidate)] hover:bg-accent-candidate-strong",
            })}
          >
            {t("hiring.activateSubscription", locale)}
          </Link>
        ) : (
          <p className="max-w-sm text-center text-caption text-ink-body">
            {t("hiring.subscriptionAdminRequired", locale)}
          </p>
        )}
      </div>
    </div>
  );
}
