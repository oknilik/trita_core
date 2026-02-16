import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { BottomCTA } from "@/components/landing/BottomCTA";

// ISR: Revalidate every 1 hour (3600 seconds)
// This makes the landing page load instantly for most visitors
export const revalidate = 3600;

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <FeatureCards />
      <BottomCTA />
    </main>
  );
}
