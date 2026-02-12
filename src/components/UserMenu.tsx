'use client'

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { SUPPORTED_LOCALES, t, type Locale } from "@/lib/i18n";
import { TritaLogo } from "@/components/TritaLogo";

export function UserMenu() {
  const { user } = useUser();
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(() => {
    // Initialize from localStorage to avoid visual jump
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("trita_username");
    }
    return null;
  });

  // Fetch user profile name from database
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/onboarding");
      if (res.ok) {
        const data = await res.json();
        if (data.username) {
          setProfileName(data.username);
          // Cache in localStorage for instant access on next load
          window.localStorage.setItem("trita_username", data.username);
        }
      }
    } catch {
      // Silently fail, fallback to Clerk data
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchProfile]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [fetchProfile]);

  // Use profile name from database if available, otherwise fallback to Clerk data
  const displayName = profileName || user?.username || user?.primaryEmailAddress?.emailAddress;

  const initials =
    profileName?.[0] ??
    user?.username?.[0] ??
    user?.primaryEmailAddress?.emailAddress?.[0] ??
    "U";

  const label = displayName;
  const itemClass = (active: boolean) =>
    `flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
      active
        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-700"
    }`;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
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
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsOpen(false)}
              aria-label="Close user panel"
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
            />

            <motion.aside
              initial={{ x: 360, opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col border-l border-indigo-100 bg-white shadow-2xl"
            >
              <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-200 via-indigo-100 to-violet-100 px-5 pt-4">
                <div className="pointer-events-none absolute -right-10 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
                <TritaLogo size={40} showText={false} />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("userMenu.closePanel", locale)}
                  className="absolute right-4 top-3 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-indigo-500/80 transition hover:bg-white/50 hover:text-indigo-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              <div className="border-b border-gray-100 px-5 py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-indigo-200 bg-white text-base font-semibold text-indigo-600 shadow-lg shadow-indigo-200/60 ring-2 ring-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {t("userMenu.greetingPrefix", locale)}
                      {label ?? t("userMenu.profileFallback", locale)}
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
                  onClick={() => setIsOpen(false)}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 10.2 10 4.5l6.5 5.7v6a1 1 0 0 1-1 1h-3.7v-4h-3.6v4H4.5a1 1 0 0 1-1-1v-6Z" />
                  </svg>
                  {t("nav.dashboard", locale)}
                </Link>
                <Link
                  href="/profile"
                  className={itemClass(pathname.startsWith("/profile"))}
                  onClick={() => setIsOpen(false)}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 10a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-5.6 6.1a5.6 5.6 0 0 1 11.2 0" />
                  </svg>
                  {t("userMenu.profile", locale)}
                </Link>

                <Link
                  href="/research"
                  className={itemClass(pathname.startsWith("/research"))}
                  onClick={() => setIsOpen(false)}
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
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
