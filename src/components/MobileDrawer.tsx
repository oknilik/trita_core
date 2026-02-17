"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { SUPPORTED_LOCALES, t, type Locale } from "@/lib/i18n";
import { TritaLogo } from "@/components/TritaLogo";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user } = useUser();
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const [profileName, setProfileName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("trita_username");
    }
    return null;
  });

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/profile/onboarding");
        if (!res.ok) return;
        const data = await res.json();
        if (data.username) {
          setProfileName(data.username);
          window.localStorage.setItem("trita_username", data.username);
        }
      } catch {
        // noop
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

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

  const displayName = useMemo(
    () => profileName || user?.username || user?.primaryEmailAddress?.emailAddress,
    [profileName, user],
  );

  const initials =
    profileName?.[0] ??
    user?.username?.[0] ??
    user?.primaryEmailAddress?.emailAddress?.[0] ??
    "U";

  const itemClass = (active: boolean) =>
    `flex min-h-[46px] items-center gap-3 rounded-lg px-3.5 text-sm font-semibold transition ${
      active
        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-700"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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
            className="absolute right-0 top-0 flex h-full w-80 max-w-[92vw] flex-col border-l border-indigo-100 bg-white shadow-2xl"
          >
            <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-200 via-indigo-100 to-violet-100 px-5 pt-4">
              <div className="pointer-events-none absolute -right-10 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
              <TritaLogo size={40} showText={false} />
              <button
                type="button"
                onClick={onClose}
                aria-label={t("userMenu.closePanel", locale)}
                className="absolute right-4 top-3 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-indigo-500/80 transition hover:bg-white/50 hover:text-indigo-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <SignedIn>
              <div className="border-b border-gray-100 px-5 py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-indigo-200 bg-white text-base font-semibold text-indigo-600 shadow-lg shadow-indigo-200/60 ring-2 ring-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {t("userMenu.greetingPrefix", locale)}
                      {displayName ?? t("userMenu.profileFallback", locale)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                      {t("userMenu.participant", locale)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 px-4 py-4">
                <Link
                  href="/dashboard"
                  className={itemClass(pathname.startsWith("/dashboard"))}
                  onClick={onClose}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 10.2 10 4.5l6.5 5.7v6a1 1 0 0 1-1 1h-3.7v-4h-3.6v4H4.5a1 1 0 0 1-1-1v-6Z" />
                  </svg>
                  {t("nav.dashboard", locale)}
                </Link>
                <Link
                  href="/profile"
                  className={itemClass(pathname.startsWith("/profile"))}
                  onClick={onClose}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 10a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-5.6 6.1a5.6 5.6 0 0 1 11.2 0" />
                  </svg>
                  {t("userMenu.profile", locale)}
                </Link>
                <Link
                  href="/research"
                  className={itemClass(pathname.startsWith("/research"))}
                  onClick={onClose}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.2 4.2h3.6M9 4.2v4.4l-3.8 6.1a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L11 8.6V4.2" />
                  </svg>
                  {t("userMenu.research", locale)}
                </Link>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {t("userMenu.settings", locale)}
                  </p>
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>🌍</span>
                    <span>{t("locale.label", locale)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SUPPORTED_LOCALES.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocale(loc as Locale)}
                        className={`min-h-[38px] rounded-lg border text-xs font-semibold transition ${
                          locale === loc
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-gray-100 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t(`locale.${loc}` as const, loc)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 p-4">
                <SignOutButton>
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.5 4h2.2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2.2M8 6.5 4.5 10 8 13.5M4.5 10H13" />
                    </svg>
                    {t("actions.signOut", locale)}
                  </button>
                </SignOutButton>
              </div>
            </SignedIn>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
