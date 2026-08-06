"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/client";

/**
 * Fül-megtekintés mérése — EGY komponens mind a négy fülrendszerhez.
 *
 * MIÉRT KOMPONENS ÉS NEM `track()` A VÁLTÁS-KEZELŐBEN:
 *
 * 1. **A kezdő fül is fül-megtekintés.** A váltás-kezelő csak azt látná, ha
 *    valaki KATTINT; a „melyik fülre érkezik, és ott meg is áll" — ami a
 *    használat-kérdés érdemi fele — kimaradna.
 * 2. **A négy fülrendszer másképp működik.** A `/team/[id]` szerver-oldalon
 *    old fel `?tab=`-ot (nincs kliens-oldali kezelő, amibe be lehetne kötni),
 *    a `ProfileTabs` és az `OrgPageShell` kliens-állapotban tartja, a
 *    mélylinkelt `?tab=` pedig mindkettőnél kezelő nélkül vált. Egyetlen,
 *    prop-változásra tüzelő komponens mindet lefedi.
 * 3. Egy helyen dől el, mi számít duplikátumnak.
 *
 * A `useRef` őrzi, hogy ugyanaz a (felület, fül) pár egy szerelés alatt
 * egyszer menjen ki — a React Strict Mode kettős effektje és a szülő
 * újrarenderelése ne szorozza fel a számot.
 */
export function TabViewTracker({ surface, tab }: { surface: string; tab: string }) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${surface}:${tab}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    track("surface.tab_view", { surface, tab });
  }, [surface, tab]);

  return null;
}
