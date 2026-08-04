import type { Locale } from "@/lib/i18n";

// Az interakció-szövegek nyelvi szabályai.
//
// Ez a blokk KÉT ember dinamikájáról beszél, akik közül az egyiket nem is
// mértük — a másik oldal egy archetípus-prototípus. Ezért itt szigorúbb a
// nyelv, mint a saját profil szövegeinél: LEHETŐSÉGET mondunk, nem állítást.
//
// Két szabály, guardrail-teszt őrzi:
//   1. TILOS abszolutizáló fordulat (mindig / soha / minden helyzetben).
//   2. KELL legalább egy valószínűségi jelölő szövegenként.
//
// A 2. szabály szándékosan egy jelölőt kér: mondatonkénti hedgelés
// olvashatatlanná tenné a szöveget.

export const HEDGE_MARKERS: Record<Locale, string[]> = {
  hu: [
    "jellemzően",
    "általában",
    "gyakran",
    "gyakori",
    "többnyire",
    "hajlamos",
    "valószínű",
    "tipikusan",
    "sokszor",
    "ritkán",
    "ritka",
    "olykor",
    "néha",
    "inkább",
    "könnyen",
    "akár",
    "esetleg",
    "előfordul",
    // A „lehet" nem esik a -hat/-het szóvégi mintába (a képző előtt csak két
    // betű áll), pedig a leggyakoribb magyar valószínűségi jelölő.
    "lehet",
    "bizonyos helyzetekben",
    "érdemes",
    "segíthet",
    "elképzelhető",
  ],
  en: [
    "typically",
    "often",
    "usually",
    "tend",
    "tends",
    "likely",
    "may ",
    "might",
    "generally",
    "frequently",
    "rarely",
    "sometimes",
    "can ",
    "could",
    "worth",
    "helps",
  ],
};

// A magyar hedgelés jórészt morfológiai: a -hat/-het ható képző
// („lemerülhet", „előfordulhat") ugyanúgy valószínűségi jelölő, mint egy
// határozószó. Szóvégi illesztés, min. 3 karakteres tővel — így a „hat"
// számnév és a „hét" nem akad fenn rajta.
const HU_POTENTIAL_SUFFIX = /\p{L}{3,}(hat|het)\p{L}{0,5}\b/iu;

export const ABSOLUTE_MARKERS: Record<Locale, RegExp[]> = {
  hu: [
    /\bmindig\b/iu,
    /\bsoha\b/iu,
    /\bsosem\b/iu,
    /\bminden (esetben|helyzetben)\b/iu,
    /\bkivétel nélkül\b/iu,
    /\bbiztosan\b/iu,
    /\bgarantáltan\b/iu,
  ],
  en: [
    /\balways\b/iu,
    /\bnever\b/iu,
    /\bin every (situation|case)\b/iu,
    /\bwithout exception\b/iu,
    /\bguaranteed\b/iu,
  ],
};

/** Idézett fordulat nem a mi állításunk — az abszolutizáló szűrés kihagyja. */
const QUOTED_SPAN = /[„“][^„“”]*[”“]/gu;

export function hasHedge(text: string, locale: Locale): boolean {
  const lower = text.toLowerCase();
  if (HEDGE_MARKERS[locale].some((marker) => lower.includes(marker))) return true;
  return locale === "hu" ? HU_POTENTIAL_SUFFIX.test(text) : false;
}

export function findAbsoluteMarkers(text: string, locale: Locale): string[] {
  const unquoted = text.replace(QUOTED_SPAN, " ");
  return ABSOLUTE_MARKERS[locale]
    .map((pattern) => unquoted.match(pattern)?.[0])
    .filter((match): match is string => Boolean(match));
}
