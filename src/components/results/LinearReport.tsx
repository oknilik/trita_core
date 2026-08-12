"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { t, type Locale } from "@/lib/i18n";

export type LinearReportSectionId = "overview" | "dimensions" | "workstyle";

export interface LinearReportSection {
  id: LinearReportSectionId;
  title: string;
  question: string;
  description: string;
  content: ReactNode;
}

interface LinearReportProps {
  sections: LinearReportSection[];
  initialSection?: LinearReportSectionId;
  locale: Locale;
  onBack: () => void;
  onSectionOpen?: (section: LinearReportSectionId) => void;
}

export function LinearReport({
  sections,
  initialSection = "overview",
  locale,
  onBack,
  onSectionOpen,
}: LinearReportProps) {
  const sectionRefs = useRef<Partial<Record<LinearReportSectionId, HTMLElement | null>>>({});
  const didApplyInitialSection = useRef(false);

  useEffect(() => {
    if (didApplyInitialSection.current || initialSection === "overview") return;
    didApplyInitialSection.current = true;
    const timer = window.setTimeout(() => {
      sectionRefs.current[initialSection]?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialSection]);

  const openSection = (sectionId: LinearReportSectionId) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    onSectionOpen?.(sectionId);
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <header className="border-b border-[var(--color-border-soft)] pb-7 md:pb-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-ink-body transition hover:text-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">←</span>
          {t("results.reportBackToSummary", locale)}
        </button>

        <p className="mt-6 font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("results.reportLinearEyebrow", locale)}
        </p>
        <h2 className="mt-2 max-w-2xl font-fraunces text-[28px] leading-tight text-ink md:text-[36px]">
          {t("results.reportLinearTitle", locale)}
        </h2>
        <p className="mt-2 max-w-2xl text-caption leading-relaxed text-muted">
          {t("results.reportLinearBody", locale)}
        </p>

        <nav aria-label={t("results.reportChaptersLabel", locale)} className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => openSection(section.id)}
              className="inline-flex min-h-[44px] items-center gap-2 border-b border-transparent text-xs font-semibold text-ink-body transition hover:border-sage hover:text-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2"
            >
              <span className="font-mono text-micro tracking-widest text-[var(--color-accent-primary-strong)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.title}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-col gap-14 md:gap-20">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={`report-${section.id}`}
            ref={(element) => {
              sectionRefs.current[section.id] = element;
            }}
            aria-labelledby={`report-${section.id}-heading`}
            className="scroll-mt-24"
          >
            <div className="grid gap-2 border-t border-[var(--color-border-soft)] pt-5 md:grid-cols-[52px_minmax(0,1fr)] md:gap-4 md:pt-7">
              <span className="font-mono text-micro font-semibold tracking-widest text-[var(--color-accent-primary-strong)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted">
                  {section.question}
                </p>
                <h3 id={`report-${section.id}-heading`} className="mt-1.5 font-fraunces text-[26px] leading-tight text-ink md:text-[32px]">
                  {section.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  {section.description}
                </p>
              </div>
            </div>

            <div className="mt-7 md:ml-[68px] md:mt-9">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
