"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useNotifications } from "./NotificationsProvider";

interface NotificationBellProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function NotificationBell({ isOpen, onToggle }: NotificationBellProps) {
  const { count, ensureList } = useNotifications();
  const { locale } = useLocale();
  const loc = locale as Locale;

  function handleClick() {
    if (!isOpen) ensureList();
    onToggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      // NH-F4PLUS: lokalizált címke + dialog-viszony jelzése a felolvasónak.
      aria-label={t("notifications.bellLabel", loc)}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
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
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent-primary)] px-1 text-micro font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
