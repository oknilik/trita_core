"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { FadeIn } from "@/components/landing/FadeIn";
import { useLocale } from "@/components/LocaleProvider";
import { t, type Locale } from "@/lib/i18n";
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

const LOCALE_META: Record<Locale, { flag: string; label: string }> = {
  hu: { flag: "🇭🇺", label: "HU" },
  en: { flag: "🇬🇧", label: "EN" },
  de: { flag: "🇩🇪", label: "DE" },
};

type FormSnapshot = {
  username: string;
  birthYear: string;
  gender: string;
  education: string;
  country: string;
};

type ProfileStatus = {
  onboarded: boolean;
  hasDraft: boolean;
  hasResult: boolean;
  sentInvites: number;
  pendingInvites: number;
  completedObserver: number;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type InvalidField = "username" | "birthYear" | "gender" | "education" | "country";
const DELETE_GOODBYE_MS = 1300;

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
  const [initialSnapshot, setInitialSnapshot] = useState<FormSnapshot | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [savedLocale, setSavedLocale] = useState<Locale>(locale);
  const [invalidFieldFlash, setInvalidFieldFlash] = useState<InvalidField | null>(null);
  const invalidFlashTimerRef = useRef<number | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);
  const educationFirstButtonRef = useRef<HTMLButtonElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);

  // Touch state for blur validation
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [birthYearTouched, setBirthYearTouched] = useState(false);

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
      const snapshot: FormSnapshot = {
        username: data.username ?? "",
        birthYear: data.birthYear ? String(data.birthYear) : "",
        gender: data.gender ?? "",
        education: data.education ?? "",
        country: data.country ?? "",
      };
      setUsername(snapshot.username);
      setBirthYear(snapshot.birthYear);
      setGender(snapshot.gender);
      setEducation(snapshot.education);
      setCountry(snapshot.country);
      setInitialSnapshot(snapshot);
    } catch {
      // silent — non-critical
    }
  }, []);

  const loadProfileStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/status");
      if (!res.ok) return;
      const data = await res.json();
      setProfileStatus(data as ProfileStatus);
    } catch {
      // silent — non-critical
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    loadDemographics();
    loadProfileStatus();
  }, [isSignedIn, loadDemographics, loadProfileStatus]);

  useEffect(() => {
    if (saveState !== "saved" && saveState !== "error") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  useEffect(() => {
    return () => {
      if (invalidFlashTimerRef.current !== null) {
        window.clearTimeout(invalidFlashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSavedLocale((prevSaved) => {
      setSelectedLocale((current) => (current === prevSaved ? locale : current));
      return locale;
    });
  }, [locale]);

  if (!isLoaded) {
    return (
      <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white">
        <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
          <div className="animate-pulse rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 pb-14 md:p-8 md:pb-16">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20" />
              <div>
                <div className="h-7 w-40 rounded bg-white/20" />
                <div className="mt-2 h-4 w-52 rounded bg-white/10" />
              </div>
            </div>
          </div>
          <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="mt-4 h-4 w-72 rounded bg-gray-100" />
            <div className="mt-6 flex flex-col gap-4">
              <div className="h-11 rounded-lg bg-gray-100" />
              <div className="h-11 rounded-lg bg-gray-100" />
              <div className="h-20 rounded-lg bg-gray-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const initials =
    (username.trim() || user?.username || user?.primaryEmailAddress?.emailAddress || "?")
      .slice(0, 1)
      .toUpperCase();
  const displayName =
    username.trim() ||
    user?.username ||
    user?.firstName ||
    t("common.userFallback", locale);

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

  const canSaveDemo =
    usernameValid &&
    birthYearValid &&
    gender !== "" &&
    education !== "" &&
    country !== "";
  const isDemographicsDirty =
    initialSnapshot != null &&
    (username.trim() !== initialSnapshot.username ||
      birthYear !== initialSnapshot.birthYear ||
      gender !== initialSnapshot.gender ||
      education !== initialSnapshot.education ||
      country !== initialSnapshot.country);
  const isLocaleDirty = selectedLocale !== savedLocale;
  const isDirty = isDemographicsDirty || isLocaleDirty;
  const canSubmitDemo = !isSavingDemo && isDirty;
  const showSaveBar = isDirty || saveState !== "idle";

  const flashInvalidField = (field: InvalidField) => {
    setInvalidFieldFlash(field);
    if (invalidFlashTimerRef.current !== null) {
      window.clearTimeout(invalidFlashTimerRef.current);
    }
    invalidFlashTimerRef.current = window.setTimeout(() => {
      setInvalidFieldFlash(null);
      invalidFlashTimerRef.current = null;
    }, 1200);
  };

  const focusAndFlashInvalidField = (field: InvalidField) => {
    flashInvalidField(field);
    window.setTimeout(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderFirstButtonRef.current?.focus();
      if (field === "education") educationFirstButtonRef.current?.focus();
      if (field === "country") {
        countryFieldRef.current?.querySelector("button")?.focus();
      }
    }, 20);
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
    if (country === "") {
      focusAndFlashInvalidField("country");
    }
  };

  const handleSaveDemographics = async () => {
    if (!canSubmitDemo) return;
    if (isDemographicsDirty && !canSaveDemo) {
      setUsernameTouched(true);
      setBirthYearTouched(true);
      focusFirstInvalidField();
      return;
    }
    setSaveState("saving");
    setIsSavingDemo(true);
    try {
      if (isDemographicsDirty) {
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
        setInitialSnapshot({
          username: username.trim(),
          birthYear,
          gender,
          education,
          country,
        });
      }
      if (isLocaleDirty) {
        setLocale(selectedLocale);
        setSavedLocale(selectedLocale);
      }
      setSaveState("saved");
      loadProfileStatus();

      // Notify UserMenu to refresh profile name
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch {
      setSaveState("error");
    } finally {
      setIsSavingDemo(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    let deleted = false;
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
      deleted = true;
      await new Promise((resolve) => window.setTimeout(resolve, DELETE_GOODBYE_MS));
      setShowDeleteModal(false);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      showToast(t("profile.deleteError", locale), "error");
      setShowDeleteModal(false);
    } finally {
      if (!deleted) {
        setIsDeleting(false);
      }
    }
  };

  const profileStatusValue = profileStatus?.onboarded
    ? t("profile.statusDone", locale)
    : t("profile.statusInProgress", locale);
  const testStatusValue = !profileStatus
    ? t("common.statusPending", locale)
    : profileStatus.hasResult
      ? t("profile.statusDone", locale)
      : profileStatus.hasDraft
        ? t("profile.statusInProgress", locale)
        : t("profile.statusNotStarted", locale);
  const feedbackStatusValue = !profileStatus
    ? t("common.statusPending", locale)
    : profileStatus.completedObserver > 0
      ? t("profile.statusReceived", locale)
      : profileStatus.pendingInvites > 0
        ? t("profile.statusWaiting", locale)
        : profileStatus.sentInvites > 0
          ? t("profile.statusRequested", locale)
          : t("profile.statusNotStarted", locale);

  const statusPillClass = (value: string) => {
    if (value === t("profile.statusDone", locale) || value === t("profile.statusReceived", locale)) {
      return "bg-emerald-50 text-emerald-700";
    }
    if (value === t("profile.statusInProgress", locale) || value === t("profile.statusWaiting", locale) || value === t("profile.statusRequested", locale)) {
      return "bg-amber-50 text-amber-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const toggleClass = (isActive: boolean) =>
    `min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
      isActive
        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
    }`;

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white">
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-10">
      {/* ── Context ── */}
      <FadeIn delay={0.05}>
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-gray-900">
                  {displayName}
                </h1>
                <p className="truncate text-xs text-gray-500">
                  {user?.primaryEmailAddress?.emailAddress ?? t("profile.missingEmail", locale)}
                </p>
              </div>
            </div>
            <div className="my-4 h-px bg-indigo-100" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
              {t("profile.researchTag", locale)}
            </p>
            <p className="mt-2 text-sm text-indigo-900">
              {t("profile.researchBody", locale)}
            </p>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">
              {t("profile.participationTitle", locale)}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t("profile.participationBody", locale)}
            </p>

            {/* Loading skeleton while fetching profile status */}
            {profileStatus === null ? (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-6 w-20 rounded-full bg-gray-200" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-6 w-24 rounded-full bg-gray-200" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="h-6 w-20 rounded-full bg-gray-200" />
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{t("profile.statusProfile", locale)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(profileStatusValue)}`}>
                    {profileStatusValue}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{t("profile.statusTest", locale)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(testStatusValue)}`}>
                    {testStatusValue}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{t("profile.statusFeedback", locale)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(feedbackStatusValue)}`}>
                    {feedbackStatusValue}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </FadeIn>

      {/* ── Demographics ── */}
      <FadeIn delay={0.1}>
        <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6">
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

            {/* Birth year */}
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
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

            {/* Gender */}
            <div className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "gender" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}>
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

            {/* Education */}
            <div className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "education" ? "ring-2 ring-orange-300 bg-orange-50/60" : ""}`}>
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

            {/* Country */}
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
      </FadeIn>

      {/* ── Locale ── */}
      <FadeIn delay={0.2}>
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">{t("profile.localeTitle", locale)}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("profile.localeBody", locale)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("profile.localeAutoHint", locale)}
          </p>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocale(loc)}
                className={`group relative flex min-h-[52px] items-center gap-3 rounded-lg border px-4 text-left text-sm font-medium transition ${
                  selectedLocale === loc
                    ? "scale-[1.01] border-indigo-300 bg-white text-indigo-700 shadow-sm"
                    : "border-transparent bg-white/60 text-gray-600 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <span className="text-xl leading-none">{LOCALE_META[loc].flag}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {t(`locale.${loc}` as const, loc)}
                  </span>
                  <span className="block text-xs uppercase tracking-[0.08em] text-gray-400">
                    {LOCALE_META[loc].label}
                  </span>
                </span>
                {selectedLocale === loc && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />
                )}
              </button>
            ))}
            </div>
          </div>

          <div className="mt-3 min-h-[20px]">
            {selectedLocale !== savedLocale ? (
              <p className="text-xs text-amber-700">{t("profile.localePending", locale)}</p>
            ) : saveState === "saved" ? (
              <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 10.5l3.2 3.2L15.5 6.3" />
                </svg>
                {t("profile.localeSaved", locale)}
              </p>
            ) : null}
          </div>
        </section>
      </FadeIn>

      {/* ── Delete zone ── */}
      <FadeIn delay={0.25}>
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-rose-900">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3h4m-7 3h10m-1 0-.7 9.1a1.2 1.2 0 0 1-1.2 1.1H8a1.2 1.2 0 0 1-1.2-1.1L6 6m2 0v8m4-8v8" />
            </svg>
            {t("profile.deleteTitle", locale)}
          </h2>
          <p className="mt-2 text-sm text-rose-800">
            {t("profile.deleteBody", locale)}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isDeleting ? t("actions.deleting", locale) : t("actions.deleteProfile", locale)}
          </button>
        </section>
      </FadeIn>

      {showSaveBar && (
        <div className="sticky bottom-4 z-30 mt-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white/95 px-4 py-3 shadow-lg shadow-indigo-100 backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500">
                {t("profile.saveBarLabel", locale)}
              </p>
              <p className="truncate text-sm font-medium text-gray-700">
                {isDirty || saveState === "saving"
                  ? t("profile.saveBarUnsaved", locale)
                  : saveState === "saved"
                    ? t("profile.saveBarSaved", locale)
                    : saveState === "error"
                      ? t("profile.saveError", locale)
                      : t("profile.saveBarUnsaved", locale)}
              </p>
            </div>
            <AnimatePresence mode="wait">
              {saveState === "saved" && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                  aria-live="polite"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 10.5l3.2 3.2L15.5 6.3" />
                  </svg>
                </motion.div>
              )}
              {saveState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1, x: [0, -3, 3, -2, 2, 0] }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.35 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600"
                  aria-live="polite"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={handleSaveDemographics}
              disabled={!canSubmitDemo}
              className="min-h-[44px] shrink-0 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSavingDemo ? t("actions.save", locale) : t("profile.saveChanges", locale)}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title={t("profile.confirmTitle", locale)}
        description={t("profile.confirmBody", locale)}
        confirmText={t("profile.modalConfirm", locale)}
        cancelText={t("profile.modalCancel", locale)}
        loadingText={t("actions.deleting", locale)}
        loadingNote={t("profile.deleteLoadingNote", locale)}
        loadingDurationMs={DELETE_GOODBYE_MS}
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
    </div>
  );
}
