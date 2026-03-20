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

const bottomCopy: Record<Locale, { heading: string; cta: string }> = {
  hu: {
    heading: "Kezdjük el a csapatoddal.",
    cta: "Kipróbálom ingyen",
  },
  en: {
    heading: "Let's start with your team.",
    cta: "Try for free",
  },
};

export default async function PricingPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  const isLoggedIn = !!userId;
  const bottom = bottomCopy[locale] ?? bottomCopy.hu;

  return (
    <main className="min-h-dvh bg-[#faf9f6]">
      <PricingHero locale={locale} />
      <PathSelector locale={locale} isLoggedIn={isLoggedIn} />
      <GrowthStory locale={locale} />
      <AddOns locale={locale} />
      <PricingFAQ locale={locale} />

      {/* Bottom CTA */}
      <section className="border-t border-[#e8e4dc] bg-[#c8410a] px-6 py-16 md:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-playfair text-4xl leading-tight text-white md:text-[48px]">
            {bottom.heading}
          </h2>
          <Link
            href="/sign-up"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-[#c8410a] transition hover:bg-[#f7eee8]"
          >
            {bottom.cta}
          </Link>
        </div>
      </section>
    </main>
  );
}
