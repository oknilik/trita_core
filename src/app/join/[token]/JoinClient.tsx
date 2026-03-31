"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { toggleBtn, inputBase } from "@/lib/onboarding-styles";
import {
  getBirthYearBounds,
  getMembershipGenderOptions,
  getMembershipSubmitErrorMessage,
  submitMembershipJoin,
  submitMembershipProfile,
  validateMembershipProfileForm,
} from "@/lib/membership-onboarding/client";

// ── Constants ─────────────────────────────────────────────────────────────────

type Step = 1 | 2;

// ── Props ──────────────────────────────────────────────────────────────────────

interface JoinClientProps {
  inviteState:
    | "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
    | "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
    | "INVITED_READY_TO_JOIN";
  inviteId: string;
  teamName: string;
  orgName: string;
  alreadyInTargetOrg: boolean;
  existingProfile: { username: string | null } | null;
  existingOrg: { orgId: string; orgName: string } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JoinClient({
  inviteState,
  inviteId,
  teamName,
  orgName,
  alreadyInTargetOrg,
  existingProfile,
  existingOrg,
}: JoinClientProps) {
  const router = useRouter();
  const { locale: rawLocale } = useLocale();
  const locale = rawLocale as Locale;
  const currentYear = new Date().getFullYear();
  const { minBirthYear, maxBirthYear } = getBirthYearBounds(currentYear);
  const STEP_LABELS = [t("join.stepProfile", locale), t("join.stepDone", locale)];
  const genderOptions = getMembershipGenderOptions(locale);
  const copy = {
    inviteEyebrow: t("join.inviteEyebrow", locale),
    title: t("join.teamTitle", locale),
    switchEyebrow: t("join.switchEyebrow", locale),
    switchTitle: t("join.switchTitle", locale),
    switchDescription: tf("join.switchDescription", locale, {
      existingOrg: existingOrg?.orgName ?? "",
      orgName,
    }),
    switchPrimaryLoading: t("join.switchPrimaryLoading", locale),
    switchPrimary: tf("join.switchPrimary", locale, { orgName }),
    switchSecondary: t("join.switchSecondary", locale),
    joinEyebrow: t("join.joinEyebrow", locale),
    welcomePrefix: t("join.welcomePrefix", locale),
    readySameOrg: tf("join.readySameOrg", locale, { teamName }),
    readyNewOrg: tf("join.readyNewOrg", locale, { orgName, teamName }),
    joinLoading: t("join.joinLoading", locale),
    joinCta: t("join.joinCta", locale),
    step1Eyebrow: t("join.step1Eyebrow", locale),
    step1Title: t("join.step1Title", locale),
    step1Sub: t("join.step1Sub", locale),
    usernameLabel: t("join.usernameLabel", locale),
    usernamePlaceholder: t("join.usernamePlaceholder", locale),
    birthYearLabel: t("join.birthYearLabel", locale),
    genderLabel: t("join.genderLabel", locale),
    birthYearPlaceholder: tf("join.birthYearPlaceholder", locale, { example: currentYear - 30 }),
    birthYearHint: tf("join.birthYearHint", locale, { min: minBirthYear, max: maxBirthYear }),
    continueCta: t("join.continueCta", locale),
    step2Eyebrow: t("join.step2Eyebrow", locale),
    step2Title: t("join.step2Title", locale),
    consentText: t("join.consentText", locale),
    privacyLabel: t("join.privacyLabel", locale),
    consentSuffix: t("join.consentSuffix", locale),
    backCta: t("join.backCta", locale),
    joinAndStartLoading: t("join.submitting", locale),
    joinAndStart: t("join.submitNew", locale),
    profileHint: t("join.profileHint", locale),
    submitErrorGeneric: t("join.submitErrorGeneric", locale),
  };

  const isNewUser = inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE";
  const isOrgSwitch = inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED";
  const isExistingReady = inviteState === "INVITED_READY_TO_JOIN";
  const isAlreadyInTargetOrg = isExistingReady && alreadyInTargetOrg;

  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = ((step - 1) / 1) * 100;

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const stepErrors = validateMembershipProfileForm({
      username,
      gender,
      birthYear,
      consent,
    }, { locale });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleJoinNew = async () => {
    if (isSubmitting || !consent) return;
    setIsSubmitting(true);
    try {
      const profileResult = await submitMembershipProfile({
        username: username.trim(),
        gender,
        birthYear: Number(birthYear),
        consentedAt: new Date().toISOString(),
      });
      if (!profileResult.ok) {
        throw new Error(profileResult.error);
      }

      const joinResult = await submitMembershipJoin("/api/team/join", inviteId);
      if (!joinResult.ok) {
        throw new Error(joinResult.error);
      }

      router.push(joinResult.nextPath);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : undefined;
      setErrors((prev) => ({
        ...prev,
        submit: getMembershipSubmitErrorMessage(errorCode, locale),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinExisting = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const joinResult = await submitMembershipJoin("/api/team/join", inviteId);
      if (!joinResult.ok) {
        throw new Error(joinResult.error);
      }
      router.push(joinResult.nextPath);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : undefined;
      setErrors((prev) => ({
        ...prev,
        submit: getMembershipSubmitErrorMessage(errorCode, locale),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchOrg = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const switchRes = await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!switchRes.ok) throw new Error("switch_failed");
      router.push("/dashboard");
    } catch {
      setErrors((prev) => ({ ...prev, submit: copy.submitErrorGeneric }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + context */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              {copy.inviteEyebrow}
            </p>
            <h1 className="font-fraunces text-3xl text-ink">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm text-ink-body/70">
              <span className="font-semibold text-ink">{orgName}</span>
              {orgName && " · "}
              <span>{teamName}</span>
            </p>
          </div>
        </div>

        {/* Step indicator — only for new users */}
        {isNewUser && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      i + 1 < step
                        ? "bg-sage text-white"
                        : i + 1 === step
                        ? "bg-ink text-white"
                        : "bg-sand text-muted"
                    }`}
                  >
                    {i + 1 < step ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      i + 1 === step ? "text-ink" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-sage transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">

          {/* ── Org switch ─────────────────────────────────────────────────── */}
          {isOrgSwitch && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {copy.switchEyebrow}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {copy.switchTitle}
                </h2>
                <p className="mt-2 text-sm text-ink-body">
                  {copy.switchDescription}
                </p>
              </div>

              {errors.submit && (
                <p className="text-sm text-bronze">{errors.submit}</p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSwitchOrg}
                  disabled={isSubmitting}
                  className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting ? copy.switchPrimaryLoading : copy.switchPrimary}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="min-h-[44px] w-full rounded-lg border border-sand text-sm font-medium text-ink-body hover:bg-cream"
                >
                  {copy.switchSecondary}
                </button>
              </div>
            </div>
          )}

          {/* ── Existing free user ─────────────────────────────────────────── */}
          {isExistingReady && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {copy.joinEyebrow}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {copy.welcomePrefix}
                  {existingProfile?.username ? `, ${existingProfile.username}` : ""}!
                </h2>
                {isAlreadyInTargetOrg ? (
                  <p className="mt-2 text-sm text-ink-body">
                    {copy.readySameOrg}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-ink-body">
                    {copy.readyNewOrg}
                  </p>
                )}
              </div>

              {errors.submit && (
                <p className="text-sm text-bronze">{errors.submit}</p>
              )}

              <button
                type="button"
                onClick={handleJoinExisting}
                disabled={isSubmitting}
                className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {isSubmitting ? copy.joinLoading : copy.joinCta}
              </button>
            </div>
          )}

          {/* ── New user: Step 1 — Személyes adatok ───────────────────────── */}
          {isNewUser && step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {copy.step1Eyebrow}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">{copy.step1Title}</h2>
                <p className="mt-1 text-sm text-ink-body/70">
                  {copy.step1Sub}
                </p>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {copy.usernameLabel}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((p) => ({ ...p, username: "" }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
                  placeholder={copy.usernamePlaceholder}
                  maxLength={20}
                  className={inputBase(!!errors.username)}
                  autoFocus
                />
                {errors.username && (
                  <span className="pl-1 text-xs text-bronze">{errors.username}</span>
                )}
              </div>

              {/* Birth year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {copy.birthYearLabel}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => {
                    if (e.target.value.length <= 4) {
                      setBirthYear(e.target.value);
                      setErrors((p) => ({ ...p, birthYear: "" }));
                    }
                  }}
                  placeholder={copy.birthYearPlaceholder}
                  className={`${inputBase(!!errors.birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <span className={`pl-1 text-xs ${errors.birthYear ? "text-bronze" : "text-muted"}`}>
                  {errors.birthYear || copy.birthYearHint}
                </span>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink">{copy.genderLabel}</span>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setGender(opt.value);
                        setErrors((p) => ({ ...p, gender: "" }));
                      }}
                      className={toggleBtn(gender === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <span className="pl-1 text-xs text-bronze">{errors.gender}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="mt-2 min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {copy.continueCta}
              </button>
            </div>
          )}

          {/* ── New user: Step 2 — Kész ────────────────────────────────────── */}
          {isNewUser && step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {copy.step2Eyebrow}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">{copy.step2Title}</h2>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setErrors((p) => ({ ...p, consent: "" }));
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-sand accent-sage focus:ring-sage/30"
                />
                <span className="text-sm text-ink-body">
                  {copy.consentText}{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-bronze underline hover:text-bronze-dark"
                  >
                    {copy.privacyLabel}
                  </a>{" "}
                  {copy.consentSuffix}
                </span>
              </label>

              {errors.consent && (
                <span className="text-sm text-bronze">{errors.consent}</span>
              )}

              {errors.submit && (
                <p className="text-center text-sm text-bronze">{errors.submit}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] rounded-lg border border-sand px-5 text-sm font-medium text-ink-body transition-colors hover:border-sage/40"
                >
                  {copy.backCta}
                </button>
                <button
                  type="button"
                  onClick={handleJoinNew}
                  disabled={isSubmitting || !consent}
                  className="min-h-[48px] flex-1 rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting ? copy.joinAndStartLoading : copy.joinAndStart}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {copy.profileHint}
        </p>

      </div>
    </div>
  );
}
