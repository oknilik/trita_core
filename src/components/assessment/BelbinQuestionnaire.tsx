"use client";

import { useState, useCallback } from "react";
import type { Locale } from "@/lib/i18n";
import { BELBIN_SECTIONS } from "@/lib/belbin-questions";
import { calculateBelbinScores, getTopRoles } from "@/lib/belbin-scoring";
import type { BelbinAnswers } from "@/lib/belbin-scoring";

interface BelbinQuestionnaireProps {
  locale: Locale | string;
  onComplete: (answers: BelbinAnswers) => void;
  onSkip?: () => void;
}

const POINTS_PER_GROUP = 10;

function PointsRow({
  statement,
  points,
  remaining,
  isHu,
  onChange,
}: {
  statement: { index: number; hu: string; en: string };
  points: number;
  remaining: number;
  isHu: boolean;
  onChange: (idx: number, val: number) => void;
}) {
  const canIncrement = remaining > 0 || points > 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 text-sm leading-relaxed text-[#3d3a35]">
        {isHu ? statement.hu : statement.en}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(statement.index, Math.max(0, points - 1))}
          disabled={points === 0}
          aria-label={isHu ? "Csökkent" : "Decrease"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e4dc] bg-white text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8h10" />
          </svg>
        </button>
        <span
          className={`w-6 text-center font-mono text-sm font-semibold tabular-nums ${
            points > 0 ? "text-[#c8410a]" : "text-[#a09a90]"
          }`}
        >
          {points}
        </span>
        <button
          type="button"
          onClick={() => onChange(statement.index, points + 1)}
          disabled={remaining === 0}
          aria-label={isHu ? "Növel" : "Increase"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e4dc] bg-white text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function BelbinQuestionnaire({
  locale,
  onComplete,
  onSkip,
}: BelbinQuestionnaireProps) {
  const isHu = locale === "hu";
  const [currentGroup, setCurrentGroup] = useState(0);
  const [answers, setAnswers] = useState<BelbinAnswers>(() =>
    Object.fromEntries(
      BELBIN_SECTIONS.map((s) => [
        s.group,
        Object.fromEntries(s.statements.map((st) => [st.index, 0])),
      ]),
    ),
  );
  const [showIntro, setShowIntro] = useState(true);

  const groupAnswers = answers[currentGroup] ?? {};
  const used = Object.values(groupAnswers).reduce((a, b) => a + b, 0);
  const remaining = POINTS_PER_GROUP - used;
  const section = BELBIN_SECTIONS[currentGroup];

  const handleChange = useCallback(
    (stmtIdx: number, newVal: number) => {
      setAnswers((prev) => {
        const groupVals = { ...(prev[currentGroup] ?? {}) };
        const oldVal = groupVals[stmtIdx] ?? 0;
        const delta = newVal - oldVal;
        const currentUsed = Object.values(groupVals).reduce((a, b) => a + b, 0);
        if (currentUsed + delta > POINTS_PER_GROUP) return prev;
        groupVals[stmtIdx] = newVal;
        return { ...prev, [currentGroup]: groupVals };
      });
    },
    [currentGroup],
  );

  const canProceed = remaining === 0;

  const handleNext = () => {
    if (currentGroup < BELBIN_SECTIONS.length - 1) {
      setCurrentGroup((g) => g + 1);
    } else {
      onComplete(answers);
    }
  };

  if (showIntro) {
    return (
      <div className="flex flex-col gap-6 rounded-2xl border border-[#e8e4dc] bg-white p-6 md:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// belbin csapatszerep kérdőív" : "// belbin team role questionnaire"}
        </p>
        <div>
          <h2 className="font-playfair text-2xl text-[#1a1814]">
            {isHu ? "Ismerd meg csapatszerepeidet" : "Discover your team roles"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5a5650]">
            {isHu
              ? "Ez a kérdőív 7 szakaszból áll. Minden szakaszban 10 pontot kell elosztanod 8 állítás között — abból, hogy mennyi igaz rád a csapatmunkában."
              : "This questionnaire has 7 sections. In each section, distribute 10 points across 8 statements — based on how much each applies to you in team work."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#5a5650]">
            {isHu
              ? "Egy állítás kaphat 0-10 pontot. Minden szakasz összes pontja egyenlő 10-zel."
              : "A statement can receive 0–10 points. All points in each section must add up to 10."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
          >
            {isHu ? "Elkezdem →" : "Start →"}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#e8e4dc] px-5 text-sm font-semibold text-[#5a5650] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]"
            >
              {isHu ? "Kihagyom" : "Skip"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[#e8e4dc] bg-white p-6 md:p-10">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 overflow-hidden rounded-full bg-[#e8e4dc]">
          <div
            className="h-1.5 rounded-full bg-[#c8410a] transition-all duration-300"
            style={{ width: `${((currentGroup + 1) / BELBIN_SECTIONS.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-[#a09a90]">
          {currentGroup + 1} / {BELBIN_SECTIONS.length}
        </span>
      </div>

      {/* Heading */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? `${currentGroup + 1}. szakasz` : `Section ${currentGroup + 1}`}
        </p>
        <h3 className="mt-1 font-playfair text-xl text-[#1a1814]">
          {isHu ? section.heading.hu : section.heading.en}
        </h3>
      </div>

      {/* Points remaining badge */}
      <div
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
          remaining === 0
            ? "bg-emerald-50 text-emerald-700"
            : "bg-[#faf9f6] text-[#5a5650]"
        }`}
      >
        {remaining === 0 ? (
          <>
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l3.5 3.5L13 5" />
            </svg>
            {isHu ? "Minden pont elosztva" : "All points distributed"}
          </>
        ) : (
          isHu
            ? `${remaining} pont maradt a elosztáshoz`
            : `${remaining} point${remaining !== 1 ? "s" : ""} remaining`
        )}
      </div>

      {/* Statements */}
      <div className="divide-y divide-[#e8e4dc]">
        {section.statements.map((stmt) => (
          <PointsRow
            key={stmt.index}
            statement={stmt}
            points={groupAnswers[stmt.index] ?? 0}
            remaining={remaining}
            isHu={isHu}
            onChange={handleChange}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setCurrentGroup((g) => Math.max(0, g - 1))}
          disabled={currentGroup === 0}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#e8e4dc] px-4 text-sm font-semibold text-[#5a5650] transition hover:border-[#c8410a]/40 hover:text-[#c8410a] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? "Vissza" : "Back"}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {currentGroup < BELBIN_SECTIONS.length - 1
            ? (isHu ? "Következő →" : "Next →")
            : (isHu ? "Befejezem ✓" : "Finish ✓")}
        </button>
      </div>
    </div>
  );
}
