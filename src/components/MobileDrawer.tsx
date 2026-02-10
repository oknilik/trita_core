"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { t } from "@/lib/i18n";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { locale } = useLocale();
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const linkClass = (href: string) =>
    `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold ${
      pathname === href
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute right-0 top-0 h-full w-64 border-l border-gray-100 bg-white p-4"
          >
            {/* Close button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-6 w-6"
                >
                  <path d="M5 5 C7 6, 9 8, 10 10 C11 8, 13 6, 15 5" />
                  <path d="M5 15 C7 14, 9 12, 10 10 C11 12, 13 14, 15 15" />
                </svg>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="mt-2 flex flex-col gap-1">
              <SignedIn>
                <Link
                  href="/dashboard"
                  className={linkClass("/dashboard")}
                  onClick={onClose}
                >
                  {t("nav.dashboard", locale)}
                </Link>
                <Link
                  href="/profile"
                  className={linkClass("/profile")}
                  onClick={onClose}
                >
                  {t("userMenu.profile", locale)}
                </Link>
              </SignedIn>

              <SignedOut>
                <Link
                  href="/sign-in"
                  className={linkClass("/sign-in")}
                  onClick={onClose}
                >
                  {t("nav.signIn", locale)}
                </Link>
              </SignedOut>
            </nav>

            <div className="my-4 h-px bg-gray-100" />
            <div className="flex flex-col gap-2 px-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                {t("locale.label", locale)}
              </span>
              <LocaleSwitcher className="w-full" />
            </div>

            {/* Sign out */}
            <SignedIn>
              <div className="my-4 h-px bg-gray-100" />
              <SignOutButton>
                <button
                  type="button"
                  className="flex w-full min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t("actions.signOut", locale)}
                </button>
              </SignOutButton>
            </SignedIn>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
