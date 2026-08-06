import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { HelpWidgetLazy } from "./HelpWidgetLazy";
import { FetchAuthStateProvider } from "@/components/auth/auth-state";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";

// Statikus marketing-shell: se auth(), se DB, se cookie — az oldalak
// build-time prerenderelhetők, és az ANONIM látogatónak NEM szállítanak
// clerk-js bundle-t. Az auth-állapotot a FetchAuthStateProvider oldja fel
// egyetlen könnyű /api hívással; a MarketingHeader kijelentkezve a könnyű
// navot, belépve a teljes app-fejlécet (NavHeaderUI) rendereli — így a
// belépett látogató a nem védett oldalakon is a megszokott headert látja.
// A lebegő segítő (HelpWidgetLazy) a tudásbázisával együtt külön, hidratálás
// utáni chunkba kerül — a kezdő bundle-t nem terheli.
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
        <HelpWidgetLazy audience="public" />
      </Suspense>
      {/* Oldalletöltés-mérés — saját, süti nélküli rendszer (/api/e).
          Nem renderel semmit, és `usePathname`-t használ, ezért a lapok
          statikus prerenderét nem töri el. */}
      <AnalyticsPageView />
    </FetchAuthStateProvider>
  );
}
