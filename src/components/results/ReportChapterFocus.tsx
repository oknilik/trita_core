"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { t, tf, type Locale } from "@/lib/i18n";

export type ReportChapterId = "overview" | "dimensions" | "workstyle";

export interface ReportChapter {
  id: ReportChapterId;
  title: string;
  description: string;
  content: ReactNode;
}

interface ReportChapterFocusProps {
  chapters: ReportChapter[];
  initialChapter?: ReportChapterId;
  locale: Locale;
  onChapterOpen?: (chapter: ReportChapterId) => void;
}

export function ReportChapterFocus({
  chapters,
  initialChapter = "overview",
  locale,
  onChapterOpen,
}: ReportChapterFocusProps) {
  const availableInitial = chapters.some((chapter) => chapter.id === initialChapter)
    ? initialChapter
    : chapters[0]?.id;
  const [activeChapter, setActiveChapter] = useState<ReportChapterId | undefined>(availableInitial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const pickerButtonRef = useRef<HTMLButtonElement | null>(null);
  const pickerCloseRef = useRef<HTMLButtonElement | null>(null);
  const pickerDialogRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = Math.max(
    0,
    chapters.findIndex((chapter) => chapter.id === activeChapter),
  );
  const chapter = chapters[activeIndex];
  const nextChapter = chapters[activeIndex + 1];

  useEffect(() => {
    if (!pickerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pickerCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
        pickerButtonRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          pickerDialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [pickerOpen]);

  if (!chapter) return null;

  const openChapter = (chapterId: ReportChapterId, moveIntoView = false) => {
    setPickerOpen(false);
    if (chapterId === activeChapter) {
      pickerButtonRef.current?.focus();
      return;
    }
    setActiveChapter(chapterId);
    onChapterOpen?.(chapterId);
    if (moveIntoView) {
      sectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      sectionRef.current?.focus({ preventScroll: true });
    }
  };

  const counter = tf("results.reportChapterCount", locale, {
    current: activeIndex + 1,
    total: chapters.length,
  });

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label={t("results.reportChaptersLabel", locale)}
      className="scroll-mt-24 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)]"
    >
      <div className="px-1">
        <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("results.reportChaptersEyebrow", locale)}
        </p>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-label={counter}
            aria-valuemin={1}
            aria-valuemax={chapters.length}
            aria-valuenow={activeIndex + 1}
          >
            {chapters.map((item, index) => (
              <span
                key={item.id}
                aria-hidden="true"
                className={`h-1 w-7 rounded-full transition-colors ${
                  index === activeIndex
                    ? "bg-[var(--color-accent-primary-strong)]"
                    : index < activeIndex
                      ? "bg-sage"
                      : "bg-[var(--color-border-default)]"
                }`}
              />
            ))}
          </div>

          <button
            ref={pickerButtonRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen(true)}
            className="min-h-[44px] text-xs font-semibold text-ink-body underline decoration-[var(--color-border-default)] underline-offset-4 transition hover:text-sage-dark"
          >
            {counter} · {t("results.reportChapterPicker", locale)}
          </button>
        </div>

        <h2 className="mt-3 font-fraunces text-[28px] leading-tight text-ink md:text-[34px]">
          {chapter.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {chapter.description}
        </p>
      </div>

      <div key={chapter.id} className="mt-6 animate-fade-in md:mt-8">
        {chapter.content}
      </div>

      {nextChapter ? (
        <div className="mt-8 flex justify-stretch border-t border-[var(--color-border-soft)] pt-5 md:justify-end">
          <button
            type="button"
            onClick={() => openChapter(nextChapter.id, true)}
            className="inline-flex min-h-[48px] w-full items-center justify-between gap-4 rounded-xl bg-sage px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark md:w-auto"
          >
            <span>{t("results.reportChapterNext", locale)}: {nextChapter.title}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[1px] md:items-center md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPickerOpen(false);
              pickerButtonRef.current?.focus();
            }
          }}
        >
          <div
            ref={pickerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-chapter-picker-title"
            className="w-full rounded-t-[22px] border border-[var(--color-border-soft)] bg-surface-card px-5 pb-6 pt-3 shadow-xl md:max-w-lg md:rounded-[20px] md:p-6"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-default)] md:hidden" />
            <div className="flex items-center justify-between gap-4">
              <h3
                id="report-chapter-picker-title"
                className="font-fraunces text-[24px] text-ink"
              >
                {t("results.reportChapterPickerTitle", locale)}
              </h3>
              <button
                ref={pickerCloseRef}
                type="button"
                aria-label={t("results.reportChapterPickerClose", locale)}
                onClick={() => {
                  setPickerOpen(false);
                  pickerButtonRef.current?.focus();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-muted transition hover:bg-[var(--color-surface-subtle)] hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="mt-3 border-b border-[var(--color-border-soft)]">
              {chapters.map((item, index) => {
                const isCurrent = item.id === activeChapter;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`${String(index + 1).padStart(2, "0")}. ${item.title}${isCurrent ? ` — ${t("results.reportChapterCurrent", locale)}` : ""}`}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => openChapter(item.id, true)}
                    className="grid min-h-[58px] w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 border-t border-[var(--color-border-soft)] text-left"
                  >
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-[var(--color-accent-primary-strong)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`text-sm ${isCurrent ? "font-semibold text-sage-dark" : "font-medium text-ink-body"}`}>
                      {item.title}
                    </span>
                    <span className={`text-xs ${isCurrent ? "font-semibold text-sage-dark" : "text-muted"}`}>
                      {isCurrent ? t("results.reportChapterCurrent", locale) : "→"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
