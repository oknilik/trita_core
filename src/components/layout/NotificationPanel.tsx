"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n/public";
import type { Locale } from "@/lib/i18n/public";
import { useNotifications } from "./NotificationsProvider";

interface NotificationPanelProps {
  onClose: () => void;
}

/** B16u: ennyi ideig vonható vissza az elvetés, mielőtt az API-törlés elindul. */
const DISMISS_UNDO_MS = 5000;

// ── Category → icon color mapping ────────────────────────────────────────────

const CATEGORY_ICON_STYLES: Record<string, string> = {
  assessment: "bg-sage-ghost text-sage",
  observer:   "bg-sage-ghost text-sage",
  org:        "bg-state-info-bg text-state-info-fg",
  campaign:   "bg-state-success-bg text-state-success-fg",
  billing:    "bg-state-warning-bg text-state-warning-fg",
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
  // A lekérés a providerben él (a harang nyitáskor hívja az ensureList-et) –
  // így a duplikált panel-mount nem jelent duplikált API-hívást.
  const router = useRouter();
  const { markRead, items: cached, loading, markAllRead, dismiss } = useNotifications();
  const items = cached ?? [];

  const panelRef = useRef<HTMLDivElement>(null);

  // A prop/context callbackok friss példányai ref-ben – a fókusz-csapda és az
  // undo-timerek effectjei mount-onként egyszer futnak, de mindig az aktuális
  // függvényt hívják.
  const onCloseRef = useRef(onClose);
  const dismissRef = useRef(dismiss);
  useEffect(() => {
    onCloseRef.current = onClose;
    dismissRef.current = dismiss;
  });

  // ── B16u: elvetés visszavonási ablakkal ───────────────────────────────────
  // Elvetéskor a sor „Elvetve – Visszavonás" állapotba vált; a tényleges
  // API-törlést (provider.dismiss) csak a DISMISS_UNDO_MS lejárta indítja.
  // Visszavonásra a timer törlődik, és a sor változatlanul visszaáll.
  const [pendingDismiss, setPendingDismiss] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const focusInPanel = useCallback((selector: string) => {
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(selector)?.focus();
    });
  }, []);

  const startDismiss = useCallback(
    (id: string) => {
      setPendingDismiss((prev) => new Set(prev).add(id));
      undoTimers.current.set(
        id,
        setTimeout(() => {
          undoTimers.current.delete(id);
          setPendingDismiss((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          void dismissRef.current(id);
        }, DISMISS_UNDO_MS),
      );
      // A lecserélt sorról ne vesszen el a billentyű-fókusz: átkerül a
      // Visszavonás gombra, így Enterrel azonnal visszavonható.
      focusInPanel(`[data-undo-for="${id}"]`);
    },
    [focusInPanel],
  );

  const undoDismiss = useCallback(
    (id: string) => {
      const timer = undoTimers.current.get(id);
      if (timer) clearTimeout(timer);
      undoTimers.current.delete(id);
      setPendingDismiss((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      focusInPanel(`[data-notif-id="${id}"]`);
    },
    [focusInPanel],
  );

  // Panelzáráskor (unmount) a még függő elvetések azonnal véglegesednek –
  // a visszavonási ablak a nyitott panelhez kötött, zárás után az elvetett
  // értesítés nem „ragadhat vissza".
  useEffect(() => {
    const timers = undoTimers.current;
    return () => {
      for (const [id, timer] of timers) {
        clearTimeout(timer);
        void dismissRef.current(id);
      }
      timers.clear();
    };
  }, []);

  // ── NH-F4PLUS: fókusz-csapda + billentyű-navigáció ────────────────────────
  // A Modal primitívben nincs kész csapda-minta (csak Esc-kezelés), ezért itt
  // a teljes dialog-viselkedést adjuk: Tab/Shift+Tab körbejár a panelen belül,
  // Esc zár, ↑/↓ az értesítés-sorok közt lép, záráskor a fókusz visszatér a
  // megnyitó elemre (harang). A panel a desktop+mobil ágban egyszerre
  // mountolódik – a CSS-sel rejtett példány (offsetParent === null) nem
  // fókuszál és nem kezel billentyűt.
  useEffect(() => {
    const panel = panelRef.current;
    // A rejtett (display:none) példányt getClientRects-szel szűrjük: a mobil ág
    // panelje fixed pozicionálású, annál az offsetParent mindig null lenne.
    if (!panel || panel.getClientRects().length === 0) return;
    // Szűkített alias: a hoistolt handleKeyDown-ban a TS nem viszi tovább a
    // fenti null-guardot.
    const panelEl: HTMLDivElement = panel;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelEl.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab") {
        const focusables = Array.from(
          panelEl.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || active === panelEl || !panelEl.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !panelEl.contains(active)) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const rows = Array.from(
          panelEl.querySelectorAll<HTMLElement>("[data-notif-row]"),
        );
        if (rows.length === 0) return;
        e.preventDefault();
        const active = document.activeElement as HTMLElement | null;
        const current = rows.findIndex(
          (row) => row === active || row.contains(active),
        );
        const next =
          e.key === "ArrowDown"
            ? Math.min(current + 1, rows.length - 1)
            : current <= 0
              ? 0
              : current - 1;
        rows[next]?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const showLoader = cached === null && loading;
  const hasUnread = items.some((n) => !n.read);

  const rowFocusCls =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-primary)]/40";

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("notifications.bellLabel", loc)}
      tabIndex={-1}
      // Mobilon a harang a hamburger mellett ül, ezért a hozzá horgonyzott
      // panel a bal viewport-szélen túlnyúlna: <md-en fixed, a h-14 fejléc
      // alatt, a viewport két oldalán 16px margóval. lg-től (desktop fejléc-ág)
      // visszaáll a haranghoz horgonyzott dropdown.
      className="fixed inset-x-4 top-[calc(3.5rem+6px)] z-50 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card-soft)] shadow-lg shadow-black/[0.06] focus:outline-none md:inset-x-auto md:right-4 md:w-[380px] lg:absolute lg:right-0 lg:top-[calc(100%+6px)]"
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
            className="text-note font-medium text-[var(--color-accent-primary-strong)] transition-colors hover:underline"
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
          <div className="px-6 py-10 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              {t("notifications.noNotifications", loc)}
            </p>
            {/* UX-B16: az üres állapot ne zsákutca legyen – mutassuk a
                következő értelmes lépést. */}
            <p className="mx-auto mt-1.5 max-w-[260px] text-note leading-relaxed text-[var(--color-text-muted)] opacity-80">
              {t("notifications.emptyHint", loc)}
            </p>
          </div>
        ) : (
          items.map((item) => {
            // B16u: függő elvetés – a sor helyén visszavonási állapot, amíg
            // a timer le nem jár. role="status": a felolvasó bejelenti.
            if (pendingDismiss.has(item.id)) {
              return (
                <div
                  key={item.id}
                  role="status"
                  data-notif-row
                  tabIndex={-1}
                  className={`flex items-center justify-between gap-3 border-b border-[var(--color-border-default)]/50 px-4 py-1.5 last:border-b-0 ${rowFocusCls}`}
                >
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t("notifications.dismissedLabel", loc)}
                  </p>
                  <button
                    type="button"
                    data-undo-for={item.id}
                    onClick={() => undoDismiss(item.id)}
                    className="min-h-[44px] shrink-0 rounded-lg px-3 text-xs font-semibold text-[var(--color-accent-primary-strong)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    {t("notifications.undo", loc)}
                  </button>
                </div>
              );
            }

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
                      className={`text-xs leading-snug ${
                        item.read
                          ? "text-[var(--color-text-muted)]"
                          : "font-semibold text-[var(--color-text-primary)]"
                      }`}
                    >
                      {title}
                    </p>
                    {item.priority === "high" && !item.read && (
                      <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-state-error-solid" />
                    )}
                  </div>
                  <p className="mt-0.5 text-note leading-relaxed text-[var(--color-text-muted)]">
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
                    startDismiss(item.id);
                  }}
                  // A vizuális méret marad (a sor nem nő), de a tap-area a
                  // pseudo-elemmel ~46px-re bővül (érintőcél-konvenció).
                  className="relative mt-1 shrink-0 rounded p-1 text-[var(--color-text-faint)] transition-colors before:absolute before:-inset-3 before:content-[''] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-muted)]"
                  aria-label={t("notifications.dismiss", loc)}
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
                data-notif-row
                data-notif-id={item.id}
                onClick={(e) => {
                  // Kattintás + navigáció = olvasott. A mark-read a navigáció
                  // ELŐTT fut le, különben az új oldal SSR-je még olvasatlan
                  // countot szerializál (badge-verseny).
                  e.preventDefault();
                  const target = item.link as string;
                  void (async () => {
                    if (!item.read) await markRead(item.id).catch(() => {});
                    onClose();
                    router.push(target);
                  })();
                }}
                className={`block border-b border-[var(--color-border-default)]/50 px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--color-surface-subtle)] ${rowFocusCls} ${
                  !item.read ? "bg-surface-card" : ""
                }`}
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.id}
                data-notif-row
                data-notif-id={item.id}
                tabIndex={-1}
                className={`border-b border-[var(--color-border-default)]/50 px-4 py-3 last:border-b-0 ${rowFocusCls} ${
                  !item.read ? "bg-surface-card" : ""
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
