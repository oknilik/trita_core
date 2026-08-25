"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { clearLocaleSyncFlag, useLocale } from "@/components/LocaleProvider";
import { t, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { GENDER_OPTIONS } from "@/lib/onboarding-options";
import { INDUSTRIES } from "@/lib/industry-fit";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";
import { createClientLogger } from "@/lib/client-logger";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { Button, getButtonClassName } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

const log = createClientLogger("profile");

type FormSnapshot = {
  username: string;
  birthYear: string;
  gender: string;
  country: string;
  eduLevel: string;
  eduField: string;
  currentIndustry: string;
};
type OrgMembershipInfo = {
  memberships: Array<{ orgId: string; role: string; orgName: string | null }>;
  teams: Array<{ id: string; name: string; orgId: string }>;
};
type SaveState = "idle" | "saving" | "saved" | "error";
type InvalidField = "username" | "birthYear" | "gender" | "country";

const DELETE_GOODBYE_MS = 1300;

export default function ProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { locale, setLocale } = useLocale();
  const { showToast } = useToast();
  const [e2eBypassSession, setE2EBypassSession] = useState(false);
  const [hasCheckedBypass, setHasCheckedBypass] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<OrgMembershipInfo | null>(null);
  const [accessLevel, setAccessLevel] = useState<string | null>(null);
  const [hasLoadedDemographics, setHasLoadedDemographics] = useState(false);

  // Demographics
  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [eduLevel, setEduLevel] = useState("");
  const [eduField, setEduField] = useState("");
  const [currentIndustry, setCurrentIndustry] = useState("");
  const [initialSnapshot, setInitialSnapshot] = useState<FormSnapshot | null>(null);
  const [isSavingDemo, setIsSavingDemo] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [eduLevelPickerOpen, setEduLevelPickerOpen] = useState(false);
  const [eduFieldPickerOpen, setEduFieldPickerOpen] = useState(false);
  const [industryPickerOpen, setIndustryPickerOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [savedLocale, setSavedLocale] = useState<Locale>(locale);
  const [invalidFieldFlash, setInvalidFieldFlash] = useState<InvalidField | null>(null);
  const invalidFlashTimerRef = useRef<number | null>(null);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [birthYearTouched, setBirthYearTouched] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const countryLabel = useMemo(() => countryOptions.find((c) => c.value === country)?.label, [country, countryOptions]);
  const eduOptions = useMemo(() => ([
    { value: "primary", label: t("results.ccEduPrimary", locale) },
    { value: "secondary", label: t("results.ccEduSecondary", locale) },
    { value: "vocational", label: t("results.ccEduVocational", locale) },
    { value: "higher", label: t("results.ccEduHigher", locale) },
    { value: "specialized", label: t("results.ccEduSpecialized", locale) },
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
    ...INDUSTRIES.map((industry) => ({ value: industry.key, label: locale === "hu" ? industry.hu : industry.en })),
    { value: "", label: t("results.ccCurrentNone", locale) },
  ]), [locale]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/org/context");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setOrgInfo({ memberships: data.memberships ?? [], teams: data.teams ?? [] });
        }
      } catch {
        // A tagság-blokk informatív; hiba esetén egyszerűen nem jelenik meg.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadDemographics = useCallback(async () => {
    setHasLoadedDemographics(false);
    try {
      const res = await fetch("/api/profile/onboarding");
      if (!res.ok) return;
      const data = await res.json();
      const careerBackground = (data.careerBackground ?? {}) as Record<string, unknown>;
      setEmail(data.email ?? null);
      setAccessLevel(data.accessLevel ?? null);
      const snap: FormSnapshot = {
        username: data.username ?? "",
        birthYear: data.birthYear ? String(data.birthYear) : "",
        gender: data.gender ?? "",
        country: data.country ?? "",
        eduLevel: typeof careerBackground.eduLevel === "string" ? careerBackground.eduLevel : "",
        eduField: typeof careerBackground.eduField === "string" ? careerBackground.eduField : "",
        currentIndustry: typeof careerBackground.currentIndustry === "string" ? careerBackground.currentIndustry : "",
      };
      setUsername(snap.username);
      setBirthYear(snap.birthYear);
      setGender(snap.gender);
      setCountry(snap.country);
      setEduLevel(snap.eduLevel);
      setEduField(snap.eduField);
      setCurrentIndustry(snap.currentIndustry);
      setInitialSnapshot(snap);
    } catch { /* silent */ }
    finally {
      setHasLoadedDemographics(true);
    }
  }, []);

  useEffect(() => {
    const hasBypassCookie =
      typeof document !== "undefined" &&
      document.cookie.split(";").some((entry) => entry.trim().startsWith("trita_e2e_user_id="));
    setE2EBypassSession(hasBypassCookie);
    setHasCheckedBypass(true);
  }, []);

  const sessionEligible = isSignedIn || e2eBypassSession;

  useEffect(() => {
    if (sessionEligible) {
      void loadDemographics();
      return;
    }
    setHasLoadedDemographics(false);
  }, [sessionEligible, loadDemographics]);

  useEffect(() => {
    if (saveState !== "saved" && saveState !== "error") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  useEffect(() => { return () => { if (invalidFlashTimerRef.current !== null) window.clearTimeout(invalidFlashTimerRef.current); }; }, []);

  useEffect(() => {
    setSavedLocale((prev) => { setSelectedLocale((cur) => (cur === prev ? locale : cur)); return locale; });
  }, [locale]);

  // Bypass-munkamenetben (e2e) a clerk-js sosem tölt be — az isLoaded-ra
  // várakozás ott örök skeletont jelentene; éles úton a feltétel azonos.
  if (!hasCheckedBypass || (!isLoaded && !e2eBypassSession) || (sessionEligible && !hasLoadedDemographics)) {
    return (
      <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
        <div className="mx-auto max-w-[640px] px-5 pt-10 pb-20">
          <div className="animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-[var(--color-border-default)]" />
              <div><div className="h-5 w-40 rounded bg-[var(--color-border-default)]" /><div className="mt-2 h-3 w-52 rounded bg-[var(--color-border-default)]" /></div>
            </div>
            <div className="mt-8 h-60 rounded-xl bg-[var(--color-border-default)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!sessionEligible) { router.push(buildSignInPath("/profile")); return null; }

  const initials = getAvatarMonogram(
    username.trim() || email,
    { length: 1 },
  );
  const displayName = username.trim() || email || t("common.userFallback", locale);
  const avatarColorName = username.trim() || email || "";
  const [avatarFrom, avatarTo] = getAvatarGradient(avatarColorName);

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;
  const usernameValid = username.trim().length >= 2 && username.trim().length <= 20;
  const birthYearNum = Number(birthYear);
  const birthYearValid = birthYear !== "" && birthYear.length === 4 && Number.isInteger(birthYearNum) && birthYearNum >= minBirthYear && birthYearNum <= maxBirthYear;
  const canSaveDemo = usernameValid && birthYearValid && gender !== "" && country !== "";

  const isDemographicsDirty = initialSnapshot != null && (username.trim() !== initialSnapshot.username || birthYear !== initialSnapshot.birthYear || gender !== initialSnapshot.gender || country !== initialSnapshot.country);
  const isCareerDirty = initialSnapshot != null && (eduLevel !== initialSnapshot.eduLevel || eduField !== initialSnapshot.eduField || currentIndustry !== initialSnapshot.currentIndustry);
  const isLocaleDirty = selectedLocale !== savedLocale;
  const isDirty = isDemographicsDirty || isCareerDirty || isLocaleDirty;
  const canSubmitDemo = !isSavingDemo && isDirty && (!isDemographicsDirty || canSaveDemo);

  const flashInvalidField = (field: InvalidField) => {
    setInvalidFieldFlash(field);
    if (invalidFlashTimerRef.current !== null) window.clearTimeout(invalidFlashTimerRef.current);
    invalidFlashTimerRef.current = window.setTimeout(() => { setInvalidFieldFlash(null); invalidFlashTimerRef.current = null; }, 1200);
  };
  const focusAndFlash = (field: InvalidField) => {
    flashInvalidField(field);
    window.setTimeout(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderFirstButtonRef.current?.focus();
      if (field === "country") countryFieldRef.current?.querySelector("button")?.focus();
    }, 20);
  };
  const focusFirstInvalid = () => {
    if (!usernameValid) { focusAndFlash("username"); return; }
    if (!birthYearValid) { focusAndFlash("birthYear"); return; }
    if (gender === "") { focusAndFlash("gender"); return; }
    if (country === "") { focusAndFlash("country"); }
  };

  const handleSave = async () => {
    if (isSavingDemo) return;
    if (isDemographicsDirty && !canSaveDemo) { setUsernameTouched(true); setBirthYearTouched(true); focusFirstInvalid(); return; }
    if (!isDirty) return;
    setSaveState("saving"); setIsSavingDemo(true);
    try {
      if (isDemographicsDirty || isCareerDirty) {
        const res = await fetch("/api/profile/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            ...(isDemographicsDirty ? { birthYear: Number(birthYear), gender, country } : {}),
            ...(isCareerDirty ? {
              eduLevel: eduLevel || null,
              eduField: eduLevel && eduLevel !== "primary" && eduField ? eduField : null,
              currentIndustry: currentIndustry || null,
            } : {}),
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        setInitialSnapshot({ username: username.trim(), birthYear, gender, country, eduLevel, eduField: eduLevel === "primary" ? "" : eduField, currentIndustry });
      }
      if (isLocaleDirty) { setLocale(selectedLocale); setSavedLocale(selectedLocale); }
      setSaveState("saved");
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch { setSaveState("error"); } finally { setIsSavingDemo(false); }
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    let deleted = false; setIsDeleting(true);
    try {
      const res = await fetch("/api/profile/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
      if (!res.ok) throw new Error("Delete failed");
      deleted = true;
      try { for (const key of Object.keys(localStorage)) { if (key.startsWith("trita_")) localStorage.removeItem(key); } } catch {}
      await new Promise((r) => window.setTimeout(r, DELETE_GOODBYE_MS));
      setShowDeleteModal(false); window.location.href = "/";
    } catch (e) { log.warn({ event: "profile.delete_failed", err: e }, "Profile delete failed"); showToast(t("profile.deleteError", locale), "error"); setShowDeleteModal(false); } finally { if (!deleted) setIsDeleting(false); }
  };

  const inputClass = (field: InvalidField, touched: boolean, valid: boolean, value: string) =>
    `min-h-[44px] rounded-lg border-[1.5px] px-3.5 py-2.5 text-base text-[var(--color-text-primary)] transition-all md:text-caption ${FOCUS_RING_CLASS} ${
      touched && value !== "" && !valid
        ? "border-state-error-border bg-state-error-bg/50"
        : "border-[var(--color-border-default)] bg-surface-card focus-visible:border-[var(--color-action-primary-bg)]"
    } ${invalidFieldFlash === field ? "ring-2 ring-state-error-border" : ""}`;

  const pillClass = (active: boolean) =>
    `min-h-[44px] rounded-full border-[1.5px] px-[18px] py-2 text-xs transition-all ${FOCUS_RING_CLASS} ${
      active
        ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-md shadow-[var(--color-action-primary-bg)]/15"
        : "border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-self)] hover:bg-[var(--color-surface-self-accent-soft)] hover:text-[var(--color-action-primary-bg)]"
    }`;

  const planLabel = accessLevel === "self_plus" ? "Plus" : "Free";

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-5 px-4 py-8 md:py-10"
    >
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-5 py-6 text-[var(--color-text-on-inverse)] shadow-[var(--ui-shadow-lg)] md:px-8 md:py-7">
        <svg aria-hidden="true" viewBox="0 0 60 60" className="absolute -right-4 -top-8 h-36 w-36 text-white/10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M30 5v50M5 30h50M12 12l36 36M48 12 12 48" />
        </svg>
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-fraunces text-2xl font-medium text-[var(--color-text-on-inverse)] shadow-md"
            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label uppercase text-[var(--color-accent-primary-soft)]">
              {locale === "hu" ? "A te tered" : "Your space"}
            </p>
            <h1 className="mt-1 truncate font-fraunces text-3xl font-medium tracking-tight">{displayName}</h1>
            <p className="mt-1 truncate text-xs text-[var(--color-text-on-inverse-muted)]">
              {[email, SELF_PAYWALL_ENABLED ? `${planLabel} ${locale === "hu" ? "csomag" : "plan"}` : null, locale === "hu" ? "Magyar" : "English"].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link
            href="/profile/results"
            className={getButtonClassName({ size: "sm", variant: "secondary", onInverse: true, className: "relative shrink-0" })}
          >
            {locale === "hu" ? "Eredményeim megnyitása" : "Open my results"} →
          </Link>
        </div>
      </section>

      <nav aria-label={locale === "hu" ? "Profilbeállítások" : "Profile settings"} className="-mb-1 flex gap-6 overflow-x-auto border-b border-border-default px-1 text-xs text-text-muted">
        <a href="#about" className={`shrink-0 border-b-2 border-[var(--color-action-primary-bg)] pb-3 font-semibold text-[var(--color-action-primary-bg)] ${FOCUS_RING_CLASS}`}>{t("profile.sectionAbout", locale)}</a>
        <a href="#language" className={`shrink-0 pb-3 hover:text-text-primary ${FOCUS_RING_CLASS}`}>{t("profile.sectionLanguage", locale)}</a>
        {orgInfo && orgInfo.memberships.length > 0 ? <a href="#organization" className={`shrink-0 pb-3 hover:text-text-primary ${FOCUS_RING_CLASS}`}>{t("profile.orgSectionTitle", locale)}</a> : null}
        <a href="#career-background" className={`shrink-0 pb-3 hover:text-text-primary ${FOCUS_RING_CLASS}`}>{locale === "hu" ? "Háttér" : "Background"}</a>
        <a href="#account" className={`shrink-0 pb-3 hover:text-text-primary ${FOCUS_RING_CLASS}`}>{t("profile.sectionAccount", locale)}</a>
      </nav>

      <div className="grid gap-5 md:grid-cols-[1.12fr_0.88fr]">
        <Card id="about" as="section" spacing="lg">
          <h2 className="font-fraunces text-xl font-medium text-[var(--color-action-primary-bg)]">{t("profile.sectionAbout", locale)}</h2>
          <p className="mb-5 mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{t("profile.sectionAboutSub", locale)}</p>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-note font-medium text-[var(--color-text-secondary)]">
              {t("onboarding.usernameLabel", locale)}
              <input
                ref={usernameInputRef}
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => setUsernameTouched(true)}
                placeholder={t("onboarding.usernamePlaceholder", locale)} minLength={2} maxLength={20}
                className={inputClass("username", usernameTouched, usernameValid, username)}
              />
              <span className="text-micro text-[var(--color-text-muted)]">{t("onboarding.usernameHint", locale)}</span>
            </label>
            <label className="flex flex-col gap-1 text-note font-medium text-[var(--color-text-secondary)]">
              {t("onboarding.birthYearLabel", locale)}
              <input
                ref={birthYearInputRef}
                type="number" inputMode="numeric" value={birthYear}
                onChange={(e) => { if (e.target.value.length <= 4) setBirthYear(e.target.value); }}
                onBlur={() => setBirthYearTouched(true)}
                placeholder={t("onboarding.birthYearPlaceholder", locale)} min={minBirthYear} max={maxBirthYear}
                className={`${inputClass("birthYear", birthYearTouched, birthYearValid, birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
              <span className="text-micro text-[var(--color-text-muted)]">{minBirthYear}–{maxBirthYear}</span>
            </label>
          </div>

          <div className={`mt-5 rounded-lg p-1 transition ${invalidFieldFlash === "gender" ? "bg-state-error-bg/60 ring-2 ring-state-error-border" : ""}`}>
            <span className="text-note font-medium text-[var(--color-text-secondary)]">{t("onboarding.genderLabel", locale)}</span>
            <div className="mt-1 flex flex-wrap gap-[5px]">
              {GENDER_OPTIONS.map((opt, idx) => (
                <button key={opt.value} ref={idx === 0 ? genderFirstButtonRef : undefined} type="button" onClick={() => setGender(opt.value)} className={pillClass(gender === opt.value)}>
                  {t(opt.labelKey, locale)}
                </button>
              ))}
            </div>
          </div>

          <div ref={countryFieldRef} className={`mt-5 rounded-lg transition ${invalidFieldFlash === "country" ? "bg-state-error-bg/60 p-1 ring-2 ring-state-error-border" : ""}`}>
            <PickerTrigger label={t("onboarding.countryLabel", locale)} value={countryLabel} placeholder={t("onboarding.countryPlaceholder", locale)} onClick={() => setCountryPickerOpen(true)} isOpen={countryPickerOpen} />
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          {orgInfo && orgInfo.memberships.length > 0 ? (
            <Card id="organization" as="section" spacing="lg">
              <h2 className="font-fraunces text-xl font-medium text-[var(--color-action-primary-bg)]">{t("profile.orgSectionTitle", locale)}</h2>
              <p className="mb-4 mt-1 text-xs text-[var(--color-text-muted)]">{t("profile.orgSectionSub", locale)}</p>
              <div className="flex flex-col gap-3">
                {orgInfo.memberships.map((m) => {
                  const roleLabel = m.role === "ORG_ADMIN"
                    ? t("profile.orgRoleAdmin", locale)
                    : m.role === "ORG_CONSULTANT"
                      ? t("profile.orgRoleConsultant", locale)
                      : m.role === "ORG_MANAGER"
                        ? t("profile.orgRoleManager", locale)
                        : t("profile.orgRoleMember", locale);
                  const orgTeams = orgInfo.teams.filter((team) => team.orgId === m.orgId);
                  const canOpenOrg = m.role === "ORG_ADMIN" || m.role === "ORG_CONSULTANT" || m.role === "ORG_MANAGER";
                  return (
                    <div key={m.orgId} className="rounded-xl bg-[var(--color-surface-self-accent-soft)] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-layer-org-accent)] text-micro font-bold text-[var(--color-text-on-inverse)]">{(m.orgName ?? "T").slice(0, 2).toUpperCase()}</span>
                        <div className="min-w-0">
                          {canOpenOrg ? <Link href={`/org/${m.orgId}`} className={`block truncate text-caption font-semibold text-text-primary hover:underline ${FOCUS_RING_CLASS}`}>{m.orgName ?? m.orgId}</Link> : <span className="block truncate text-caption font-semibold text-text-primary">{m.orgName ?? m.orgId}</span>}
                          <span className="text-micro text-text-muted">{roleLabel}</span>
                        </div>
                      </div>
                      {orgTeams.length > 0 ? <div className="mt-3 flex flex-wrap gap-1.5">{orgTeams.map((team) => <Link key={team.id} href={`/team/${team.id}`} className={`rounded-full border border-border-default bg-surface-card px-2.5 py-1 text-note text-text-secondary hover:text-text-primary ${FOCUS_RING_CLASS}`}>{team.name}</Link>)}</div> : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <Card id="language" as="section" spacing="lg">
            <h2 className="font-fraunces text-xl font-medium text-[var(--color-action-primary-bg)]">{t("profile.sectionLanguage", locale)}</h2>
            <p className="mb-4 mt-1 text-xs text-[var(--color-text-muted)]">{t("profile.sectionLanguageSub", locale)}</p>
            <div className="flex flex-wrap gap-[5px]">
              {SUPPORTED_LOCALES.map((loc) => (
                <button key={loc} type="button" onClick={() => setSelectedLocale(loc)} className={pillClass(selectedLocale === loc)}>
                  {t(`locale.${loc}` as const, loc)}
                </button>
              ))}
            </div>
          </Card>

          <div className="rounded-2xl bg-[var(--color-surface-soft-warm)] p-4 text-xs leading-relaxed text-[var(--color-accent-earth-strong)]">
            <strong className="font-fraunces text-base font-medium">{locale === "hu" ? "Az adataid nálad maradnak." : "Your data stays yours."}</strong><br />
            {locale === "hu" ? "A profilod adatai bármikor módosíthatók vagy törölhetők." : "Your profile data can be edited or deleted at any time."}
          </div>
        </div>
      </div>

      <Card id="career-background" as="section" spacing="lg">
        <h2 className="font-fraunces text-xl font-medium text-[var(--color-action-primary-bg)]">
          {locale === "hu" ? "Tanulmányok és szakmai háttér" : "Education and professional background"}
        </h2>
        <p className="mb-5 mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {locale === "hu" ? "Ezekkel pontosabban tudjuk személyre szabni a későbbi eredményeidet." : "These details help us tailor your future results more precisely."}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <PickerTrigger
            label={locale === "hu" ? "Legmagasabb végzettség" : "Highest education"}
            value={eduOptions.find((option) => option.value === eduLevel)?.label}
            placeholder={locale === "hu" ? "Válassz végzettséget" : "Choose education"}
            onClick={() => setEduLevelPickerOpen(true)}
            isOpen={eduLevelPickerOpen}
          />
          {eduLevel === "primary" ? (
            <div className="flex flex-col gap-1">
              <span className="text-note font-medium text-[var(--color-text-secondary)]">{t("onboarding.eduFieldLabel", locale)}</span>
              <div className="flex min-h-[44px] items-center rounded-lg border-[1.5px] border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-3.5 text-xs text-[var(--color-text-muted)]">
                {locale === "hu" ? "Nem szükséges" : "Not needed"}
              </div>
            </div>
          ) : (
            <PickerTrigger
              label={t("onboarding.eduFieldLabel", locale)}
              value={eduFieldOptions.find((option) => option.value === eduField || (eduField === "none_other" && option.value === "none"))?.label}
              placeholder={locale === "hu" ? "Válassz területet" : "Choose a field"}
              onClick={() => setEduFieldPickerOpen(true)}
              isOpen={eduFieldPickerOpen}
            />
          )}
          <PickerTrigger
            label={locale === "hu" ? "Jelenlegi iparág" : "Current industry"}
            value={industryOptions.find((option) => option.value === currentIndustry)?.label}
            placeholder={locale === "hu" ? "Válassz iparágat" : "Choose an industry"}
            onClick={() => setIndustryPickerOpen(true)}
            isOpen={industryPickerOpen}
          />
        </div>
      </Card>

      <section className="flex flex-col gap-4 rounded-2xl bg-[var(--color-surface-inverse)] p-4 text-[var(--color-text-on-inverse)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-note">
          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${isDirty ? "bg-[var(--color-accent-primary-soft)]" : "bg-[var(--color-sage-300)]"}`} />
          <span>
            <strong className="block text-[var(--color-text-on-inverse)]">
              {isDirty ? t("profile.saveUnsaved", locale) : saveState === "saved" ? t("profile.saveSaved", locale) : t("profile.saveNoChanges", locale)}
            </strong>
            <span className="text-micro text-[var(--color-text-on-inverse-muted)]">{locale === "hu" ? "A módosításokat itt tudod menteni." : "Save your changes here."}</span>
          </span>
        </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSubmitDemo}
            loading={isSavingDemo}
            onInverse
            className="shrink-0"
          >
            {isSavingDemo ? t("actions.save", locale) : t("profile.saveButton", locale)}
          </Button>
      </section>
      {saveState === "saved" ? <p role="status" className="text-note text-[var(--color-state-success-text)]">{locale === "hu" ? "A profil mentése sikerült." : "Profile saved successfully."}</p> : saveState === "error" ? <p role="alert" className="text-note text-[var(--color-state-error-text)]">{locale === "hu" ? "A mentés nem sikerült. Az adataid megmaradtak; próbáld újra." : "Save failed. Your changes are preserved; please try again."}</p> : null}

        <Card
          id="account"
          as="section"
          bordered={false}
          spacing="sm"
          className="overflow-hidden border border-[var(--color-state-error-border)]"
          style={{ padding: 0 }}
        >
          <div className="flex items-center gap-1.5 border-b border-[var(--color-state-error-border)] bg-[var(--color-state-error-bg)] px-[18px] py-3">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-state-error-border)] text-micro text-[var(--color-state-error-fg)]">!</div>
            <span className="text-xs font-semibold text-[var(--color-state-error-fg)]">{t("profile.sectionAccount", locale)}</span>
          </div>
          <div className="bg-surface-card p-[18px]">
            {/* Sign out */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-caption text-[var(--color-text-secondary)]">{t("profile.logoutTitle", locale)}</p>
                <p className="text-micro text-[var(--color-text-muted)]">{t("profile.logoutSub", locale)}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => { clearLocaleSyncFlag(); void signOut(); }} className="shrink-0">
                {t("profile.logoutButton", locale)}
              </Button>
            </div>
            <div className="my-2.5 h-px bg-[var(--color-state-error-bg)]" />
            {/* Delete */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-caption text-[var(--color-state-error-fg)]">{t("profile.deleteTitle", locale)}</p>
                <p className="text-micro text-[var(--color-text-muted)]">{t("profile.deleteBody", locale)}</p>
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)} disabled={isDeleting} className="shrink-0">
                {isDeleting ? t("actions.deleting", locale) : t("actions.deleteProfile", locale)}
              </Button>
            </div>
          </div>
        </Card>

      <ConfirmModal
        isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm}
        title={t("profile.confirmTitle", locale)} description={t("profile.confirmBody", locale)}
        confirmText={t("profile.modalConfirm", locale)} cancelText={t("profile.modalCancel", locale)}
        loadingText={t("actions.deleting", locale)} loadingNote={t("profile.deleteLoadingNote", locale)}
        loadingDurationMs={DELETE_GOODBYE_MS} variant="danger" isLoading={isDeleting}
      />

      <Picker isOpen={countryPickerOpen} onClose={() => setCountryPickerOpen(false)} onSelect={setCountry}
        options={countryOptions} selectedValue={country} title={t("onboarding.countryLabel", locale)}
        closeLabel={t("common.close", locale)}
        searchable searchPlaceholder={t("onboarding.countryPlaceholder", locale)}
      />
      <Picker isOpen={eduLevelPickerOpen} onClose={() => setEduLevelPickerOpen(false)} onSelect={(value) => { setEduLevel(value); if (value === "primary") setEduField(""); }}
        options={eduOptions} selectedValue={eduLevel} title={locale === "hu" ? "Legmagasabb végzettség" : "Highest education"}
        closeLabel={t("common.close", locale)}
      />
      <Picker isOpen={eduFieldPickerOpen} onClose={() => setEduFieldPickerOpen(false)} onSelect={setEduField}
        options={eduFieldOptions} selectedValue={eduField} title={t("onboarding.eduFieldLabel", locale)}
        closeLabel={t("common.close", locale)}
      />
      <Picker isOpen={industryPickerOpen} onClose={() => setIndustryPickerOpen(false)} onSelect={setCurrentIndustry}
        options={industryOptions} selectedValue={currentIndustry} title={locale === "hu" ? "Jelenlegi iparág" : "Current industry"}
        closeLabel={t("common.close", locale)} searchable
      />
    </PlatformPageShell>
  );
}
