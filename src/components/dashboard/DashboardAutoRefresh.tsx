"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * „Megjött egy observer-kitöltés" háttér-figyelő az eredmény-oldalon.
 *
 * Mérés (2026-07-30, docs/audits/perf-call-chain-audit-2026-07-30.md):
 * a korábbi 30 s-os ütem volt az app legdrágább kliens-oldali ciklusa —
 * változáskor `router.refresh()`-t hív, ami TELJES layout+oldal újrarender
 * (mérve 33–36 DB-query). Observer-beadás naptári napokban érkezik, nem
 * másodpercekben, ezért:
 *
 * - alapütem 30 s → 180 s,
 * - rejtett fülön nincs időzítő (nem csak a lekérés maradt el, mint eddig),
 * - a fülre visszatéréskor egyszeri azonnali ellenőrzés (ez a valódi
 *   „friss adatot akarok" pillanat).
 *
 * Ugyanezt az eseményt a harang is jelzi (OBSERVER_COMPLETED notification),
 * tehát a felhasználó nem marad információ nélkül két ellenőrzés között.
 */
const POLL_INTERVAL_MS = 180_000;

interface DashboardAutoRefreshProps {
  pendingInvites: number;
  completedObserver: number;
}

export function DashboardAutoRefresh({
  pendingInvites,
  completedObserver,
}: DashboardAutoRefreshProps) {
  const router = useRouter();
  const lastSnapshot = useRef({ pendingInvites, completedObserver });
  const inFlight = useRef(false);

  useEffect(() => {
    lastSnapshot.current = { pendingInvites, completedObserver };
  }, [pendingInvites, completedObserver]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await fetch("/api/dashboard/status");
        if (!res.ok) return;
        const data = await res.json();
        const next = {
          pendingInvites: data.pendingInvites ?? 0,
          completedObserver: data.completedObserver ?? 0,
        };
        const prev = lastSnapshot.current;
        if (
          next.pendingInvites !== prev.pendingInvites ||
          next.completedObserver !== prev.completedObserver
        ) {
          // A snapshotot azonnal frissítjük, hogy a refresh alatt beeső
          // következő poll ne indítson újabb teljes újrarendert.
          lastSnapshot.current = next;
          router.refresh();
        }
      } catch {
        // silent
      } finally {
        inFlight.current = false;
      }
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
