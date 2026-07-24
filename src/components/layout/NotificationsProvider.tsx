"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Notification kliens-állapot — EGY forrás az egész fejlécnek.
 *
 * A harang és a panel két helyen is renderelődik (desktop + mobil ág), ezért
 * a lekérés itt, a providerben él: így a duplikált mount NEM jelent duplikált
 * API-hívást. A számlálót a szerver adja kezdőértéknek (layout), a lista
 * válasza is visszaadja — így panel-nyitás/zárás nem indít külön count-hívást.
 */

export interface NotificationItem {
  id: string;
  type: string;
  category: string;
  priority: string;
  titleKey: string;
  bodyKey: string;
  vars: Record<string, string | number> | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** Háttér-poll periódus. Csak látható fülön jár. */
const POLL_INTERVAL = 60_000;
/** Ennél frissebb listát nem kérünk le újra (ismételt panel-nyitás). */
const LIST_STALE_MS = 20_000;

interface NotificationsContextValue {
  count: number;
  items: NotificationItem[] | null;
  loading: boolean;
  /** Panel-nyitáskor: lekéri a listát, ha nincs vagy elavult. */
  ensureList: () => void;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within <NotificationsProvider>");
  }
  return ctx;
}

export function NotificationsProvider({
  initialCount = 0,
  children,
}: {
  initialCount?: number;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const listFetchedAt = useRef(0);
  const listInFlight = useRef<Promise<void> | null>(null);
  const countInFlight = useRef<Promise<void> | null>(null);

  // ── Számláló-poll (olcsó endpoint) ────────────────────────────────────────
  const refreshCount = useCallback(() => {
    if (countInFlight.current) return countInFlight.current;
    const p = (async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setCount(data.count ?? 0);
        }
      } catch {
        // silent — a következő poll újrapróbálja
      } finally {
        countInFlight.current = null;
      }
    })();
    countInFlight.current = p;
    return p;
  }, []);

  // ── Lista-lekérés (a count-ot is visszaadja) ──────────────────────────────
  const fetchList = useCallback(() => {
    if (listInFlight.current) return listInFlight.current;
    setLoading(true);
    const p = (async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setItems(data.notifications ?? []);
          if (typeof data.unreadCount === "number") setCount(data.unreadCount);
          listFetchedAt.current = Date.now();
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        listInFlight.current = null;
      }
    })();
    listInFlight.current = p;
    return p;
  }, []);

  const ensureList = useCallback(() => {
    if (items !== null && Date.now() - listFetchedAt.current < LIST_STALE_MS) return;
    void fetchList();
  }, [items, fetchList]);

  // ── Poll: csak látható fülön, fókuszra azonnali frissítés ─────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer) return;
      timer = setInterval(() => void refreshCount(), POLL_INTERVAL);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        void refreshCount();
        start();
      } else {
        stop();
      }
    }

    // Kezdőérték a szerverről jön, ezért mountkor NINCS azonnali lekérés.
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshCount]);

  // ── Mutációk: optimista lokális állapot, nincs utólagos re-fetch ──────────
  const markAllRead = useCallback(async () => {
    setItems((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
    setCount(0);
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      void refreshCount();
    }
  }, [refreshCount]);

  const dismiss = useCallback(
    async (id: string) => {
      let wasUnread = false;
      setItems((prev) => {
        if (!prev) return prev;
        wasUnread = prev.some((n) => n.id === id && !n.read);
        return prev.filter((n) => n.id !== id);
      });
      setCount((c) => (wasUnread ? Math.max(0, c - 1) : c));
      try {
        await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      } catch {
        void refreshCount();
      }
    },
    [refreshCount],
  );

  return (
    <NotificationsContext.Provider
      value={{ count, items, loading, ensureList, markAllRead, dismiss }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
