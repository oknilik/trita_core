"use client";

import { Component, Suspense, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import Link from "next/link";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import IntentSelector, { type AuthIntent } from "@/components/auth/IntentSelector";

class SignUpErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    try { window.sessionStorage.clear(); } catch { /* ignore */ }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
          <div className="w-full max-w-md rounded border border-sand bg-white p-8 text-center">
            <p className="text-sm text-ink-body">Valami hiba történt. Kérjük, frissítsd az oldalt.</p>
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

function SignUpContent() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const searchParams = useSearchParams();
  const observeToken = searchParams.get("observeToken");
  const redirectUrl = searchParams.get("redirect_url");
  const safeRedirectUrl = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : null;
  const { locale } = useLocale();
  const [intent, setIntent] = useState<AuthIntent>("explore");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState("");
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

  const canResend = resendCooldown <= 0 && !isSubmitting;

  const handleResendCode = async () => {
    if (!signUp || !canResend) return;
    setResendNote(null);
    setResendCooldown(30);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendNote(t("auth.resendCodeSent", locale));
    } catch {
      setResendNote(t("auth.errorSignUpGeneric", locale));
      setResendCooldown(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await signUp.create({
        emailAddress: email,
        unsafeMetadata: { locale, intent },
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setIsVerifying(true);
      setResendCooldown(30);
      setResendNote(null);
    } catch (err: unknown) {
      console.error("[SignUp] Error:", err);
      const clerkError = err as { errors?: { longMessage?: string; message?: string }[] };
      const message =
        clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message;
      if (message?.includes("already") || message?.includes("exists")) {
        setError(t("auth.errorEmailExists", locale));
      } else {
        setError(message || t("auth.errorSignUpGeneric", locale));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

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
        window.location.href = safeRedirectUrl ?? `/onboarding?intent=${intent}`;
      } else {
        setError(t("auth.errorVerificationIncomplete", locale));
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      const message = clerkError?.errors?.[0]?.message;
      setError(message || t("auth.errorVerificationInvalid", locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!signUp || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: observeToken
          ? `/observe/${observeToken}`
          : safeRedirectUrl ?? `/onboarding?intent=${intent}`,
      });
    } catch {
      setError(t("auth.errorGoogleSignUp", locale));
      setIsGoogleLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
        <div className="w-full max-w-[800px] overflow-hidden rounded-xl border border-sand bg-white shadow-sm flex">
          <AuthLeftPanel context="verify" />
          <div className="flex flex-1 flex-col justify-center px-8 py-10">
            <Link href="/" className="font-fraunces mb-6 inline-block text-2xl font-black tracking-[-0.03em] text-ink">
              {"trit"}<span className="text-bronze">a</span>
            </Link>
            <h1 className="mb-1 font-fraunces text-xl text-ink">
              {t("auth.verifyTitle", locale)}
            </h1>
            <p className="mb-6 text-sm text-ink-body">
              {tf("auth.verifySent", locale, { email })}
            </p>

            {error && (
              <div className="mb-4 rounded border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                {t("auth.verifyCodeLabel", locale)}
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="000000"
                  autoFocus
                  className="min-h-[44px] rounded border border-sand bg-cream px-3 text-center text-lg font-semibold tracking-[0.3em] text-ink focus:border-sage/50 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[48px] rounded bg-sage px-6 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted-warm disabled:hover:translate-y-0"
              >
                {isSubmitting ? t("actions.verifying", locale) : t("actions.verify", locale)}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className="text-sm font-medium text-bronze hover:text-bronze-dark disabled:cursor-not-allowed disabled:text-muted-warm"
              >
                {resendCooldown > 0
                  ? tf("auth.resendCodeWait", locale, { seconds: resendCooldown })
                  : t("auth.resendCode", locale)}
              </button>
              {resendNote ? (
                <p className="mt-2 text-xs text-ink-body">{resendNote}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsVerifying(false);
                setCode("");
                setError(null);
                setResendCooldown(0);
                setResendNote(null);
              }}
              className="mt-4 w-full text-center text-sm text-ink-body hover:text-ink"
            >
              {t("actions.backToSignUp", locale)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-[800px] overflow-hidden rounded-xl border border-sand bg-white shadow-sm flex">
        <AuthLeftPanel context={intent} />

        <div className="flex flex-1 flex-col justify-center px-8 py-10">
          <Link href="/" className="font-fraunces mb-6 inline-block text-2xl font-black tracking-[-0.03em] text-ink">
            {"trit"}<span className="text-bronze">a</span>
          </Link>

          <h1 className="mb-1 font-fraunces text-xl text-ink">
            {t("auth.signUpTitle", locale)}
          </h1>
          <p className="mb-5 text-sm text-ink-body">
            {t("auth.signUpSubtitle", locale)}
          </p>

          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[1px] text-[#8a8a9a]">
              {locale === "hu" ? "Mire használod a triát?" : "What will you use trita for?"}
            </p>
            <IntentSelector value={intent} onChange={setIntent} />
          </div>

          {observeToken && (
            <div className="mb-5 rounded border border-sand bg-[#fdf5f0] px-4 py-3 text-sm text-ink-body">
              {t("auth.observeTokenHint", locale)}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Google first */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="mb-4 flex min-h-[44px] w-full items-center justify-center gap-3 rounded border border-sand bg-white px-4 text-sm font-medium text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <svg className="h-4 w-4 animate-spin text-muted-warm" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            {t("auth.googleContinue", locale)}
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-sand" />
            <span className="font-dm-sans text-[11px] text-muted-warm">{t("common.or", locale)}</span>
            <div className="h-px flex-1 bg-sand" />
          </div>

          <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-ink">
              {t("auth.emailLabel", locale)}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="email@example.com"
                className="min-h-[44px] rounded border border-sand bg-cream px-3 text-sm text-ink focus:border-sage/50 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[48px] rounded bg-sage px-6 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted-warm disabled:hover:translate-y-0"
            >
              {isSubmitting ? t("auth.submitSendCodeLoading", locale) : t("auth.submitSendCode", locale)}
            </button>
          </form>

          <p className="text-center text-sm text-ink-body">
            {t("auth.hasAccount", locale)}{" "}
            <Link
              href={
                observeToken
                  ? `/sign-in?observeToken=${observeToken}`
                  : safeRedirectUrl
                  ? `/sign-in?redirect_url=${encodeURIComponent(safeRedirectUrl)}`
                  : "/sign-in"
              }
              className="font-medium text-bronze hover:text-bronze-dark"
            >
              {t("actions.signInCta", locale)}
            </Link>
          </p>

          <div id="clerk-captcha" />
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <SignUpErrorBoundary>
      <Suspense fallback={<div className="min-h-dvh bg-cream" />}>
        <SignUpContent />
      </Suspense>
    </SignUpErrorBoundary>
  );
}
