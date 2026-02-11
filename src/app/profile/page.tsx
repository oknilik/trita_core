"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { FadeIn } from "@/components/landing/FadeIn";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";

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

export default function ProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { locale, setLocale } = useLocale();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Demographics
  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");
  const [country, setCountry] = useState("");
  const [isSavingDemo, setIsSavingDemo] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const countryLabel = useMemo(
    () => countryOptions.find((c) => c.value === country)?.label,
    [country, countryOptions],
  );

  // Load demographics
  const loadDemographics = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/onboarding");
      if (!res.ok) return;
      const data = await res.json();
      if (data.username) setUsername(data.username);
      if (data.birthYear) setBirthYear(String(data.birthYear));
      if (data.gender) setGender(data.gender);
      if (data.education) setEducation(data.education);
      if (data.country) setCountry(data.country);
    } catch {
      // silent — non-critical
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) loadDemographics();
  }, [isSignedIn, loadDemographics]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const initials =
    (username.trim() || user?.username || user?.primaryEmailAddress?.emailAddress || "?")
      .slice(0, 1)
      .toUpperCase();

  const handleSaveDemographics = async () => {
    if (isSavingDemo) return;
    setIsSavingDemo(true);
    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          birthYear: Number(birthYear),
          gender,
          education,
          country,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast(t("profile.demographicsSaveSuccess", locale), "success");
    } catch {
      showToast(t("profile.saveError", locale), "error");
    } finally {
      setIsSavingDemo(false);
    }
  };

  const birthYearNum = Number(birthYear);
  const birthYearValid =
    birthYear !== "" &&
    Number.isInteger(birthYearNum) &&
    birthYearNum >= 1940 &&
    birthYearNum <= 2010;

  const canSaveDemo =
    username.trim() !== "" &&
    birthYearValid &&
    gender !== "" &&
    education !== "" &&
    country !== "";

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      showToast(t("profile.deleteError", locale), "error");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleClass = (isActive: boolean) =>
    `min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
      isActive
        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
    }`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
      {/* ── Header ── */}
      <FadeIn>
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 pb-14 md:p-8 md:pb-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/doodles/chilling.svg"
            alt=""
            className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 object-contain opacity-10 brightness-0 invert md:h-48 md:w-48"
            loading="lazy"
          />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white backdrop-blur-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {t("profile.title", locale)}
              </h1>
              <p className="mt-1 text-sm text-indigo-100">
                {user?.primaryEmailAddress?.emailAddress ?? t("profile.missingEmail", locale)}
              </p>
            </div>
          </div>
          <svg className="absolute inset-x-0 bottom-0 h-8 w-full text-white md:h-10" viewBox="0 0 1200 60" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,28 C150,48 350,8 600,28 C850,48 1050,8 1200,28 L1200,60 L0,60 Z" />
          </svg>
        </header>
      </FadeIn>

      {/* ── Demographics ── */}
      <FadeIn delay={0.1}>
        <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/doodles/meditating.svg"
            alt=""
            className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 object-contain opacity-15 md:h-36 md:w-36"
            loading="lazy"
          />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("profile.demographicsTitle", locale)}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("profile.demographicsBody", locale)}
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {/* Preferred name */}
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              {t("onboarding.usernameLabel", locale)}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("onboarding.usernamePlaceholder", locale)}
                maxLength={80}
                className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
              />
            </label>

            {/* Birth year */}
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              {t("onboarding.birthYearLabel", locale)}
              <input
                type="number"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder={t("onboarding.birthYearPlaceholder", locale)}
                min={1940}
                max={2010}
                className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>

            {/* Gender */}
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

            {/* Education */}
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

            {/* Country */}
            <PickerTrigger
              label={t("onboarding.countryLabel", locale)}
              value={countryLabel}
              placeholder={t("onboarding.countryPlaceholder", locale)}
              onClick={() => setCountryPickerOpen(true)}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveDemographics}
              disabled={!canSaveDemo || isSavingDemo}
              className="min-h-[44px] rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSavingDemo ? t("actions.save", locale) : t("actions.saveShort", locale)}
            </button>
          </div>
        </section>
      </FadeIn>

      {/* ── Locale ── */}
      <FadeIn delay={0.2}>
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">{t("profile.localeTitle", locale)}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("profile.localeBody", locale)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocale(loc)}
                className={`min-h-[44px] rounded-lg border px-5 text-sm font-medium transition ${
                  locale === loc
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {t(`locale.${loc}` as const, loc)}
              </button>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── Delete zone ── */}
      <FadeIn delay={0.25}>
        <section className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <h2 className="text-lg font-semibold text-rose-900">
            {t("profile.deleteTitle", locale)}
          </h2>
          <p className="mt-2 text-sm text-rose-700">
            {t("profile.deleteBody", locale)}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="mt-4 min-h-[44px] rounded-lg border border-rose-200 bg-white px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-rose-100"
          >
            {isDeleting ? t("actions.deleting", locale) : t("actions.deleteProfile", locale)}
          </button>
        </section>
      </FadeIn>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title={t("profile.confirmTitle", locale)}
        description={t("profile.confirmBody", locale)}
        confirmText={t("profile.modalConfirm", locale)}
        cancelText={t("profile.modalCancel", locale)}
        loadingText={t("actions.deleting", locale)}
        variant="danger"
        isLoading={isDeleting}
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
    </main>
  );
}
