"use client";

import { useEffect, useState } from "react";

// Haladás-gyűrű (UI-egységesítés F3) — kitöltöttség kör-formában.
// Betöltéskor animáltan húzódik fel a célértékig; reduced-motion esetén
// azonnal a végállapotot mutatja.

export function ProgressRing({
  percent,
  size = 84,
  strokeWidth = 7,
  trackColor = "rgba(255,255,255,0.12)",
  color = "var(--color-sage-300)",
  label,
  sublabel,
  labelClassName = "fill-white",
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  color?: string;
  /** A gyűrű közepén megjelenő fő felirat (tipikusan "NN%"). */
  label?: string;
  /** Kis másodlagos felirat a fő alatt. */
  sublabel?: string;
  labelClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const target = c * (1 - clamped / 100);

  const [offset, setOffset] = useState(c);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion: azonnali végállapot, nincs kaszkád
      setOffset(target);
      return;
    }
    // Két frame, hogy a kezdő állapot (teli offset) renderelődjön, és a
    // CSS-transition ténylegesen animáljon.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOffset(target)),
    );
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ? `${label}${sublabel ? ` – ${sublabel}` : ""}` : `${clamped}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0, 0, 1)" }}
      />
      {label ? (
        <text
          x="50%"
          y={sublabel ? "46%" : "50%"}
          textAnchor="middle"
          dominantBaseline="central"
          className={labelClassName}
          style={{ fontFamily: "var(--font-fraunces)", fontSize: size * 0.24 }}
        >
          {label}
        </text>
      ) : null}
      {sublabel ? (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          dominantBaseline="central"
          className={labelClassName}
          style={{ fontSize: size * 0.11, opacity: 0.55 }}
        >
          {sublabel}
        </text>
      ) : null}
    </svg>
  );
}
