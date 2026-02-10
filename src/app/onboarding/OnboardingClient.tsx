"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { t } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { TritaLogo } from "@/components/TritaLogo";

const GENDER_OPTIONS = [
  { value: "male", labelKey: "onboarding.genderMale" },
  { value: "female", labelKey: "onboarding.genderFemale" },
  { value: "other", labelKey: "onboarding.genderOther" },
  { value: "prefer_not_to_say", labelKey: "onboarding.genderPreferNot" },
] as const;

const EDUCATION_OPTIONS = [
  { value: "primary", labelKey: "onboarding.educationPrimary" },
  { value: "secondary", labelKey: "onboarding.educationSecondary" },
  { value: "bachelor", labelKey: "onboarding.educationBachelor" },
  { value: "master", labelKey: "onboarding.educationMaster" },
  { value: "doctorate", labelKey: "onboarding.educationDoctorate" },
  { value: "other", labelKey: "onboarding.educationOther" },
] as const;

function buildYearOptions() {
  const options: { value: string; label: string }[] = [];
  for (let y = 2010; y >= 1940; y--) {
    options.push({ value: String(y), label: String(y) });
  }
  return options;
}

export function OnboardingClient() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const yearOptions = useMemo(() => buildYearOptions(), []);
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);

  const countryLabel = useMemo(
    () => countryOptions.find((c) => c.value === country)?.label,
    [country, countryOptions],
  );

  const canSubmit =
    birthYear !== "" &&
    gender !== "" &&
    education !== "" &&
    occupation.trim() !== "" &&
    country !== "";

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: Number(birthYear),
          gender,
          education,
          occupation: occupation.trim(),
          country,
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
          <TritaLogo size={48} />
          <h1 className="text-2xl font-bold text-gray-900">
            {t("onboarding.title", locale)}
          </h1>
          <p className="max-w-sm text-center text-sm text-gray-600">
            {t("onboarding.subtitle", locale)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5">
            {/* Birth year — picker */}
            <PickerTrigger
              label={t("onboarding.birthYearLabel", locale)}
              value={birthYear}
              placeholder={t("onboarding.birthYearPlaceholder", locale)}
              onClick={() => setYearPickerOpen(true)}
            />

            {/* Gender — toggle buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {t("onboarding.genderLabel", locale)}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={toggleClass(gender === opt.value)}
                  >
                    {t(opt.labelKey, locale)}
                  </button>
                ))}
              </div>
            </div>

            {/* Education — toggle buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {t("onboarding.educationLabel", locale)}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {EDUCATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEducation(opt.value)}
                    className={toggleClass(education === opt.value)}
                  >
                    {t(opt.labelKey, locale)}
                  </button>
                ))}
              </div>
            </div>

            {/* Occupation — text input */}
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              {t("onboarding.occupationLabel", locale)}
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder={t("onboarding.occupationPlaceholder", locale)}
                maxLength={200}
                className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
              />
            </label>

            {/* Country — searchable picker */}
            <PickerTrigger
              label={t("onboarding.countryLabel", locale)}
              value={countryLabel}
              placeholder={t("onboarding.countryPlaceholder", locale)}
              onClick={() => setCountryPickerOpen(true)}
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
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

      {/* Year picker */}
      <Picker
        isOpen={yearPickerOpen}
        onClose={() => setYearPickerOpen(false)}
        onSelect={setBirthYear}
        options={yearOptions}
        selectedValue={birthYear}
        title={t("onboarding.birthYearLabel", locale)}
      />

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
