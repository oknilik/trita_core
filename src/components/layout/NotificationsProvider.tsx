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

/**
 * Háttér-poll ütemezés — adaptív backoff.
 *
 * Miért nem websocket: az értesítések emberi akciókból születnek (napi
 * 0–10 / user), a poll egyetlen indexelt count query, és a teljes DB-terhelés
 * néhány százaléka. A valós költség az oldal-render volt, nem ez.
 * Részletek: docs/audits/perf-call-chain-audit-2026-07-30.md
 *
 * A lépcső akkor lép feljebb, ha a count VÁLTOZATLAN maradt; bármilyen
 * változás, fül-fókusz vagy saját mutáció visszaállítja az alapra.
 */
const POLL_STEPS_MS = [60_000, 120_000, 300_000] as const;
/** Ennyi változatlan poll után lépünk a következő lépcsőre. */
const UNCHANGED_POLLS_PER_STEP = 3;
/** Ennél frissebb listát nem kérünk le újra (ismételt panel-nyitás). */
const LIST_STALE_MS = 20_000;

interface NotificationsContextValue {
  count: number;
  items: NotificationItem[] | null;
  loading: boolean;
  /** Panel-nyitáskor: lekéri a listát, ha nincs vagy elavult. */
  ensureList: () => void;
  markAllRead: () => Promise<void>;
  /** Egy elem olvasottra állítása (pl. kattintás + navigáció előtt). */
  markRead: (id: string) => Promise<void>;
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
  /** Backoff-állapot: melyik lépcsőn állunk és hány változatlan poll óta. */
  const backoffStep = useRef(0);
  const unchangedPolls = useRef(0);
  /** A legutóbb LÁTOTT count — a backoff „változott-e" döntéséhez. */
  const lastSeenCount = useRef(initialCount);

  const resetBackoff = useCallback(() => {
    backoffStep.current = 0;
    unchangedPolls.current = 0;
  }, []);

  // ── Számláló-poll (olcsó endpoint) ────────────────────────────────────────
  const refreshCount = useCallback(() => {
    if (countInFlight.current) return countInFlight.current;
    const p = (async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          const next = data.count ?? 0;
          if (next === lastSeenCount.current) {
            unchangedPolls.current += 1;
            if (
              unchangedPolls.current >= UNCHANGED_POLLS_PER_STEP &&
              backoffStep.current < POLL_STEPS_MS.length - 1
            ) {
              backoffStep.current += 1;
              unchangedPolls.current = 0;
            }
          } else {
            resetBackoff();
          }
          lastSeenCount.current = next;
          setCount(next);
        }
      } catch {
        // silent — a következő poll újrapróbálja
      } finally {
        countInFlight.current = null;
      }
    })();
    countInFlight.current = p;
    return p;
  }, [resetBackoff]);

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
          if (typeof data.unreadCount === "number") {
            lastSeenCount.current = data.unreadCount;
            setCount(data.unreadCount);
          }
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

  // ── Navigáció-piggyback ───────────────────────────────────────────────────
  // A szerver-render friss számlálót ad minden navigációnál. Átvesszük, és a
  // backoff „változott-e" állapotát is ehhez igazítjuk — így a poll nem
  // ismétli meg azt, amit az oldal-render már elvégzett.
  useEffect(() => {
    if (initialCount === lastSeenCount.current) return;
    lastSeenCount.current = initialCount;
    setCount(initialCount);
    resetBackoff();
  }, [initialCount, resetBackoff]);

  // ── Poll: csak látható fülön, fókuszra azonnali frissítés ─────────────────
  // setInterval helyett önmagát újraütemező setTimeout — így a backoff
  // lépcsőváltása azonnal érvényre jut, nem csak a következő teljes ciklusban.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function schedule(delayMs: number) {
      if (stopped || timer) return;
      timer = setTimeout(async () => {
        timer = null;
        if (document.visibilityState !== "visible") return;
        await refreshCount();
        schedule(POLL_STEPS_MS[backoffStep.current]);
      }, delayMs);
    }
    function start() {
      schedule(POLL_STEPS_MS[backoffStep.current]);
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        // Vissza a fülre: azonnali frissítés és tiszta lappal induló ütem.
        resetBackoff();
        void refreshCount();
        stop();
        start();
      } else {
        stop();
      }
    }

    // Kezdőérték a szerverről jön, ezért mountkor NINCS azonnali lekérés.
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshCount, resetBackoff]);

  // ── Mutációk: optimista lokális állapot, nincs utólagos re-fetch ──────────
  // A saját mutáció aktivitás-jel: a backoff visszaáll az alap ütemre, és a
  // lastSeenCount-ot is követjük, hogy a következő poll ne lássa hamis
  // változásnak a saját optimista módosításunkat.
  const applyLocalCount = useCallback(
    (next: number) => {
      lastSeenCount.current = next;
      setCount(next);
      resetBackoff();
    },
    [resetBackoff],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
    applyLocalCount(0);
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      void refreshCount();
    }
  }, [applyLocalCount, refreshCount]);

  const markRead = useCallback(
    async (id: string) => {
      // FONTOS: a wasUnread-et NEM az updater-en belül számoljuk — a
      // funkcionális state-updater nem garantáltan fut szinkron, így az
      // utána olvasott flag hamis maradna (a badge nem csökkenne).
      const wasUnread = Boolean(items?.some((n) => n.id === id && !n.read));
      setItems((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev,
      );
      if (wasUnread) applyLocalCount(Math.max(0, lastSeenCount.current - 1));
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        });
      } catch {
        void refreshCount();
      }
    },
    [applyLocalCount, items, refreshCount],
  );

  const dismiss = useCallback(
    async (id: string) => {
      // Ld. markRead: a wasUnread updater-en kívül számolódik.
      const wasUnread = Boolean(items?.some((n) => n.id === id && !n.read));
      setItems((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
      if (wasUnread) applyLocalCount(Math.max(0, lastSeenCount.current - 1));
      try {
        await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      } catch {
        void refreshCount();
      }
    },
    [applyLocalCount, items, refreshCount],
  );

  return (
    <NotificationsContext.Provider
      value={{ count, items, loading, ensureList, markAllRead, markRead, dismiss }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
