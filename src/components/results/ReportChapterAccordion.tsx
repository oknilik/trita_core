"use client";

import { useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "@/lib/i18n";

export type ReportChapterId = "overview" | "dimensions" | "workstyle";

export interface ReportChapter {
  id: ReportChapterId;
  title: string;
  description: string;
  content: ReactNode;
}

interface ReportChapterAccordionProps {
  chapters: ReportChapter[];
  initialChapter?: ReportChapterId;
  locale: Locale;
  onChapterOpen?: (chapter: ReportChapterId) => void;
}

export function ReportChapterAccordion({
  chapters,
  initialChapter = "overview",
  locale,
  onChapterOpen,
}: ReportChapterAccordionProps) {
  const availableInitial = chapters.some((chapter) => chapter.id === initialChapter)
    ? initialChapter
    : chapters[0]?.id;
  const [activeChapter, setActiveChapter] = useState<ReportChapterId | undefined>(availableInitial);
  const sectionRefs = useRef<Partial<Record<ReportChapterId, HTMLElement | null>>>({});

  const openChapter = (chapter: ReportChapterId, moveIntoView = false) => {
    if (chapter === activeChapter) return;
    setActiveChapter(chapter);
    onChapterOpen?.(chapter);
    if (moveIntoView) {
      sectionRefs.current[chapter]?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section aria-label={t("results.reportChaptersLabel", locale)}>
      <div className="mb-4 px-1">
        <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("results.reportChaptersEyebrow", locale)}
        </p>
        <h2 className="mt-1.5 font-fraunces text-[24px] leading-tight text-ink md:text-[28px]">
          {t("results.reportChaptersTitle", locale)}
        </h2>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[var(--color-border-soft)] bg-surface-card shadow-sm">
        {chapters.map((chapter, index) => {
          const isOpen = activeChapter === chapter.id;
          const nextChapter = chapters[index + 1];
          const panelId = `report-chapter-panel-${chapter.id}`;
          const triggerId = `report-chapter-trigger-${chapter.id}`;

          return (
            <article
              key={chapter.id}
              ref={(element) => { sectionRefs.current[chapter.id] = element; }}
              className={`scroll-mt-24 ${index > 0 ? "border-t border-[var(--color-border-soft)]" : ""}`}
            >
              <button
                id={triggerId}
                type="button"
                aria-label={`${index + 1}. ${chapter.title} — ${t(isOpen ? "results.reportChapterOpen" : "results.reportChapterClosed", locale)}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => openChapter(chapter.id)}
                className={`grid min-h-[78px] w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors md:grid-cols-[42px_minmax(0,1fr)_auto] md:px-6 ${
                  isOpen
                    ? "bg-[var(--color-surface-self-accent-soft)]"
                    : "bg-surface-card hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <span className="font-mono text-[11px] font-semibold tracking-widest text-[var(--color-accent-primary-strong)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block font-fraunces text-[19px] leading-tight text-ink md:text-[21px]">
                    {chapter.title}
                  </span>
                  <span className="mt-1 hidden max-w-2xl text-micro leading-relaxed text-muted sm:block">
                    {chapter.description}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="hidden text-micro font-semibold uppercase tracking-wide text-muted md:inline">
                    {t(isOpen ? "results.reportChapterOpen" : "results.reportChapterClosed", locale)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-transform ${
                      isOpen
                        ? "rotate-180 border-sage-ring bg-surface-card text-sage-dark"
                        : "border-[var(--color-border-default)] text-muted"
                    }`}
                  >
                    ↓
                  </span>
                </span>
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="border-t border-sage-ring/60 bg-[var(--color-surface-subtle)]/40 p-4 md:p-7"
                >
                  <div className="animate-fade-in">{chapter.content}</div>
                  {nextChapter ? (
                    <div className="mt-8 flex justify-end border-t border-[var(--color-border-soft)] pt-5">
                      <button
                        type="button"
                        onClick={() => openChapter(nextChapter.id, true)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sage px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
                      >
                        {t("results.reportChapterNext", locale)}: {nextChapter.title} →
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
