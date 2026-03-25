import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getLanguageAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PathSelector } from "@/components/pricing/PathSelector";
import { GrowthStory } from "@/components/pricing/GrowthStory";
import { AddOns } from "@/components/pricing/AddOns";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();

  const copy: Record<Locale, { title: string; description: string }> = {
    hu: {
      title: "Árazás | trita",
      description: "Egyszeri vásárlások és előfizetések — a saját ritmusodban.",
    },
    en: {
      title: "Pricing | trita",
      description: "One-time purchases and subscriptions — at your own pace.",
    },
  };

  const { title, description } = copy[locale] ?? copy.hu;

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

const bottomCopy: Record<Locale, { heading: string; sub: string; cta: string }> = {
  hu: {
    heading: "Kezdd el most.",
    sub: "Az első karrierképed ~15 perc múlva ott lehet előtted.",
    cta: "Teszt indítása →",
  },
  en: {
    heading: "Start now.",
    sub: "Your first career profile can be ready in ~15 minutes.",
    cta: "Start assessment →",
  },
};

export default async function PricingPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  const isLoggedIn = !!userId;
  const bottom = bottomCopy[locale] ?? bottomCopy.hu;

  return (
    <main className="min-h-dvh bg-[#f7f4ef]">
      <PricingHero locale={locale} />
      <PathSelector locale={locale} isLoggedIn={isLoggedIn} />
      <GrowthStory locale={locale} />
      <AddOns locale={locale} />
      <PricingFAQ locale={locale} />

      {/* Bottom CTA */}
      <section className="mx-5 mb-8 mt-12 lg:mx-14">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#2a2740] p-8 lg:p-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h2 className="font-fraunces text-2xl text-white lg:text-3xl">{bottom.heading}</h2>
              <p className="mt-2 text-sm text-white/[0.35]">{bottom.sub}</p>
            </div>
            <Link
              href="/try"
              className="shrink-0 rounded-[10px] bg-[#c17f4a] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06]"
            >
              {bottom.cta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
