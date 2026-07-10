import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getLanguageAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PathSelector } from "@/components/pricing/PathSelector";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();

  const title = t("pricing.metaTitle", locale);
  const description = t("pricing.metaDescription", locale);

  return {
    title,
    description,
    alternates: {
      canonical: "/pricing",
      languages: getLanguageAlternates("/pricing"),
    },
    openGraph: {
      title,
      description,
      url: "/pricing",
      type: "website",
      siteName: "trita",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PricingPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  const isLoggedIn = !!userId;

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <PricingHero locale={locale} />
      <PathSelector locale={locale} isLoggedIn={isLoggedIn} />

      {/* Consulting note — activation happens off-platform */}
      <section className="px-6 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-xl border border-[var(--color-border-soft)] bg-white px-5 py-4">
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t("pricing.consultingNote", locale)}
          </p>
        </div>
      </section>

      <PricingFAQ locale={locale} />

      {/* Bottom CTA */}
      <section className="mx-5 mb-8 mt-12 lg:mx-14">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-strong-deep)] p-8 lg:p-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h2 className="font-fraunces text-2xl text-white lg:text-3xl">{t("pricing.bottomHeading", locale)}</h2>
              <p className="mt-2 text-sm text-white/[0.35]">{t("pricing.bottomSub", locale)}</p>
            </div>
            <Link
              href="/try"
              className="shrink-0 rounded-[10px] bg-[var(--color-accent-primary)] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06]"
            >
              {t("pricing.bottomCta", locale)}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
