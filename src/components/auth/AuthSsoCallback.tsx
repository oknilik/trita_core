"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { StarLoader } from "@/components/ui/StarLoader";
import { t } from "@/lib/i18n";

export default function AuthSsoCallback() {
  const { locale } = useLocale();

  return (
    <AuthErrorBoundary>
      <AuthPageShell panelContext="verify">
        <div className="flex flex-col items-center py-8 text-center" aria-live="polite">
          <StarLoader size={64} />
          <h1 className="mt-7 font-fraunces text-title text-[var(--color-text-primary)]">
            {t("auth.ssoTitle", locale)}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t("auth.ssoSubtitle", locale)}
          </p>
        </div>

        {/* A Clerk Smart CAPTCHA ide renderel az OAuth-transfer során. */}
        <div id="clerk-captcha" />
        <AuthenticateWithRedirectCallback />
      </AuthPageShell>
    </AuthErrorBoundary>
  );
}
