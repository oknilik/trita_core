"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/auth/auth-state";
import { useLocale } from "@/components/LocaleProvider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
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
  const { isSignedIn } = useAuthState();
  const isHu = locale === "hu";
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const [entry, setEntry] = useState<HelpEntry | null>(null);
  // In-app kérdés-form (csak bejelentkezve) — az inquiry-pipeline-ba fut be
  const [askOpen, setAskOpen] = useState(false);
  const [askMessage, setAskMessage] = useState("");
  const [askState, setAskState] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
    if (askOpen) setAskOpen(false);
    else if (entry) setEntry(null);
    else setTopic(null);
  }

  function close() {
    setOpen(false);
    setTopic(null);
    setEntry(null);
    setAskOpen(false);
    if (askState === "sent") {
      setAskState("idle");
      setAskMessage("");
    }
  }

  async function sendQuestion() {
    if (askMessage.trim().length < 10 || askState === "sending") return;
    setAskState("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: askMessage.trim() }),
      });
      if (!res.ok) throw new Error("SUBMIT_FAILED");
      setAskState("sent");
    } catch {
      setAskState("error");
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 left-4 right-4 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-sand bg-surface-card shadow-xl md:left-auto md:w-[380px]">
          {/* Fejléc */}
          <div className="flex items-center gap-2 border-b border-sand bg-cream px-4 py-3">
            {(topic || entry || askOpen) && (
              <button
                type="button"
                onClick={goBack}
                aria-label={isHu ? "Vissza" : "Back"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-body transition hover:bg-sand/60 hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <SectionEyebrow>
                {isHu ? "segítség" : "help"}
              </SectionEyebrow>
              <p className="truncate font-fraunces text-base text-ink">
                {askOpen
                  ? isHu ? "Kérdésem van" : "Ask a question"
                  : entry
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-body transition hover:bg-sand/60 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Tartalom */}
          <div className="flex-1 overflow-y-auto p-3">
            {askOpen ? (
              <div className="px-1 py-1">
                {askState === "sent" ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-lg font-bold text-white">
                      ✓
                    </span>
                    <p className="text-sm leading-relaxed text-ink-body">
                      {isHu
                        ? "Kérdésed megérkezett — hamarosan válaszolunk emailben."
                        : "Your question has been received — we'll reply by email soon."}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-xs leading-relaxed text-muted">
                      {isHu
                        ? "Írd le a kérdésed — a fiókodhoz kötve érkezik meg hozzánk, és emailben válaszolunk."
                        : "Describe your question — it arrives linked to your account, and we'll reply by email."}
                    </p>
                    <textarea
                      value={askMessage}
                      onChange={(e) => {
                        setAskMessage(e.target.value);
                        if (askState === "error") setAskState("idle");
                      }}
                      rows={5}
                      placeholder={isHu ? "Miben segíthetünk?" : "How can we help?"}
                      className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm text-ink-body outline-none focus:border-sage/50"
                    />
                    {askState === "error" && (
                      <p className="mt-2 text-xs text-state-error-solid">
                        {isHu ? "A küldés nem sikerült — próbáld újra." : "Sending failed — please try again."}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void sendQuestion()}
                      disabled={askMessage.trim().length < 10 || askState === "sending"}
                      className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-4 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {askState === "sending"
                        ? isHu ? "Küldés…" : "Sending…"
                        : isHu ? "Kérdés elküldése" : "Send question"}
                    </button>
                  </>
                )}
              </div>
            ) : entry ? (
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
          {!askOpen && (
            <div className="border-t border-sand bg-cream px-4 py-3">
              <p className="text-xs text-muted">
                {isHu ? "Nem találtad a választ?" : "Didn't find your answer?"}{" "}
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => setAskOpen(true)}
                    className="font-semibold text-bronze underline-offset-2 hover:underline"
                  >
                    {isHu ? "Kérdésem van" : "Ask a question"}
                  </button>
                ) : (
                  <Link
                    href="/contact"
                    onClick={close}
                    className="font-semibold text-bronze underline-offset-2 hover:underline"
                  >
                    {isHu ? "Írj nekünk" : "Contact us"}
                  </Link>
                )}
              </p>
            </div>
          )}
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
