"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { t } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { TritaLogo } from "@/components/TritaLogo";
import {
  COMPANY_SIZE_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  OCCUPATION_STATUS_OPTIONS,
  STUDY_LEVEL_OPTIONS,
  UNEMPLOYMENT_DURATION_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
  type OccupationStatus,
  requiresStudyLevel,
  requiresWorkFields,
} from "@/lib/onboarding-options";

export function OnboardingClient() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");
  const [occupationStatus, setOccupationStatus] = useState("");
  const [workSchedule, setWorkSchedule] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [unemploymentDuration, setUnemploymentDuration] = useState("");
  const [country, setCountry] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Touch state for blur validation
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [birthYearTouched, setBirthYearTouched] = useState(false);
  const [invalidFieldFlash, setInvalidFieldFlash] = useState<
    | "username"
    | "birthYear"
    | "gender"
    | "education"
    | "occupationStatus"
    | "workSchedule"
    | "companySize"
    | "studyLevel"
    | "country"
    | "consent"
  | null>(null);

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const invalidFlashTimerRef = useRef<number | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const usernameFieldRef = useRef<HTMLLabelElement>(null);
  const birthYearFieldRef = useRef<HTMLLabelElement>(null);
  const genderFieldRef = useRef<HTMLDivElement>(null);
  const educationFieldRef = useRef<HTMLDivElement>(null);
  const occupationStatusFieldRef = useRef<HTMLDivElement>(null);
  const workScheduleFieldRef = useRef<HTMLDivElement>(null);
  const companySizeFieldRef = useRef<HTMLDivElement>(null);
  const studyLevelFieldRef = useRef<HTMLDivElement>(null);
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);
  const educationFirstButtonRef = useRef<HTMLButtonElement>(null);
  const occupationStatusFirstButtonRef = useRef<HTMLButtonElement>(null);
  const workScheduleFirstButtonRef = useRef<HTMLButtonElement>(null);
  const companySizeFirstButtonRef = useRef<HTMLButtonElement>(null);
  const studyLevelFirstButtonRef = useRef<HTMLButtonElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);
  const consentFieldRef = useRef<HTMLLabelElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);

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

  // Dynamic validation based on current year
  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;

  const usernameValid =
    username.trim().length >= 2 && username.trim().length <= 12;

  const birthYearNum = Number(birthYear);
  const birthYearValid =
    birthYear !== "" &&
    birthYear.length === 4 &&
    Number.isInteger(birthYearNum) &&
    birthYearNum >= minBirthYear &&
    birthYearNum <= maxBirthYear;

  const needsWorkFields =
    occupationStatus !== "" && requiresWorkFields(occupationStatus as OccupationStatus);
  const needsStudyLevel =
    occupationStatus !== "" && requiresStudyLevel(occupationStatus as OccupationStatus);

  const occupationDetailsValid =
    occupationStatus !== "" &&
    (!needsWorkFields || (workSchedule !== "" && companySize !== "")) &&
    (!needsStudyLevel || studyLevel !== "");

  const canSubmit =
    usernameValid &&
    birthYearValid &&
    gender !== "" &&
    education !== "" &&
    occupationDetailsValid &&
    country !== "" &&
    consent;

  const handleOccupationStatusChange = (value: OccupationStatus) => {
    setOccupationStatus(value);
    if (!requiresWorkFields(value)) {
      setWorkSchedule("");
      setCompanySize("");
    }
    if (!requiresStudyLevel(value)) {
      setStudyLevel("");
    }
    if (value !== "unemployed") {
      setUnemploymentDuration("");
    }
  };

  const focusAndFlashInvalidField = (
    field:
      | "username"
      | "birthYear"
      | "gender"
      | "education"
      | "occupationStatus"
      | "workSchedule"
      | "companySize"
      | "studyLevel"
      | "country"
      | "consent",
  ) => {
    setInvalidFieldFlash(field);
    if (invalidFlashTimerRef.current !== null) {
      window.clearTimeout(invalidFlashTimerRef.current);
    }
    invalidFlashTimerRef.current = window.setTimeout(() => {
      setInvalidFieldFlash(null);
      invalidFlashTimerRef.current = null;
    }, 1000);

    const scrollTarget =
      field === "username"
        ? usernameFieldRef.current
        : field === "birthYear"
          ? birthYearFieldRef.current
          : field === "gender"
            ? genderFieldRef.current
            : field === "education"
              ? educationFieldRef.current
              : field === "occupationStatus"
                ? occupationStatusFieldRef.current
                : field === "workSchedule"
                  ? workScheduleFieldRef.current
                  : field === "companySize"
                    ? companySizeFieldRef.current
                    : field === "studyLevel"
                      ? studyLevelFieldRef.current
                      : field === "country"
                        ? countryFieldRef.current
                        : consentFieldRef.current;

    scrollTarget?.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderFirstButtonRef.current?.focus();
      if (field === "education") educationFirstButtonRef.current?.focus();
      if (field === "occupationStatus") occupationStatusFirstButtonRef.current?.focus();
      if (field === "workSchedule") workScheduleFirstButtonRef.current?.focus();
      if (field === "companySize") companySizeFirstButtonRef.current?.focus();
      if (field === "studyLevel") studyLevelFirstButtonRef.current?.focus();
      if (field === "country") countryFieldRef.current?.querySelector("button")?.focus();
      if (field === "consent") consentCheckboxRef.current?.focus();
    }, 180);
  };

  const focusFirstInvalidField = () => {
    if (!usernameValid) {
      focusAndFlashInvalidField("username");
      return;
    }
    if (!birthYearValid) {
      focusAndFlashInvalidField("birthYear");
      return;
    }
    if (gender === "") {
      focusAndFlashInvalidField("gender");
      return;
    }
    if (education === "") {
      focusAndFlashInvalidField("education");
      return;
    }
    if (occupationStatus === "") {
      focusAndFlashInvalidField("occupationStatus");
      return;
    }
    if (needsWorkFields && workSchedule === "") {
      focusAndFlashInvalidField("workSchedule");
      return;
    }
    if (needsWorkFields && companySize === "") {
      focusAndFlashInvalidField("companySize");
      return;
    }
    if (needsStudyLevel && studyLevel === "") {
      focusAndFlashInvalidField("studyLevel");
      return;
    }
    if (country === "") {
      focusAndFlashInvalidField("country");
      return;
    }
    if (!consent) {
      focusAndFlashInvalidField("consent");
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!canSubmit) {
      setUsernameTouched(true);
      setBirthYearTouched(true);
      focusFirstInvalidField();
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
          education,
          occupationStatus,
          workSchedule: workSchedule || undefined,
          companySize: companySize || undefined,
          studyLevel: studyLevel || undefined,
          unemploymentDuration: unemploymentDuration || undefined,
          country,
          consentedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      router.push("/assessment");
    } catch {
      showToast(t("onboarding.errorGeneric", locale), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClass = (isActive: boolean) =>
    `min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
      isActive
        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
    }`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <TritaLogo size={48} showText={false} />
          <h1 className="text-2xl font-bold text-gray-900">
            {t("onboarding.title", locale)}
          </h1>
          <p className="max-w-sm text-center text-sm text-gray-600">
            {t("onboarding.subtitle", locale)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="mb-4">
                <p className="text-base font-semibold text-gray-900">
                  👤 {t("onboarding.blockBasicsTitle", locale)}
                </p>
                <p className="text-xs text-gray-600">{t("onboarding.blockBasicsHint", locale)}</p>
              </div>
              <div className="flex flex-col gap-5">
                <label
                  ref={usernameFieldRef}
                  className="flex flex-col gap-2 text-sm font-semibold text-gray-700"
                >
                  {t("onboarding.usernameLabel", locale)}
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder={t("onboarding.usernamePlaceholder", locale)}
                    minLength={2}
                    maxLength={12}
                    className={`min-h-[44px] rounded-lg border-2 px-3 text-sm font-normal text-gray-900 focus:outline-none ${
                      usernameTouched && username.trim() !== "" && !usernameValid
                        ? "border-orange-400 bg-orange-100"
                        : "border-gray-200 bg-gray-50 focus:border-indigo-300"
                    } ${invalidFieldFlash === "username" ? "ring-2 ring-orange-300" : ""}`}
                  />
                  {usernameTouched && username.trim() !== "" && !usernameValid ? (
                    <span className="pl-1 text-xs italic text-orange-700">
                      {t("onboarding.usernameError", locale)}
                    </span>
                  ) : (
                    <span className="pl-1 text-xs italic text-gray-500">
                      {t("onboarding.usernameHint", locale)}
                    </span>
                  )}
                </label>

                <label
                  ref={birthYearFieldRef}
                  className="flex flex-col gap-2 text-sm font-semibold text-gray-700"
                >
                  {t("onboarding.birthYearLabel", locale)}
                  <input
                    ref={birthYearInputRef}
                    type="number"
                    inputMode="numeric"
                    value={birthYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 4) {
                        setBirthYear(value);
                      }
                    }}
                    onBlur={() => setBirthYearTouched(true)}
                    placeholder={t("onboarding.birthYearPlaceholder", locale)}
                    min={minBirthYear}
                    max={maxBirthYear}
                    maxLength={4}
                    className={`min-h-[44px] rounded-lg border-2 px-3 text-sm font-normal text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                      birthYearTouched && birthYear !== "" && !birthYearValid
                        ? "border-orange-400 bg-orange-100"
                        : "border-gray-200 bg-gray-50 focus:border-indigo-300"
                    } ${invalidFieldFlash === "birthYear" ? "ring-2 ring-orange-300" : ""}`}
                  />
                  {birthYearTouched && birthYear !== "" && !birthYearValid ? (
                    <span className="pl-1 text-xs italic text-orange-700">
                      {t("onboarding.validRangeLabel", locale)}: {minBirthYear} - {maxBirthYear}
                    </span>
                  ) : (
                    <span className="pl-1 text-xs italic text-gray-500">
                      {t("onboarding.validRangeLabel", locale)}: {minBirthYear} - {maxBirthYear}
                    </span>
                  )}
                </label>

                <div
                  ref={genderFieldRef}
                  className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "gender" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
                >
                  <span className="text-sm font-semibold text-gray-700">
                    {t("onboarding.genderLabel", locale)}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.value}
                        ref={idx === 0 ? genderFirstButtonRef : undefined}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={toggleClass(gender === opt.value)}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={countryFieldRef}
                  className={`rounded-lg transition ${invalidFieldFlash === "country" ? "ring-2 ring-orange-300 bg-orange-50/60 p-1" : ""}`}
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

            <section className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">
              <div className="mb-4">
                <p className="text-base font-semibold text-gray-900">
                  🎓 {t("onboarding.blockEducationTitle", locale)}
                </p>
                <p className="text-xs text-gray-600">{t("onboarding.blockEducationHint", locale)}</p>
              </div>
              <div
                ref={educationFieldRef}
                className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "education" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
              >
                <span className="text-sm font-semibold text-gray-700">
                  {t("onboarding.educationLabel", locale)}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {EDUCATION_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.value}
                      ref={idx === 0 ? educationFirstButtonRef : undefined}
                      type="button"
                      onClick={() => setEducation(opt.value)}
                      className={toggleClass(education === opt.value)}
                    >
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="mb-4">
                <p className="text-base font-semibold text-gray-900">
                  💼 {t("onboarding.blockStatusTitle", locale)}
                </p>
                <p className="text-xs text-gray-600">{t("onboarding.blockStatusHint", locale)}</p>
              </div>
              <div className="flex flex-col gap-5">
                <div
                  ref={occupationStatusFieldRef}
                  className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "occupationStatus" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
                >
                  <span className="text-sm font-semibold text-gray-700">
                    {t("onboarding.occupationStatusLabel", locale)}
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {OCCUPATION_STATUS_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.value}
                        ref={idx === 0 ? occupationStatusFirstButtonRef : undefined}
                        type="button"
                        onClick={() => handleOccupationStatusChange(opt.value)}
                        className={toggleClass(occupationStatus === opt.value)}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    ))}
                  </div>
                </div>

                {needsWorkFields && (
                  <>
                    <div
                      ref={workScheduleFieldRef}
                      className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "workSchedule" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
                    >
                      <span className="text-sm font-semibold text-gray-700">
                        {t("onboarding.workScheduleLabel", locale)}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {WORK_SCHEDULE_OPTIONS.map((opt, idx) => (
                          <button
                            key={opt.value}
                            ref={idx === 0 ? workScheduleFirstButtonRef : undefined}
                            type="button"
                            onClick={() => setWorkSchedule(opt.value)}
                            className={toggleClass(workSchedule === opt.value)}
                          >
                            {t(opt.labelKey, locale)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      ref={companySizeFieldRef}
                      className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "companySize" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
                    >
                      <span className="text-sm font-semibold text-gray-700">
                        {t("onboarding.companySizeLabel", locale)}
                      </span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {COMPANY_SIZE_OPTIONS.map((opt, idx) => (
                          <button
                            key={opt.value}
                            ref={idx === 0 ? companySizeFirstButtonRef : undefined}
                            type="button"
                            onClick={() => setCompanySize(opt.value)}
                            className={toggleClass(companySize === opt.value)}
                          >
                            {t(opt.labelKey, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {needsStudyLevel && (
                  <div
                    ref={studyLevelFieldRef}
                    className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "studyLevel" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
                  >
                    <span className="text-sm font-semibold text-gray-700">
                      {t("onboarding.studyLevelLabel", locale)}
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {STUDY_LEVEL_OPTIONS.map((opt, idx) => (
                        <button
                          key={opt.value}
                          ref={idx === 0 ? studyLevelFirstButtonRef : undefined}
                          type="button"
                          onClick={() => setStudyLevel(opt.value)}
                          className={toggleClass(studyLevel === opt.value)}
                        >
                          {t(opt.labelKey, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {occupationStatus === "unemployed" && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {t("onboarding.unemploymentDurationLabel", locale)}
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {UNEMPLOYMENT_DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setUnemploymentDuration(opt.value)}
                          className={toggleClass(unemploymentDuration === opt.value)}
                        >
                          {t(opt.labelKey, locale)}
                        </button>
                      ))}
                    </div>
                    <span className="pl-1 text-xs italic text-gray-500">
                      {t("onboarding.unemploymentDurationOptionalHint", locale)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Consent */}
          <label
            ref={consentFieldRef}
            className={`mt-4 flex cursor-pointer items-start gap-3 rounded-lg p-1 transition ${invalidFieldFlash === "consent" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}
          >
            <input
              ref={consentCheckboxRef}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
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
                        className="font-medium text-indigo-600 underline hover:text-indigo-700"
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

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`mt-8 min-h-[48px] w-full rounded-lg px-6 text-sm font-semibold transition ${
              canSubmit && !isSubmitting
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {isSubmitting
              ? t("onboarding.saving", locale)
              : t("onboarding.submit", locale)}
          </button>
        </div>

        {/* Decorative doodle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/doodles/sleek.svg"
          alt=""
          className="mx-auto mt-8 h-24 w-32 object-contain opacity-50"
          loading="lazy"
        />
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
