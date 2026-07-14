"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import {
  getHelpTopics,
  type HelpAudience,
  type HelpEntry,
  type HelpTopic,
} from "@/lib/help/topics";

// Vezetett (gombos) segítő — statikus tudásbázisból válaszol, LLM nélkül.
// Tartalma: src/lib/help/topics.ts. Landing + belépett felület egyaránt
// használja; a közönséget (audience) a root layout adja át szerep alapján.

const HIDDEN_PREFIXES = ["/observe", "/pilot", "/assessment", "/onboarding"];

export function HelpWidget({ audience }: { audience: HelpAudience }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const [entry, setEntry] = useState<HelpEntry | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  const topics = getHelpTopics(audience);

  function goBack() {
    if (entry) setEntry(null);
    else setTopic(null);
  }

  function close() {
    setOpen(false);
    setTopic(null);
    setEntry(null);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 left-4 right-4 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-xl md:left-auto md:w-[380px]">
          {/* Fejléc */}
          <div className="flex items-center gap-2 border-b border-sand bg-cream px-4 py-3">
            {(topic || entry) && (
              <button
                type="button"
                onClick={goBack}
                aria-label={isHu ? "Vissza" : "Back"}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-body transition hover:bg-sand/60 hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bronze">
                {isHu ? "// segítség" : "// help"}
              </p>
              <p className="truncate font-fraunces text-base text-ink">
                {entry
                  ? isHu ? entry.question.hu : entry.question.en
                  : topic
                    ? isHu ? topic.label.hu : topic.label.en
                    : isHu ? "Miben segíthetünk?" : "How can we help?"}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={isHu ? "Bezárás" : "Close"}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-body transition hover:bg-sand/60 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Tartalom */}
          <div className="flex-1 overflow-y-auto p-3">
            {entry ? (
              <div className="px-1 py-1">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                  {isHu ? entry.answer.hu : entry.answer.en}
                </p>
                {entry.link && (
                  <Link
                    href={entry.link.href}
                    onClick={close}
                    className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-4 text-sm font-semibold text-white transition hover:bg-sage-dark"
                  >
                    {isHu ? entry.link.label.hu : entry.link.label.en}
                  </Link>
                )}
              </div>
            ) : topic ? (
              <ul className="flex flex-col gap-1">
                {topic.entries.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setEntry(item)}
                      className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-body transition hover:bg-cream hover:text-ink"
                    >
                      <span>{isHu ? item.question.hu : item.question.en}</span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-muted">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-1">
                {topics.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setTopic(item)}
                      className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-cream"
                    >
                      <span>{isHu ? item.label.hu : item.label.en}</span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-muted">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Lábléc — kiút emberhez */}
          <div className="border-t border-sand bg-cream px-4 py-3">
            <p className="text-xs text-muted">
              {isHu ? "Nem találtad a választ?" : "Didn't find your answer?"}{" "}
              <Link
                href="/contact"
                onClick={close}
                className="font-semibold text-bronze underline-offset-2 hover:underline"
              >
                {isHu ? "Írj nekünk" : "Contact us"}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Lebegő gomb */}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={isHu ? "Segítség" : "Help"}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream shadow-lg transition hover:bg-ink/85"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="font-fraunces text-xl leading-none">?</span>
        )}
      </button>
    </>
  );
}
