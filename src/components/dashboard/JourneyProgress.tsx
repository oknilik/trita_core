"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { t, tf, type Locale } from "@/lib/i18n";

interface JourneyProgressProps {
  locale: Locale;
  initialHasInvites: boolean;
  initialPendingInvites: number;
  hasObserverFeedback: boolean;
  completedObserversCount?: number;
  onTabChange?: (tab: "invites" | "comparison") => void;
  /** If false, the self-assessment step is not yet completed (empty state). Defaults to true. */
  selfCompleted?: boolean;
  /** Whether the user has an in-progress draft (only relevant when selfCompleted=false). */
  hasDraft?: boolean;
  /** Number of questions already answered in the draft. */
  draftAnsweredCount?: number;
  /** Total number of questions in the draft's test. */
  draftTotalQuestions?: number;
  /** Whether the research survey has already been submitted. */
  surveySubmitted?: boolean;
  /** Opens the research survey modal. */
  onOpenSurvey?: () => void;
}

interface InviteProgressEventDetail {
  hasInvites: boolean;
  pendingInvites: number;
}

export function JourneyProgress({
  locale,
  initialHasInvites,
  initialPendingInvites,
  hasObserverFeedback,
  completedObserversCount = 0,
  onTabChange,
  selfCompleted = true,
  hasDraft = false,
  draftAnsweredCount = 0,
  draftTotalQuestions = 0,
  surveySubmitted = true,
  onOpenSurvey,
}: JourneyProgressProps) {
  const [hasInvites, setHasInvites] = useState(initialHasInvites);
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);
  const [surveyDone, setSurveyDone] = useState(surveySubmitted);
  const containerRef = useRef<HTMLDivElement>(null);
  const [journeyVisible, setJourneyVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onInvitesUpdated = (event: Event) => {
      const detail = (event as CustomEvent<InviteProgressEventDetail>).detail;
      if (!detail) return;
      setHasInvites(detail.hasInvites);
      setPendingInvites(detail.pendingInvites);
    };
    const onSurveySubmitted = () => setSurveyDone(true);

    window.addEventListener("dashboard:invites-updated", onInvitesUpdated);
    window.addEventListener("dashboard:survey-submitted", onSurveySubmitted);
    return () => {
      window.removeEventListener("dashboard:invites-updated", onInvitesUpdated);
      window.removeEventListener("dashboard:survey-submitted", onSurveySubmitted);
    };
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setJourneyVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const feedbackInProgress = (pendingInvites > 0 || (completedObserversCount > 0 && !hasObserverFeedback)) && !hasObserverFeedback;
  const feedbackPartial = pendingInvites > 0 && hasObserverFeedback;
  const totalSteps = 3;
  const stepsCompleted =
    (selfCompleted ? 1 : 0) +
    (selfCompleted && hasInvites ? 1 : 0) +
    (selfCompleted && hasObserverFeedback ? 1 : 0);
  const progressPct = Math.round((stepsCompleted / totalSteps) * 100);

  const inviteBody: ReactNode = (
    <span>
      {t("dashboard.nextStepInviteBodyPre", locale)}
      <strong className="font-bold italic">{t("dashboard.nextStepInviteBodyHighlight", locale)}</strong>
      {t("dashboard.nextStepInviteBodyPost", locale)}
    </span>
  );

  const nextStep: { title: string; body: ReactNode; cta: string; href: string; useLink?: boolean; onAction?: () => void } = !selfCompleted
    ? hasDraft
      ? {
          title: t("dashboard.nextStepDraftTitle", locale),
          body: t("dashboard.nextStepDraftBody", locale),
          cta: t("actions.continueTest", locale),
          href: "/assessment",
        }
      : {
          title: t("dashboard.nextStepTestTitle", locale),
          body: t("dashboard.nextStepTestBody", locale),
          cta: t("actions.startTest", locale),
          href: "/assessment",
        }
    : !hasInvites
      ? {
          title: t("dashboard.nextStepInviteTitle", locale),
          body: inviteBody,
          cta: t("dashboard.nextStepInviteCta", locale),
          href: "#invite",
        }
      : !hasObserverFeedback
        ? {
            title: t("dashboard.nextStepWaitTitle", locale),
            body: tf("dashboard.nextStepWaitBody", locale, { received: completedObserversCount, pending: pendingInvites }),
            cta: t("dashboard.nextStepManageInvitesCta", locale),
            href: "#invite",
          }
        : {
            title: t("dashboard.nextStepDoneTitle", locale),
            body: t("dashboard.nextStepDoneBody", locale),
            cta: t("dashboard.nextStepDoneCta", locale),
            href: hasObserverFeedback ? "#comparison" : "#results",
          };

  // Whether the CTA should use a Link (href navigation) vs button (tab change)
  const useLink = !selfCompleted || !onTabChange;

  const allDone = stepsCompleted === totalSteps && surveyDone;
  const showSurveyInSticky = stepsCompleted === totalSteps && !surveyDone && !!onOpenSurvey;
  const showStickyBar = !journeyVisible && !allDone;

  return (
    <>
    <div ref={containerRef} className="mt-6">
      <div className="mt-6 flex justify-center md:hidden">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white shadow-lg">
          {stepsCompleted}/{totalSteps}
        </div>
      </div>
      <div className="absolute right-6 top-6 hidden md:flex">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white shadow-lg">
          {stepsCompleted}/{totalSteps}
        </div>
      </div>
      <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: feedbackPartial
              ? "linear-gradient(90deg, #6366f1 0%, #6366f1 50%, #f59e0b 50%, #f59e0b 100%)"
              : undefined,
          }}
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {/* Step 1: Self assessment */}
        <span
          className={
            selfCompleted
              ? "text-emerald-500"
              : hasDraft
                ? "text-amber-500"
                : "text-gray-300"
          }
        >
          {selfCompleted ? (
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-8 w-8 drop-shadow-md transition-transform hover:scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
              <path d="M8.5 12.5l2.5 2.5 4.5-5" />
            </svg>
          ) : hasDraft ? (
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-8 w-8 drop-shadow-md transition-transform hover:scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
              <path d="M12 6v6l4 2" />
            </svg>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-gray-200"></div>
          )}
        </span>
        {/* Step 2: Invites */}
        <span className={stepsCompleted >= 2 ? "text-emerald-500" : "text-gray-300"}>
          {stepsCompleted >= 2 ? (
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-8 w-8 drop-shadow-md transition-transform hover:scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
              <path d="M8.5 12.5l2.5 2.5 4.5-5" />
            </svg>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-gray-200"></div>
          )}
        </span>
        {/* Step 3: Observer feedback */}
        <span
          className={
            stepsCompleted >= 3
              ? feedbackPartial
                ? "text-amber-500"
                : "text-emerald-500"
              : feedbackInProgress
                ? "text-amber-500"
                : "text-gray-300"
          }
        >
          {stepsCompleted >= 3 ? (
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-8 w-8 drop-shadow-md transition-transform hover:scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
              <path d="M8.5 12.5l2.5 2.5 4.5-5" />
            </svg>
          ) : feedbackInProgress ? (
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-8 w-8 drop-shadow-md transition-transform hover:scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
              <path d="M12 6v6l4 2" />
            </svg>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-full border-2 border-gray-200"></div>
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 text-center text-xs font-semibold text-gray-500">
        <span
          className={
            selfCompleted
              ? "text-indigo-600"
              : hasDraft
                ? "text-amber-500"
                : ""
          }
        >
          {t("dashboard.journeyStepSelf", locale)}
        </span>
        <span className={stepsCompleted >= 2 ? "text-indigo-600" : ""}>
          {t("dashboard.journeyStepInvite", locale)}
        </span>
        <span
          className={
            stepsCompleted >= 3
              ? feedbackPartial
                ? "text-amber-500"
                : "text-indigo-600"
              : feedbackInProgress
                ? "text-amber-500"
                : ""
          }
        >
          {t("dashboard.journeyStepObserver", locale)}
        </span>
      </div>

      {/* Optional: research survey (kept separate from the 3-step progress) */}
      {selfCompleted && hasObserverFeedback && !surveyDone && onOpenSurvey && (
        <div className="mt-6 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-yellow-50/70 to-white p-5 shadow-md shadow-amber-100/60">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M12 3v2" />
                <path d="M12 19v2" />
                <path d="M4.22 7.22l1.42 1.42" />
                <path d="M18.36 18.36l1.42 1.42" />
                <path d="M3 12h2" />
                <path d="M19 12h2" />
                <path d="M18.36 5.64l1.42-1.42" />
                <path d="M4.22 16.78l1.42-1.42" />
                <path d="M12 7a5 5 0 0 1 5 5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("dashboard.nextStepSurveyTitle", locale)}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {t("dashboard.nextStepSurveyBody", locale)}
              </p>
              <button
                type="button"
                onClick={onOpenSurvey}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 text-sm font-semibold text-white shadow-lg ring-2 ring-amber-300/40 ring-offset-2 ring-offset-amber-50/60 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                {t("dashboard.nextStepSurveyCta", locale)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next step card — amber when draft in progress, indigo otherwise */}
      {hasDraft && !selfCompleted ? (
        <div className="mt-6 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 via-white to-white p-6 md:p-8 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{nextStep.title}</p>
              <p className="mt-1 text-sm text-gray-600">{nextStep.body}</p>
              {draftTotalQuestions > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-amber-700 font-medium mb-1">
                    {draftAnsweredCount} / {draftTotalQuestions}
                  </p>
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{
                        width: `${Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <Link
              href={nextStep.href}
              className="group inline-flex min-h-[48px] items-center justify-center rounded-lg bg-amber-500 px-8 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-amber-600 hover:scale-105"
            >
              {nextStep.cta}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-pink-50/40 p-6 md:p-8 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-900">{nextStep.title}</p>
              <p className="mt-1 text-sm text-indigo-700/70">{nextStep.body}</p>
              {selfCompleted && nextStep.href === "#invite" ? (
                <p className="mt-2 text-xs text-indigo-700/70">
                  {t("dashboard.nextStepInviteNote", locale)}
                </p>
              ) : null}
            </div>
            {nextStep.onAction ? (
              <button
                type="button"
                onClick={nextStep.onAction}
                className="group inline-flex shrink-0 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg ring-2 ring-indigo-400/25 ring-offset-2 ring-offset-indigo-50/60 hover:shadow-xl hover:ring-indigo-400/40 transition-all duration-300 hover:scale-105"
              >
                {nextStep.cta}
                <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            ) : useLink ? (
              <Link
                href={nextStep.href}
                className="group inline-flex shrink-0 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg ring-2 ring-indigo-400/25 ring-offset-2 ring-offset-indigo-50/60 hover:shadow-xl hover:ring-indigo-400/40 transition-all duration-300 hover:scale-105"
              >
                {nextStep.cta}
                <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onTabChange!(nextStep.href === "#comparison" ? "comparison" : "invites")}
                className="group inline-flex shrink-0 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg ring-2 ring-indigo-400/25 ring-offset-2 ring-offset-indigo-50/60 hover:shadow-xl hover:ring-indigo-400/40 transition-all duration-300 hover:scale-105"
              >
                {nextStep.cta}
                <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Sticky floating next-step bar — portalled to body to escape parent CSS transforms */}
    {mounted && !allDone && createPortal(
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out ${
          showStickyBar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`px-4 py-4 shadow-2xl ${showSurveyInSticky ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600"}`}
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-lg items-center gap-3">
            {/* Mini step dots — green=done, amber=in-progress, dim=not started */}
            <div className="flex shrink-0 items-center gap-1.5">
              {[
                // Step 1: self assessment
                selfCompleted ? "bg-emerald-400" : hasDraft ? "bg-amber-300" : "bg-white/30",
                // Step 2: invites sent
                stepsCompleted >= 2 ? "bg-emerald-400" : "bg-white/30",
                // Step 3: observer feedback
                stepsCompleted >= 3
                  ? feedbackPartial ? "bg-amber-300" : "bg-emerald-400"
                  : feedbackInProgress ? "bg-amber-300" : "bg-white/30",
              ].map((cls, i) => (
                <div key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${cls}`} />
              ))}
            </div>

            {/* Next step label */}
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
              {showSurveyInSticky
                ? t("dashboard.nextStepSurveyTitle", locale)
                : nextStep.title}
            </p>

            {/* CTA — white button, colored text */}
            {showSurveyInSticky ? (
              <button
                type="button"
                onClick={onOpenSurvey}
                className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-amber-600 shadow-md transition-all hover:scale-[1.03]"
              >
                {t("dashboard.nextStepSurveyCta", locale)}
              </button>
            ) : nextStep.onAction ? (
              <button
                type="button"
                onClick={nextStep.onAction}
                className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all hover:scale-[1.03]"
              >
                {nextStep.cta}
              </button>
            ) : useLink ? (
              <Link
                href={nextStep.href}
                className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all hover:scale-[1.03]"
              >
                {nextStep.cta}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onTabChange!(nextStep.href === "#comparison" ? "comparison" : "invites")}
                className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all hover:scale-[1.03]"
              >
                {nextStep.cta}
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )}
    </>
  );
}
