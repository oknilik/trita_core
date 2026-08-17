"use client";

import Link from "next/link";
import { useAuthState } from "@/components/auth/auth-state";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

// A publikus/nav UserMenu — a belépett látogató identitása a nav auth-context-
// ből jön (Clerk kliens-hook nélkül). A belépett APP-felület saját, gazdagabb
// fejlécet használ (NavHeaderUI), ez a komponens csak a NavBar-ban él.
export function UserMenu() {
  const { username, email, loading } = useAuthState();
  const { locale } = useLocale();

  const displayName = username || email;
  const avatarInitial = getAvatarMonogram(displayName, { length: 1, fallback: "·" });
  const [from, to] = getAvatarGradient(displayName ?? "trita");

  return (
    <Link
      href="/profile"
      className={`flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-surface-card px-2 py-1 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm transition hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
    >
      {loading ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-subtle)]" />
      ) : (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {avatarInitial}
        </div>
      )}
      {loading ? (
        <span className="hidden h-3 w-20 animate-pulse rounded-full bg-[var(--color-surface-subtle)] lg:block" />
      ) : (
        <span className="hidden min-w-[80px] max-w-[120px] truncate text-sm text-[var(--color-text-secondary)] lg:block">
          {displayName ?? t("userMenu.profile", locale)}
        </span>
      )}
    </Link>
  );
}
