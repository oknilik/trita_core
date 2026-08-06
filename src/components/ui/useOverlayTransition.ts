"use client";

import { useEffect, useState } from "react";

/**
 * Enter/exit átmenet `AnimatePresence` nélkül.
 *
 * Miért: a framer-motion modul-szintű importja minden olyan komponenst a
 * közös chunkba húz, amelyik a root layoutban (ToastProvider) vagy széles
 * körben használt overlay-ekben (Modal, Picker) ül — a landing így ~42 KB
 * animációs futtatókörnyezetet töltött le olyan felületekért, amelyek ott
 * meg sem jelennek. A mozgás maga sima CSS-átmenettel is elvégezhető.
 *
 * Használat:
 *   const { shouldRender, isEntered } = useOverlayTransition(isOpen, 200);
 *   if (!shouldRender) return null;
 *   <div className={isEntered ? "opacity-100" : "opacity-0"} />
 *
 * - `shouldRender`: a DOM-ban kell-e lennie (nyitva VAGY épp kilépőben),
 *   ez váltja ki az AnimatePresence „exit előtt még ne unmountolj" logikáját.
 * - `isEntered`: a belépő állapot már felkerülhet-e. A váltás két rAF-fel
 *   késleltetve történik, hogy a böngésző előbb kifesse a kiinduló állapotot
 *   — enélkül nem indulna el az átmenet.
 */
export function useOverlayTransition(isOpen: boolean, exitDurationMs: number) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEntered(false);
      const timer = setTimeout(() => setShouldRender(false), exitDurationMs);
      return () => clearTimeout(timer);
    }

    setShouldRender(true);
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setIsEntered(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [isOpen, exitDurationMs]);

  return { shouldRender, isEntered };
}
