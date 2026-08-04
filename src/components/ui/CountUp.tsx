"use client";

import { useEffect, useRef, useState } from "react";

// Szám-megérkezés animáció (UI-egységesítés F3, „eredmény-reveal").
// 0-ról számol fel easinggel; prefers-reduced-motion esetén azonnal a
// végértéket mutatja. A delay a staggerhez van (egymás után érkező számok).

export function CountUp({
  value,
  delay = 0,
  duration = 1100,
  className,
}: {
  value: number;
  /** ms — stagger-késleltetés az indulás előtt */
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion: azonnali végállapot, nincs kaszkád
      setDisplay(value);
      return;
    }
    let start: number | null = null;
    const timer = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(value * eased));
        if (p < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, delay, duration]);

  return <span className={className}>{display}</span>;
}
