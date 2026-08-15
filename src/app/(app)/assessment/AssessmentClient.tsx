'use client'

import { estimateAssessmentMinutes } from "@/lib/questions/types";
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { EvaluatingScreen } from '@/components/assessment/EvaluatingScreen'
import { Button } from '@/components/ui/primitives/Button'
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from '@/components/ui/Toast'
import { track } from '@/lib/analytics/client'
import { useAuthState } from '@/components/auth/auth-state'
import { useLocale } from '@/components/LocaleProvider'
import { t, tf } from '@/lib/i18n'
import { JOURNEY_HOME_HANDOFF_PATH } from '@/lib/journey/routes'
import {
  clearAssessmentDraftFromStorage,
  getAssessmentDraftKey,
  getResumeQuestionIndex,
  readAssessmentDraftFromStorage,
  toAssessmentAnswerPayload,
  writeAssessmentDraftToStorage,
} from '@/lib/assessment-draft'
import type { TestType } from '@prisma/client'
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("assessment");
type AssessmentQuestion = { id: number; text: string }

// UX-A8: egyetlen milestone-képernyő félútnál (a korábbi 25/50/75%-os
// kényszer-interstitial hármas helyett), saját „Folytatom" gombbal.
const MILESTONE_PERCENT = 50

// A betöltött piszkozat-válaszokat a KISZOLGÁLT kérdések id-halmazára
// szűrjük, MIELŐTT state-be kerülnek (ahogy az ObserverClient is teszi).
// Forma-váltás vagy egy korábbi teljes forma után benn ragadt, formán
// kívüli id-k különben hamis „kész" answeredCountot és elutasított submit-
// payloadot okoznának — a debounced mentés visszaírná a szennyezett
// állapotot, és a kitöltés helyrehozhatatlan hurokba kerülne.
function pickInFormAnswers(
  raw: Record<string, number> | Record<number, number> | undefined,
  allowedIds: ReadonlySet<number>,
): Record<number, number> {
  const result: Record<number, number> = {}
  if (!raw) return result
  for (const [key, rawValue] of Object.entries(raw)) {
    const questionId = Number(key)
    if (!Number.isInteger(questionId) || !allowedIds.has(questionId)) continue
    const value = Number(rawValue)
    if (!Number.isInteger(value) || value < 1 || value > 5) continue
    result[questionId] = value
  }
  return result
}


interface AssessmentClientProps {
  testType: TestType
  testName: string
  totalQuestions: number
  questions: AssessmentQuestion[]
  initialDraft?: { answers: Record<string, number>; currentPage: number }
  clearDraft?: boolean
  guestMode?: boolean
  /** Bejelentkezett user profil-id-ja — a localStorage-draft userhez kötéséhez */
  draftScope?: string
  /**
   * UX-A10: szerver-oldalról (page.tsx) jövő döntés — van-e a usernek org-
   * vagy csapat-tagsága. Csak tagoknál van értelme a team-roles lépésnek;
   * self-serve usernél a submit közvetlenül a journey-elosztóra megy (oda,
   * ahova a team-roles oldal kapuja amúgy is visszadobná).
   */
  hasTeamContext?: boolean
}

export function AssessmentClient({
  testType,
  testName,
  totalQuestions,
  questions,
  initialDraft,
  clearDraft = false,
  guestMode = false,
  draftScope,
  hasTeamContext = false,
}: AssessmentClientProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  // Bejelentkezve az app-shell fókusz-fejléce (sticky, h-12 = 48px) már
  // renderel a kitöltő fölött. Ilyenkor NEM ismételjük meg a logót, és a
  // teljes-magasság számításából levonjuk a fejlécet — különben két
  // trita-sáv eszi a mobil viewportot, és a lábléc a fold alá csúszik.
  const { isSignedIn } = useAuthState()
  const hasShellHeader = isSignedIn
  const shellMinHeight = hasShellHeader ? "min-h-[calc(100dvh-3rem)]" : "min-h-dvh"
  const orderedQuestionIds = useMemo(() => questions.map((question) => question.id), [questions])
  const questionIdSet = useMemo(() => new Set(orderedQuestionIds), [orderedQuestionIds])
  // A kulcs a scope-pal együtt épül (ahogy az írás/olvasás is): belépett
  // usernél a draft a `__u_<scope>` kulcson él, a storage-listener enélkül
  // sosem ismerné fel a másik fül frissítését (kereszt-fül szinkron).
  const draftStorageKey = useMemo(() => getAssessmentDraftKey(testType, draftScope), [testType, draftScope])
  const maxQuestionIndex = Math.max(totalQuestions - 1, 0)
  const clampQuestionIndex = useCallback(
    (value: number) => Math.min(Math.max(value, 0), maxQuestionIndex),
    [maxQuestionIndex],
  )

  // A szerver-piszkozat formára szűrt kezdőállapota — a seedhez és a
  // „belépéskor már kész volt" döntéshez is EZ a forrás (nem a nyers,
  // esetleg formán kívüli id-kat is tartalmazó initialDraft).
  const initialInFormAnswers = useMemo(
    () => pickInFormAnswers(initialDraft?.answers, questionIdSet),
    [initialDraft?.answers, questionIdSet],
  )

  const [answers, setAnswers] = useState<Record<number, number>>(() => initialInFormAnswers)
  const [questionIndex, setQuestionIndex] = useState(0) // single flat index 0..totalQuestions-1
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  // null = not yet determined (avoid flash), true = show intro, false = skip
  const [showIntro, setShowIntro] = useState<boolean | null>(() => {
    const hasServerDraft = initialDraft && Object.keys(initialDraft.answers ?? {}).length > 0
    if (hasServerDraft) return false
    return null // will resolve in useEffect after hydration
  })
  const answersRef = useRef(answers)
  const questionIndexRef = useRef(questionIndex)
  const milestoneOpenRef = useRef(milestoneOpen)
  const isSubmittingRef = useRef(isSubmitting)
  const localDraftRevisionRef = useRef(0)
  const autoAdvanceTimerRef = useRef<number | null>(null)
  const stepTransitionLockRef = useRef(false)

  // After hydration, check localStorage for guest draft and resolve showIntro
  useEffect(() => {
    if (showIntro !== null) return
    if (readAssessmentDraftFromStorage({ testType, scope: draftScope })) {
      setShowIntro(false)
      return
    }
    setShowIntro(true)
  }, [showIntro, testType, draftScope])
  // UX-A8: már látott-e milestone-t (folytatott draftnál félút felett nem
  // mutatjuk újra).
  const milestoneSeenRef = useRef<boolean>(
    (Object.keys(initialInFormAnswers).length / totalQuestions) * 100 >=
      MILESTONE_PERCENT,
  )

  const answeredCount = Object.keys(answers).length
  const isFullyCompleted = answeredCount >= totalQuestions

  // UX-A13: kész-de-nem-regisztrált vendég a "Folytasd" CTA-ról ne a 60.
  // kérdésre essen vissza, hanem az eredmény-ízelítőjére. Csak a BETÖLTÉSKOR
  // már teljes draftra fut — élő kitöltés közben (amikor az utolsó válasz
  // most érkezik) a normál "Kiértékelés" út marad.
  const wasCompleteAtMount = useRef(
    guestMode && Object.keys(initialInFormAnswers).length >= totalQuestions,
  )
  useEffect(() => {
    // ?review=1: a záróoldal "Válaszok átnézése" linkje — ilyenkor maradunk.
    const reviewing = window.location.search.includes('review=1')
    if (wasCompleteAtMount.current && !reviewing) {
      router.replace('/try/complete')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0)
  // UX-A4: a landing és a teszt UGYANABBÓL a konstansból becsül (9 mp/item) —
  // a korábbi 15 mp/item itt „~15 perc"-et mutatott az 1. kérdésnél a ~10 perces
  // ígéret után.
  const etaMinutes = estimateAssessmentMinutes(remainingQuestions)
  const activeQuestion = questions[questionIndex] ?? null
  const canGoPrev = questionIndex > 0
  const currentQuestionAnswered = !activeQuestion || answers[activeQuestion.id] !== undefined
  const canProceed = milestoneOpen || currentQuestionAnswered
  const showEvaluateButton = !milestoneOpen && isFullyCompleted

  // Refs to always have the latest values in async callbacks
  const latestAnswersRef = useRef(answers)
  useEffect(() => {
    latestAnswersRef.current = answers
    answersRef.current = answers
  }, [answers])
  useEffect(() => {
    questionIndexRef.current = questionIndex
  }, [questionIndex])
  useEffect(() => {
    milestoneOpenRef.current = milestoneOpen
  }, [milestoneOpen])
  useEffect(() => {
    isSubmittingRef.current = isSubmitting
  }, [isSubmitting])

  const questionAreaRef = useRef<HTMLDivElement>(null)

  // ── Analitika: kitöltési tölcsér (P3 / A2) ──────────────────────────
  // A LEGFONTOSABB mérésünk: a kérdés-index hisztogramból rajzolódik ki a
  // lemorzsolódás-görbe (hol veszítjük el a kitöltőt). Csak a SORSZÁM megy
  // ki — a kérdés szövege és a válasz soha.
  const analyticsMode = guestMode ? ('guest' as const) : ('user' as const)
  const startedAtRef = useRef<number>(Date.now())
  const trackedIndexesRef = useRef<Set<number>>(new Set())
  const lastSeenIndexRef = useRef(0)

  const setQuestionIndexSafe = useCallback(
    (updater: number | ((current: number) => number)) => {
      setQuestionIndex((current) => {
        const rawNext = typeof updater === 'function' ? updater(current) : updater
        return clampQuestionIndex(rawNext)
      })
    },
    [clampQuestionIndex],
  )

  // Kérdés-megjelenés: kérdésenként EGYSZER (a vissza-előre lépkedés nem
  // hígíthatja a görbét). Az `assessment.start` az első kérdés első
  // megjelenése — így nem számoljuk azokat, akik a bevezetőn megálltak.
  useEffect(() => {
    if (showIntro !== false) return
    if (trackedIndexesRef.current.has(questionIndex)) {
      lastSeenIndexRef.current = Math.max(lastSeenIndexRef.current, questionIndex)
      return
    }
    trackedIndexesRef.current.add(questionIndex)
    lastSeenIndexRef.current = Math.max(lastSeenIndexRef.current, questionIndex)
    if (trackedIndexesRef.current.size === 1) {
      startedAtRef.current = Date.now()
      track('assessment.start', { mode: analyticsMode })
    }
    track('assessment.question_view', { mode: analyticsMode, index: questionIndex })
  }, [questionIndex, showIntro, analyticsMode])

  // Elhagyás: a lap bezárásakor/elrejtésekor, ha még nem küldtük be. A
  // `visibilitychange` az egyetlen megbízhatóan tüzelő esemény mobilon; a
  // kliens-könyvtár ugyanitt üríti a sort is (sendBeacon).
  const submittedRef = useRef(false)
  useEffect(() => {
    if (showIntro !== false) return
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return
      if (submittedRef.current || trackedIndexesRef.current.size === 0) return
      track('assessment.abandon', {
        mode: analyticsMode,
        last_index: lastSeenIndexRef.current,
      })
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [showIntro, analyticsMode])

  // Load localStorage draft after hydration (only if no server draft and not a fresh retake)
  useEffect(() => {
    if (clearDraft) {
      clearAssessmentDraftFromStorage(testType, draftScope)
      return
    }
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) {
      clearAssessmentDraftFromStorage(testType, draftScope)
      localDraftRevisionRef.current = 0
      const resumeIndex = getResumeQuestionIndex(orderedQuestionIds, initialInFormAnswers)
      setQuestionIndexSafe(resumeIndex)
      return
    }
    const localDraft = readAssessmentDraftFromStorage({
      testType,
      scope: draftScope,
      questionIds: questionIdSet,
      totalQuestions,
    })
    if (!localDraft) return

    setAnswers(localDraft.answers)
    latestAnswersRef.current = localDraft.answers
    answersRef.current = localDraft.answers
    localDraftRevisionRef.current = localDraft.revision
    const resumeIndex = getResumeQuestionIndex(orderedQuestionIds, localDraft.answers)
    setQuestionIndexSafe(resumeIndex)
    const pct = (Object.keys(localDraft.answers).length / totalQuestions) * 100
    if (pct >= MILESTONE_PERCENT) milestoneSeenRef.current = true
  }, [
    clearDraft,
    draftScope,
    initialDraft?.answers,
    initialInFormAnswers,
    orderedQuestionIds,
    questionIdSet,
    setQuestionIndexSafe,
    testType,
    totalQuestions,
  ])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== draftStorageKey) return
      if (!event.newValue) return

      const nextSnapshot = readAssessmentDraftFromStorage({
        testType,
        scope: draftScope,
        questionIds: questionIdSet,
        totalQuestions,
      })
      if (!nextSnapshot) return
      if (nextSnapshot.revision < localDraftRevisionRef.current) return

      localDraftRevisionRef.current = nextSnapshot.revision
      setAnswers(nextSnapshot.answers)
      latestAnswersRef.current = nextSnapshot.answers
      answersRef.current = nextSnapshot.answers
      const resumeIndex = getResumeQuestionIndex(orderedQuestionIds, nextSnapshot.answers)
      setQuestionIndexSafe(resumeIndex)
      setShowIntro(false)

      const pct = (Object.keys(nextSnapshot.answers).length / totalQuestions) * 100
      if (pct >= MILESTONE_PERCENT) milestoneSeenRef.current = true
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [draftStorageKey, orderedQuestionIds, questionIdSet, setQuestionIndexSafe, testType, totalQuestions, draftScope])

  // Save draft to localStorage on every meaningful change.
  useEffect(() => {
    if (answeredCount === 0) {
      clearAssessmentDraftFromStorage(testType, draftScope)
      return
    }
    localDraftRevisionRef.current += 1
    writeAssessmentDraftToStorage({
      testType,
      scope: draftScope,
      answers,
      questionIndex,
      questionIds: questionIdSet,
      totalQuestions,
      revision: localDraftRevisionRef.current,
    })
  }, [answers, answeredCount, questionIdSet, questionIndex, testType, totalQuestions, draftScope])

  // Debounced server save (2 s) — skip for guest users.
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const serverSaveAbortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    if (guestMode || answeredCount === 0) return
    if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
    serverSaveDebounce.current = setTimeout(async () => {
      serverSaveAbortRef.current?.abort()
      const abortController = new AbortController()
      serverSaveAbortRef.current = abortController
      setIsSavingDraft(true)
      try {
        await fetch('/api/assessment/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: latestAnswersRef.current,
            currentPage: questionIndexRef.current,
          }),
          signal: abortController.signal,
        })
      } catch {
        // Silent fail
      } finally {
        if (serverSaveAbortRef.current === abortController) {
          serverSaveAbortRef.current = null
          setIsSavingDraft(false)
        }
      }
    }, 2000)
    return () => {
      if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
      serverSaveDebounce.current = null
      serverSaveAbortRef.current?.abort()
      serverSaveAbortRef.current = null
      setIsSavingDraft(false)
    }
  }, [answeredCount, guestMode, questionIndex, setIsSavingDraft])

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
        autoAdvanceTimerRef.current = null
      }
    }
  }, [])

  // UX-A8: egyetlen milestone-képernyő félútnál.
  useEffect(() => {
    const percentage = (answeredCount / totalQuestions) * 100
    if (percentage < MILESTONE_PERCENT || milestoneSeenRef.current) return
    milestoneSeenRef.current = true
    setMilestoneOpen(true)
  }, [answeredCount, totalQuestions])

  const highlightMissing = useCallback(
    (missingId: number) => {
      setHighlightQuestionId(missingId)
      window.setTimeout(() => {
        setHighlightQuestionId((current) => (current === missingId ? null : current))
      }, 1200)
    },
    [],
  )

  const handleFinish = useCallback(async () => {
    // Cancel any pending debounced draft save so it doesn't re-create the draft after submit deletes it
    if (serverSaveDebounce.current) {
      clearTimeout(serverSaveDebounce.current)
      serverSaveDebounce.current = null
    }
    serverSaveAbortRef.current?.abort()
    serverSaveAbortRef.current = null
    setIsSavingDraft(false)

    const currentAnswers = latestAnswersRef.current
    const firstUnanswered = questions.findIndex((q) => currentAnswers[q.id] === undefined)
    if (firstUnanswered !== -1) {
      // UX-A9: ne néma teleport legyen — jelezzük, MIÉRT ugrottunk ide.
      setQuestionIndexSafe(firstUnanswered)
      highlightMissing(questions[firstUnanswered].id)
      showToast(t('assessment.missingAnswerToast', locale), 'error')
      return
    }
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setEvaluationProgress(0)

    const progressInterval = setInterval(() => {
      setEvaluationProgress((prev) => {
        if (prev >= 70) return prev
        return Math.min(prev + Math.random() * 4 + 1, 70)
      })
    }, 300)

    try {
      if (guestMode) {
        // Guest mode: skip API submit, keep localStorage draft, redirect to registration gate.
        // UX-A6: nincs kamu várakozás — egy rövid (~700 ms) ramp, aztán irány az eredmény.
        clearInterval(progressInterval)
        setEvaluationProgress(100)
        await new Promise((resolve) => setTimeout(resolve, 700))
        router.push('/try/complete')
        return
      }

      const payload = {
        testType,
        answers: toAssessmentAnswerPayload(currentAnswers),
      }
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        log.warn({ event: "assessment.submit_api_error", status: response.status, body: errBody }, "Submit API error")
        throw new Error(t('assessment.saveResultError', locale))
      }

      clearInterval(progressInterval)
      // Innentől a lapelhagyás NEM lemorzsolódás — a `assessment.complete`
      // eseményt amúgy is a szerver írja (hamisíthatatlan).
      submittedRef.current = true
      clearAssessmentDraftFromStorage(testType, draftScope)

      // UX-A6: az API már válaszolt — a korábbi 4,6 mp kamu „kiértékelés"
      // helyett rövid lezáró ramp, és megyünk tovább.
      setEvaluationProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 700))
      // UX-A10: a team-roles lépés csak org-/csapat-tagnak szól — self-serve
      // usernél a team-roles oldal kapuja úgyis a journey-fallbackra dobna,
      // ezért közvetlenül a journey-elosztóra megyünk (friss, submit utáni
      // állapotból dönt).
      router.push(hasTeamContext ? '/assessment/team-roles' : JOURNEY_HOME_HANDOFF_PATH)
    } catch (error) {
      clearInterval(progressInterval)
      isSubmittingRef.current = false
      setIsSubmitting(false)
      setEvaluationProgress(0)
      log.warn({ event: "assessment.submit_failed", err: error }, "Submit failed")
      showToast(t('assessment.saveError', locale), 'error')
    }
  }, [questions, setQuestionIndexSafe, highlightMissing, testType, locale, router, showToast, guestMode, draftScope, hasTeamContext])

  const scheduleAutoAdvance = useCallback((questionId: number, nextAnsweredCount: number) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      const liveQuestion = questions[questionIndexRef.current]
      if (!liveQuestion || liveQuestion.id !== questionId) return

      const nextProgress = (nextAnsweredCount / totalQuestions) * 100
      const willTriggerMilestone =
        nextProgress >= MILESTONE_PERCENT && !milestoneSeenRef.current
      if (willTriggerMilestone || milestoneOpenRef.current) return

      if (questionIndexRef.current < totalQuestions - 1) {
        setQuestionIndexSafe((current) => current + 1)
      } else {
        void handleFinish()
      }
    }, 130)
  }, [handleFinish, questions, setQuestionIndexSafe, totalQuestions])

  const handleAnswer = useCallback((questionId: number, value: number) => {
    if (isSubmittingRef.current) return
    if (questions[questionIndexRef.current]?.id !== questionId) return

    let nextAnsweredCount = 0
    setAnswers((current) => {
      const next = { ...current, [questionId]: value }
      latestAnswersRef.current = next
      answersRef.current = next
      nextAnsweredCount = Object.keys(next).length
      return next
    })

    if (!autoAdvance) return
    scheduleAutoAdvance(questionId, nextAnsweredCount)
  }, [autoAdvance, questions, scheduleAutoAdvance])

  const runStepTransition = useCallback((action: () => void) => {
    if (stepTransitionLockRef.current) return
    stepTransitionLockRef.current = true
    action()
    window.setTimeout(() => {
      stepTransitionLockRef.current = false
    }, 120)
  }, [])

  const handlePrevStep = useCallback(() => {
    if (milestoneOpenRef.current) {
      setMilestoneOpen(false)
      return
    }
    if (questionIndexRef.current > 0) {
      runStepTransition(() => {
        setQuestionIndexSafe((current) => current - 1)
      })
    }
  }, [runStepTransition, setQuestionIndexSafe])

  const handleNextStep = useCallback(async () => {
    if (milestoneOpenRef.current) {
      setMilestoneOpen(false)
      if (questionIndexRef.current < totalQuestions - 1) {
        runStepTransition(() => {
          setQuestionIndexSafe((current) => current + 1)
        })
      }
      return
    }
    const liveQuestion = questions[questionIndexRef.current]
    const liveAnswers = answersRef.current
    if (liveQuestion && liveAnswers[liveQuestion.id] === undefined) {
      highlightMissing(liveQuestion.id)
      return
    }

    if (questionIndexRef.current < totalQuestions - 1) {
      runStepTransition(() => {
        setQuestionIndexSafe((current) => current + 1)
      })
      return
    }

    if (isSubmittingRef.current) return
    await handleFinish()
  }, [highlightMissing, handleFinish, questions, runStepTransition, setQuestionIndexSafe, totalQuestions])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSubmitting) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      if (!milestoneOpen && activeQuestion && ['1', '2', '3', '4', '5'].includes(event.key)) {
        event.preventDefault()
        handleAnswer(activeQuestion.id, Number(event.key))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        void handleNextStep()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [milestoneOpen, activeQuestion, isSubmitting, handleNextStep, handleAnswer])

  if (isSubmitting) {
    return <EvaluatingScreen progress={evaluationProgress} />
  }

  // Still resolving localStorage — UX-A17: brand-spinner az üres képernyő
  // helyett (lassú eszközön / tiltott storage-nál törött oldalnak tűnt).
  if (showIntro === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--color-surface-canvas)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-primary)] border-t-transparent" />
      </div>
    );
  }

  if (showIntro) {
    const steps = [
      { num: 1, style: "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]", title: t("assessment.introStep1", locale), sub: tf("assessment.introStep1Sub", locale, { count: totalQuestions }) },
      { num: 2, style: "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]", title: t("assessment.introStep2", locale), sub: t("assessment.introStep2Sub", locale) },
      { num: 3, style: "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]", title: t("assessment.introStep3", locale), sub: t("assessment.introStep3Sub", locale) },
    ]
    const previewDims = [
      { name: t("landing.selfDim1", locale), val: 79 },
      { name: t("landing.selfDim2", locale), val: 46 },
      { name: t("landing.selfDim3", locale), val: 34 },
    ]
    return (
      <div className={`${shellMinHeight} bg-[var(--color-surface-canvas)]`}>
        {/* Minimal nav — csak ha a shell fókusz-fejléce nincs jelen. */}
        {!hasShellHeader && (
          <nav className="flex items-center justify-between bg-[var(--color-surface-header)]/95 px-6 py-3 backdrop-blur-[12px] sm:px-10 lg:px-16">
            <Link href="/" className="font-fraunces text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
              <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
            </Link>
            {/* A NavBar ezen az útvonalon szándékosan null (krómmentes fókusz),
                ezért a séma-választó ide kerül — kijelentkezve is elérhető. */}
            <ThemeToggle variant="compact" />
          </nav>
        )}

        {/* Two-column hero */}
        <div className="mx-auto max-w-4xl px-5 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-8 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:py-14">

            {/* Left column */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <div className="h-px w-4 bg-[var(--color-accent-primary)]" />
                <span className="text-micro font-medium uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                  {t("assessment.introEyebrow", locale)}
                </span>
              </div>
              <h1 className="mb-3 font-fraunces text-[26px] leading-[1.15] tracking-tight text-[var(--color-text-primary)] lg:text-[28px]">
                {tf("assessment.introHeadline1", locale, { minutes: estimateAssessmentMinutes(totalQuestions) })}
                <em className="not-italic text-[var(--color-accent-primary)]">{t("assessment.introHeadlineEm", locale)}</em>
              </h1>
              <p className="mb-5 max-w-[360px] text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t("assessment.introSub", locale)}
              </p>
              <div className="mb-5 rounded-r-lg border-l-2 border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] px-3.5 py-3">
                <p className="text-xs leading-relaxed text-[var(--color-accent-self-deep)]">
                  {t("assessment.introInfo", locale)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="w-full rounded-[10px] bg-[var(--color-action-primary-bg)] px-8 py-3.5 text-body font-semibold text-[var(--color-action-primary-fg)] shadow-md shadow-[var(--color-action-primary-bg)]/20 transition-all hover:-translate-y-px hover:brightness-[1.06] hover:shadow-lg lg:w-auto"
              >
                {t("assessment.introStart", locale)}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[var(--color-text-muted)] lg:text-left">
                {tf("assessment.introMeta", locale, { count: totalQuestions, minutes: estimateAssessmentMinutes(totalQuestions) })}
              </p>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-2.5">
              {steps.map((s) => (
                <div key={s.num} className="flex items-start gap-2.5 rounded-[10px] border border-[var(--color-border-default)] bg-surface-card p-3 px-3.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-fraunces text-caption font-medium ${s.style}`}>
                    {s.num}
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-[var(--color-text-primary)]">{s.title}</p>
                    <p className="text-[11px] leading-[1.4] text-[var(--color-text-muted)]">{s.sub}</p>
                  </div>
                </div>
              ))}
              {/* Dekoratív miniatűr eredmény-teaser — a törpe, halvány szöveg
                  szándékos „thumbnail"-hatás, nem olvasásra szánt tartalom,
                  ezért aria-hidden és mentesül a 10px-es a11y-padló alól. */}
              <div aria-hidden className="mt-1 rounded-[10px] bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-4 py-3.5">
                {/* eslint-disable-next-line no-restricted-syntax */}
                <p className="text-[6px] uppercase tracking-widest text-white/20">
                  {t("assessment.introPreviewEyebrow", locale)}
                </p>
                <p className="mt-0.5 font-fraunces text-sm font-medium italic text-[var(--color-accent-primary-soft)]">
                  {t("landing.selfPanelType", locale)}
                </p>
                <div className="mt-2 flex gap-1.5">
                  {previewDims.map((d) => (
                    <div key={d.name} className="flex-1 rounded bg-white/[0.05] px-1 py-1 text-center">
                      {/* eslint-disable-next-line no-restricted-syntax */}
                      <p className="text-[5px] text-white/20">{d.name}</p>
                      <p className="font-fraunces text-xs text-white/[0.35]">{d.val}</p>
                    </div>
                  ))}
                </div>
                {/* eslint-disable-next-line no-restricted-syntax */}
                <p className="mt-1.5 text-center text-[7px] text-white/[0.15]">
                  {t("assessment.introPreviewLabel", locale)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${shellMinHeight} flex-col bg-[var(--color-surface-canvas)]`}>
      {/* ═══ MINIMAL NAV ═══ — a logó csak akkor, ha a shell fejléce nem
          renderel fölötte (különben két azonos márkasáv ülne egymáson). */}
      <nav
        className={`flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 bg-[var(--color-surface-header)]/95 px-4 backdrop-blur-[12px] sm:px-10 lg:px-16 ${
          hasShellHeader ? "justify-end py-1.5" : "justify-between py-3"
        }`}
      >
        {!hasShellHeader && (
          <Link href="/" className="font-fraunces text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
          </Link>
        )}
        <div className="flex items-center gap-3">
          {/* A kitöltés közben is elérhető: aki világosban indult és
              zavarónak találja, ne kelljen félbehagynia a kitöltést. */}
          <ThemeToggle variant="compact" />
          {/* UX-A5: vendégnél őszinte címke — csak ebben a böngészőben mentünk. */}
          <span className="text-micro text-[var(--color-action-primary-bg)]">
            ✓ {guestMode
              ? t('assessment.savedStateGuest', locale)
              : isSavingDraft ? t('actions.save', locale) : t('assessment.savedState', locale)}
          </span>
          <a
            href={guestMode ? "/" : "/profile/results"}
            className="rounded-md border border-[var(--color-border-default)] bg-surface-card px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-secondary)]"
          >
            {t('assessment.continueLater', locale)}
          </a>
        </div>
      </nav>

      {/* ═══ PROGRESS BAR — single row ═══ */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border-default)] px-4 py-2.5 md:gap-4 md:px-7">
        <div className="flex items-baseline gap-1">
          <span className="font-fraunces text-base font-medium text-[var(--color-text-primary)]">{questionIndex + 1}</span>
          <span className="text-xs text-[var(--color-text-muted)]">/ {totalQuestions}</span>
        </div>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border-default)]">
          {/* Answered reach — light sage: up to last answered question position */}
          {(() => {
            let lastAnsweredIdx = -1;
            for (let i = questions.length - 1; i >= 0; i--) {
              if (answers[questions[i].id] !== undefined) { lastAnsweredIdx = i; break; }
            }
            const answeredReach = Math.max(lastAnsweredIdx + 1, questionIndex + 1);
            return (
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)]/30 transition-all duration-300"
                style={{ width: `${(answeredReach / totalQuestions) * 100}%` }}
              />
            );
          })()}
          {/* Current position — solid sage */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)] transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[11px] text-[var(--color-text-muted)]">
          {tf('assessment.etaRemaining', locale, { minutes: etaMinutes })}
        </span>
      </div>

      {/* ═══ QUESTION AREA (centered) ═══ */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 lg:py-12">
        <div ref={questionAreaRef} className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={milestoneOpen ? 'milestone' : `q-${activeQuestion?.id ?? 'none'}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              {milestoneOpen ? (
                <div className="flex flex-col items-center text-center">
                  {/* Sage pill badge */}
                  <div className="mb-4 inline-flex items-center gap-[5px] rounded-full bg-[var(--color-surface-self-accent-soft)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-action-primary-bg)]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
                    {t('assessment.journeyMilestone', locale)}
                  </div>

                  {/* Title */}
                  <h2 className="mb-3 font-fraunces text-[24px] leading-tight text-[var(--color-text-primary)] lg:text-[26px]">
                    {t('assessment.journeyMilestone50', locale)}
                  </h2>

                  {/* Subtitle */}
                  <p className="mb-5 max-w-[400px] text-[14px] leading-relaxed text-[var(--color-text-muted)]">
                    {t('assessment.journeyMilestone50Sub', locale)}
                  </p>

                  {/* Segmented progress — 10 segments */}
                  <div className="mb-5 flex w-full max-w-[280px] gap-[3px]">
                    {Array.from({ length: 10 }, (_, i) => {
                      const filledSegments = Math.round((answeredCount / totalQuestions) * 10);
                      return (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < filledSegments
                              ? "bg-[var(--color-action-primary-bg)]"
                              : i === filledSegments
                                ? "bg-[var(--color-accent-primary)]"
                                : "bg-[var(--color-border-default)]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Tip callout */}
                  <div className="flex w-full max-w-[400px] items-start gap-2 rounded-lg bg-[var(--color-surface-self-accent-soft)] px-4 py-3 text-left">
                    <span className="mt-px shrink-0 text-sm">💡</span>
                    <p className="text-caption leading-[1.45] text-[var(--color-accent-self-deep)]">
                      {t('assessment.journeyMilestone50Hint', locale)}
                    </p>
                  </div>

                  {/* UX-A8: saját továbblépő gomb — a milestone nem függ a
                      lábléc „Tovább" gombjától. */}
                  <Button
                    type="button"
                    onClick={() => void handleNextStep()}
                    className="mt-6 w-full max-w-[280px]"
                  >
                    {t('assessment.milestoneContinue', locale)} →
                  </Button>
                </div>
              ) : activeQuestion ? (
                <QuestionCard
                  testName={testName}
                  format="likert"
                  question={activeQuestion.text}
                  value={(answers[activeQuestion.id] as number) ?? null}
                  onChange={(v) => handleAnswer(activeQuestion.id, v)}
                  highlight={highlightQuestionId === activeQuestion.id}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hint */}
        <p className="mt-6 text-xs italic text-[var(--color-text-muted)]">
          {t('assessment.helpLikert', locale)}
        </p>
        {/* UX-A12: a billentyű-gyorsítók léteztek, de sehol nem voltak
            elmagyarázva — asztali nézetben megmutatjuk. */}
        <p className="mt-1 hidden text-xs text-[var(--color-text-muted)] md:block">
          {t('assessment.keyboardHint', locale)}
        </p>
      </div>

      {/* ═══ FOOTER BAR ═══ */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--color-border-default)] bg-surface-card px-4 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.02)] md:flex-nowrap md:px-7">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={!canGoPrev}
          className={`min-h-[44px] whitespace-nowrap rounded-lg border px-4 py-2.5 text-caption transition-all md:px-5 ${
            canGoPrev
              ? "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
              : "border-transparent bg-transparent text-transparent pointer-events-none"
          }`}
        >
          ← {t('assessment.prevCta', locale)}
        </button>

        {/* Mobilon saját sorba kerül (order-last + w-full), hogy a két
            navigációs gomb ne préselődjön össze; asztalon a sorban marad. */}
        <label className="order-last flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 md:order-none md:w-auto md:justify-start">
          <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-[1.5px] transition-all ${
              autoAdvance ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)]" : "border-[var(--color-border-default)] bg-surface-card"
            }`}
          >
            {autoAdvance && <span className="text-micro leading-none text-white">✓</span>}
          </div>
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="sr-only"
          />
          <span className="text-[11px] text-[var(--color-text-muted)]">{t('assessment.autoAdvance', locale)}</span>
        </label>

        {/* UX-A7: az autosave fire-and-forget — a fő gombot nem tiltjuk le
            miatta (lassú neten random kiszürkült magyarázat nélkül). */}
        {!showEvaluateButton ? (
          <button
            type="button"
            onClick={() => void handleNextStep()}
            disabled={!canProceed}
            className={`min-h-[44px] whitespace-nowrap rounded-lg px-5 py-2.5 text-caption font-semibold transition-all md:px-6 ${
              canProceed
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
            }`}
          >
            {t('assessment.nextCta', locale)} →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleFinish()}
            disabled={isSubmitting}
            className={`min-h-[44px] whitespace-nowrap rounded-lg px-5 py-2.5 text-caption font-semibold transition-all md:px-6 ${
              !isSubmitting
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
            }`}
          >
            {t('assessment.evaluateCta', locale)}
          </button>
        )}
      </div>
    </div>
  )
}
