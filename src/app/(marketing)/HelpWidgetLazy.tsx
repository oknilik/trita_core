"use client";

import dynamic from "next/dynamic";
import type { HelpAudience } from "@/lib/help/topics";

// ─────────────────────────────────────────────────────────────────────
// A lebegő segítő (HelpWidget) LUSTA betöltése a publikus (marketing) fán.
//
// Miért: a HelpWidget a teljes statikus tudásbázist (`src/lib/help/topics.ts`,
// HU+EN prózával) behúzza, és a marketing-fán ez a KEZDŐ bundle-be került —
// pedig a tartalma csak a „?" gomb megnyomása után kell. A widget fixed
// pozíciójú, így a késleltetett mount nem okoz layout-eltolódást (CLS 0).
//
// `ssr: false`: a widget kliens-oldali állapotból (locale + auth-state) él,
// szerver-oldali renderje nem hordoz értéket — viszont így a kódja külön,
// hidratálás után letöltött chunkba kerül. Ugyanaz a minta, mint a
// MarketingHeader → MarketingAppHeader dinamikus importja.
//
// A megjelenés és a működés VÁLTOZATLAN: ugyanaz a komponens, ugyanazokkal a
// propokkal — csak később kerül a fába.
// ─────────────────────────────────────────────────────────────────────
const HelpWidget = dynamic(
  () => import("@/components/help/HelpWidget").then((mod) => mod.HelpWidget),
  { ssr: false },
);

export function HelpWidgetLazy({ audience }: { audience: HelpAudience }) {
  return <HelpWidget audience={audience} />;
}
