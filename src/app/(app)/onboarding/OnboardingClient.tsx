"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TextField } from "@/components/ui/primitives/TextField";
import { t } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { INDUSTRIES } from "@/lib/industry-fit";
import { TritaLogo } from "@/components/TritaLogo";
import { GENDER_OPTIONS } from "@/lib/onboarding-options";
import { toggleBtn } from "@/lib/onboarding-styles";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";




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
  // Karrier-háttér (opcionális) — a Karrier-iránytű előtöltéséhez
  const [eduLevel, setEduLevel] = useState("");
  const [eduField, setEduField] = useState("");
  const [currentIndustry, setCurrentIndustry] = useState("");
  const [eduPickerOpen, setEduPickerOpen] = useState(false);
  const [eduFieldPickerOpen, setEduFieldPickerOpen] = useState(false);
  const [industryPickerOpen, setIndustryPickerOpen] = useState(false);
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

  const eduOptions = useMemo(() => ([
    { value: "primary", label: t("results.ccEduPrimary", locale) },
    { value: "secondary", label: t("results.ccEduSecondary", locale) },
    { value: "vocational", label: t("results.ccEduVocational", locale) },
    { value: "higher", label: t("results.ccEduHigher", locale) },
  ]), [locale]);
  const eduFieldOptions = useMemo(() => ([
    { value: "tech_engineering", label: t("results.ccFieldTech", locale) },
    { value: "economics", label: t("results.ccFieldEconomics", locale) },
    { value: "health", label: t("results.ccFieldHealth", locale) },
    { value: "humanities", label: t("results.ccFieldHumanities", locale) },
    { value: "natural_science", label: t("results.ccFieldScience", locale) },
    { value: "legal", label: t("results.ccFieldLegal", locale) },
    { value: "arts", label: t("results.ccFieldArts", locale) },
    { value: "pedagogy", label: t("results.ccFieldPedagogy", locale) },
    { value: "trade", label: t("results.ccFieldTrade", locale) },
    { value: "none", label: t("results.ccFieldNone", locale) },
  ]), [locale]);
  const industryOptions = useMemo(() => ([
    ...INDUSTRIES.map((i) => ({ value: i.key, label: locale === "hu" ? i.hu : i.en })),
    { value: "", label: t("results.ccCurrentNone", locale) },
  ]), [locale]);
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
          ...(eduLevel && { eduLevel }),
          ...(eduLevel && eduLevel !== "primary" && eduField && { eduField }),
          ...(currentIndustry && { currentIndustry }),
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      window.dispatchEvent(new CustomEvent("profile-updated"));
      router.push(JOURNEY_HOME_HANDOFF_PATH);
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
  // UX-A16: a folyamatjelző ne mutasson 100%-ot a befejezetlen utolsó lépésen.
  const progress = (step / 2) * 100;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + title */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <h1 className="font-fraunces text-3xl text-ink">
              {t("onboarding.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-ink-body/70 max-w-sm">
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
                      ? "bg-sage text-white"
                      : i + 1 === step
                      ? "bg-ink text-white"
                      : "bg-sand text-muted"
                  }`}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
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

        {/* Card */}
        <div className="bg-white rounded-2xl border border-sand p-6 md:p-8 shadow-sm">

          {/* ── Step 1: Alapadatok ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <SectionEyebrow className="mb-1">{"// 01"}</SectionEyebrow>
                <p className="font-fraunces text-xl text-ink">
                  {t("onboarding.blockBasicsTitle", locale)}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {t("onboarding.blockBasicsHint", locale)}
                </p>
              </div>

              <div className="flex flex-col gap-5">

                {/* Username */}
                <div ref={usernameFieldRef}>
                  <TextField
                    ref={usernameInputRef}
                    label={t("onboarding.usernameLabel", locale)}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder={t("onboarding.usernamePlaceholder", locale)}
                    minLength={2}
                    maxLength={20}
                    error={
                      usernameTouched && username.trim() !== "" && !usernameValid
                        ? t("onboarding.usernameError", locale)
                        : undefined
                    }
                    helpText={
                      usernameTouched && username.trim() !== "" && !usernameValid
                        ? undefined
                        : t("onboarding.usernameHint", locale)
                    }
                    helpTextClassName="pl-1 italic text-xs text-muted"
                    errorClassName="pl-1 italic text-xs text-bronze"
                    inputClassName={invalidFieldFlash === "username" ? "ring-2 ring-sage/30" : undefined}
                  />
                </div>

                {/* Birth year */}
                <div ref={birthYearFieldRef}>
                  <TextField
                    ref={birthYearInputRef}
                    label={t("onboarding.birthYearLabel", locale)}
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
                    error={
                      birthYearTouched && birthYear !== "" && !birthYearValid
                        ? t("onboarding.birthYearError", locale)
                        : undefined
                    }
                    helpText={`${t("onboarding.validRangeLabel", locale)}: ${minBirthYear} – ${maxBirthYear}`}
                    helpTextClassName={`pl-1 italic text-xs ${
                      birthYearTouched && birthYear !== "" && !birthYearValid
                        ? "text-bronze"
                        : "text-muted"
                    }`}
                    inputClassName={`[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none${
                      invalidFieldFlash === "birthYear" ? " ring-2 ring-sage/30" : ""
                    }`}
                  />
                </div>

                {/* Gender */}
                <div
                  ref={genderFieldRef}
                  className={`flex flex-col gap-2 rounded-lg p-1 transition ${
                    invalidFieldFlash === "gender" ? "ring-2 ring-sage/30 bg-orange-50/40" : ""
                  }`}
                >
                  <span className="text-sm font-semibold text-ink">
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
                    invalidFieldFlash === "country" ? "ring-2 ring-sage/30 bg-orange-50/40 p-1" : ""
                  }`}
                >
                  <PickerTrigger
                    label={t("onboarding.countryLabel", locale)}
                    value={countryLabel}
                    placeholder={t("onboarding.countryPlaceholder", locale)}
                    onClick={() => setCountryPickerOpen(true)}
                  />
                </div>

                {/* Karrier-háttér (opcionális) — a Karrier-iránytű előtöltéséhez */}
                <div className="mt-2 border-t border-sand pt-4">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted">
                    {t("onboarding.careerSectionLabel", locale)}
                  </p>
                  <div className="flex flex-col gap-4">
                    <PickerTrigger
                      label={t("onboarding.eduLabel", locale)}
                      value={eduOptions.find((o) => o.value === eduLevel)?.label ?? ""}
                      placeholder={t("onboarding.optionalPlaceholder", locale)}
                      onClick={() => setEduPickerOpen(true)}
                    />
                    {eduLevel && eduLevel !== "primary" && (
                      <PickerTrigger
                        label={t("onboarding.eduFieldLabel", locale)}
                        value={eduFieldOptions.find((o) => o.value === eduField)?.label ?? ""}
                        placeholder={t("onboarding.optionalPlaceholder", locale)}
                        onClick={() => setEduFieldPickerOpen(true)}
                      />
                    )}
                    <PickerTrigger
                      label={t("onboarding.industryLabel", locale)}
                      value={industryOptions.find((o) => o.value === currentIndustry && o.value !== "")?.label ?? ""}
                      placeholder={t("onboarding.optionalPlaceholder", locale)}
                      onClick={() => setIndustryPickerOpen(true)}
                    />
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                disabled={isSubmitting}
                className="mt-2 min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {t("actions.next", locale)}
              </button>
            </div>
          )}

          {/* ── Step 2: Hozzájárulás ────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <SectionEyebrow className="mb-1">{"// 02"}</SectionEyebrow>
                <p className="font-fraunces text-xl text-ink">
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
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-sand accent-sage focus:ring-sage/30"
                />
                <span className="text-sm text-ink-body">
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
                            className="font-medium text-bronze underline hover:text-bronze-dark"
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
                {/* UX-A1: a "Vissza" tényleg az 1. lépésre vigyen (setStep(2)
                    a 2. lépésen holt gomb volt — elütést csak újratöltéssel
                    lehetett javítani). */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] rounded-lg border border-sand px-5 text-sm font-medium text-ink-body transition-colors hover:border-sage/40"
                >
                  ← {t("actions.back", locale)}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !consent}
                  className="min-h-[48px] flex-1 rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
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
        <p className="mt-6 text-center text-xs text-muted">
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
      <Picker
        isOpen={eduPickerOpen}
        onClose={() => setEduPickerOpen(false)}
        onSelect={setEduLevel}
        options={eduOptions}
        selectedValue={eduLevel}
        title={t("onboarding.eduLabel", locale)}
      />
      <Picker
        isOpen={eduFieldPickerOpen}
        onClose={() => setEduFieldPickerOpen(false)}
        onSelect={setEduField}
        options={eduFieldOptions}
        selectedValue={eduField}
        title={t("onboarding.eduFieldLabel", locale)}
      />
      <Picker
        isOpen={industryPickerOpen}
        onClose={() => setIndustryPickerOpen(false)}
        onSelect={setCurrentIndustry}
        options={industryOptions}
        selectedValue={currentIndustry}
        title={t("onboarding.industryLabel", locale)}
      />
    </div>
  );
}
