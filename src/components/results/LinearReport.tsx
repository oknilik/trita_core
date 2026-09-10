"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { EditorialBackHeader } from "@/components/ui/primitives/EditorialBackHeader";

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
  const resolvedInitial = sections.some((section) => section.id === initialSection)
    ? initialSection
    : sections[0]?.id;
  const [openSectionId, setOpenSectionId] = useState<LinearReportSectionId | undefined>(resolvedInitial);
  const sectionRefs = useRef<Partial<Record<LinearReportSectionId, HTMLElement | null>>>({});

  useEffect(() => {
    if (!resolvedInitial || resolvedInitial === "overview") return;

    const timer = window.setTimeout(() => {
      sectionRefs.current[resolvedInitial]?.scrollIntoView?.({
        behavior: "auto",
        block: "start",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [resolvedInitial]);

  const openSection = (sectionId: LinearReportSectionId, element: HTMLElement) => {
    setOpenSectionId(sectionId);
    onSectionOpen?.(sectionId);
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-7 wrap-anywhere md:gap-9">
      <EditorialBackHeader
        onBack={onBack}
        backLabel={t("results.reportBackToSummary", locale)}
        eyebrow={t("results.reportLinearEyebrow", locale)}
        title={t("results.reportLinearTitle", locale)}
        description={t("results.reportLinearBody", locale)}
        headingLevel={2}
        className="border-b border-[var(--color-border-soft)] pb-7 md:pb-8"
      />

      <div className="flex flex-col gap-3" role="group" aria-label={t("results.reportChaptersLabel", locale)}>
        {sections.map((section, index) => {
          const isOpen = section.id === openSectionId;
          const actionLabel = isOpen
            ? t("results.reportCardClose", locale)
            : t("results.reportCardOpen", locale);

          return (
            <section
              key={section.id}
              id={`report-${section.id}`}
              ref={(element) => {
                sectionRefs.current[section.id] = element;
              }}
              aria-labelledby={`report-${section.id}-heading`}
              className={`scroll-mt-24 min-w-0 rounded-[20px] border transition-colors ${
                isOpen
                  ? "border-transparent bg-transparent"
                  : "border-[var(--color-border-soft)] bg-surface-card hover:border-[var(--color-state-hover-border)]"
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                aria-label={`${String(index + 1).padStart(2, "0")}. ${section.title} – ${actionLabel}`}
                aria-expanded={isOpen}
                aria-controls={`report-${section.id}-content`}
                onClick={(event) => {
                  if (isOpen) {
                    setOpenSectionId(undefined);
                    return;
                  }
                  openSection(section.id, event.currentTarget.closest("section") ?? event.currentTarget);
                }}
                className="!grid !font-normal min-h-[108px] w-full grid-cols-[24px_minmax(0,1fr)] !gap-3 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-state-focus-ring)] md:grid-cols-[44px_minmax(0,1fr)_auto] md:items-center md:gap-4 md:px-6 md:py-5"
              >
                <span className="self-start pt-0.5 font-mono text-micro font-semibold tracking-widest text-[var(--color-accent-primary-strong)] md:self-center md:pt-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-micro font-semibold uppercase tracking-wide text-muted">
                    {section.question}
                  </span>
                  <span id={`report-${section.id}-heading`} className="mt-1 block font-fraunces text-heading leading-tight text-ink md:text-title">
                    {section.title}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                    {section.description}
                  </span>
                </span>
                <span className="col-start-2 inline-flex min-h-[32px] items-center text-xs font-semibold text-sage-dark md:col-start-3 md:self-center">
                  {actionLabel}
                  <span aria-hidden="true" className="ml-1">{isOpen ? "↑" : "↓"}</span>
                </span>
              </Button>

              {isOpen ? (
                <div
                  id={`report-${section.id}-content`}
                  className="min-w-0 border-t border-[var(--color-border-soft)] pb-6 pt-5 md:pb-8 md:pt-6"
                >
                  {section.content}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
