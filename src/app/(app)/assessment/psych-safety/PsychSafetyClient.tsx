"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_ITEM_COUNT,
  type PsychSafetyAnswers,
} from "@/lib/psych-safety";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PsychSafetyClientProps {
  locale: Locale;
  campaignId: string;
  campaignName: string;
}

type Phase = "intro" | "answering" | "submitting" | "done" | "error";

// Pszichológiai biztonság pulse — a self-kitöltés vizuális nyelvén:
// egyszerre egy kérdés, csúszó kártya, haladásjelző. A válaszok anonimok,
// ezért itt NINCS piszkozat-mentés (a localStorage-ban sem hagyunk nyomot).
export function PsychSafetyClient({
  locale,
  campaignId,
  campaignName,
}: PsychSafetyClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const answersRef = useRef<PsychSafetyAnswers>({});
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = PSYCH_SAFETY_ITEMS[index];

  const submit = useCallback(
    async (answers: PsychSafetyAnswers) => {
      setPhase("submitting");
      try {
        const res = await fetch("/api/psych-safety/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId, answers }),
        });
        if (!res.ok) throw new Error("submit failed");
        setPhase("done");
      } catch {
        setPhase("error");
      }
    },
    [campaignId],
  );

  const handleAnswer = useCallback(
    (value: number) => {
      setCurrentValue(value);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        answersRef.current = { ...answersRef.current, [item.id]: value };
        if (index + 1 >= PSYCH_SAFETY_ITEM_COUNT) {
          void submit(answersRef.current);
        } else {
          setIndex((i) => i + 1);
          setCurrentValue(answersRef.current[PSYCH_SAFETY_ITEMS[index + 1].id] ?? null);
        }
      }, 350);
    },
    [index, item, submit],
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-widest text-bronze">
          {t("psafety.eyebrow", locale)}
        </p>
        <h1 className="mt-3 text-center font-fraunces text-3xl leading-tight text-ink">
          {t("psafety.introTitle", locale)}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">{campaignName}</p>
        <p className="mt-5 max-w-md text-center text-[14px] leading-relaxed text-ink-body">
          {tf("psafety.introBody", locale, { count: PSYCH_SAFETY_ITEM_COUNT })}
        </p>
        <div className="mt-6 w-full rounded-xl border border-sage/30 bg-sage/5 px-4 py-3.5">
          <p className="text-[13px] leading-relaxed text-ink-body">
            <span className="font-semibold text-ink">
              {t("psafety.anonTitle", locale)}
            </span>{" "}
            {t("psafety.anonBody", locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPhase("answering")}
          className="mt-8 inline-flex min-h-[48px] items-center rounded-[10px] bg-action-primary-bg px-8 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {t("psafety.start", locale)}
        </button>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted">
          {tf("psafety.meta", locale, { count: PSYCH_SAFETY_ITEM_COUNT })}
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl">🌱</div>
        <h1 className="mt-4 font-fraunces text-2xl text-ink">
          {t("psafety.doneTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("psafety.doneBody", locale)}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          {t("psafety.backToDashboard", locale)}
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-fraunces text-2xl text-ink">
          {t("psafety.errorTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("psafety.errorBody", locale)}
        </p>
        <button
          type="button"
          onClick={() => submit(answersRef.current)}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          {t("psafety.retry", locale)}
        </button>
      </div>
    );
  }

  // answering / submitting
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-bronze">
          {t("psafety.eyebrow", locale)}
        </p>
        <p className="font-mono text-[11px] text-muted">
          {index + 1} / {PSYCH_SAFETY_ITEM_COUNT}
        </p>
      </div>
      <div className="mt-3">
        <ProgressBar current={index + 1} total={PSYCH_SAFETY_ITEM_COUNT} />
      </div>
      <p className="mt-3 text-center text-[12px] text-muted">
        {t("psafety.anonStrip", locale)}
      </p>

      <div className="flex flex-1 flex-col items-center justify-center py-10">
        {phase === "submitting" ? (
          <p className="text-sm text-muted">{t("psafety.submitting", locale)}</p>
        ) : (
          <AnimatePresence mode="wait">
            <QuestionCard
              key={item.id}
              format="likert"
              testName="psych-safety"
              question={item.text[locale === "en" ? "en" : "hu"]}
              value={currentValue}
              onChange={handleAnswer}
            />
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
