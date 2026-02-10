import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { BottomCTA } from "@/components/landing/BottomCTA";
import { getServerLocale } from "@/lib/i18n-server";

export default async function Home() {
  const locale = await getServerLocale();
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <StatsSection locale={locale} />
      <HowItWorks locale={locale} />
      <FeatureCards locale={locale} />
      <BottomCTA locale={locale} />
    </main>
  );
}
