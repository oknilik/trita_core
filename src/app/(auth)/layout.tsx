import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Clerk itt (nem a root layoutban) — a sign-in/up/sso + a /sign-out route
  // ezt a providert kapja; a marketing-fa így Clerk-mentes marad.
  return (
    <ClerkProvider
      signInFallbackRedirectUrl={JOURNEY_HOME_HANDOFF_PATH}
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  );
}

