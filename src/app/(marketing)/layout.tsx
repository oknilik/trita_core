import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { HelpWidget } from "@/components/help/HelpWidget";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

// Statikus marketing-shell: se auth(), se DB, se cookie — az oldalak
// build-time prerenderelhetők. Az auth-állapotot a NavBar kliens-oldalon
// oldja fel (Clerk useAuth); bejelentkezett látogatónak a journey handoff
// a home-link.
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense>
        <NavBar signedInHomeHref={JOURNEY_HOME_HANDOFF_PATH} />
        <div className="pb-16">{children}</div>
        <Footer />
      </Suspense>
      <Suspense>
        <HelpWidget audience="public" />
      </Suspense>
    </>
  );
}
