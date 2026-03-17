"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AVATAR_OPTIONS, DEFAULT_AVATAR, AVATARS_INITIAL_COUNT } from "@/lib/avatars";


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
import {
  GENDER_OPTIONS,
} from "@/lib/onboarding-options";

const LOCALE_META: Record<Locale, { flag: string; label: string }> = {
  hu: { flag: "🇭🇺", label: "HU" },
  en: { flag: "🇬🇧", label: "EN" },
};

type FormSnapshot = {
  username: string;
  birthYear: string;
  gender: string;
  country: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type InvalidField =
  | "username"
  | "birthYear"
  | "gender"
  | "country";
const DELETE_GOODBYE_MS = 1300;

export default function ProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { locale, setLocale } = useLocale();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [org, setOrg] = useState<{ id: string; name: string; role: string } | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("trita_avatar") ?? DEFAULT_AVATAR;
    }
    return DEFAULT_AVATAR;
  });
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string>(avatarSrc);
  const [avatarsExpanded, setAvatarsExpanded] = useState(false);

  // Demographics
  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [isSavingDemo, setIsSavingDemo] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<FormSnapshot | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [savedLocale, setSavedLocale] = useState<Locale>(locale);
  const [invalidFieldFlash, setInvalidFieldFlash] = useState<InvalidField | null>(null);
  const invalidFlashTimerRef = useRef<number | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);

  // Touch state for blur validation
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [birthYearTouched, setBirthYearTouched] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const countryLabel = useMemo(
    () => countryOptions.find((c) => c.value === country)?.label,
    [country, countryOptions],
  );

  const loadDemographics = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/onboarding");
      if (!res.ok) return;
      const data = await res.json();
      setEmail(data.email ?? null);
      if (data.orgMemberships?.length > 0) {
        const m = data.orgMemberships[0];
        setOrg({ id: m.org.id, name: m.org.name, role: m.role });
      }
      if (data.teamMemberships?.length > 0) {
        setTeams(data.teamMemberships.map((tm: { team: { id: string; name: string } }) => tm.team));
      }
      const snapshot: FormSnapshot = {
        username: data.username ?? "",
        birthYear: data.birthYear ? String(data.birthYear) : "",
        gender: data.gender ?? "",
        country: data.country ?? "",
      };
      setUsername(snapshot.username);
      setBirthYear(snapshot.birthYear);
      setGender(snapshot.gender);
      setCountry(snapshot.country);
      setInitialSnapshot(snapshot);
      if (data.avatarUrl) {
        setAvatarSrc(data.avatarUrl);
        setPendingAvatarUrl(data.avatarUrl);
        window.localStorage.setItem("trita_avatar", data.avatarUrl);
      }
    } catch {
      // silent — non-critical
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    loadDemographics();
  }, [isSignedIn, loadDemographics]);

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
      <div className="min-h-dvh bg-[#faf9f6]">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
          <div className="animate-pulse rounded border border-[#e0ddd6] bg-[#f0ede6] p-6">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-[#e0ddd6]" />
              <div>
                <div className="h-5 w-40 rounded bg-[#e0ddd6]" />
                <div className="mt-2 h-3.5 w-52 rounded bg-[#e8e4dc]" />
              </div>
            </div>
          </div>
          <div className="animate-pulse rounded border border-[#e0ddd6] bg-white p-6">
            <div className="h-5 w-48 rounded bg-[#e0ddd6]" />
            <div className="mt-4 h-4 w-72 rounded bg-[#e8e4dc]" />
            <div className="mt-6 flex flex-col gap-4">
              <div className="h-11 rounded bg-[#e8e4dc]" />
              <div className="h-11 rounded bg-[#e8e4dc]" />
              <div className="h-20 rounded bg-[#e8e4dc]" />
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
    username.trim().length >= 2 && username.trim().length <= 20;

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
    country !== "";

  const isDemographicsDirty =
    initialSnapshot != null &&
    (username.trim() !== initialSnapshot.username ||
      birthYear !== initialSnapshot.birthYear ||
      gender !== initialSnapshot.gender ||
      country !== initialSnapshot.country);
  const isLocaleDirty = selectedLocale !== savedLocale;
  const isAvatarDirty = pendingAvatarUrl !== avatarSrc;
  const isDirty = isDemographicsDirty || isLocaleDirty || isAvatarDirty;
  const canSubmitDemo = !isSavingDemo && isDirty && (!isDemographicsDirty || canSaveDemo);
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
      if (field === "country") {
        countryFieldRef.current?.querySelector("button")?.focus();
      }
    }, 20);
  };

  const focusFirstInvalidField = () => {
    if (!usernameValid) { focusAndFlashInvalidField("username"); return; }
    if (!birthYearValid) { focusAndFlashInvalidField("birthYear"); return; }
    if (gender === "") { focusAndFlashInvalidField("gender"); return; }
    if (country === "") { focusAndFlashInvalidField("country"); }
  };

  const handleSaveDemographics = async () => {
    if (isSavingDemo) return;
    if (isDemographicsDirty && !canSaveDemo) {
      setUsernameTouched(true);
      setBirthYearTouched(true);
      focusFirstInvalidField();
      return;
    }
    if (!isDirty) return;
    setSaveState("saving");
    setIsSavingDemo(true);
    try {
      if (isDemographicsDirty || isAvatarDirty) {
        const res = await fetch("/api/profile/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            birthYear: Number(birthYear),
            gender,
            country,
            ...(isAvatarDirty && { avatarUrl: pendingAvatarUrl }),
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        setInitialSnapshot({
          username: username.trim(),
          birthYear,
          gender,
          country,
        });
        if (isAvatarDirty) {
          setAvatarSrc(pendingAvatarUrl);
          window.localStorage.setItem("trita_avatar", pendingAvatarUrl);
        }
      }
      if (isLocaleDirty) {
        setLocale(selectedLocale);
        setSavedLocale(selectedLocale);
      }
      setSaveState("saved");

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
      // Clear all trita-related localStorage data so old drafts don't survive re-registration
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("trita_")) localStorage.removeItem(key);
        }
      } catch {}
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

  const toggleClass = (isActive: boolean) =>
    `min-h-[44px] rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors ${
      isActive
        ? "border-[#c8410a] bg-[#fce7d6] font-semibold text-[#c8410a]"
        : "border-[#e8e4dc] bg-white text-[#5a5650] hover:border-[#c8410a] hover:text-[#c8410a]"
    }`;

  const roleLabel =
    org?.role === "ORG_ADMIN"
      ? "Admin"
      : org?.role === "ORG_MANAGER"
      ? (locale === "en" ? "Manager" : "Menedzser")
      : org?.role
      ? (locale === "en" ? "Member" : "Tag")
      : "";
  const metaParts = [org?.name, teams.map((tm) => tm.name).join(", ") || null, roleLabel || null].filter(Boolean);

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-8 pb-20">

        {/* ── Profile header ── */}
        <FadeIn delay={0}>
          <section className="rounded-xl bg-[#1a1814] px-6 py-5">
            <div className="flex items-center gap-4">
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[#2a2824]"
              />
              <div className="min-w-0">
                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[.14em] text-[#c8410a]">
                  // profil
                </p>
                <p className="truncate font-playfair text-[22px] font-black leading-tight tracking-tight text-white">
                  {displayName}
                </p>
                {metaParts.length > 0 && (
                  <p className="mt-1 text-[12px] text-[#6b6560]">
                    {metaParts.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── Demographics ── */}
        <FadeIn delay={0.05}>
          <section className="overflow-hidden rounded-xl border border-[#e8e4dc] bg-white">
            <div className="border-b border-[#f0ede6] px-5 py-4">
              <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#c8410a]">
                // személyes adatok
              </p>
              <h2 className="text-[15px] font-bold text-[#1a1814]">
                {t("profile.demographicsTitle", locale)}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#a09a90]">
                {t("profile.demographicsBody", locale)}
              </p>
            </div>

            <div className="flex flex-col gap-5 px-5 py-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#5a5650]">
                  {t("onboarding.usernameLabel", locale)}
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder={t("onboarding.usernamePlaceholder", locale)}
                    minLength={2}
                    maxLength={20}
                    className={`min-h-[44px] rounded-lg border px-3 text-[13px] text-[#1a1814] focus:outline-none ${
                      usernameTouched && username.trim() !== "" && !usernameValid
                        ? "border-orange-400 bg-orange-50"
                        : "border-[#e8e4dc] bg-white focus:border-[#c8410a]/50"
                    } ${invalidFieldFlash === "username" ? "ring-2 ring-orange-300" : ""}`}
                  />
                  {usernameTouched && username.trim() !== "" && !usernameValid ? (
                    <span className="pl-1 text-[11px] italic text-orange-700">
                      {t("onboarding.usernameError", locale)}
                    </span>
                  ) : (
                    <span className="pl-1 text-[11px] text-[#a09a90]">
                      {t("onboarding.usernameHint", locale)}
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#5a5650]">
                  {t("onboarding.birthYearLabel", locale)}
                  <input
                    ref={birthYearInputRef}
                    type="number"
                    inputMode="numeric"
                    value={birthYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 4) setBirthYear(value);
                    }}
                    onBlur={() => setBirthYearTouched(true)}
                    placeholder={t("onboarding.birthYearPlaceholder", locale)}
                    min={minBirthYear}
                    max={maxBirthYear}
                    maxLength={4}
                    className={`min-h-[44px] rounded-lg border px-3 text-[13px] text-[#1a1814] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                      birthYearTouched && birthYear !== "" && !birthYearValid
                        ? "border-orange-400 bg-orange-50"
                        : "border-[#e8e4dc] bg-white focus:border-[#c8410a]/50"
                    } ${invalidFieldFlash === "birthYear" ? "ring-2 ring-orange-300" : ""}`}
                  />
                  {birthYearTouched && birthYear !== "" && !birthYearValid ? (
                    <span className="pl-1 text-[11px] italic text-orange-700">
                      {minBirthYear}–{maxBirthYear}
                    </span>
                  ) : (
                    <span className="pl-1 text-[11px] text-[#a09a90]">
                      {minBirthYear}–{maxBirthYear}
                    </span>
                  )}
                </label>
              </div>

              <div className={`flex flex-col gap-2 rounded-lg p-1 transition ${invalidFieldFlash === "gender" ? "bg-orange-50/60 ring-2 ring-orange-300" : ""}`}>
                <span className="text-[12px] font-semibold text-[#5a5650]">
                  {t("onboarding.genderLabel", locale)}
                </span>
                <div className="flex flex-wrap gap-2">
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
                className={`rounded-lg transition ${invalidFieldFlash === "country" ? "bg-orange-50/60 p-1 ring-2 ring-orange-300" : ""}`}
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

        {/* ── Avatar ── */}
        <FadeIn delay={0.08}>
          <section className="overflow-hidden rounded-xl border border-[#e8e4dc] bg-white">
            <div className="border-b border-[#f0ede6] px-5 py-4">
              <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#c8410a]">
                // avatar
              </p>
              <h2 className="text-[15px] font-bold text-[#1a1814]">
                {locale === "hu" ? "Avatar" : "Avatar"}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#a09a90]">
                {locale === "hu" ? "Válaszd ki a profilképedet." : "Choose your profile picture."}
              </p>
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-5 gap-3">
                {AVATAR_OPTIONS.slice(0, avatarsExpanded ? AVATAR_OPTIONS.length : AVATARS_INITIAL_COUNT).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setPendingAvatarUrl(src)}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                      pendingAvatarUrl === src
                        ? "border-[#c8410a] ring-2 ring-[#c8410a]/30"
                        : "border-[#e8e4dc] hover:border-[#c8410a]/40"
                    }`}
                  >
                    <Image
                      src={src}
                      alt="avatar option"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
              {AVATAR_OPTIONS.length > AVATARS_INITIAL_COUNT && (
                <button
                  type="button"
                  onClick={() => setAvatarsExpanded((v) => !v)}
                  className="mt-3 text-[12px] font-medium text-[#c8410a] hover:underline"
                >
                  {avatarsExpanded
                    ? (locale === "hu" ? "− Kevesebb" : "− Show less")
                    : (locale === "hu"
                        ? `+ Összes megjelenítése (${AVATAR_OPTIONS.length})`
                        : `+ Show all (${AVATAR_OPTIONS.length})`)}
                </button>
              )}
            </div>
          </section>
        </FadeIn>

        {/* ── Locale ── */}
        <FadeIn delay={0.1}>
          <section className="overflow-hidden rounded-xl border border-[#e8e4dc] bg-white">
            <div className="border-b border-[#f0ede6] px-5 py-4">
              <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#c8410a]">
                // nyelv
              </p>
              <h2 className="text-[15px] font-bold text-[#1a1814]">{t("profile.localeTitle", locale)}</h2>
              <p className="mt-0.5 text-[12px] text-[#a09a90]">
                {t("profile.localeBody", locale)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-4">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocale(loc)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium transition-colors ${
                    selectedLocale === loc
                      ? "border-[#c8410a] bg-[#fce7d6] font-semibold text-[#c8410a]"
                      : "border-[#e8e4dc] bg-white text-[#5a5650] hover:border-[#c8410a] hover:text-[#c8410a]"
                  }`}
                >
                  <span className="text-base leading-none">{LOCALE_META[loc].flag}</span>
                  {t(`locale.${loc}` as const, loc)}
                </button>
              ))}
            </div>

            <div className="min-h-[20px] px-5 pb-3">
              {selectedLocale !== savedLocale ? (
                <p className="text-[11px] text-amber-700">{t("profile.localePending", locale)}</p>
              ) : saveState === "saved" ? (
                <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
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
        <FadeIn delay={0.15}>
          <section className="flex items-center justify-between gap-4 rounded-xl border border-[#f5c4b3] bg-white px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-[#c8410a]">{t("profile.deleteTitle", locale)}</p>
              <p className="mt-0.5 text-[12px] text-[#a09a90]">
                {t("profile.deleteBody", locale)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="min-h-[44px] shrink-0 rounded-lg border border-[#f5c4b3] bg-white px-4 py-2 text-[12px] font-semibold text-[#c8410a] transition hover:bg-[#fce7d6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? t("actions.deleting", locale) : t("actions.deleteProfile", locale)}
            </button>
          </section>
        </FadeIn>

        {/* ── Save bar ── */}
        {showSaveBar && (
          <div className="sticky bottom-4 z-30 mt-2">
            <div className="flex items-center justify-between gap-3 rounded border border-[#e0ddd6] bg-white/95 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur">
              <div className="min-w-0">
                <p className="font-ibm-plex-mono text-[10px] uppercase tracking-[2px] text-[#c8410a]">
                  {t("profile.saveBarLabel", locale)}
                </p>
                <p className="truncate text-sm font-medium text-[#1a1814]">
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
                className="min-h-[44px] shrink-0 rounded bg-[#c8410a] px-5 text-sm font-medium text-white transition hover:-translate-y-px hover:bg-[#a33408] disabled:cursor-not-allowed disabled:bg-[#e0ddd6] disabled:text-[#a09c96] disabled:hover:translate-y-0"
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
