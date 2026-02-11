"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 30000;

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

  useEffect(() => {
    lastSnapshot.current = { pendingInvites, completedObserver };
  }, [pendingInvites, completedObserver]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
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
          router.refresh();
        }
      } catch {
        // silent
      }
    };

    timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [router]);

  return null;
}
