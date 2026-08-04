"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { NavHeaderUI } from "@/components/layout/nav-header-ui";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

type NavData = React.ComponentProps<typeof NavHeaderUI>;

// A belépett marketing-fejléc (teljes app-header). KÜLÖN modul + dinamikus
// import a MarketingHeader-ből: a clerk-js (ClerkProvider + NavHeaderUI
// useClerk) így KÜLÖN chunkba kerül, és CSAK a belépett látogatónak töltődik
// le — az anonim marketing-forgalom bundle-je Clerk-mentes marad.
export default function MarketingAppHeader({ nav }: { nav: NavData }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl={JOURNEY_HOME_HANDOFF_PATH}
      signUpFallbackRedirectUrl="/onboarding"
    >
      <NavHeaderUI {...nav} />
    </ClerkProvider>
  );
}
