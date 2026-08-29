"use client";

import { isConsultingLed } from "@/lib/operating-mode";
import { Suspense, useEffect, useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import Link from "next/link";
import IntentSelector, { type AuthIntent } from "@/components/auth/IntentSelector";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { createClientLogger } from "@/lib/client-logger";
import { buildSignInPath, sanitizeInternalRedirect } from "@/lib/navigation/auth-redirects";
import { presentAuthError, type AuthErrorContext, type AuthErrorTarget } from "@/lib/auth-errors";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { createRegistrationLegalAcceptance } from "@/lib/legal/versions";

const log = createClientLogger("auth");

interface AuthUiError {
  target: AuthErrorTarget;
  translationKey: string;
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
  const safeRedirectUrl = sanitizeInternalRedirect(redirectUrl);
  const { locale } = useLocale();
  // Consulting-led módban nincs intent-választó: minden regisztráció a
  // személyes (explore) úton indul, csapat/org kizárólag meghívóval vagy
  // tanácsadói úton jön létre.
  const [intent, setIntent] = useState<AuthIntent | null>(
    isConsultingLed() ? "explore" : null,
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<AuthUiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);

  const showAuthError = (err: unknown, context: AuthErrorContext) => {
    setError(presentAuthError(err, context));
  };

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

  const canResend = resendCooldown <= 0 && !isSubmitting;

  const handleResendCode = async () => {
    if (!signUp || !canResend) return;
    setResendNote(null);
    setResendCooldown(30);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendNote(t("auth.resendCodeSent", locale));
    } catch (err: unknown) {
      log.warn({ event: "auth.sign_up_resend_failed", err }, "Sign-up resend error");
      showAuthError(err, "resend");
      setResendCooldown(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || isSubmitting || !hasAcceptedLegal) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await signUp.create({
        emailAddress: email,
        unsafeMetadata: {
          locale,
          intent,
          legalAcceptance: createRegistrationLegalAcceptance(),
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setIsVerifying(true);
      setResendCooldown(30);
      setResendNote(null);
    } catch (err: unknown) {
      log.warn({ event: "auth.sign_up_failed", err }, "Sign-up error");
      showAuthError(err, "sign-up");
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
        setError({
          target: "code",
          translationKey: "auth.errors.verificationGeneric",
        });
      }
    } catch (err: unknown) {
      log.warn({ event: "auth.sign_up_verify_failed", err }, "Sign-up verify error");
      showAuthError(err, "verify");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!signUp || isGoogleLoading || !hasAcceptedLegal) return;
    setIsGoogleLoading(true);
    try {
      await signUp.update({
        unsafeMetadata: {
          locale,
          intent,
          legalAcceptance: createRegistrationLegalAcceptance(),
        },
      });
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: observeToken
          ? `/observe/${observeToken}`
          : safeRedirectUrl ?? `/onboarding?intent=${intent}`,
      });
    } catch (err: unknown) {
      log.warn({ event: "auth.google_sign_up_failed", err }, "Google sign-up error");
      showAuthError(err, "google-sign-up");
      setIsGoogleLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthPageShell panelContext="verify">
            <SectionEyebrow tone="selfDeep" className="mb-3">{t("auth.accountEyebrow", locale)}</SectionEyebrow>
            <h1 className="mb-2 font-fraunces text-display tracking-tight text-[var(--color-text-primary)] sm:text-hero">
              {t("auth.verifyTitle", locale)}
            </h1>
            <p className="mb-7 text-base leading-relaxed text-[var(--color-text-muted)]">
              {tf("auth.verifySent", locale, { email })}
            </p>

            {error?.target === "global" ? (
              <AuthAlert message={t(error.translationKey, locale)} />
            ) : null}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <TextField
                id="sign-up-code"
                label={t("auth.verifyCodeLabel", locale)}
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error?.target === "code") setError(null);
                }}
                error={error?.target === "code" ? t(error.translationKey, locale) : undefined}
                required
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                inputClassName="min-h-[56px] text-center text-lg font-semibold tracking-[0.28em]"
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={!isLoaded}
                loading={isSubmitting}
              >
                {t("actions.verify", locale)}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                disabled={!canResend}
              >
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
                setResendCooldown(0);
                setResendNote(null);
              }}
              className="mt-2 text-[var(--color-text-muted)]"
            >
              {t("actions.backToSignUp", locale)}
            </Button>

            {/* A Clerk ide mountolja a Turnstile-t, ha újra kell a bot-check
                (pl. kód-újraküldés). Az oszlopON BELÜL kell lennie – flex-sor
                gyerekeként beékelődne a panel és az űrlap közé. */}
            <div id="clerk-captcha" className="mt-4" />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell panelContext={intent}>
          <SectionEyebrow tone="selfDeep" className="mb-3">{t("auth.accountEyebrow", locale)}</SectionEyebrow>
          <h1 className="mb-3 font-fraunces text-display tracking-tight text-[var(--color-text-primary)] sm:text-hero">
            {t("auth.signUpTitle", locale)}
          </h1>
          <p className="mb-7 text-base leading-relaxed text-[var(--color-text-muted)]">
            {t("auth.signUpSubtitle", locale)}
          </p>

          {/* Intent selector – self-serve módban él; consulting-led alatt rejtve */}
          {!isConsultingLed() && (
            <div className="mb-5">
              <p className="mb-2 text-label uppercase text-[var(--color-text-muted)]">
                {t("auth.intentQuestion", locale)}
              </p>
              <IntentSelector value={intent} onChange={setIntent} />
            </div>
          )}

          {observeToken && (
            <div className="mb-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-toast)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {t("auth.observeTokenHint", locale)}
            </div>
          )}

          {error?.target === "global" ? (
            <AuthAlert message={t(error.translationKey, locale)} />
          ) : null}

          {/* Form section – blurred until intent is chosen */}
          <div className={`transition-all duration-300 ${!intent ? "pointer-events-none select-none opacity-40 blur-[2px]" : ""}`}>
            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-4 py-3">
              <input
                type="checkbox"
                checked={hasAcceptedLegal}
                onChange={(event) => setHasAcceptedLegal(event.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-action-primary-bg)]"
              />
              <span className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                {t("auth.legalAcceptancePrefix", locale)}{" "}
                <Link
                  href="/legal/platform-terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--color-action-primary-bg)] underline underline-offset-2"
                >
                  {t("auth.platformTerms", locale)}
                </Link>{" "}
                {t("auth.legalAcceptanceAnd", locale)}{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--color-action-primary-bg)] underline underline-offset-2"
                >
                  {t("auth.privacyNotice", locale)}
                </Link>
                {t("auth.legalAcceptanceSuffix", locale)}
              </span>
            </label>

            {/* Google – primary action */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleGoogleSignUp}
              disabled={!intent || !isLoaded || !hasAcceptedLegal}
              loading={isGoogleLoading}
              className="mb-3"
              iconLeft={<GoogleIcon />}
            >
              {t("auth.googleContinue", locale)}
            </Button>

            {/* Divider – compact */}
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-border-default)]" />
              <span className="text-micro text-[var(--color-text-muted)]">{t("common.or", locale)}</span>
              <div className="h-px flex-1 bg-[var(--color-border-default)]" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-3">
              <TextField
                id="sign-up-email"
                type="email"
                label={t("auth.emailLabel", locale)}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error?.target === "email") setError(null);
                }}
                error={error?.target === "email" ? t(error.translationKey, locale) : undefined}
                required
                disabled={!intent}
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder", locale)}
                inputClassName="min-h-[56px] px-4 text-base"
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={!intent || !isLoaded || !hasAcceptedLegal}
                loading={isSubmitting}
                style={{ backgroundColor: "var(--color-bronze-dark)", color: "var(--color-text-on-accent-deep)" }}
                className="min-h-[56px] justify-center rounded-[16px] px-5 shadow-[0_10px_24px_rgba(139,82,48,0.18)] hover:brightness-[1.06]"
              >
                {t("auth.requestSignUpCode", locale)}
              </Button>
            </form>
            <p className="mb-5 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {t("auth.codeNote", locale)}
            </p>

            {/* Sign in link – close to CTA */}
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              {t("auth.hasAccount", locale)}{" "}
              <Link
                href={
                  observeToken
                    ? `/sign-in?observeToken=${observeToken}`
                    : safeRedirectUrl
                    ? buildSignInPath(safeRedirectUrl)
                    : "/sign-in"
                }
                className="rounded-sm font-semibold text-[var(--color-action-primary-bg)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)]"
              >
                {t("actions.signInCta", locale)}
              </Link>
            </p>
          </div>

          <div id="clerk-captcha" />
    </AuthPageShell>
  );
}

export default function SignUpPage() {
  return (
    <AuthErrorBoundary>
      <Suspense fallback={<div className="min-h-dvh bg-cream" />}>
        <SignUpContent />
      </Suspense>
    </AuthErrorBoundary>
  );
}
