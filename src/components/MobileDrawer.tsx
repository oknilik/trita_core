"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_AVATAR = "/avatars/avatar-1.png";
import { usePathname } from "next/navigation";
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(() => {
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
        if (data.avatarUrl) {
          setAvatarSrc(data.avatarUrl);
          window.localStorage.setItem("trita_avatar", data.avatarUrl);
        }
        setOrgRole(data.orgMemberships?.[0]?.role ?? null);
      } catch {
        // noop
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        ? "bg-[#fef3ec] text-[#1a1814] ring-1 ring-[#f3d4c8]"
        : "text-[#3d3a35] hover:bg-white hover:text-[#1a1814]"
    }`;

  if (!mounted) return null;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 lg:hidden" style={{ zIndex: 9999 }}>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("userMenu.closePanel", locale)}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-dvh w-80 max-w-[92vw] flex-col overflow-y-auto overscroll-contain border-l border-[#e8e4dc] bg-[#faf9f6] shadow-2xl"
      >
            <div className="relative z-10 flex h-20 items-center justify-center border-b border-[#e8e4dc] bg-[#faf9f6] px-5">
              <TritaLogo size={40} showText={false} />
              <button
                type="button"
                onClick={onClose}
                aria-label={t("userMenu.closePanel", locale)}
                className="absolute right-4 top-1/2 flex min-h-[40px] min-w-[40px] -translate-y-1/2 items-center justify-center rounded-lg text-[#5a5650] transition hover:bg-[#f5efe6] hover:text-[#1a1814]"
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
              <div className="border-b border-[#e8e4dc] px-5 py-5">
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
                    <p className="truncate text-sm font-semibold text-[#1a1814]">
                      {t("userMenu.greetingPrefix", locale)}
                      {displayName ?? t("userMenu.profileFallback", locale)}
                    </p>
                    <p className="truncate text-xs text-[#5a5650]">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="mt-1 inline-flex rounded-full border border-[#e8e4dc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3d3a35]">
                      {orgRole === "ORG_ADMIN"
                        ? "org admin"
                        : orgRole === "ORG_MANAGER"
                        ? "menedzser"
                        : orgRole === "ORG_MEMBER"
                        ? "org tag"
                        : t("userMenu.participant", locale)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 px-4 py-4">
                <Link
                  href="/profile/results"
                  className={itemClass(pathname.startsWith("/profile/results"))}
                  onClick={onClose}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#c8410a]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 10.2 10 4.5l6.5 5.7v6a1 1 0 0 1-1 1h-3.7v-4h-3.6v4H4.5a1 1 0 0 1-1-1v-6Z" />
                  </svg>
                  {t("nav.dashboard", locale)}
                </Link>
                <Link
                  href="/profile"
                  className={itemClass(pathname === "/profile")}
                  onClick={onClose}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#c8410a]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 10a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-5.6 6.1a5.6 5.6 0 0 1 11.2 0" />
                  </svg>
                  {t("userMenu.profile", locale)}
                </Link>

                {orgRole && (
                  <>
                    <div className="h-px bg-[#e8e4dc]" />
                    <Link
                      href="/org"
                      className={itemClass(pathname.startsWith("/org"))}
                      onClick={onClose}
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#c8410a]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="16" height="11" rx="1.5" />
                        <path d="M6 7V5.5a4 4 0 0 1 8 0V7" />
                        <path d="M10 11v3M8 13h4" />
                      </svg>
                      {locale === "hu" ? "Szervezetek" : "Organizations"}
                    </Link>
                  </>
                )}

                <div className="rounded-xl border border-[#e8e4dc] bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5a5650]">
                    {t("userMenu.settings", locale)}
                  </p>
                  <div className="mb-2 flex items-center gap-2 text-xs text-[#5a5650]">
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
                            ? "border-[#f3d4c8] bg-[#fef3ec] text-[#8b2f09]"
                            : "border-[#e8e4dc] bg-white text-[#3d3a35] hover:border-[#d9cfc1]"
                        }`}
                      >
                        {t(`locale.${loc}` as const, loc)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e8e4dc] p-4">
                <SignOutButton>
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#f3d4c8] text-sm font-semibold text-[#8b2f09] transition hover:bg-[#fef3ec]"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.5 4h2.2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2.2M8 6.5 4.5 10 8 13.5M4.5 10H13" />
                    </svg>
                    {t("actions.signOut", locale)}
                  </button>
                </SignOutButton>
              </div>
            </SignedIn>
      </aside>
    </div>
    ,
    document.body,
  );
}
