"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import type { Locale } from "@/lib/i18n/public";
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
      // 44px érintőcél a mobil/tablet fejlécben (a hamburger mellett ez az
      // értesítések egyetlen belépési pontja); lg-től a desktop fejléc-ág
      // sűrűsége marad.
      className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-subtle)] lg:h-8 lg:w-8"
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
      {/* Badge háttere: bronze-dark — a világosabb accent-primary fehér
          10px-es számmal csak 3.28:1 (AA-bukó); a bronze-dark 4.89:1. */}
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center lg:-right-0.5 lg:-top-0.5 rounded-full bg-[var(--color-bronze-dark)] px-1 text-micro font-bold leading-none text-[var(--color-text-on-accent-deep)]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
