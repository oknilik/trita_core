"use client";

import type { ReactNode } from "react";
import { memo } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// CSS-based fade-in animation (much faster than Framer Motion)
export const FadeIn = memo(function FadeIn({ children, className = "", delay = 0 }: FadeInProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDelay: `${delay}s`,
        opacity: 0,
        animationFillMode: "forwards"
      }}
    >
      {children}
    </div>
  );
});
