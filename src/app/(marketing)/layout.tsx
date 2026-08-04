import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { HelpWidget } from "@/components/help/HelpWidget";
import { FetchAuthStateProvider } from "@/components/auth/auth-state";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

// Statikus marketing-shell: se auth(), se DB, se cookie — az oldalak
// build-time prerenderelhetők, és az ANONIM látogatónak NEM szállítanak
// clerk-js bundle-t. Az auth-állapotot a FetchAuthStateProvider oldja fel
// egyetlen könnyű /api hívással; a MarketingHeader kijelentkezve a könnyű
// navot, belépve a teljes app-fejlécet (NavHeaderUI) rendereli — így a
// belépett látogató a nem védett oldalakon is a megszokott headert látja.
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FetchAuthStateProvider>
      <Suspense>
        <MarketingHeader />
        <div>{children}</div>
        <Footer />
      </Suspense>
      <Suspense>
        <HelpWidget audience="public" />
      </Suspense>
    </FetchAuthStateProvider>
  );
}
