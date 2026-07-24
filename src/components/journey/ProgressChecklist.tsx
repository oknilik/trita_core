"use client";

import Link from "next/link";
import { DashboardPanel, DashboardStatusChip } from "@/components/dashboard/DashboardPrimitives";

export interface ProgressChecklistItem {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  cta?: {
    label: string;
    href: string;
  };
}

export interface ProgressChecklistProps {
  eyebrow: string;
  title: string;
  description: string;
  items: ProgressChecklistItem[];
  nextStepLabel?: string;
  showInlineItemCtas?: boolean;
}

export function ProgressChecklist({
  eyebrow,
  title,
  description,
  items,
  nextStepLabel = "Következő lépés",
  showInlineItemCtas = false,
}: ProgressChecklistProps) {
  const doneCount = items.filter((item) => item.done).length;
  const progressPct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const nextItem = items.find((item) => !item.done);

  return (
    <DashboardPanel tone="warm" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-micro uppercase tracking-[0.18em] text-bronze/80">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-fraunces text-[28px] leading-none tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-2 max-w-[680px] text-caption leading-[1.65] text-ink-body">
            {description}
          </p>
        </div>
        <DashboardStatusChip
          label={`${doneCount}/${items.length} kész`}
          tone="warm"
        />
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-sage transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={[
              "rounded-[16px] border px-4 py-3",
              item.done
                ? "border-sage/25 bg-white"
                : "border-sand bg-cream",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-ink">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-1 text-[11px] text-ink-body">{item.detail}</p>
              </div>
              <DashboardStatusChip
                label={item.done ? "Kész" : "Nyitott"}
                tone={item.done ? "sage" : "muted"}
              />
            </div>
            {showInlineItemCtas && !item.done && item.cta ? (
              <Link
                href={item.cta.href}
                className="mt-2 inline-flex text-[11px] font-semibold text-bronze no-underline"
              >
                {item.cta.label} →
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      {nextItem?.cta ? (
        <div className="mt-4 rounded-[14px] border border-sand bg-white px-4 py-3">
          <p className="text-micro uppercase tracking-[0.12em] text-muted">{nextStepLabel}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-ink">{nextItem.title}</p>
            <Link
              href={nextItem.cta.href}
              className="inline-flex min-h-[36px] items-center rounded-[9px] bg-sage px-3 text-[11px] font-semibold text-white no-underline transition hover:bg-sage-dark"
            >
              {nextItem.cta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </DashboardPanel>
  );
}
