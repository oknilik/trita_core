"use client";

import { useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  AXIS_META,
  PATTERNS,
  getClosestPattern,
  getSecondClosest,
  getMatchLabel,
  isBalanced,
} from "@/lib/pattern-data";

// ── Design tokens (founding page palette) ──────────────────
const T = {
  bg: "#FAF7F2",
  card: "#F3EDE4",
  text: "#2C2420",
  muted: "#5C4F45",
  heading: "#1a1410",
  border: "#E8E0D4",
  accent: "#3d6b5e",
  accentHover: "#a83508",
};

// ── Axis Slider ─────────────────────────────────────────────

function AxisSlider({
  axis,
  index,
  value,
  onChange,
}: {
  axis: (typeof AXIS_META)[number];
  index: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const norm = value / 100;
  const bal = isBalanced(norm);

  const detail = bal
    ? axis.midDetail
    : value > 50
    ? axis.highDetail
    : axis.lowDetail;

  return (
    <div>
      {/* Label row */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: T.heading }}>
          {axis.name}
        </span>
        {bal && (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
            style={{ backgroundColor: T.card, color: T.muted }}
          >
            Kiegyensúlyozott
          </span>
        )}
      </div>

      {/* Pole labels */}
      <div className="mb-1 flex justify-between text-[11px]" style={{ color: T.muted }}>
        <span>{axis.low}</span>
        <span>{axis.high}</span>
      </div>

      {/* Track + input */}
      <div className="relative flex items-center">
        {/* Visual track — shows balanced zone */}
        <div
          className="pointer-events-none absolute inset-0 h-2 self-center rounded-full"
          style={{
            background: `linear-gradient(to right,
              rgba(44,36,32,0.09) 35%,
              ${bal ? "rgba(200,65,10,0.18)" : "rgba(200,65,10,0.08)"} 35%,
              ${bal ? "rgba(200,65,10,0.18)" : "rgba(200,65,10,0.08)"} 65%,
              rgba(44,36,32,0.09) 65%)`,
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="pattern-range w-full"
          aria-label={axis.name}
        />
      </div>

      {/* Detail text */}
      <p
        className="mt-2 text-xs leading-relaxed"
        style={{ color: T.muted, minHeight: "2.8em" }}
      >
        {detail}
      </p>
    </div>
  );
}

// ── Pattern Card ────────────────────────────────────────────

function PatternCard({
  code,
  matchLabel,
}: {
  code: string;
  matchLabel: ReturnType<typeof getMatchLabel>;
}) {
  const pattern = PATTERNS[code];
  if (!pattern) return null;

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{ backgroundColor: "white", borderColor: T.border }}
    >
      {/* Accent top bar */}
      <div className="h-1" style={{ backgroundColor: pattern.color }} />

      <div className="p-6">
        {/* Match badge */}
        <span
          className="mb-3 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={{ backgroundColor: matchLabel.bg, color: matchLabel.color }}
        >
          {matchLabel.label}
        </span>

        {/* Name */}
        <h2
          className="font-fraunces text-2xl leading-tight"
          style={{ color: T.heading }}
        >
          {pattern.alias}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: T.muted }}>
          <span style={{ color: pattern.color }}>{pattern.name}</span>
        </p>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed" style={{ color: T.text }}>
          {pattern.description}
        </p>

        {/* Strengths + Risks */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(46,107,80,0.07)", border: "1px solid rgba(46,107,80,0.15)" }}
          >
            <p
              className="mb-2 font-mono text-[9px] uppercase tracking-widest"
              style={{ color: "#2e6b50" }}
            >
              // erősségek
            </p>
            <ul className="space-y-1">
              {pattern.strengths.map((s) => (
                <li key={s} className="flex items-start gap-1.5 text-xs" style={{ color: T.text }}>
                  <span className="mt-0.5 shrink-0" style={{ color: "#2e6b50" }}>✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(181,101,29,0.07)", border: "1px solid rgba(181,101,29,0.15)" }}
          >
            <p
              className="mb-2 font-mono text-[9px] uppercase tracking-widest"
              style={{ color: "#b5651d" }}
            >
              // vakfoltok
            </p>
            <ul className="space-y-1">
              {pattern.risks.map((r) => (
                <li key={r} className="flex items-start gap-1.5 text-xs" style={{ color: T.text }}>
                  <span className="mt-0.5 shrink-0" style={{ color: "#b5651d" }}>△</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* People + Contexts */}
        <div className="mt-4 space-y-2">
          <p className="text-xs" style={{ color: T.text }}>
            <span className="font-semibold" style={{ color: T.heading }}>Kik érzik jól magukat:</span>{" "}
            {pattern.people}
          </p>
          <p className="text-xs" style={{ color: T.text }}>
            <span className="font-semibold" style={{ color: T.heading }}>Ahol megjelenik:</span>{" "}
            {pattern.contexts}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Hybrid Card ─────────────────────────────────────────────

function HybridCard({
  bestCode,
  secondCode,
  onSelect,
}: {
  bestCode: string;
  secondCode: string;
  onSelect: (code: string) => void;
}) {
  const best = PATTERNS[bestCode];
  const second = PATTERNS[secondCode];
  if (!best || !second) return null;

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{ backgroundColor: "white", borderColor: T.border }}
    >
      <div className="h-1" style={{ background: `linear-gradient(to right, ${best.color}, ${second.color})` }} />
      <div className="p-6">
        <span
          className="mb-3 inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={{ backgroundColor: "rgba(107,107,107,0.08)", color: "#6b6b6b" }}
        >
          Kontextusfüggő működés
        </span>
        <h2 className="font-fraunces text-2xl" style={{ color: T.heading }}>
          Két mintázat határán
        </h2>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          A csúszkák kiegyensúlyozott állásban vannak — a csapat működése a kontextustól függ.
          Kattints valamelyikre a részletes leíráshoz.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { code: bestCode, pattern: best },
            { code: secondCode, pattern: second },
          ].map(({ code, pattern }) => (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className="rounded-xl p-4 text-left transition-shadow hover:shadow-md"
              style={{ backgroundColor: T.bg, border: `1px solid ${T.border}` }}
            >
              <div className="mb-1 h-0.5 rounded-full" style={{ backgroundColor: pattern.color }} />
              <p className="mt-2 text-sm font-semibold" style={{ color: T.heading }}>
                {pattern.alias}
              </p>
              <p className="text-xs" style={{ color: pattern.color }}>
                {pattern.name}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: T.muted }}>
                {pattern.description}
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.accent }}>
                Részletek →
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── All Patterns Grid ────────────────────────────────────────

const QUADRANTS = [
  {
    label: "Energikus + Összetartó",
    desc: "Magas hajtóerő, erős kohézió",
    codes: ["1111", "1110", "1101", "1100"],
    accent: "#3d6b5e",
  },
  {
    label: "Energikus + Versengő",
    desc: "Magas hajtóerő, önálló egyéniségek",
    codes: ["1011", "1010", "1001", "1000"],
    accent: "#8b3a2a",
  },
  {
    label: "Visszafogott + Összetartó",
    desc: "Csendes energia, erős csapatkötés",
    codes: ["0111", "0110", "0101", "0100"],
    accent: "#2e6b50",
  },
  {
    label: "Visszafogott + Versengő",
    desc: "Önálló szakértők, alacsony energia",
    codes: ["0011", "0010", "0001", "0000"],
    accent: "#3d4f6b",
  },
] as const;

function AllPatternsGrid({ onSelect }: { onSelect: (code: string) => void }) {
  return (
    <div className="mt-10 border-t pt-10" style={{ borderColor: T.border }}>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>
        // mind a 16 mintázat
      </p>
      <h3 className="mb-8 font-fraunces text-xl" style={{ color: T.heading }}>
        Összes csapatmintázat
      </h3>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {QUADRANTS.map((q) => (
          <div key={q.label}>
            {/* Quadrant header */}
            <div className="mb-3 flex items-center gap-2.5">
              <div className="h-4 w-1 rounded-full" style={{ backgroundColor: q.accent }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: T.heading }}>
                  {q.label}
                </p>
                <p className="text-xs" style={{ color: T.muted }}>
                  {q.desc}
                </p>
              </div>
            </div>

            {/* 4 pattern cards */}
            <div className="grid grid-cols-2 gap-2">
              {q.codes.map((code) => {
                const pattern = PATTERNS[code];
                if (!pattern) return null;
                return (
                  <button
                    key={code}
                    onClick={() => onSelect(code)}
                    className="rounded-xl border p-3 text-left transition-shadow hover:shadow-md"
                    style={{ backgroundColor: "white", borderColor: T.border }}
                  >
                    <div className="mb-2 h-0.5 rounded-full" style={{ backgroundColor: pattern.color }} />
                    <p className="text-xs font-semibold leading-snug" style={{ color: T.heading }}>
                      {pattern.alias}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed" style={{ color: T.muted }}>
                      {pattern.description}
                    </p>
                    <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: q.accent }}>
                      Részletek →
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Alternative Pattern Section ──────────────────────────────

function AlternativeSection({
  secondCode,
  differingAxisIdx,
}: {
  secondCode: string;
  differingAxisIdx: number;
}) {
  const second = PATTERNS[secondCode];
  if (!second) return null;

  const axis = differingAxisIdx >= 0 ? AXIS_META[differingAxisIdx] : null;
  const secondHigh = differingAxisIdx >= 0
    ? secondCode.split("")[differingAxisIdx] === "1"
    : null;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: T.bg, borderColor: T.border }}
    >
      <p
        className="mb-2 font-mono text-[9px] uppercase tracking-widest"
        style={{ color: T.muted }}
      >
        // közeli alternatív mintázat
      </p>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: T.heading }}>
            {second.alias}
          </p>
          <p className="text-xs" style={{ color: second.color }}>
            {second.name}
          </p>
        </div>
        <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: second.color }} />
      </div>
      {axis && secondHigh !== null && (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: T.muted }}>
          A fő különbség a{" "}
          <span className="font-semibold" style={{ color: T.text }}>
            {axis.name}
          </span>{" "}
          tengelyen van — ha a csapat inkább{" "}
          <span className="font-semibold" style={{ color: T.text }}>
            {secondHigh ? axis.high : axis.low}
          </span>{" "}
          irányba mozdulna, közelebb kerülne a{" "}
          <span className="font-semibold" style={{ color: T.text }}>
            {second.alias}
          </span>{" "}
          mintázathoz.
        </p>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export function PatternExplorer() {
  const searchParams = useSearchParams();

  const initialValues = useMemo(() => {
    const keys = ["drive", "cohesion", "discipline", "openness"] as const;
    return keys.map((k) => {
      const v = Number(searchParams.get(k));
      return Number.isFinite(v) && v >= 0 && v <= 100 ? Math.round(v) : 50;
    });
  }, [searchParams]);

  const [values, setValues] = useState<number[]>(initialValues);
  const [selectedHybridCode, setSelectedHybridCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const normalized = values.map((v) => v / 100);
  const { code: bestCode, distance } = getClosestPattern(normalized);
  const { code: secondCode } = getSecondClosest(normalized, bestCode);
  const matchLabel = getMatchLabel(distance);

  const balancedCount = normalized.filter(isBalanced).length;
  const isHybridState = balancedCount >= 2 && distance > 0.4;

  // Reset hybrid selection when sliders move out of hybrid state
  const activeCode = isHybridState ? (selectedHybridCode ?? null) : null;
  if (!isHybridState && selectedHybridCode) setSelectedHybridCode(null);

  // Find first differing axis between best and second closest
  const bestBits = bestCode.split("").map(Number);
  const secondBits = secondCode.split("").map(Number);
  let differingAxisIdx = -1;
  for (let i = 0; i < 4; i++) {
    if (bestBits[i] !== secondBits[i]) {
      differingAxisIdx = i;
      break;
    }
  }

  const setAxisValue = (idx: number, val: number) =>
    setValues((prev) => prev.map((v, i) => (i === idx ? val : v)));

  return (
    <div style={{ backgroundColor: T.bg }}>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-12 md:px-6">
        <p
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: T.accent }}
        >
          // csapatminta felfedező
        </p>
        <h1
          className="mt-1 font-fraunces text-3xl leading-tight md:text-4xl"
          style={{ color: T.heading }}
        >
          16 csapatmintázat — melyik a tiéd?
        </h1>
        <p
          className="mt-3 max-w-2xl text-base leading-relaxed"
          style={{ color: T.muted }}
        >
          Húzd a csúszkákat, hogy beállítsd a csapatod jellemzőit. A mintázat kártya
          valós időben frissül — nézd meg, melyik működés illik legjobban a csapatodra.
        </p>
      </section>

      {/* ── Explorer grid ────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-20 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_3fr]">
          {/* Sliders */}
          <div className="flex flex-col gap-8">
            <div
              className="rounded-2xl border p-6 shadow-sm"
              style={{ backgroundColor: "white", borderColor: T.border }}
            >
              <p
                className="mb-6 font-mono text-[10px] uppercase tracking-widest"
                style={{ color: T.muted }}
              >
                // 4 tengelyen beállítható
              </p>
              <div className="flex flex-col gap-7">
                {AXIS_META.map((axis, i) => (
                  <AxisSlider
                    key={axis.key}
                    axis={axis}
                    index={i}
                    value={values[i]}
                    onChange={(v) => setAxisValue(i, v)}
                  />
                ))}
              </div>
            </div>

            {/* Balanced zone note */}
            <div
              className="rounded-xl border px-4 py-3 text-xs"
              style={{
                borderColor: "rgba(200,65,10,0.2)",
                backgroundColor: "rgba(200,65,10,0.04)",
                color: T.muted,
                lineHeight: 1.6,
              }}
            >
              <span
                className="mr-1 font-mono text-[9px] uppercase tracking-wider"
                style={{ color: T.accent }}
              >
                // tipp
              </span>
              A narancssárga sáv jelzi a{" "}
              <span style={{ color: T.text, fontWeight: 600 }}>kiegyensúlyozott zónát</span>{" "}
              (35–65%). Ha 2+ tengely ott áll, a csapat működése kontextusfüggő — nem egyetlen
              domináns minta jellemzi.
            </div>
          </div>

          {/* Pattern results */}
          <div ref={resultRef} className="flex flex-col gap-5">
            {isHybridState && !activeCode ? (
              <HybridCard
                bestCode={bestCode}
                secondCode={secondCode}
                onSelect={setSelectedHybridCode}
              />
            ) : (
              <>
                {isHybridState && activeCode && (
                  <button
                    onClick={() => setSelectedHybridCode(null)}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: T.muted }}
                  >
                    ← Vissza a határesethez
                  </button>
                )}
                <PatternCard
                  code={activeCode ?? bestCode}
                  matchLabel={isHybridState && activeCode ? { label: "kiválasztott", color: matchLabel.color, bg: matchLabel.bg } : matchLabel}
                />
              </>
            )}

            {!isHybridState && (
              <AlternativeSection
                secondCode={secondCode}
                differingAxisIdx={differingAxisIdx}
              />
            )}

            {/* Framing note */}
            <p
              className="border-t pt-4 text-xs italic leading-relaxed"
              style={{ color: "var(--color-muted)", borderColor: T.border }}
            >
              Ezek a mintázatok tudományos személyiségkutatáson alapuló csapat-szintű értelmezések. Nem fix
              címkék — a csapat működése idővel változik, és ugyanaz a csapat különböző
              kontextusokban eltérően viselkedhet.
            </p>

            {/* Show all toggle */}
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-1 text-xs font-semibold underline-offset-2 hover:underline"
              style={{ color: T.muted }}
            >
              {showAll ? "Elrejtem az összes mintázatot" : "Mutasd az összes 16 mintázatot"}
            </button>
          </div>
        </div>

        {showAll && (
          <AllPatternsGrid
            onSelect={(code) => {
              setShowAll(false);
              if (isHybridState) setSelectedHybridCode(code);
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section
        className="mb-16 border-t"
        style={{ backgroundColor: T.card, borderColor: T.border }}
      >
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <p
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: T.accent }}
          >
            // tudományos személyiségmérés
          </p>
          <h2
            className="mt-2 font-fraunces text-2xl leading-snug"
            style={{ color: T.heading }}
          >
            Kíváncsi vagy a csapatod valódi mintázatára?
          </h2>

          <SignedOut>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: T.muted }}>
              A Trita felmérése 12–15 perc — és az eredmény nem egy csúszka, hanem a
              csapatod valódi adata. Csapatprofilok, heatmap, tension pair elemzés.
            </p>
            <a
              href="/founding"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-lg px-8 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: T.accent }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = T.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = T.accent)
              }
            >
              Ingyenes próba →
            </a>
            <p className="mt-3 text-xs" style={{ color: "var(--color-muted)" }}>
              Nincs kártyaadathoz kötés. Az első felmérés ingyenes.
            </p>
          </SignedOut>

          <SignedIn>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: T.muted }}>
              Ez az interaktív eszköz csak a lehetőségeket mutatja meg. A csapatod valódi
              mintázatát objektív személyiségmérésből számoljuk — adatokból, nem becslésből.
            </p>
            <a
              href="/advisory"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-lg px-8 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: T.accent }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = T.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = T.accent)
              }
            >
              Megnézem a fejlesztési lehetőségeket →
            </a>
          </SignedIn>
        </div>
      </section>

    </div>
  );
}
