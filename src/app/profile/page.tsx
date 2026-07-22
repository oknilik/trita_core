"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { useLocale } from "@/components/LocaleProvider";
import { t, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { GENDER_OPTIONS } from "@/lib/onboarding-options";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";

type FormSnapshot = { username: string; birthYear: string; gender: string; country: string };
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
  const [initialSnapshot, setInitialSnapshot] = useState<FormSnapshot | null>(null);
  const [isSavingDemo, setIsSavingDemo] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
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
      setEmail(data.email ?? null);
      setAccessLevel(data.accessLevel ?? null);
      const snap: FormSnapshot = {
        username: data.username ?? "",
        birthYear: data.birthYear ? String(data.birthYear) : "",
        gender: data.gender ?? "",
        country: data.country ?? "",
      };
      setUsername(snap.username);
      setBirthYear(snap.birthYear);
      setGender(snap.gender);
      setCountry(snap.country);
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

  if (!isLoaded || !hasCheckedBypass || (sessionEligible && !hasLoadedDemographics)) {
    return (
      <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
        <div className="mx-auto max-w-[640px] px-5 py-10">
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

  if (!sessionEligible) { router.push("/sign-in"); return null; }

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
  const isLocaleDirty = selectedLocale !== savedLocale;
  const isDirty = isDemographicsDirty || isLocaleDirty;
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
      if (isDemographicsDirty) {
        const res = await fetch("/api/profile/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username.trim(), birthYear: Number(birthYear), gender, country }) });
        if (!res.ok) throw new Error("Save failed");
        setInitialSnapshot({ username: username.trim(), birthYear, gender, country });
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
    } catch (e) { console.error(e); showToast(t("profile.deleteError", locale), "error"); setShowDeleteModal(false); } finally { if (!deleted) setIsDeleting(false); }
  };

  const inputClass = (field: InvalidField, touched: boolean, valid: boolean, value: string) =>
    `min-h-[44px] rounded-lg border-[1.5px] px-3.5 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none transition-all ${
      touched && value !== "" && !valid
        ? "border-rose-300 bg-rose-50/50"
        : "border-[var(--color-border-default)] bg-white focus:border-[var(--color-action-primary-bg)] focus:shadow-[0_0_0_3px_rgba(61,107,94,0.08)]"
    } ${invalidFieldFlash === field ? "ring-2 ring-rose-300" : ""}`;

  const pillClass = (active: boolean) =>
    `min-h-[44px] rounded-full border-[1.5px] px-[18px] py-2 text-xs transition-all ${
      active
        ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)] text-white shadow-md shadow-[var(--color-action-primary-bg)]/15"
        : "border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-self)] hover:bg-[var(--color-surface-self-accent-soft)] hover:text-[var(--color-action-primary-bg)]"
    }`;

  const planLabel = accessLevel === "self_plus" ? "Plus" : "Free";

  return (
    <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <div className="mx-auto max-w-[640px] px-5 pb-12 lg:px-0">

        {/* ═══ HERO ═══ */}
        <div className="border-b border-[var(--color-border-default)] py-7">
          <div className="mb-2.5 flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-fraunces text-[22px] font-medium text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-fraunces text-xl text-[var(--color-text-primary)]">{displayName}</h1>
              <p className="text-xs text-[var(--color-text-muted)]">{email}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
            {t("profile.heroSubtitle", locale)}
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {SELF_PAYWALL_ENABLED && (
              <span className="flex items-center gap-[5px] text-[11px] text-[var(--color-text-muted)]">
                <span className="h-[5px] w-[5px] rounded-full bg-[var(--color-action-primary-bg)]" />
                {planLabel}
              </span>
            )}
            <span className="flex items-center gap-[5px] text-[11px] text-[var(--color-text-muted)]">
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--color-accent-primary)]" />
              {locale === "hu" ? "Magyar" : "English"}
            </span>
          </div>
          <Link
            href="/profile/results"
            className="mt-4 inline-flex min-h-[40px] items-center rounded-lg border border-[var(--color-border-default)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
          >
            {locale === "hu" ? "Eredményeim megnyitása" : "Open my results"}
          </Link>
        </div>

        {/* ═══ SZERVEZETI TAGSÁG ═══ */}
        {orgInfo && orgInfo.memberships.length > 0 && (
          <div className="border-b border-[var(--color-border-default)] py-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("profile.orgSectionTitle", locale)}</h2>
            <p className="mb-4 text-xs text-[var(--color-text-muted)]">{t("profile.orgSectionSub", locale)}</p>
            <div className="flex flex-col gap-3">
              {orgInfo.memberships.map((m) => {
                const roleLabel =
                  m.role === "ORG_ADMIN"
                    ? t("profile.orgRoleAdmin", locale)
                    : m.role === "ORG_CONSULTANT"
                      ? t("profile.orgRoleConsultant", locale)
                      : m.role === "ORG_MANAGER"
                      ? t("profile.orgRoleManager", locale)
                      : t("profile.orgRoleMember", locale);
                const orgTeams = orgInfo.teams.filter((team) => team.orgId === m.orgId);
                const canOpenOrg = m.role === "ORG_ADMIN" || m.role === "ORG_CONSULTANT" || m.role === "ORG_MANAGER";
                return (
                  <div key={m.orgId} className="rounded-xl border border-[var(--color-border-default)] bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {canOpenOrg ? (
                        <Link href={`/org/${m.orgId}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] hover:underline">
                          {m.orgName ?? m.orgId}
                        </Link>
                      ) : (
                        <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{m.orgName ?? m.orgId}</span>
                      )}
                      <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                        {roleLabel}
                      </span>
                    </div>
                    {orgTeams.length > 0 && (
                      <div className="mt-2.5">
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[1px] text-[var(--color-text-muted)]">
                          {t("profile.orgTeamsLabel", locale)}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {orgTeams.map((team) => (
                            <Link
                              key={team.id}
                              href={`/team/${team.id}`}
                              className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                            >
                              {team.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ RÓLAD ═══ */}
        <div className="border-b border-[var(--color-border-default)] py-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("profile.sectionAbout", locale)}</h2>
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">{t("profile.sectionAboutSub", locale)}</p>

          <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
              {t("onboarding.usernameLabel", locale)}
              <input
                ref={usernameInputRef}
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => setUsernameTouched(true)}
                placeholder={t("onboarding.usernamePlaceholder", locale)} minLength={2} maxLength={20}
                className={inputClass("username", usernameTouched, usernameValid, username)}
              />
              <span className="text-[10px] text-[var(--color-text-muted)]">{t("onboarding.usernameHint", locale)}</span>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
              {t("onboarding.birthYearLabel", locale)}
              <input
                ref={birthYearInputRef}
                type="number" inputMode="numeric" value={birthYear}
                onChange={(e) => { if (e.target.value.length <= 4) setBirthYear(e.target.value); }}
                onBlur={() => setBirthYearTouched(true)}
                placeholder={t("onboarding.birthYearPlaceholder", locale)} min={minBirthYear} max={maxBirthYear}
                className={`${inputClass("birthYear", birthYearTouched, birthYearValid, birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
              <span className="text-[10px] text-[var(--color-text-muted)]">{minBirthYear}–{maxBirthYear}</span>
            </label>
          </div>

          <div className={`mt-5 rounded-lg p-1 transition ${invalidFieldFlash === "gender" ? "bg-rose-50/60 ring-2 ring-rose-300" : ""}`}>
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{t("onboarding.genderLabel", locale)}</span>
            <div className="mt-1 flex flex-wrap gap-[5px]">
              {GENDER_OPTIONS.map((opt, idx) => (
                <button key={opt.value} ref={idx === 0 ? genderFirstButtonRef : undefined} type="button" onClick={() => setGender(opt.value)} className={pillClass(gender === opt.value)}>
                  {t(opt.labelKey, locale)}
                </button>
              ))}
            </div>
          </div>

          <div ref={countryFieldRef} className={`mt-5 rounded-lg transition ${invalidFieldFlash === "country" ? "bg-rose-50/60 p-1 ring-2 ring-rose-300" : ""}`}>
            <PickerTrigger label={t("onboarding.countryLabel", locale)} value={countryLabel} placeholder={t("onboarding.countryPlaceholder", locale)} onClick={() => setCountryPickerOpen(true)} />
          </div>
        </div>

        {/* ═══ MEGJELENÉS ÉS NYELV ═══ */}
        <div className="border-b border-[var(--color-border-default)] py-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("profile.sectionLanguage", locale)}</h2>
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">{t("profile.sectionLanguageSub", locale)}</p>
          <div className="flex gap-[5px]">
            {SUPPORTED_LOCALES.map((loc) => (
              <button key={loc} type="button" onClick={() => setSelectedLocale(loc)} className={pillClass(selectedLocale === loc)}>
                {t(`locale.${loc}` as const, loc)}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ SAVE ROW ═══ */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] py-4">
          <div className="flex items-center gap-[5px] text-[11px] text-[var(--color-text-muted)]">
            <span className={`h-1.5 w-1.5 rounded-full ${isDirty ? "bg-[var(--color-accent-primary)]" : "bg-[var(--color-action-primary-bg)]"}`} />
            {isDirty
              ? t("profile.saveUnsaved", locale)
              : saveState === "saved"
                ? t("profile.saveSaved", locale)
                : t("profile.saveNoChanges", locale)}
          </div>
          <button
            type="button" onClick={handleSave} disabled={!canSubmitDemo}
            className={`rounded-lg bg-[var(--color-action-primary-bg)] px-6 py-2.5 text-[13px] font-semibold text-white transition-all ${canSubmitDemo ? "hover:brightness-[1.06]" : "cursor-default opacity-35"}`}
          >
            {isSavingDemo ? t("actions.save", locale) : t("profile.saveButton", locale)}
          </button>
        </div>

        {/* ═══ DANGER BOX ═══ */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e8cece]">
          <div className="flex items-center gap-1.5 border-b border-[#e8cece] bg-[#fdf6f6] px-[18px] py-3">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f5dede] text-[10px] text-[#c0392b]">!</div>
            <span className="text-xs font-semibold text-[#a93226]">{t("profile.sectionAccount", locale)}</span>
          </div>
          <div className="bg-white p-[18px]">
            {/* Sign out */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-[var(--color-text-secondary)]">{t("profile.logoutTitle", locale)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{t("profile.logoutSub", locale)}</p>
              </div>
              <button type="button" onClick={() => signOut()} className="shrink-0 rounded-lg border border-[var(--color-border-default)] bg-white px-[18px] py-[7px] text-xs text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-secondary)]">
                {t("profile.logoutButton", locale)}
              </button>
            </div>
            <div className="my-2.5 h-px bg-[#f0e0e0]" />
            {/* Delete */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-[#a93226]">{t("profile.deleteTitle", locale)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{t("profile.deleteBody", locale)}</p>
              </div>
              <button type="button" onClick={() => setShowDeleteModal(true)} disabled={isDeleting}
                className="shrink-0 rounded-lg border border-[#e8b4b4] bg-[#fdf0f0] px-[18px] py-[7px] text-xs text-[#c0392b] transition-all hover:border-[#d4a0a0] hover:bg-[#f5dede] disabled:opacity-50"
              >
                {isDeleting ? t("actions.deleting", locale) : t("actions.deleteProfile", locale)}
              </button>
            </div>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm}
        title={t("profile.confirmTitle", locale)} description={t("profile.confirmBody", locale)}
        confirmText={t("profile.modalConfirm", locale)} cancelText={t("profile.modalCancel", locale)}
        loadingText={t("actions.deleting", locale)} loadingNote={t("profile.deleteLoadingNote", locale)}
        loadingDurationMs={DELETE_GOODBYE_MS} variant="danger" isLoading={isDeleting}
      />

      <Picker isOpen={countryPickerOpen} onClose={() => setCountryPickerOpen(false)} onSelect={setCountry}
        options={countryOptions} selectedValue={country} title={t("onboarding.countryLabel", locale)}
        searchable searchPlaceholder={t("onboarding.countryPlaceholder", locale)}
      />
    </div>
  );
}
