'use client'

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function UserMenu() {
  const { user } = useUser();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const initials =
    user?.firstName?.[0] ??
    user?.lastName?.[0] ??
    user?.username?.[0] ??
    user?.primaryEmailAddress?.emailAddress?.[0] ??
    "U";

  const label =
    user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-gray-100 bg-white px-2 py-1 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm text-gray-600 md:block">
          {label ?? t("userMenu.profileFallback", locale)}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-3 w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-lg"
          >
            <Link
              href="/dashboard"
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              {t("userMenu.profile", locale)}
            </Link>
            <SignOutButton>
              <button
                type="button"
                className="flex w-full min-h-[44px] items-center rounded-lg px-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t("actions.signOut", locale)}
              </button>
            </SignOutButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
