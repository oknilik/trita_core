import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ServerAuthStateProvider } from "@/components/auth/auth-state";
import { NavHeaderUI } from "@/components/layout/nav-header-ui";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { resolveWorkspaceNavContext } from "@/lib/navigation/nav-context.server";
import { HelpWidget } from "@/components/help/HelpWidget";

// A bejelentkezett app-felület shellje: auth + journey + org-kontextus
// requestenként — szándékosan dinamikus. A marketing-oldalak a (marketing)
// group statikus shelljét kapják; a belépett marketing-fejléc ugyanezt a
// nav-kontextust kliens-oldalon kéri le (/api/nav/context).
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [{ userId }, locale] = await Promise.all([getServerAuth(), getServerLocale()]);
  const { navData, signedInHomeHref, signedInExperienceHints, helpAudience } =
    await resolveWorkspaceNavContext(userId, locale);

  // Clerk itt (nem a root layoutban) — az app-felület komponensei (NavHeaderUI
  // signOut, profile, try, observe…) ezt a providert kapják. A nav auth-
  // állapotot a szerver már ismeri, ezért a nav-context szerver-értékből jön
  // (nincs kliens-oldali auth-lekérés az app zónában).
  return (
    <ClerkProvider
      signInFallbackRedirectUrl={JOURNEY_HOME_HANDOFF_PATH}
      signUpFallbackRedirectUrl="/onboarding"
    >
      <ServerAuthStateProvider
        isSignedIn={Boolean(userId)}
        username={navData?.user?.username ?? null}
        email={navData?.user?.email ?? null}
      >
        {userId && navData ? (
          <>
            <NavHeaderUI {...navData} />
            <div>{children}</div>
            <Footer />
          </>
        ) : (
          <Suspense>
            <NavBar
              signedInHomeHref={signedInHomeHref}
              signedInExperienceHints={signedInExperienceHints}
            />
            <div>{children}</div>
            <Footer />
          </Suspense>
        )}
        <Suspense>
          <HelpWidget audience={helpAudience} />
        </Suspense>
      </ServerAuthStateProvider>
    </ClerkProvider>
  );
}
