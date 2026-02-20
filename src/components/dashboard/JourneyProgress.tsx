"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, tf, type Locale } from "@/lib/i18n";

interface JourneyProgressProps {
  locale: Locale;
  initialHasInvites: boolean;
  initialPendingInvites: number;
  hasObserverFeedback: boolean;
  onTabChange?: (tab: "invites" | "comparison") => void;
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
  onTabChange,
}: JourneyProgressProps) {
  const [hasInvites, setHasInvites] = useState(initialHasInvites);
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);

  useEffect(() => {
    const onInvitesUpdated = (event: Event) => {
      const detail = (event as CustomEvent<InviteProgressEventDetail>).detail;
      if (!detail) return;
      setHasInvites(detail.hasInvites);
      setPendingInvites(detail.pendingInvites);
    };

    window.addEventListener("dashboard:invites-updated", onInvitesUpdated);
    return () => window.removeEventListener("dashboard:invites-updated", onInvitesUpdated);
  }, []);

  const feedbackInProgress = pendingInvites > 0 && !hasObserverFeedback;
  const feedbackPartial = pendingInvites > 0 && hasObserverFeedback;
  const totalSteps = 3;
  const stepsCompleted = 1 + (hasInvites ? 1 : 0) + (hasObserverFeedback ? 1 : 0);
  const progressPct = Math.round((stepsCompleted / totalSteps) * 100);

  const nextStep = !hasInvites
    ? {
        title: t("dashboard.nextStepInviteTitle", locale),
        body: t("dashboard.nextStepInviteBody", locale),
        cta: t("dashboard.nextStepInviteCta", locale),
        href: "#invite",
      }
    : !hasObserverFeedback
      ? {
          title: t("dashboard.nextStepWaitTitle", locale),
          body: tf("dashboard.nextStepWaitBody", locale, { count: pendingInvites }),
          cta: t("dashboard.nextStepManageInvitesCta", locale),
          href: "#invite",
        }
      : {
          title: t("dashboard.nextStepDoneTitle", locale),
          body: t("dashboard.nextStepDoneBody", locale),
          cta: t("dashboard.nextStepDoneCta", locale),
          href: hasObserverFeedback ? "#comparison" : "#results",
        };

  return (
    <div className="mt-6">
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
        <span className={stepsCompleted >= 1 ? "text-emerald-500" : "text-gray-300"}>
          {stepsCompleted >= 1 ? (
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
        <span className={stepsCompleted >= 1 ? "text-indigo-600" : ""}>
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

      <div className="mt-6 rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/20 p-6 md:p-8 shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{nextStep.title}</p>
            <p className="mt-1 text-sm text-gray-600">{nextStep.body}</p>
          </div>
          {onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange(nextStep.href === "#comparison" ? "comparison" : "invites")}
              className="group inline-flex min-h-[48px] items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {nextStep.cta}
            </button>
          ) : (
            <Link
              href={nextStep.href}
              className="group inline-flex min-h-[48px] items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {nextStep.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
