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
import {
  AssessmentFlowHeader,
  AssessmentFlowShell,
  AssessmentIntro,
  AssessmentStatus,
  assessmentPrimaryActionClass,
} from "@/components/assessment/AssessmentFlowShell";

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
      <AssessmentIntro
        eyebrow={t("psafety.eyebrow", locale)}
        title={t("psafety.introTitle", locale)}
        campaignName={campaignName}
        body={tf("psafety.introBody", locale, { count: PSYCH_SAFETY_ITEM_COUNT })}
        notice={
          <>
            <span className="font-semibold text-ink">
              {t("psafety.anonTitle", locale)}
            </span>{" "}
            {t("psafety.anonBody", locale)}
          </>
        }
        action={<button type="button" onClick={() => setPhase("answering")} className={assessmentPrimaryActionClass}>{t("psafety.start", locale)}</button>}
        meta={tf("psafety.meta", locale, { count: PSYCH_SAFETY_ITEM_COUNT })}
      />
    );
  }

  if (phase === "done") {
    return (
      <AssessmentStatus
        tone="success"
        title={t("psafety.doneTitle", locale)}
        body={t("psafety.doneBody", locale)}
        action={<button type="button" onClick={() => router.push("/dashboard")} className={assessmentPrimaryActionClass}>{t("psafety.backToDashboard", locale)}</button>}
      />
    );
  }

  if (phase === "error") {
    return (
      <AssessmentStatus
        tone="error"
        title={t("psafety.errorTitle", locale)}
        body={t("psafety.errorBody", locale)}
        action={<button
          type="button"
          onClick={() => submit(answersRef.current)}
          className={assessmentPrimaryActionClass}
        >
          {t("psafety.retry", locale)}
        </button>}
      />
    );
  }

  // answering / submitting
  return (
    <AssessmentFlowShell>
      <AssessmentFlowHeader
        eyebrow={t("psafety.eyebrow", locale)}
        progress={`${index + 1} / ${PSYCH_SAFETY_ITEM_COUNT}`}
      />
      <div className="mt-3">
        <ProgressBar current={index + 1} total={PSYCH_SAFETY_ITEM_COUNT} />
      </div>
      <p className="mt-3 text-center text-xs text-muted">
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
    </AssessmentFlowShell>
  );
}
