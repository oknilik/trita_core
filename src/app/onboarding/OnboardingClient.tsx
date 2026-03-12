"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { t, tf } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { TritaLogo } from "@/components/TritaLogo";
import {
  GENDER_OPTIONS,
} from "@/lib/onboarding-options";

// ── Helper styles ────────────────────────────────────────────────────────────

const toggleBtn = (isActive: boolean, flash?: boolean) =>
  `min-h-[44px] rounded-lg border px-4 text-sm font-medium transition-all cursor-pointer ${
    isActive
      ? "border-[#c8410a] bg-[#c8410a]/8 text-[#c8410a] font-semibold"
      : "border-[#e8e4dc] bg-white text-[#3d3a35] hover:border-[#c8410a]/40"
  } ${flash ? "ring-2 ring-[#c8410a]/40 bg-orange-50/60" : ""}`;

const inputBase = (error?: boolean, flash?: boolean) =>
  `min-h-[48px] w-full rounded-lg border-2 px-4 text-sm font-normal text-[#1a1814] focus:outline-none transition-colors ${
    error
      ? "border-orange-400 bg-orange-50"
      : "border-[#e8e4dc] bg-white focus:border-[#c8410a]"
  } ${flash ? "ring-2 ring-[#c8410a]/30" : ""}`;

// ── Main component ───────────────────────────────────────────────────────────

export function OnboardingClient() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usernameTouched, setUsernameTouched] = useState(false);
  const [birthYearTouched, setBirthYearTouched] = useState(false);
  const [invalidFieldFlash, setInvalidFieldFlash] = useState<
    | "username"
    | "birthYear"
    | "gender"
    | "country"
    | "consent"
    | null
  >(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const invalidFlashTimerRef = useRef<number | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const usernameFieldRef = useRef<HTMLDivElement>(null);
  const birthYearFieldRef = useRef<HTMLDivElement>(null);
  const genderFieldRef = useRef<HTMLDivElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);
  const consentFieldRef = useRef<HTMLLabelElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (invalidFlashTimerRef.current !== null) {
        window.clearTimeout(invalidFlashTimerRef.current);
      }
    };
  }, []);

  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const countryLabel = useMemo(
    () => countryOptions.find((c) => c.value === country)?.label,
    [country, countryOptions],
  );

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;

  const usernameValid = username.trim().length >= 2 && username.trim().length <= 20;
  const birthYearNum = Number(birthYear);
  const birthYearValid =
    birthYear !== "" &&
    birthYear.length === 4 &&
    Number.isInteger(birthYearNum) &&
    birthYearNum >= minBirthYear &&
    birthYearNum <= maxBirthYear;

  const canSubmit =
    usernameValid &&
    birthYearValid &&
    gender !== "" &&
    country !== "" &&
    consent;

  const progressTotals = useMemo(() => {
    const required: boolean[] = [
      usernameValid,
      birthYearValid,
      gender !== "",
      country !== "",
      consent,
    ];
    const total = required.length;
    const completed = required.filter(Boolean).length;
    return { total, completed, pct: Math.round((completed / Math.max(1, total)) * 100) };
  }, [usernameValid, birthYearValid, gender, country, consent]);

  // ── Flash + focus logic ──────────────────────────────────────────────────

  const flashField = (
    field:
      | "username"
      | "birthYear"
      | "gender"
      | "country"
      | "consent",
  ) => {
    setInvalidFieldFlash(field);
    if (invalidFlashTimerRef.current !== null) window.clearTimeout(invalidFlashTimerRef.current);
    invalidFlashTimerRef.current = window.setTimeout(() => {
      setInvalidFieldFlash(null);
      invalidFlashTimerRef.current = null;
    }, 1000);

    const target =
      field === "username" ? usernameFieldRef.current :
      field === "birthYear" ? birthYearFieldRef.current :
      field === "gender" ? genderFieldRef.current :
      field === "country" ? countryFieldRef.current :
      consentFieldRef.current;

    target?.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderFirstButtonRef.current?.focus();
      if (field === "country") countryFieldRef.current?.querySelector("button")?.focus();
      if (field === "consent") consentCheckboxRef.current?.focus();
    }, 180);
  };

  const focusFirstInvalid = () => {
    if (!usernameValid) { flashField("username"); return; }
    if (!birthYearValid) { flashField("birthYear"); return; }
    if (gender === "") { flashField("gender"); return; }
    if (country === "") { flashField("country"); return; }
    if (!consent) { flashField("consent"); }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!canSubmit) {
      setUsernameTouched(true);
      setBirthYearTouched(true);
      focusFirstInvalid();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          birthYear: birthYearNum,
          gender,
          country,
          consentedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      window.dispatchEvent(new CustomEvent("profile-updated"));
      router.push("/assessment");
    } catch {
      showToast(t("onboarding.errorGeneric", locale), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[#faf9f6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + title */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <h1 className="font-playfair text-3xl text-[#1a1814]">
              {t("onboarding.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-[#3d3a35]/70 max-w-sm">
              {t("onboarding.subtitle", locale)}
            </p>
          </div>

          {/* Progress */}
          <div className="w-full max-w-sm">
            <div className="h-1.5 w-full bg-[#e8e4dc] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c8410a] rounded-full transition-all duration-500"
                style={{ width: `${progressTotals.pct}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-[#a09a90] font-mono">
              {tf("onboarding.progress", locale, {
                completed: progressTotals.completed,
                total: progressTotals.total,
              })}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-8">

            {/* ── Block 1: Who are you? ─────────────────────────────────── */}
            <section>
              <div className="mb-5">
                <p className="font-mono text-xs text-[#c8410a] tracking-widest uppercase mb-1">// 01</p>
                <p className="font-playfair text-xl text-[#1a1814]">
                  {t("onboarding.blockBasicsTitle", locale)}
                </p>
                <p className="text-xs text-[#a09a90] mt-0.5">
                  {t("onboarding.blockBasicsHint", locale)}
                </p>
              </div>

              <div className="flex flex-col gap-5">

                {/* Username */}
                <div ref={usernameFieldRef} className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#1a1814]">
                    {t("onboarding.usernameLabel", locale)}
                  </label>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder={t("onboarding.usernamePlaceholder", locale)}
                    minLength={2}
                    maxLength={20}
                    className={inputBase(
                      usernameTouched && username.trim() !== "" && !usernameValid,
                      invalidFieldFlash === "username",
                    )}
                  />
                  {usernameTouched && username.trim() !== "" && !usernameValid ? (
                    <span className="text-xs text-[#c8410a] pl-1 italic">
                      {t("onboarding.usernameError", locale)}
                    </span>
                  ) : (
                    <span className="text-xs text-[#a09a90] pl-1 italic">
                      {t("onboarding.usernameHint", locale)}
                    </span>
                  )}
                </div>

                {/* Birth year */}
                <div ref={birthYearFieldRef} className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#1a1814]">
                    {t("onboarding.birthYearLabel", locale)}
                  </label>
                  <input
                    ref={birthYearInputRef}
                    type="number"
                    inputMode="numeric"
                    value={birthYear}
                    onChange={(e) => {
                      if (e.target.value.length <= 4) setBirthYear(e.target.value);
                    }}
                    onBlur={() => setBirthYearTouched(true)}
                    placeholder={t("onboarding.birthYearPlaceholder", locale)}
                    min={minBirthYear}
                    max={maxBirthYear}
                    className={`${inputBase(
                      birthYearTouched && birthYear !== "" && !birthYearValid,
                      invalidFieldFlash === "birthYear",
                    )} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  />
                  <span className={`text-xs pl-1 italic ${
                    birthYearTouched && birthYear !== "" && !birthYearValid
                      ? "text-[#c8410a]"
                      : "text-[#a09a90]"
                  }`}>
                    {t("onboarding.validRangeLabel", locale)}: {minBirthYear} – {maxBirthYear}
                  </span>
                </div>

                {/* Gender */}
                <div
                  ref={genderFieldRef}
                  className={`flex flex-col gap-2 rounded-lg p-1 transition ${
                    invalidFieldFlash === "gender" ? "ring-2 ring-[#c8410a]/30 bg-orange-50/40" : ""
                  }`}
                >
                  <span className="text-sm font-semibold text-[#1a1814]">
                    {t("onboarding.genderLabel", locale)}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.value}
                        ref={idx === 0 ? genderFirstButtonRef : undefined}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={toggleBtn(gender === opt.value)}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div
                  ref={countryFieldRef}
                  className={`rounded-lg transition ${
                    invalidFieldFlash === "country" ? "ring-2 ring-[#c8410a]/30 bg-orange-50/40 p-1" : ""
                  }`}
                >
                  <PickerTrigger
                    label={t("onboarding.countryLabel", locale)}
                    value={countryLabel}
                    placeholder={t("onboarding.countryPlaceholder", locale)}
                    onClick={() => setCountryPickerOpen(true)}
                  />
                </div>

              </div>
            </section>

          </div>

          {/* ── Consent ─────────────────────────────────────────────────── */}
          <label
            ref={consentFieldRef}
            className={`mt-6 flex cursor-pointer items-start gap-3 rounded-lg p-2 transition ${
              invalidFieldFlash === "consent" ? "ring-2 ring-[#c8410a]/30 bg-orange-50/40" : ""
            }`}
          >
            <input
              ref={consentCheckboxRef}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#e8e4dc] accent-[#c8410a] focus:ring-[#c8410a]/30"
            />
            <span className="text-sm text-[#3d3a35]">
              {t("onboarding.consentLabel", locale)
                .split("{link}")
                .map((part, i, arr) =>
                  i < arr.length - 1 ? (
                    <span key={i}>
                      {part}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#c8410a] underline hover:text-[#a8340a]"
                      >
                        {t("onboarding.consentLinkText", locale)}
                      </a>
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
            </span>
          </label>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`mt-6 min-h-[48px] w-full rounded-lg px-6 text-sm font-semibold transition-all ${
              canSubmit && !isSubmitting
                ? "bg-[#c8410a] text-white hover:bg-[#a8340a]"
                : "cursor-not-allowed bg-[#e8e4dc] text-[#a09a90]"
            }`}
          >
            {isSubmitting
              ? t("onboarding.saving", locale)
              : t("onboarding.submit", locale)}
          </button>

        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-xs text-[#a09a90]">
          {t("onboarding.footerHint", locale)}
        </p>

      </div>

      {/* Country picker */}
      <Picker
        isOpen={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={setCountry}
        options={countryOptions}
        selectedValue={country}
        title={t("onboarding.countryLabel", locale)}
        searchable
        searchPlaceholder={t("onboarding.countryPlaceholder", locale)}
      />
    </div>
  );
}
