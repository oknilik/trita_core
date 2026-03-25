"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function UserMenu() {
  const { user } = useUser();
  const { locale } = useLocale();
  const [profileName, setProfileName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("trita_username");
    }
    return null;
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/onboarding");
      if (res.ok) {
        const data = await res.json();
        if (data.username) {
          setProfileName(data.username);
          window.localStorage.setItem("trita_username", data.username);
        } else {
          setProfileName(null);
          window.localStorage.removeItem("trita_username");
        }
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchProfile(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchProfile]);

  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [fetchProfile]);

  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName = profileName || user?.username || email;
  const initials = profileName?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href="/profile"
      className="flex min-h-[44px] items-center gap-2 rounded-full border border-[#e8e0d3] bg-white px-2 py-1 text-sm font-semibold text-[#4a4a5e] shadow-sm transition hover:border-[#8a8a9a] hover:text-[#1a1a2e]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3d6b5e] to-[#2a5244] text-xs font-bold text-white">
        {initials}
      </div>
      <span className="hidden max-w-[120px] truncate text-sm text-[#4a4a5e] lg:block">
        {displayName ?? t("userMenu.profileFallback", locale)}
      </span>
    </Link>
  );
}
