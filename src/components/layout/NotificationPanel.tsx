"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useNotifications } from "./NotificationsProvider";

interface NotificationPanelProps {
  onClose: () => void;
}

// ── Category → icon color mapping ────────────────────────────────────────────

const CATEGORY_ICON_STYLES: Record<string, string> = {
  assessment: "bg-indigo-50 text-indigo-600",
  observer:   "bg-purple-50 text-purple-600",
  org:        "bg-sky-50 text-sky-600",
  campaign:   "bg-emerald-50 text-emerald-600",
  billing:    "bg-amber-50 text-amber-700",
  system:     "bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]",
};

// ── Relative time ───────────────────────────────────────────────────────────

function relativeTime(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const isHu = locale !== "en";

  if (mins < 1) return isHu ? "most" : "just now";
  if (mins < 60) return isHu ? `${mins} perce` : `${mins}m ago`;
  if (hours < 24) return isHu ? `${hours} órája` : `${hours}h ago`;
  if (days < 30) return isHu ? `${days} napja` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { month: "short", day: "numeric" });
}

// ── Type → icon mapping ─────────────────────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "OBSERVER_COMPLETED":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3" /><path d="M1 8h4M11 8h4M8 1v4M8 11v4" />
        </svg>
      );
    case "RESULT_READY":
    case "MEMBER_COMPLETED_ASSESSMENT":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12V8l3-2 3 3 4-5v8" />
        </svg>
      );
    case "PURCHASE_CONFIRMED":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" /><path d="M5.5 8l2 2 3.5-4" />
        </svg>
      );
    case "CAMPAIGN_LAUNCHED":
    case "CAMPAIGN_CLOSED":
    case "CAMPAIGN_MILESTONE":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14V2l10 5-10 5" />
        </svg>
      );
    case "PAYMENT_FAILED":
    case "SUBSCRIPTION_FROZEN":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1L1 14h14L8 1zM8 6v4M8 12v.01" />
        </svg>
      );
    case "TRIAL_ENDING_SOON":
    case "TRIAL_EXPIRED":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" /><path d="M8 4v4l2.5 1.5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 10.5v.01" />
        </svg>
      );
  }
}

// ── Panel ───────────────────────────────────────────────────────────────────

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { locale } = useLocale();
  const loc = locale as Locale;
  // A lekérés a providerben él (a harang nyitáskor hívja az ensureList-et) —
  // így a duplikált panel-mount nem jelent duplikált API-hívást.
  const { items: cached, loading, markAllRead, dismiss } = useNotifications();
  const items = cached ?? [];

  // Escape key closes panel
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const showLoader = cached === null && loading;
  const hasUnread = items.some((n) => !n.read);

  return (
    <div
      className="absolute right-0 top-[calc(100%+6px)] z-50 w-[340px] overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-lg shadow-black/[0.06] sm:w-[380px]"
      style={{ animation: "fade-in 150ms ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
        <p className="text-caption font-semibold text-[var(--color-text-primary)]">
          {t("notifications.bellLabel", loc)}
        </p>
        {hasUnread && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-[11px] font-medium text-[var(--color-accent-primary)] transition-colors hover:underline"
          >
            {t("notifications.markAllRead", loc)}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {showLoader ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-primary)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[12px] text-[var(--color-text-muted)]">
              {t("notifications.noNotifications", loc)}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const title = item.vars
              ? tf(item.titleKey, loc, item.vars as Record<string, string | number>)
              : t(item.titleKey, loc);
            const body = item.vars
              ? tf(item.bodyKey, loc, item.vars as Record<string, string | number>)
              : t(item.bodyKey, loc);

            const iconColor = item.read
              ? "bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)]"
              : CATEGORY_ICON_STYLES[item.category] ?? CATEGORY_ICON_STYLES.system;

            const content = (
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
                >
                  <NotifIcon type={item.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-[12px] leading-snug ${
                        item.read
                          ? "text-[var(--color-text-muted)]"
                          : "font-semibold text-[var(--color-text-primary)]"
                      }`}
                    >
                      {title}
                    </p>
                    {item.priority === "high" && !item.read && (
                      <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                    {body}
                  </p>
                  <p className="mt-1 text-micro text-[var(--color-text-faint)]">
                    {relativeTime(item.createdAt, locale)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void dismiss(item.id);
                  }}
                  className="mt-1 shrink-0 rounded p-0.5 text-[var(--color-text-faint)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-muted)]"
                  aria-label="Dismiss"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 3l8 8M11 3l-8 8" />
                  </svg>
                </button>
              </div>
            );

            return item.link ? (
              <Link
                key={item.id}
                href={item.link}
                onClick={onClose}
                className={`block border-b border-[var(--color-border-default)]/50 px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--color-surface-subtle)] ${
                  !item.read ? "bg-white" : ""
                }`}
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.id}
                className={`border-b border-[var(--color-border-default)]/50 px-4 py-3 last:border-b-0 ${
                  !item.read ? "bg-white" : ""
                }`}
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
