'use client'

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_AVATAR = "/avatars/avatar-1.png";
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
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("trita_avatar") ?? DEFAULT_AVATAR;
    }
    return DEFAULT_AVATAR;
  });
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<string | null>(null);

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
        } else {
          // Profile has no username yet (deleted or in onboarding) — clear stale cache
          setProfileName(null);
          window.localStorage.removeItem("trita_username");
        }
        if (data.avatarUrl) {
          setAvatarSrc(data.avatarUrl);
          window.localStorage.setItem("trita_avatar", data.avatarUrl);
        }
        setOrgRole(data.orgMemberships?.[0]?.role ?? null);
        setAccessLevel(data.accessLevel ?? null);
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

  const isOnboarding = pathname.startsWith("/onboarding");
  const email = user?.primaryEmailAddress?.emailAddress;

  // During onboarding show email as fallback (no stale cached name)
  const displayName = isOnboarding
    ? email ?? null
    : profileName || user?.username || email;

  const initials = isOnboarding
    ? email?.[0]?.toUpperCase() ?? "?"
    : profileName?.[0]?.toUpperCase() ??
      user?.username?.[0]?.toUpperCase() ??
      email?.[0]?.toUpperCase() ??
      "U";

  const label = displayName;
  const itemClass = (active: boolean) =>
    `flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
      active
        ? "bg-sage-soft text-ink ring-1 ring-bronze-soft"
        : "text-ink-body hover:bg-white hover:text-ink"
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
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-sand bg-white px-2 py-1 text-sm font-semibold text-ink-body shadow-sm transition hover:border-warm-dark hover:text-ink"
      >
        <Image
          src={avatarSrc}
          alt="Avatar"
          width={32}
          height={32}
          unoptimized
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="hidden max-w-[120px] truncate text-sm text-ink-body lg:block">
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
              className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col border-l border-sand bg-cream shadow-2xl"
            >
              <div className="relative z-10 flex h-20 items-center justify-center border-b border-sand bg-cream px-5">
                <TritaLogo size={40} showText={false} />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("userMenu.closePanel", locale)}
                  className="absolute right-4 top-1/2 flex min-h-[40px] min-w-[40px] -translate-y-1/2 items-center justify-center rounded-lg text-ink-body transition hover:bg-[#f5efe6] hover:text-ink"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              <div className="border-b border-sand px-5 py-5">
                <div className="flex items-start gap-3">
                  <Image
                    src={avatarSrc}
                    alt="Avatar"
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {t("userMenu.greetingPrefix", locale)}
                      {label ?? t("userMenu.profileFallback", locale)}
                    </p>
                    <p className="truncate text-xs text-ink-body">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="mt-1 inline-flex rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-body">
                      {orgRole === "ORG_ADMIN"
                        ? "Org Admin"
                        : orgRole === "ORG_MANAGER"
                        ? "Manager"
                        : orgRole === "ORG_MEMBER"
                        ? "Team"
                        : accessLevel === "self_reflect"
                        ? "Self Reflect"
                        : accessLevel === "self_plus"
                        ? "Self Plus"
                        : "Self Start"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 px-4 py-4">
                <Link
                  href="/profile/results"
                  className={itemClass(pathname.startsWith("/profile/results"))}
                  onClick={() => setIsOpen(false)}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-bronze" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 10.2 10 4.5l6.5 5.7v6a1 1 0 0 1-1 1h-3.7v-4h-3.6v4H4.5a1 1 0 0 1-1-1v-6Z" />
                  </svg>
                  {t("nav.dashboard", locale)}
                </Link>
                <Link
                  href="/profile"
                  className={itemClass(pathname === "/profile")}
                  onClick={() => setIsOpen(false)}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-bronze" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 10a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-5.6 6.1a5.6 5.6 0 0 1 11.2 0" />
                  </svg>
                  {t("userMenu.profile", locale)}
                </Link>

                <div className="h-px bg-sand" />

                <div className="rounded-xl border border-sand bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-body">
                    {t("userMenu.settings", locale)}
                  </p>
                  <div className="mb-2 flex items-center gap-2 text-xs text-ink-body">
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
                            ? "border-sage-ring bg-sage-soft text-bronze-dark"
                            : "border-sand bg-white text-ink-body hover:border-warm-dark"
                        }`}
                      >
                        {t(`locale.${loc}` as const, loc)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-sand p-4">
                <SignOutButton>
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-sage-ring text-sm font-semibold text-bronze-dark transition hover:bg-sage-soft"
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
