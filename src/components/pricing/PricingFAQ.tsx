"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const FAQ_COUNT = 5;

export function PricingFAQ({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`pricing.faqQ${i + 1}`, locale),
    a: t(`pricing.faqA${i + 1}`, locale),
  }));

  return (
    <section className="border-t border-[var(--color-border-default)] px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[var(--color-accent-primary)]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[var(--color-accent-primary)]">{t("pricing.faqEyebrow", locale)}</span>
        </div>
        <h2 className="mt-2 font-fraunces text-3xl text-ink md:text-4xl">
          {t("pricing.faqHeading", locale)}
        </h2>

        <div className="mt-8 space-y-2">
          {items.map((item, i) => (
            <div
              key={item.q}
              className="rounded-xl border border-sand bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left min-h-[44px]"
                aria-expanded={open === i}
              >
                <span className="text-[15px] font-semibold text-ink">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 text-bronze transition-transform duration-200 ${
                    open === i ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <div className="border-t border-sand px-5 pb-4 pt-3">
                  <p className="text-sm leading-[1.7] text-ink-body">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
