"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { clearLocaleSyncFlag } from "@/components/LocaleProvider";

// Kijelentkezés-route a (auth) zónában (itt van ClerkProvider). A publikus
// nav (marketing, Clerk-mentes) ide linkel a kijelentkezéshez, ahelyett hogy
// clerk-js-t húzna be a marketing-fába. Mountkor kijelentkeztet és a
// landingre irányít.
export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    clearLocaleSyncFlag();
    void signOut({ redirectUrl: "/" });
  }, [signOut]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-primary)]" />
    </div>
  );
}
