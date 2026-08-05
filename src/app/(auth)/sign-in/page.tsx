"use client";

import { Component, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import Link from "next/link";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import { createClientLogger } from "@/lib/client-logger";

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
          <div className="w-full max-w-md rounded border border-sand bg-white p-8 text-center">
            <p className="text-sm text-ink-body">Hiba történt. Frissítsd az oldalt.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded bg-sage px-6 py-2.5 text-sm font-medium text-white hover:bg-sage-dark"
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
  const safeRedirectUrl = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : null;
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

  if (!isLoaded) return null;

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
      <div className="flex min-h-[80dvh] items-center justify-center bg-[var(--color-surface-canvas)] px-4 py-10">
        <div className="flex w-full max-w-[440px] lg:max-w-[800px] lg:overflow-hidden lg:rounded-xl lg:border lg:border-[var(--color-border-soft)] lg:bg-[var(--color-surface-canvas)] lg:shadow-sm">
          <AuthLeftPanel context="verify" />
          <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-10 lg:py-10">
            <h1 className="mb-1 font-fraunces text-2xl tracking-tight text-[var(--color-text-primary)]">
              {t("auth.verifyTitle", locale)}
            </h1>
            <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {tf("auth.verifySent", locale, { email })}
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                placeholder="000000"
                autoFocus
                className="min-h-[48px] rounded-lg border-[1.5px] border-[var(--color-border-default)] bg-white px-3 text-center text-lg font-semibold tracking-widest text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-action-primary-bg)] focus:shadow-[0_0_0_3px_rgba(61,107,94,0.08)]"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[48px] rounded-lg bg-[var(--color-action-primary-bg)] px-6 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {isSubmitting ? t("actions.verifying", locale) : t("actions.verify", locale)}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className="text-sm font-medium text-[var(--color-action-primary-bg)] hover:text-[var(--color-accent-self-deep)] disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]"
              >
                {resendCooldown > 0
                  ? tf("auth.resendCodeWait", locale, { seconds: resendCooldown })
                  : t("auth.resendCode", locale)}
              </button>
              {resendNote ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{resendNote}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsVerifying(false);
                setCode("");
                setError(null);
                setEmailAddressId(null);
                setResendCooldown(0);
                setResendNote(null);
              }}
              className="mt-4 w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              {t("auth.backToSignIn", locale)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80dvh] items-center justify-center bg-[var(--color-surface-canvas)] px-4 py-10">
      <div className="flex w-full max-w-[440px] lg:max-w-[800px] lg:overflow-hidden lg:rounded-xl lg:border lg:border-[var(--color-border-soft)] lg:bg-[var(--color-surface-canvas)] lg:shadow-sm">
        <AuthLeftPanel context="signin" />
        <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-10 lg:py-10">

          <h1 className="mb-1 font-fraunces text-2xl tracking-tight text-[var(--color-text-primary)]">
            {t("auth.signInTitle", locale)}
          </h1>
          <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t("auth.signInSubtitle", locale)}
          </p>

          {observeToken && (
            <div className="mb-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-toast)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {t("auth.observeTokenHint", locale)}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Google — primary */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="mb-3 flex min-h-[48px] w-full items-center justify-center gap-3 rounded-lg border-[1.5px] border-[var(--color-border-soft)] bg-white px-4 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition-all hover:border-[var(--color-text-muted)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <svg className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            {t("auth.googleContinue", locale)}
          </button>

          {/* Divider */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border-default)]" />
            <span className="text-micro text-[var(--color-text-muted)]">{t("common.or", locale)}</span>
            <div className="h-px flex-1 bg-[var(--color-border-default)]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleRequestCode} className="mb-4 flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t("auth.emailLabel", locale)}
              className="min-h-[48px] rounded-lg border-[1.5px] border-[var(--color-border-default)] bg-white px-3.5 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-action-primary-bg)] focus:shadow-[0_0_0_3px_rgba(61,107,94,0.08)]"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[48px] rounded-lg bg-[var(--color-action-primary-bg)] px-6 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {isSubmitting ? t("auth.submitSendCodeLoading", locale) : t("auth.submitSendCode", locale)}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            {t("auth.noAccount", locale)}{" "}
            <Link
              href={
                observeToken
                  ? `/sign-up?observeToken=${observeToken}`
                  : safeRedirectUrl
                  ? `/sign-up?redirect_url=${encodeURIComponent(safeRedirectUrl)}`
                  : "/sign-up"
              }
              className="font-medium text-[var(--color-action-primary-bg)] hover:text-[var(--color-accent-self-deep)]"
            >
              {t("actions.signUpCta", locale)}
            </Link>
          </p>

          <div id="clerk-captcha" />
        </div>
      </div>
    </div>
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
