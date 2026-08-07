"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/client";

/**
 * Oldalletöltés-mérés — egyetlen, láthatatlan kliens-komponens a layoutban.
 *
 * `usePathname` (és NEM `useSearchParams`): utóbbi Suspense-határ nélkül
 * kliens-oldali renderelésre kényszerítené a lapot, és ezzel kivenné a
 * statikus HTML-ből — pont azt a munkát csinálná vissza, amit a
 * next.config.ts megjegyzései dokumentálnak. A query-ből minket amúgy is
 * csak az UTM érdekel, azt pedig a szerver olvassa ki a Referer fejlécből.
 *
 * A `useRef` őrzi, hogy ugyanarra az útvonalra a React Strict Mode kettős
 * effektje ne küldjön két eseményt.
 */
export function AnalyticsPageView() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page.view", {});
  }, [pathname]);

  return null;
}
