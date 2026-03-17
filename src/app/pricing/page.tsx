import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getLanguageAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import { PricingClient } from "./PricingClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();

  const copy: Record<Locale, { title: string; description: string }> = {
    hu: {
      title: "Árazás | trita",
      description: "A trita összes csomagja és add-on árazása egy helyen.",
    },
    en: {
      title: "Pricing | trita",
      description: "All trita plans and add-on pricing in one place.",
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

export default async function PricingPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  return <PricingClient locale={locale} isLoggedIn={!!userId} />;
}
