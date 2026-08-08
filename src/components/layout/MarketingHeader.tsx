"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NavBar } from "@/components/NavBar";
import type { NavHeaderUI } from "@/components/layout/nav-header-ui";
import { useAuthState } from "@/components/auth/auth-state";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

type NavData = React.ComponentProps<typeof NavHeaderUI>;

// A teljes app-fejléc (Clerk + NavHeaderUI) DINAMIKUS import: külön chunk,
// csak a belépett ág mountjakor töltődik le. Így az anonim marketing-forgalom
// bundle-je NEM tartalmaz clerk-js-t. `ssr: false` — a fejléc amúgy is
// kliens-oldali auth-állapotból dől el.
const MarketingAppHeader = dynamic(() => import("./MarketingAppHeader"), {
  ssr: false,
});

// ─────────────────────────────────────────────────────────────────────
// A nem védett (marketing) oldalak fejléce.
//
//   · Kijelentkezve (SEO-forgalom többsége): könnyű, Clerk-mentes NavBar.
//   · Belépve: UGYANAZ a teljes app-fejléc (NavHeaderUI), mint az appban —
//     azonos user-blokk, értesítés-harang, munkaterület-nav. A nav-adatot
//     kliens-oldalon kérjük le (/api/nav/context); a clerk-js csak ekkor
//     (dinamikus chunk) töltődik, az anonimnak nem.
// ─────────────────────────────────────────────────────────────────────
export function MarketingHeader() {
  const { isSignedIn } = useAuthState();
  const [nav, setNav] = useState<NavData | null>(null);

  useEffect(() => {
    // Kijelentkezve nincs teendő — a render-guard (isSignedIn && nav) amúgy is
    // a könnyű navot mutatja; a nav csak a fetch callbackjéből áll be.
    if (!isSignedIn) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/nav/context", {
          headers: { "cache-control": "no-cache" },
        });
        if (!alive || !res.ok) return;
        const data = (await res.json()) as { navData?: NavData };
        if (alive && data?.navData) setNav(data.navData);
      } catch {
        // A könnyű navon maradunk (fetch hiba esetén).
      }
    })();
    return () => {
      alive = false;
    };
  }, [isSignedIn]);

  // Belépve + a nav-adat megjött → teljes app-fejléc (dinamikus, Clerk-es chunk).
  if (isSignedIn && nav) {
    return <MarketingAppHeader nav={nav} />;
  }

  // Kijelentkezve, vagy amíg a nav-adat betölt → könnyű marketing-nav.
  // A színséma-választó a marketing-fejlécben is kell: a látogató a belépés
  // előtt dönt, és a marketing-fa a `.theme-scope`-on belül van.
  return <NavBar signedInHomeHref={JOURNEY_HOME_HANDOFF_PATH} showThemeToggle />;
}
