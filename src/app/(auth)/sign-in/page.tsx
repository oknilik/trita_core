"use client";

import { Suspense, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import Link from "next/link";
import { TritaLogo } from "@/components/TritaLogo";

function SignInContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const observeToken = searchParams.get("observeToken");
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isLoaded) return null;

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
        setIsVerifying(true);
      } else {
        setError(t("auth.errorSignInGeneric", locale));
      }
    } catch (err: unknown) {
      console.error("[SignIn] Error:", err);
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
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

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
        router.push("/dashboard");
      } else {
        setError(t("auth.errorVerificationIncomplete", locale));
      }
    } catch (err: unknown) {
      console.error("[SignIn] Verify error:", err);
      const clerkError = err as { errors?: { longMessage?: string; message?: string }[] };
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message;
      setError(message || t("auth.errorVerificationInvalid", locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: observeToken ? `/observe/${observeToken}` : "/dashboard",
      });
    } catch {
      setError(t("auth.errorGoogleSignIn", locale));
    }
  };

  if (isVerifying) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/4 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <TritaLogo size={72} showText={false} />
            <h1 className="text-2xl font-bold text-gray-900">
              {t("auth.verifyTitle", locale)}
            </h1>
            <p className="text-sm text-gray-600">
              {tf("auth.verifySent", locale, { email })}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
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
                  className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-center text-lg font-semibold tracking-[0.3em] text-gray-900 focus:border-indigo-300 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 min-h-[48px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200 disabled:hover:scale-100"
              >
                {isSubmitting ? t("actions.verifying", locale) : t("actions.verify", locale)}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsVerifying(false);
                setCode("");
                setError(null);
              }}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              {t("auth.backToSignIn", locale)}
            </button>
          </div>

          <div id="clerk-captcha" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/4 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <TritaLogo size={72} showText={false} />
          <h1 className="text-2xl font-bold text-gray-900">
            {t("auth.signInTitle", locale)}
          </h1>
          <p className="text-sm text-gray-600">
            {t("auth.signInSubtitle", locale)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              {t("auth.emailLabel", locale)}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="email@example.com"
                className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 min-h-[48px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200 disabled:hover:scale-100"
            >
              {isSubmitting ? t("auth.submitSendCodeLoading", locale) : t("auth.submitSendCode", locale)}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">{t("common.or", locale)}</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-lg border border-gray-100 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t("auth.googleContinue", locale)}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("auth.noAccount", locale)}{" "}
          <Link
            href={observeToken ? `/sign-up?observeToken=${observeToken}` : "/sign-up"}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {t("actions.signUpCta", locale)}
          </Link>
        </p>

        <div id="clerk-captcha" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />}>
      <SignInContent />
    </Suspense>
  );
}
