"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/auth/auth-state";
import { useLocale } from "@/components/LocaleProvider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { BackChevronIcon } from "@/components/ui/primitives/BackChevronIcon";
import {
  ChevronRightIcon,
  ChartIcon,
  CloseIcon,
  DocumentIcon,
  EyeIcon,
  FlagIcon,
  GiftIcon,
  HelpCircleIcon,
  LockIcon,
  NetworkIcon,
  RoleClusterIcon,
  SearchIcon,
  SlidersIcon,
  SparklesIcon,
  SupportChatIcon,
  UserPlusIcon,
} from "@/components/ui/icons";
import {
  getHelpTopics,
  type HelpAudience,
  type HelpEntry,
  type HelpTopic,
} from "@/lib/help/topics";
import { track } from "@/lib/analytics/client";
import { isFocusRoute } from "@/lib/navigation/focus-routes";

const HIDDEN_NON_FOCUS_PREFIXES = ["/pilot"];

const CONTEXTUAL_ENTRY_IDS: Array<{ prefix: string; ids: string[] }> = [
  { prefix: "/profile/results", ids: ["where-results", "comparison", "how-invite"] },
  { prefix: "/assessment", ids: ["duration-pause", "honest-answers"] },
  { prefix: "/team", ids: ["when-team-results", "track-progress", "invite-members"] },
  { prefix: "/org", ids: ["manage-org", "track-progress", "start-campaign"] },
  { prefix: "/dashboard", ids: ["track-progress", "when-team-results", "start-campaign"] },
  { prefix: "/privacy", ids: ["data-handling"] },
  { prefix: "/how-we-work", ids: ["pricing", "how-to-start", "what-teams-get"] },
  { prefix: "/pricing", ids: ["pricing", "how-to-start", "what-teams-get"] },
];

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function topicIcon(topicId: string): ReactNode {
  const className = "h-5 w-5";
  switch (topicId) {
    case "about":
      return <SparklesIcon className={className} />;
    case "assessment":
    case "results":
      return <DocumentIcon className={className} />;
    case "observers":
    case "team-management":
      return <NetworkIcon className={className} />;
    case "teams-companies":
    case "my-team":
    case "org-admin":
      return <RoleClusterIcon className={className} />;
    case "privacy":
      return <LockIcon className={className} />;
    default:
      return <HelpCircleIcon className={className} />;
  }
}

function entryIcon(entryId: string, fallbackTopicId: string): ReactNode {
  const className = "h-5 w-5";
  switch (entryId) {
    case "try-free":
      return <GiftIcon className={className} />;
    case "how-assessment-works":
    case "honest-answers":
      return <SlidersIcon className={className} />;
    case "where-results":
      return <ChartIcon className={className} />;
    case "comparison":
    case "who-sees-results":
      return <EyeIcon className={className} />;
    case "how-invite":
    case "invite-members":
      return <UserPlusIcon className={className} />;
    case "start-campaign":
    case "track-progress":
    case "pilot-program":
      return <FlagIcon className={className} />;
    case "data-handling":
      return <LockIcon className={className} />;
    default:
      return topicIcon(fallbackTopicId);
  }
}

function analyticsSurface(pathname: string | null): string {
  const segment = pathname?.split("/").filter(Boolean)[0];
  return segment?.slice(0, 32) || "home";
}

export function HelpWidget({ audience }: { audience: HelpAudience }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { isSignedIn } = useAuthState();
  const isHu = locale === "hu";
  const surface = analyticsSurface(pathname);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const [entry, setEntry] = useState<HelpEntry | null>(null);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askMessage, setAskMessage] = useState("");
  const [askState, setAskState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const topics = useMemo(() => getHelpTopics(audience), [audience]);
  const indexedEntries = useMemo(
    () => topics.flatMap((parent) => parent.entries.map((item) => ({ item, parent }))),
    [topics],
  );
  const entryById = useMemo(
    () => new Map(indexedEntries.map(({ item }) => [item.id, item])),
    [indexedEntries],
  );
  const topicByEntryId = useMemo(
    () => new Map(indexedEntries.map(({ item, parent }) => [item.id, parent.id])),
    [indexedEntries],
  );

  const contextualEntries = useMemo(() => {
    const match = CONTEXTUAL_ENTRY_IDS.find(({ prefix }) =>
      pathname === prefix || pathname?.startsWith(`${prefix}/`),
    );
    const candidates = (match?.ids ?? []).map((id) => entryById.get(id)).filter(Boolean) as HelpEntry[];
    if (candidates.length > 0) return candidates.slice(0, 3);
    return indexedEntries.slice(0, 3).map(({ item }) => item);
  }, [entryById, indexedEntries, pathname]);

  const searchResults = useMemo(() => {
    const needle = normalized(query.trim());
    if (!needle) return [];
    return indexedEntries.filter(({ item, parent }) => {
      const haystack = normalized(
        [item.question[locale], item.answer[locale], item.keywords?.[locale] ?? "", parent.label[locale]].join(" "),
      );
      return haystack.includes(needle);
    });
  }, [indexedEntries, locale, query]);

  const close = useCallback(() => {
    setOpen(false);
    setTopic(null);
    setEntry(null);
    setAskOpen(false);
    setQuery("");
    setFeedback(null);
    setAskState("idle");
    setAskMessage("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const panelEl = panel;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : launcherRef.current;
    requestAnimationFrame(() => searchRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        panelEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panelEl.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [close, open]);

  if (
    isFocusRoute(pathname) ||
    HIDDEN_NON_FOCUS_PREFIXES.some(
      (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }

  function openWidget() {
    setOpen(true);
    track("help.open", { audience, surface });
  }

  function goBack() {
    if (askOpen) setAskOpen(false);
    else if (entry) {
      setEntry(null);
      setFeedback(null);
    } else if (topic) setTopic(null);
  }

  function openEntry(item: HelpEntry, source: "context" | "topic" | "search" | "related") {
    setEntry(item);
    setTopic(null);
    setQuery("");
    setFeedback(null);
    track("help.answer_open", { entry_id: item.id, source, surface });
  }

  function handleSearch(value: string) {
    setQuery(value);
    setTopic(null);
    setEntry(null);
    setAskOpen(false);
    if (value.trim().length === 2) {
      const needle = normalized(value.trim());
      const resultCount = indexedEntries.filter(({ item, parent }) =>
        normalized(`${item.question[locale]} ${item.answer[locale]} ${item.keywords?.[locale] ?? ""} ${parent.label[locale]}`).includes(needle),
      ).length;
      track("help.search", { audience, result_count: resultCount, surface });
    }
  }

  function recordFeedback(value: "yes" | "no") {
    if (!entry) return;
    setFeedback(value);
    track("help.answer_feedback", { entry_id: entry.id, helpful: value === "yes", surface });
  }

  function openQuestionForm(source: "footer" | "no_result") {
    setAskOpen(true);
    setEntry(null);
    setTopic(null);
    setQuery("");
    track("help.contact_start", { source, surface });
  }

  async function sendQuestion() {
    if (askMessage.trim().length < 10 || askState === "sending") return;
    setAskState("sending");
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: askMessage.trim() }),
      });
      if (!response.ok) throw new Error("SUBMIT_FAILED");
      setAskState("sent");
    } catch {
      setAskState("error");
    }
  }

  const relatedEntries = entry?.related
    ?.map((id) => entryById.get(id))
    .filter((item): item is HelpEntry => Boolean(item)) ?? [];
  const showBack = Boolean(topic || entry || askOpen);
  const title = askOpen
    ? isHu ? "Kérdezz tőlünk" : "Ask us"
    : entry
      ? isHu ? "Válasz" : "Answer"
      : topic
        ? topic.label[locale]
        : isHu ? "Miben segíthetünk?" : "How can we help?";

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--color-surface-inverse)]/20 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
            aria-hidden="true"
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-widget-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-xl focus:outline-none md:bottom-20 md:left-auto md:right-4 md:max-h-[min(720px,calc(100dvh-7rem))] md:w-[430px] md:rounded-2xl md:border-b"
          >
            <header className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] px-4 pb-4 pt-3.5">
              <div className="flex items-center gap-2">
                {showBack && (
                  <button type="button" onClick={goBack} aria-label={isHu ? "Vissza" : "Back"} className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-body transition hover:bg-sand/60 hover:text-ink">
                    <BackChevronIcon size="sm" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <SectionEyebrow>{isHu ? "segítség" : "help"}</SectionEyebrow>
                  <h2 id="help-widget-title" className="truncate font-fraunces text-xl font-medium text-ink">{title}</h2>
                </div>
                <button type="button" onClick={close} aria-label={isHu ? "Bezárás" : "Close"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-body transition hover:bg-sand/60 hover:text-ink">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              {!askOpen && !entry && (
                <label className="relative mt-3 block">
                  <span className="sr-only">{isHu ? "Keresés a segítségben" : "Search help"}</span>
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input ref={searchRef} type="search" value={query} onChange={(event) => handleSearch(event.target.value)} placeholder={isHu ? "Keress kérdésre vagy témára…" : "Search questions or topics…"} className="min-h-11 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] py-2 pl-10 pr-3 text-base text-ink outline-none transition placeholder:text-muted focus:border-sage focus:ring-2 focus:ring-sage/15 md:text-sm" />
                </label>
              )}
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {askOpen ? (
                <div>
                  {askState === "sent" ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-lg font-bold text-[var(--color-action-primary-fg)]">✓</span>
                      <p className="max-w-xs text-sm leading-relaxed text-ink-body">{isHu ? "Kérdésed megérkezett – egy munkanapon belül válaszolunk emailben." : "Your question has been received – we'll reply by email within one business day."}</p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 text-xs leading-relaxed text-muted">{isHu ? "Írd le, hol akadtál el. A kérdés a fiókodhoz kötve érkezik meg hozzánk; a szövegét nem használjuk termékanalitikához." : "Describe where you got stuck. The question arrives linked to your account; its text is not used for product analytics."}</p>
                      <label htmlFor="help-question" className="mb-1.5 block text-xs font-medium text-ink">{isHu ? "Kérdésed" : "Your question"}</label>
                      <textarea id="help-question" value={askMessage} onChange={(event) => { setAskMessage(event.target.value); if (askState === "error") setAskState("idle"); }} rows={5} placeholder={isHu ? "Miben segíthetünk?" : "How can we help?"} className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] px-3 py-2.5 text-base text-ink-body outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15 md:text-sm" />
                      {askState === "error" && <p className="mt-2 text-xs text-state-error-fg" role="alert">{isHu ? "A küldés nem sikerült – próbáld újra." : "Sending failed – please try again."}</p>}
                      <button type="button" onClick={() => void sendQuestion()} disabled={askMessage.trim().length < 10 || askState === "sending"} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-sage px-4 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50">
                        {askState === "sending" ? isHu ? "Küldés…" : "Sending…" : isHu ? "Kérdés elküldése" : "Send question"}
                      </button>
                    </>
                  )}
                </div>
              ) : entry ? (
                <article>
                  <p className="font-fraunces text-xl font-medium leading-snug text-ink">{entry.question[locale]}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">{entry.answer[locale]}</p>
                  {entry.steps && entry.steps.length > 0 && (
                    <ol className="mt-4 space-y-3">
                      {entry.steps.map((step, index) => (
                        <li key={step[locale]} className="flex gap-3 text-sm leading-relaxed text-ink-body">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-xs font-semibold text-sage-dark">{index + 1}</span>
                          <span>{step[locale]}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {entry.link && <Link href={entry.link.href} onClick={close} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-sage px-4 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark">{entry.link.label[locale]}</Link>}
                  {relatedEntries.length > 0 && (
                    <div className="mt-6 border-t border-[var(--color-border-default)] pt-4">
                      <p className="mb-2 text-xs font-medium text-muted">{isHu ? "Kapcsolódó kérdések" : "Related questions"}</p>
                      {relatedEntries.map((related) => (
                        <button key={related.id} type="button" onClick={() => openEntry(related, "related")} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm text-ink-body transition hover:bg-cream hover:text-ink">
                          <span>{related.question[locale]}</span><ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-default)] pt-4">
                    <p className="text-xs text-muted">{isHu ? "Hasznos volt ez a válasz?" : "Was this answer helpful?"}</p>
                    <div className="flex gap-2">
                      {(["yes", "no"] as const).map((value) => (
                        <button key={value} type="button" aria-pressed={feedback === value} onClick={() => recordFeedback(value)} className={`min-h-10 rounded-lg border px-3 text-xs font-medium transition ${feedback === value ? "border-[var(--color-surface-inverse)] bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]" : "border-[var(--color-border-default)] text-ink-body hover:bg-cream"}`}>
                          {value === "yes" ? isHu ? "Igen" : "Yes" : isHu ? "Nem" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ) : query ? (
                <div aria-live="polite">
                  <p className="mb-3 text-xs text-muted">{searchResults.length > 0 ? isHu ? `${searchResults.length} találat` : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}` : isHu ? "Nincs találat" : "No results"}</p>
                  {searchResults.length > 0 ? (
                    <ul className="space-y-1">
                      {searchResults.map(({ item, parent }) => (
                        <li key={item.id}>
                          <button type="button" onClick={() => openEntry(item, "search")} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-cream">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage-dark">{topicIcon(parent.id)}</span>
                            <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">{item.question[locale]}</span><span className="mt-0.5 block text-xs text-muted">{parent.label[locale]}</span></span>
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-2xl bg-cream px-4 py-5 text-center">
                      <p className="text-sm text-ink-body">{isHu ? "Próbálj másik kifejezést, vagy kérdezz közvetlenül tőlünk." : "Try another phrase, or ask us directly."}</p>
                      {isSignedIn && <button type="button" onClick={() => openQuestionForm("no_result")} className="mt-3 text-sm font-semibold text-[var(--color-accent-primary-strong)] underline-offset-2 hover:underline">{isHu ? "Kérdésem van" : "Ask a question"}</button>}
                    </div>
                  )}
                </div>
              ) : topic ? (
                <ul className="space-y-1">
                  {topic.entries.map((item) => (
                    <li key={item.id}><button type="button" onClick={() => openEntry(item, "topic")} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-body transition hover:bg-cream hover:text-ink"><span>{item.question[locale]}</span><ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" /></button></li>
                  ))}
                </ul>
              ) : (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted">{isHu ? "Ezen az oldalon" : "On this page"}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {contextualEntries.map((item) => (
                      <button key={item.id} type="button" onClick={() => openEntry(item, "context")} className="group flex min-h-14 items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:border-sage/35 hover:bg-sage-ghost sm:min-h-[106px] sm:flex-col sm:items-start sm:justify-between">
                        <span className="shrink-0 text-sage">{entryIcon(item.id, topicByEntryId.get(item.id) ?? "")}</span><span className="leading-snug">{item.question[locale]}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 mt-5 text-xs font-medium text-muted">{isHu ? "További témák" : "More topics"}</p>
                  <ul className="space-y-1">
                    {topics.map((item) => (
                      <li key={item.id}><button type="button" onClick={() => setTopic(item)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-cream"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage-dark">{topicIcon(item.id)}</span><span className="flex-1 text-sm font-medium text-ink">{item.label[locale]}</span><span className="text-xs tabular-nums text-muted">{item.entries.length}</span><ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" /></button></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {!askOpen && (
              <footer className="flex min-h-14 items-center justify-between gap-3 border-t border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] px-4 py-2.5">
                <p className="text-xs text-muted">{isHu ? "Nem találtad a választ?" : "Didn't find your answer?"}</p>
                {isSignedIn ? (
                  <button type="button" onClick={() => openQuestionForm("footer")} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-accent-primary-strong)] underline-offset-2 hover:underline">
                    {isHu ? "Kérdezz tőlünk" : "Ask us"}<ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link href="/contact" onClick={() => { track("help.contact_start", { source: "footer", surface }); close(); }} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-accent-primary-strong)] underline-offset-2 hover:underline">
                    {isHu ? "Írj nekünk" : "Contact us"}<ChevronRightIcon className="h-3.5 w-3.5" />
                  </Link>
                )}
              </footer>
            )}
          </div>
        </>
      )}

      <button ref={launcherRef} type="button" onClick={() => (open ? close() : openWidget())} aria-expanded={open} aria-haspopup="dialog" aria-label={isHu ? "Segítség megnyitása" : "Open help"} className={`fixed bottom-4 right-4 z-50 h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-[var(--color-surface-inverse)] px-3.5 text-[var(--color-text-on-inverse)] shadow-lg ring-1 ring-[var(--color-surface-inverse)]/10 transition hover:-translate-y-0.5 hover:bg-[var(--color-surface-inverse-soft)] hover:shadow-xl md:px-4 ${open ? "hidden md:flex" : "flex"}`}>
        {open ? <CloseIcon className="h-4 w-4" /> : <SupportChatIcon className="h-5 w-5" />}<span className="hidden text-sm font-semibold md:inline">{isHu ? "Segítség" : "Help"}</span>
      </button>
    </>
  );
}
