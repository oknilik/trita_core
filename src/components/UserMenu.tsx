"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";

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
  const avatarInitial = getAvatarMonogram(displayName, { length: 1, fallback: "·" });
  const [from, to] = getAvatarGradient(user?.id ?? displayName ?? "trita");

  return (
    <Link
      href="/profile"
      className="flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-white px-2 py-1 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm transition hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
    >
      {showIdentityLoader ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
      ) : (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {avatarInitial}
        </div>
      )}
      {showIdentityLoader ? (
        <span className="hidden h-3 w-20 animate-pulse rounded-full bg-[var(--color-surface-subtle)] lg:block" />
      ) : (
        <span className="hidden min-w-[80px] max-w-[120px] truncate text-sm text-[var(--color-text-secondary)] lg:block">
          {displayName ?? t("userMenu.profile", locale)}
        </span>
      )}
    </Link>
  );
}
