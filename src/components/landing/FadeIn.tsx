"use client";

import type { ReactNode } from "react";
import { memo } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * CSS-alapú beúszás (framer-motion helyett).
 *
 * A kezdőállapot (opacity: 0) a `.animate-fade-in` KEYFRAME-jéből +
 * `animation-fill-mode: backwards`-ből jön, NEM inline style-ból: korábban
 * inline `opacity: 0` került a szerver-HTML-be, így ha a CSS bármiért nem
 * érvényesült, a tartalom láthatatlan maradt. Késleltetés nélkül (a hajtás
 * feletti használat) semmilyen inline stílust nem írunk ki.
 */
export const FadeIn = memo(function FadeIn({ children, className = "", delay = 0 }: FadeInProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
});
