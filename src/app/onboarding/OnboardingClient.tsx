"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { t } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { TritaLogo } from "@/components/TritaLogo";
import { GENDER_OPTIONS } from "@/lib/onboarding-options";
import { toggleBtn, inputBase } from "@/lib/onboarding-styles";

// ── Main component ───────────────────────────────────────────────────────────

export function OnboardingClient() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
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

  const canStep1 = usernameValid && birthYearValid && gender !== "" && country !== "";

  // ── Flash + focus logic ──────────────────────────────────────────────────

  const flashField = (
    field: "username" | "birthYear" | "gender" | "country",
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
      countryFieldRef.current;

    target?.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderFirstButtonRef.current?.focus();
      if (field === "country") countryFieldRef.current?.querySelector("button")?.focus();
    }, 180);
  };

  const focusFirstInvalid = () => {
    if (!usernameValid) { flashField("username"); return; }
    if (!birthYearValid) { flashField("birthYear"); return; }
    if (gender === "") { flashField("gender"); return; }
    if (country === "") { flashField("country"); }
  };

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleStep1Next = () => {
    setUsernameTouched(true);
    setBirthYearTouched(true);
    if (!canStep1) {
      focusFirstInvalid();
      return;
    }
    setStep(2);
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmitting || !consent) return;

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

  // ── Step indicator ───────────────────────────────────────────────────────

  const stepLabels = [
    t("onboarding.step1Label", locale),
    t("onboarding.step2Label", locale),
  ];
  const progress = ((step - 1) / 1) * 100;

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
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    i + 1 < step
                      ? "bg-[#c8410a] text-white"
                      : i + 1 === step
                      ? "bg-[#1a1814] text-white"
                      : "bg-[#e8e4dc] text-[#a09a90]"
                  }`}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    i + 1 === step ? "text-[#1a1814]" : "text-[#a09a90]"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#e8e4dc]">
            <div
              className="h-full rounded-full bg-[#c8410a] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 shadow-sm">

          {/* ── Step 1: Alapadatok ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
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

              <button
                type="button"
                onClick={handleStep1Next}
                disabled={isSubmitting}
                className="mt-2 min-h-[48px] w-full rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:opacity-50"
              >
                {t("actions.next", locale)}
              </button>
            </div>
          )}

          {/* ── Step 2: Hozzájárulás ────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="font-mono text-xs text-[#c8410a] tracking-widest uppercase mb-1">// 02</p>
                <p className="font-playfair text-xl text-[#1a1814]">
                  {t("onboarding.step2Title", locale)}
                </p>
              </div>

              <label
                ref={consentFieldRef}
                className="flex cursor-pointer items-start gap-3 rounded-lg p-2"
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] rounded-lg border border-[#e8e4dc] px-5 text-sm font-medium text-[#3d3a35] transition-colors hover:border-[#c8410a]/40"
                >
                  ← {t("actions.back", locale)}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !consent}
                  className="min-h-[48px] flex-1 rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:opacity-50"
                >
                  {isSubmitting
                    ? t("onboarding.saving", locale)
                    : t("onboarding.submit", locale)}
                </button>
              </div>
            </div>
          )}

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
