"use client";

import { Component, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import Link from "next/link";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { createClientLogger } from "@/lib/client-logger";
import { buildSignUpPath, sanitizeInternalRedirect } from "@/lib/navigation/auth-redirects";

const log = createClientLogger("auth");

class SignInErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    try { window.sessionStorage.clear(); } catch { /* ignore */ }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
          <div className="w-full max-w-md rounded border border-sand bg-surface-card p-8 text-center">
            <p className="text-sm text-ink-body">Hiba történt. Frissítsd az oldalt.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded bg-sage px-6 py-2.5 text-sm font-medium text-[var(--color-action-primary-fg)] hover:bg-sage-dark"
            >
              Újratöltés
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function SignInContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const observeToken = searchParams.get("observeToken");
  const redirectUrl = searchParams.get("redirect_url");
  const safeRedirectUrl = sanitizeInternalRedirect(redirectUrl);
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  // A clerk-js betöltésére NEM némítjuk el az egész oldalt (korábban
  // `if (!isLoaded) return null` — fehér képernyő, h1 nélkül, amíg a
  // Clerk meg nem érkezik). A statikus váz, a fejléc és az űrlap azonnal
  // renderel; csak a Clerk-et ténylegesen hívó műveletek várnak. Így a
  // lassú hálózaton is van mit olvasni, a heading-sorrend a11y-szerződése
  // pedig az első festéstől teljesül.

  const canResend = resendCooldown <= 0 && !isSubmitting && Boolean(emailAddressId);

  const handleResendCode = async () => {
    if (!signIn || !canResend || !emailAddressId) return;
    setResendNote(null);
    setResendCooldown(30);
    try {
      await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId });
      setResendNote(t("auth.resendCodeSent", locale));
    } catch {
      setResendNote(t("auth.errorSignInGeneric", locale));
      setResendCooldown(0);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const si = await signIn.create({ identifier: email });
      const emailFactor = si.supportedFirstFactors?.find(
        (f) => f.strategy === "email_code"
      ) as { emailAddressId: string } | undefined;

      if (emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
        setEmailAddressId(emailFactor.emailAddressId);
        setIsVerifying(true);
        setResendCooldown(30);
        setResendNote(null);
      } else {
        setError(t("auth.errorSignInGeneric", locale));
      }
    } catch (err: unknown) {
      log.warn({ event: "auth.sign_in_failed", err }, "Sign-in error");
      const clerkError = err as { errors?: { longMessage?: string; message?: string }[] };
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message;
      if (message?.includes("Identifier") || message?.includes("identifier")) {
        setError(t("auth.errorNoAccount", locale));
      } else {
        setError(message || t("auth.errorSignInGeneric", locale));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await fetch("/api/profile/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        }).catch(() => null);
        if (observeToken) {
          await fetch("/api/observer/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: observeToken }),
          }).catch(() => null);
        }
        router.push(safeRedirectUrl ?? JOURNEY_HOME_HANDOFF_PATH);
      } else {
        setError(t("auth.errorVerificationIncomplete", locale));
      }
    } catch (err: unknown) {
      log.warn({ event: "auth.sign_in_verify_failed", err }, "Sign-in verify error");
      const clerkError = err as { errors?: { longMessage?: string; message?: string }[] };
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message;
      setError(message || t("auth.errorVerificationInvalid", locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signIn || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: observeToken
          ? `/observe/${observeToken}`
          : safeRedirectUrl ?? JOURNEY_HOME_HANDOFF_PATH,
      });
    } catch {
      setError(t("auth.errorGoogleSignIn", locale));
      setIsGoogleLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthPageShell panelContext="verify">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.17em] text-[var(--color-accent-self-deep)]">
          {t("auth.accountEyebrow", locale)}
        </p>
        <h1 className="mb-2 font-fraunces text-4xl leading-[1.05] tracking-tight text-[var(--color-text-primary)] sm:text-[42px]">
          {t("auth.verifyTitle", locale)}
        </h1>
        <p className="mb-7 text-base leading-relaxed text-[var(--color-text-muted)]">
          {tf("auth.verifySent", locale, { email })}
        </p>

        {error ? (
          <div role="alert" className="mb-4 rounded-xl border border-state-error-border bg-state-error-bg px-4 py-3 text-sm text-state-error-fg">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <TextField
            id="sign-in-code"
            label={t("auth.verifyCodeLabel", locale)}
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            inputClassName="min-h-[56px] text-center text-lg font-semibold tracking-[0.28em]"
          />
          <Button type="submit" size="lg" fullWidth disabled={!isLoaded} loading={isSubmitting}>
            {t("actions.verify", locale)}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button type="button" variant="ghost" onClick={handleResendCode} disabled={!canResend}>
            {resendCooldown > 0
              ? tf("auth.resendCodeWait", locale, { seconds: resendCooldown })
              : t("auth.resendCode", locale)}
          </Button>
          {resendNote ? (
            <p aria-live="polite" className="mt-2 text-xs text-[var(--color-text-muted)]">{resendNote}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => {
            setIsVerifying(false);
            setCode("");
            setError(null);
            setEmailAddressId(null);
            setResendCooldown(0);
            setResendNote(null);
          }}
          className="mt-2 text-[var(--color-text-muted)]"
        >
          {t("auth.backToSignIn", locale)}
        </Button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell panelContext="signin">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.17em] text-[var(--color-accent-self-deep)]">
        {t("auth.accountEyebrow", locale)}
      </p>
      <h1 className="mb-3 max-w-md font-fraunces text-4xl leading-[1.02] tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-[44px]">
        {t("auth.signInTitle", locale)}
      </h1>
      <p className="mb-7 text-base leading-relaxed text-[var(--color-text-muted)]">
        {t("auth.signInSubtitle", locale)}
      </p>

      {observeToken ? (
        <div className="mb-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-toast)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {t("auth.observeTokenHint", locale)}
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-state-error-border bg-state-error-bg px-4 py-3 text-sm text-state-error-fg">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleRequestCode} className="flex flex-col gap-3">
        <TextField
          id="sign-in-email"
          type="email"
          label={t("auth.emailLabel", locale)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={t("auth.emailPlaceholder", locale)}
          inputClassName="min-h-[56px] px-4 text-base"
        />
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!isLoaded}
          loading={isSubmitting}
          style={{ backgroundColor: "var(--color-bronze-dark)", color: "var(--color-text-on-accent-deep)" }}
          className="min-h-[56px] justify-between rounded-[16px] pl-5 pr-2 shadow-[0_10px_24px_rgba(139,82,48,0.18)] hover:brightness-[1.06]"
          iconRight={<span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-white/15 text-xl">→</span>}
        >
          {t("auth.requestSignInCode", locale)}
        </Button>
      </form>
      <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
        {t("auth.codeNote", locale)}
      </p>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-[var(--color-border-default)]" />
        <span className="text-micro text-[var(--color-text-muted)]">{t("common.or", locale)}</span>
        <div className="h-px flex-1 bg-[var(--color-border-default)]" />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        disabled={!isLoaded}
        loading={isGoogleLoading}
        onClick={handleGoogleSignIn}
        iconLeft={<GoogleIcon />}
      >
        {t("auth.googleContinue", locale)}
      </Button>

      <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
        {t("auth.noAccount", locale)}{" "}
        <Link
          href={
            observeToken
              ? `/sign-up?observeToken=${observeToken}`
              : safeRedirectUrl
                ? buildSignUpPath(safeRedirectUrl)
                : "/sign-up"
          }
          className="rounded-sm font-semibold text-[var(--color-action-primary-bg)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)]"
        >
          {t("actions.signUpCta", locale)}
        </Link>
      </p>
      <div id="clerk-captcha" />
    </AuthPageShell>
  );
}

export default function SignInPage() {
  return (
    <SignInErrorBoundary>
      <Suspense fallback={<div className="min-h-dvh bg-cream" />}>
        <SignInContent />
      </Suspense>
    </SignInErrorBoundary>
  );
}
