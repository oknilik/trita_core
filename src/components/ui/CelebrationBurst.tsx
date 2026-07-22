"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Publikálás-rituálé (UI-egységesítés F3) — visszafogott, egyszeri
// sage–bronz „szirom-hullás". Nem konfetti-zaj: kevés elem, 2,4 mp, aztán
// nyomtalanul eltűnik. Reduced-motion esetén nem renderel semmit.

const PETAL_COLORS = ["#3d6b5e", "#5a8f7f", "#c17f4a", "#e8a96a", "#b8d0cb"];
const PETAL_COUNT = 18;
const DURATION_MS = 2400;

interface Petal {
  left: number;      // vw %
  size: number;      // px
  color: string;
  delay: number;     // ms
  drift: number;     // px vízszintes sodródás
  rotate: number;    // deg
}

export function CelebrationBurst({ onDone }: { onDone?: () => void }) {
  const [active, setActive] = useState(true);

  const petals = useMemo<Petal[]>(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, i) => ({
        left: 6 + (i * 88) / PETAL_COUNT + (i % 3) * 2,
        size: 7 + (i % 4) * 3,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
        delay: (i % 6) * 120,
        drift: ((i % 5) - 2) * 34,
        rotate: ((i % 7) - 3) * 60,
      })),
    [],
  );

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) {
      onDone?.();
      return;
    }
    const id = window.setTimeout(() => {
      setActive(false);
      onDone?.();
    }, DURATION_MS + 800);
    return () => window.clearTimeout(id);
  }, [onDone, reducedMotion]);

  if (reducedMotion || !active || typeof document === "undefined") return null;

  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <style>{`
        @keyframes trita-petal-fall {
          0%   { transform: translate3d(0, -8vh, 0) rotate(0deg); opacity: 0; }
          12%  { opacity: 0.9; }
          100% { transform: translate3d(var(--petal-drift), 105vh, 0) rotate(var(--petal-rotate)); opacity: 0; }
        }
      `}</style>
      {petals.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * 1.4,
            borderRadius: "60% 40% 55% 45%",
            backgroundColor: p.color,
            opacity: 0,
            animation: `trita-petal-fall ${DURATION_MS}ms cubic-bezier(0.3, 0.1, 0.6, 1) ${p.delay}ms forwards`,
            ["--petal-drift" as string]: `${p.drift}px`,
            ["--petal-rotate" as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
