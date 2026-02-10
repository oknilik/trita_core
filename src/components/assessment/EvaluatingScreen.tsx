"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

const CX = 150;
const CY = 150;
const MAX_R = 100;
const RINGS = [0.25, 0.5, 0.75, 1.0];
const N = 6;

function getPoint(index: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / N;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

/** Seed-based pseudo-random so wobble is stable per ring */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/** Create a hand-drawn wobbly path for a ring */
function wobblyRingPath(radius: number, seed: number): string {
  const pts = Array.from({ length: N }, (_, i) => getPoint(i, radius));
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const from = pts[i];
    const to = pts[(i + 1) % N];
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    // Perpendicular offset for wobble
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    const wobble = (seededRandom(seed + i * 7) - 0.5) * radius * 0.12;
    const cx1 = mx + nx * wobble;
    const cy1 = my + ny * wobble;
    d += ` Q ${cx1.toFixed(1)},${cy1.toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`;
  }
  return d;
}

/** Create a hand-drawn wobbly axis line */
function wobblyAxisPath(index: number, seed: number): string {
  const p = getPoint(index, MAX_R);
  const mx = (CX + p.x) / 2;
  const my = (CY + p.y) / 2;
  const dx = p.x - CX;
  const dy = p.y - CY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  const wobble = (seededRandom(seed + index * 13) - 0.5) * 6;
  const cx1 = mx + nx * wobble;
  const cy1 = my + ny * wobble;
  return `M ${CX},${CY} Q ${cx1.toFixed(1)},${cy1.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
}

function randomRadii(): number[] {
  return Array.from({ length: N }, () => 30 + Math.random() * 60);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Build a smooth closed cubic bezier path through the data points (doodle feel) */
function toSmoothPath(radii: number[]): string {
  const pts = radii.map((r, i) => getPoint(i, r));
  // Catmull-Rom → cubic bezier for smooth closed curve
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  d += " Z";
  return d;
}

interface EvaluatingScreenProps {
  progress: number;
}

export function EvaluatingScreen({ progress }: EvaluatingScreenProps) {
  const { locale } = useLocale();
  const currentRadii = useRef(randomRadii());
  const targetRadii = useRef(randomRadii());
  const progressRef = useRef(0); // 0→1 lerp progress
  const [pathD, setPathD] = useState(() => toSmoothPath(currentRadii.current));
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Advance lerp progress (~3s per morph cycle)
    progressRef.current += delta / 3000;

    if (progressRef.current >= 1) {
      // Arrived at target — pick a new target
      currentRadii.current = targetRadii.current;
      targetRadii.current = randomRadii();
      progressRef.current = 0;
    }

    // Smooth easing (ease-in-out)
    const t = progressRef.current;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const interpolated = currentRadii.current.map((c, i) =>
      lerp(c, targetRadii.current[i], eased)
    );
    setPathD(toSmoothPath(interpolated));

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {/* Animated doodle hexagon */}
        <div className="h-48 w-48 md:h-56 md:w-56">
          <svg viewBox="0 0 300 300" className="h-full w-full">
            <defs>
              <linearGradient id="evalFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="evalStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>

            {/* Wobbly grid rings */}
            {RINGS.map((ring, ri) => (
              <path
                key={ring}
                d={wobblyRingPath(MAX_R * ring, ri * 31)}
                fill="none"
                stroke={ring === 1 ? "#D1D5DB" : "#E5E7EB"}
                strokeWidth={ring === 1 ? "1.2" : "0.7"}
                strokeLinecap="round"
                opacity="0.5"
              />
            ))}

            {/* Wobbly axis lines */}
            {Array.from({ length: N }, (_, i) => (
              <path
                key={i}
                d={wobblyAxisPath(i, 42)}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="0.7"
                strokeLinecap="round"
                opacity="0.5"
              />
            ))}

            {/* Animated smooth data blob */}
            <path
              d={pathD}
              fill="url(#evalFill)"
              stroke="url(#evalStroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text */}
        <h2 className="mt-6 text-center text-xl font-bold text-gray-900 md:text-2xl">
          {t("assessment.evaluatingTitle", locale)}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {t("assessment.evaluatingBody", locale)}
        </p>

        {/* Progress bar */}
        <div className="mt-8 h-2 w-64 overflow-hidden rounded-full bg-gray-100 md:w-80">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
