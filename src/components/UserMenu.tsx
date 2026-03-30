"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"], // sage
  ["#8a5530", "#6b3f22"], // bronze
  ["#4a4a5e", "#33334a"], // ink
  ["#6366F1", "#4F46E5"], // indigo
  ["#0E7490", "#0C5E75"], // teal
  ["#9333EA", "#7C22CB"], // purple
] as const;

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { locale } = useLocale();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

  const refreshProfile = useCallback(async () => {
    setHasFetchedProfile(false);
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
    finally {
      setHasFetchedProfile(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(async () => {
      await refreshProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoaded, refreshProfile]);

  useEffect(() => {
    if (!isLoaded) return;
    const handler = async () => {
      await refreshProfile();
    };
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [isLoaded, refreshProfile]);

  const email = user?.primaryEmailAddress?.emailAddress;
  const resolvedName = profileName || user?.username || user?.firstName || null;
  const displayName = resolvedName || email;
  const showIdentityLoader = !isLoaded || !hasFetchedProfile;
  const avatarInitial = displayName?.[0]?.toUpperCase() ?? "·";
  const [from, to] = getAvatarColor(user?.id ?? displayName ?? "trita");

  return (
    <Link
      href="/profile"
      className="flex min-h-[44px] items-center gap-2 rounded-full border border-[#e8e0d3] bg-white px-2 py-1 text-sm font-semibold text-[#4a4a5e] shadow-sm transition hover:border-[#8a8a9a] hover:text-[#1a1a2e]"
    >
      {showIdentityLoader ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-[#f2ede6]" />
      ) : (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {avatarInitial}
        </div>
      )}
      {showIdentityLoader ? (
        <span className="hidden h-3 w-20 animate-pulse rounded-full bg-[#f2ede6] lg:block" />
      ) : (
        <span className="hidden max-w-[120px] truncate text-sm text-[#4a4a5e] lg:block">
          {displayName ?? t("userMenu.profile", locale)}
        </span>
      )}
    </Link>
  );
}
