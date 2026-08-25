"use client";

import { useCallback, useEffect, useRef } from "react";

interface AssessmentStepControllerOptions {
  getActiveQuestionId: () => number | null;
  autoAdvanceDelay?: number;
  transitionLockDelay?: number;
}

/**
 * Shared navigation guard for the self and observer assessment flows.
 *
 * It keeps only one auto-advance timer alive, validates that the answer still
 * belongs to the visible question before advancing, and prevents rapid manual
 * actions from applying two transitions to the same step.
 */
export function useAssessmentStepController({
  getActiveQuestionId,
  autoAdvanceDelay = 130,
  transitionLockDelay = 120,
}: AssessmentStepControllerOptions) {
  const getActiveQuestionIdRef = useRef(getActiveQuestionId);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const transitionUnlockTimerRef = useRef<number | null>(null);
  const transitionLockedRef = useRef(false);

  useEffect(() => {
    getActiveQuestionIdRef.current = getActiveQuestionId;
  }, [getActiveQuestionId]);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current === null) return;
    window.clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = null;
  }, []);

  const scheduleAutoAdvance = useCallback(
    (sourceQuestionId: number, advance: () => void) => {
      cancelAutoAdvance();
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        autoAdvanceTimerRef.current = null;
        if (getActiveQuestionIdRef.current() !== sourceQuestionId) return;
        advance();
      }, autoAdvanceDelay);
    },
    [autoAdvanceDelay, cancelAutoAdvance],
  );

  const runStepTransition = useCallback(
    (action: () => void) => {
      if (transitionLockedRef.current) return false;
      cancelAutoAdvance();
      transitionLockedRef.current = true;
      action();
      transitionUnlockTimerRef.current = window.setTimeout(() => {
        transitionLockedRef.current = false;
        transitionUnlockTimerRef.current = null;
      }, transitionLockDelay);
      return true;
    },
    [cancelAutoAdvance, transitionLockDelay],
  );

  useEffect(() => {
    return () => {
      cancelAutoAdvance();
      if (transitionUnlockTimerRef.current !== null) {
        window.clearTimeout(transitionUnlockTimerRef.current);
        transitionUnlockTimerRef.current = null;
      }
      transitionLockedRef.current = false;
    };
  }, [cancelAutoAdvance]);

  return { cancelAutoAdvance, runStepTransition, scheduleAutoAdvance };
}
