"use client";

import { useEffect, useState, useCallback } from "react";

const POLL_INTERVAL = 30_000;

interface NotificationBellProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function NotificationBell({ isOpen, onToggle }: NotificationBellProps) {
  const [count, setCount] = useState(0);

  const poll = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count ?? 0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    // Külső rendszerrel (API) szinkronizáló polling — az azonnali első
    // lekérés szándékos, nem kaszkád-render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [poll]);

  // Re-poll when panel closes (user may have read notifications)
  useEffect(() => {
    // Panel-záráskor frissítés a szerverről — külső állapot szinkron, szándékos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isOpen) poll();
  }, [isOpen, poll]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-subtle)]"
    >
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 2a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 0 0-5-5Z" />
        <path d="M8 16a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent-primary)] px-1 text-[9px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
