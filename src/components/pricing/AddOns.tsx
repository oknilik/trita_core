import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const ADDON_COUNT = 3;

export function AddOns({ locale }: { locale: Locale }) {
  const items = Array.from({ length: ADDON_COUNT }, (_, i) => ({
    label: t(`pricing.addon${i + 1}Label`, locale),
    price: t(`pricing.addon${i + 1}Price`, locale),
    desc: t(`pricing.addon${i + 1}Desc`, locale),
  }));

  return (
    <section className="border-t border-sand bg-cream px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">{t("pricing.addonsEyebrow", locale)}</span>
        </div>
        <h2 className="mt-2 font-fraunces text-3xl text-ink md:text-4xl">
          {t("pricing.addonsHeading", locale)}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-body">{t("pricing.addonsSub", locale)}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-sand bg-white p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {item.label}
              </p>
              <p className="mt-2 font-fraunces text-3xl text-ink">
                {item.price}
              </p>
              <p className="mt-1.5 text-sm text-ink-body">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
