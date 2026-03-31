"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";
import { useLocale } from "@/components/LocaleProvider";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { toggleBtn, inputBase } from "@/lib/onboarding-styles";
import { getCountryOptions } from "@/lib/countries";
import { evaluateProductLayersForScope } from "@/lib/domain/layers-4plus2";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface WizardState {
  username: string;
  birthYear: string;
  gender: string;
  country: string;
  role: string;
  orgName: string;
  orgId: string;
  industry: string;
  teamSize: string;
  teamName: string;
  consent: boolean;
}

type FieldError = Partial<Record<keyof WizardState, string>>;

// ── Constants ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male", label: { hu: "Férfi", en: "Male" } },
  { value: "female", label: { hu: "Nő", en: "Female" } },
  { value: "other", label: { hu: "Egyéb", en: "Other" } },
  {
    value: "prefer_not_to_say",
    label: { hu: "Nem kívánom megadni", en: "Prefer not to say" },
  },
];

const ROLE_OPTIONS = [
  { hu: "CEO", en: "CEO" },
  { hu: "Vezető", en: "Manager" },
  { hu: "HR", en: "HR" },
  { hu: "Egyéb", en: "Other" },
] as const;
const INDUSTRY_OPTIONS = [
  { hu: "Tech / SaaS", en: "Tech / SaaS" },
  { hu: "Gyártás", en: "Manufacturing" },
  { hu: "Kereskedelem", en: "Commerce" },
  { hu: "Szolgáltatás", en: "Services" },
  { hu: "Egyéb", en: "Other" },
] as const;
const TEAM_SIZE_OPTIONS = ["1–9", "10–49", "50–249", "250+"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function OrgOnboardingWizard() {
  const router = useRouter();
  const { locale } = useLocale();
  const isHu = locale !== "en";
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const [state, setState] = useState<WizardState>({
    username: "",
    birthYear: "",
    gender: "",
    country: "",
    role: "",
    orgName: "",
    orgId: "",
    industry: "",
    teamSize: "",
    teamName: "",
    consent: false,
  });

  const countryOptions = useMemo(
    () => getCountryOptions(isHu ? "hu" : "en"),
    [isHu],
  );
  const countryLabel = useMemo(
    () => countryOptions.find((c) => c.value === state.country)?.label,
    [state.country, countryOptions],
  );

  const set = (key: keyof WizardState) => (value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;

  // ── Validation ────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const e: FieldError = {};
    const u = state.username.trim();
    if (u.length < 2) {
      e.username = isHu ? "Legalább 2 karakter szükséges" : "At least 2 characters are required";
    } else if (u.length > 20) {
      e.username = isHu ? "Maximum 20 karakter" : "Maximum 20 characters";
    }
    const yr = Number(state.birthYear);
    if (
      !state.birthYear ||
      state.birthYear.length !== 4 ||
      !Number.isInteger(yr) ||
      yr < minBirthYear ||
      yr > maxBirthYear
    ) {
      e.birthYear = isHu
        ? `${minBirthYear}–${maxBirthYear} között`
        : `Between ${minBirthYear} and ${maxBirthYear}`;
    }
    if (!state.gender) e.gender = isHu ? "Kérjük válassz" : "Please choose one";
    if (!state.country) e.country = isHu ? "Kérjük válassz" : "Please choose one";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: FieldError = {};
    const n = state.orgName.trim();
    if (!n) e.orgName = isHu ? "A cég neve kötelező" : "Company name is required";
    else if (n.length > 100) e.orgName = isHu ? "Maximum 100 karakter" : "Maximum 100 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: FieldError = {};
    const n = state.teamName.trim();
    if (!n) e.teamName = isHu ? "A csapat neve kötelező" : "Team name is required";
    else if (n.length > 60) e.teamName = isHu ? "Maximum 60 karakter" : "Maximum 60 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleStep1Next = () => {
    if (!validateStep1()) {
      document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      return;
    }
    setStep(2);
  };

  const handleStep2Next = async () => {
    if (!validateStep2()) {
      document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.orgName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        set("orgId")(data.org.id);
        setStep(3);
      } else if (data.error === "ALREADY_IN_ORG") {
        const orgRes = await fetch("/api/org");
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          if (orgData.orgs?.[0]) set("orgId")(orgData.orgs[0].id);
        }
        setStep(3);
      } else {
        setErrors((prev) => ({
          ...prev,
          orgName: isHu ? "Hiba történt, próbáld újra" : "Something went wrong. Please try again.",
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        orgName: isHu ? "Hiba történt, próbáld újra" : "Something went wrong. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Finish = async (skip = false) => {
    if (!skip && !validateStep3()) {
      document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      return;
    }
    setIsSubmitting(true);
    const teamName = skip
      ? (isHu ? "Első csapatom" : "My first team")
      : state.teamName.trim();
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, orgId: state.orgId }),
      });
      if (!res.ok) { setStep(4); return; }
      const data = await res.json();
      const createdTeamId = data.team.id;
      setTeamId(createdTeamId);

      const inviteRes = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: createdTeamId }),
      });
      if (!inviteRes.ok) { setStep(4); return; }
      const inviteData = await inviteRes.json();
      setInviteUrl(inviteData.inviteUrl);
    } catch {
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Finish = async () => {
    if (isSubmitting || !state.consent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: state.username.trim(),
          birthYear: Number(state.birthYear),
          gender: state.gender,
          country: state.country,
          consentedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/dashboard");
    } catch {
      setErrors((prev) => ({
        ...prev,
        consent: isHu ? "Hiba történt, kérjük próbáld újra." : "Something went wrong. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Progress ──────────────────────────────────────────────────────────────

  const stepLabels = isHu
    ? ["Profil", "Cég", "Csapat", "Kész"]
    : ["Profile", "Company", "Team", "Done"];
  const progress = ((step - 1) / 3) * 100;
  const hasProfileStarted = Boolean(
    state.username.trim() ||
    state.birthYear.trim() ||
    state.gender ||
    state.country,
  );
  const onboardingLayerStatuses = evaluateProductLayersForScope(isHu ? "hu" : "en", {
    hasSelfAssessmentStarted: hasProfileStarted,
    hasSelfAssessment: false,
    hasBelbinStarted: Boolean(state.teamName.trim()) || Boolean(teamId),
    hasBelbin: false,
    hasStrengthProfile: false,
    hasObserverFeedback: false,
    hasTeamInsights: false,
    hasOrgCampaign: false,
    hasValuesLayerStarted: false,
    hasValuesLayer: false,
    hasConflictLayerStarted: false,
    hasConflictLayer: false,
    hasPlusAccess: true,
  }, "results", "self");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + heading */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <h1 className="font-fraunces text-3xl text-ink">
              {isHu ? "Üdvözlünk a tritán." : "Welcome to trita."}
            </h1>
            <p className="mt-2 text-sm text-ink-body/70">
              {isHu
                ? "3 perc és látod az első csapatképet."
                : "In 3 minutes you'll unlock your first team snapshot."}
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

        <div className="mb-6 rounded-xl border border-sand bg-white/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {isHu ? "Layer útiterv" : "Layer roadmap"}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {onboardingLayerStatuses.map((layer) => {
              const statusLabel = layer.status === "COMPLETED"
                ? (isHu ? "Kész" : "Completed")
                : layer.status === "IN_PROGRESS"
                  ? (isHu ? "Folyamatban" : "In progress")
                  : layer.status === "AVAILABLE"
                    ? (isHu ? "Elérhető" : "Available")
                    : (isHu ? "Zárolt" : "Locked");
              const statusClasses = layer.status === "COMPLETED"
                ? "bg-sage/15 text-sage-dark"
                : layer.status === "IN_PROGRESS"
                  ? "bg-bronze/20 text-bronze-dark"
                  : layer.status === "AVAILABLE"
                    ? "bg-[#d4a15a]/20 text-[#8f602f]"
                    : "bg-sand text-muted";

              return (
                <div key={layer.id} className="flex items-center justify-between rounded-lg border border-sand/80 bg-cream px-3 py-2">
                  <span className="text-[12px] font-medium text-ink">{layer.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-body">
            {isHu
              ? "A +2 réteg opcionális mélyítésként jelenik meg, amikor az alap self és team rétegek készen állnak."
              : "The +2 layers appear as optional deepening once the core self and team layers are ready."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">

          {/* ── Step 1: Profil ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {isHu ? "Lépés 01" : "Step 01"}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {isHu ? "Személyes adatok" : "Personal details"}
                </h2>
                <p className="mt-1 text-sm text-ink-body/70">
                  {isHu
                    ? "Ezek szükségesek a személyre szabott csapatképhez."
                    : "These details are required for personalized team insight."}
                </p>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {isHu ? "Megjelenítési név" : "Display name"}
                </label>
                <input
                  type="text"
                  value={state.username}
                  onChange={(e) => set("username")(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
                  placeholder={isHu ? "pl. Kovács Péter" : "e.g. Alex Walker"}
                  maxLength={20}
                  className={inputBase(!!errors.username)}
                  autoFocus
                />
                {errors.username && (
                  <span className="pl-1 text-xs text-bronze">{errors.username}</span>
                )}
              </div>

              {/* Birth year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {isHu ? "Születési év" : "Birth year"}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={state.birthYear}
                  onChange={(e) => {
                    if (e.target.value.length <= 4) set("birthYear")(e.target.value);
                  }}
                  placeholder={isHu ? `pl. ${currentYear - 30}` : `e.g. ${currentYear - 30}`}
                  min={minBirthYear}
                  max={maxBirthYear}
                  className={`${inputBase(!!errors.birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <span className={`pl-1 text-xs ${errors.birthYear ? "text-bronze" : "text-muted"}`}>
                  {errors.birthYear ||
                    (isHu
                      ? `${minBirthYear}–${maxBirthYear} között`
                      : `Between ${minBirthYear} and ${maxBirthYear}`)}
                </span>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink">{isHu ? "Nem" : "Gender"}</span>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("gender")(opt.value)}
                      className={toggleBtn(state.gender === opt.value)}
                    >
                      {opt.label[isHu ? "hu" : "en"]}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <span className="pl-1 text-xs text-bronze">{errors.gender}</span>
                )}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-2">
                <PickerTrigger
                  label={isHu ? "Ország" : "Country"}
                  value={countryLabel}
                  placeholder={isHu ? "Válassz országot" : "Select country"}
                  onClick={() => setCountryPickerOpen(true)}
                />
                {errors.country && (
                  <span className="pl-1 text-xs text-bronze">{errors.country}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="mt-2 min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {isHu ? "Tovább →" : "Continue →"}
              </button>
            </div>
          )}

          {/* ── Step 2: Cég ───────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {isHu ? "Lépés 02" : "Step 02"}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {isHu ? "A céged" : "Your company"}
                </h2>
                <p className="mt-1 text-sm text-ink-body/70">
                  {isHu
                    ? "Ezek az adatok segítenek személyre szabni a csapatképet."
                    : "These details help us tailor the team insight."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {isHu ? "Mi a szerepköröd?" : "What is your role?"}{" "}
                  <span className="font-normal text-muted">
                    {isHu ? "(opcionális)" : "(optional)"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.hu}
                      type="button"
                      onClick={() => set("role")(state.role === r.hu ? "" : r.hu)}
                      className={toggleBtn(state.role === r.hu)}
                    >
                      {r[isHu ? "hu" : "en"]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {isHu ? "Cég neve" : "Company name"} <span className="text-bronze">*</span>
                </label>
                <input
                  type="text"
                  value={state.orgName}
                  onChange={(e) => set("orgName")(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep2Next()}
                  placeholder={isHu ? "pl. Kovács és Társa Kft." : "e.g. Acme Inc."}
                  maxLength={100}
                  className={inputBase(!!errors.orgName)}
                  autoFocus
                />
                {errors.orgName && (
                  <span className="pl-1 text-xs text-bronze">{errors.orgName}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {isHu ? "Iparág" : "Industry"}{" "}
                  <span className="font-normal text-muted">
                    {isHu ? "(opcionális)" : "(optional)"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <button
                      key={ind.hu}
                      type="button"
                      onClick={() =>
                        set("industry")(state.industry === ind.hu ? "" : ind.hu)
                      }
                      className={toggleBtn(state.industry === ind.hu)}
                    >
                      {ind[isHu ? "hu" : "en"]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  {isHu ? "Csapat mérete" : "Team size"}{" "}
                  <span className="font-normal text-muted">
                    {isHu ? "(opcionális)" : "(optional)"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TEAM_SIZE_OPTIONS.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => set("teamSize")(state.teamSize === sz ? "" : sz)}
                      className={toggleBtn(state.teamSize === sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] rounded-lg border border-sand px-5 text-sm font-medium text-ink-body transition-colors hover:border-sage/40"
                >
                  {isHu ? "← Vissza" : "← Back"}
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  disabled={isSubmitting}
                  className="min-h-[48px] flex-1 rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting
                    ? (isHu ? "Létrehozás..." : "Creating...")
                    : (isHu ? "Tovább →" : "Continue →")}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Csapat ────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {isHu ? "Lépés 03" : "Step 03"}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {isHu ? "Az első csapatod" : "Your first team"}
                </h2>
                <p className="mt-1 text-sm text-ink-body/70">
                  {isHu
                    ? "Adj nevet a csapatnak, majd oszd meg a meghívó linket a tagokkal."
                    : "Name your team, then share the invite link with members."}
                </p>
              </div>

              {!teamId ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-ink">
                      {isHu ? "Csapat neve" : "Team name"} <span className="text-bronze">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.teamName}
                      onChange={(e) => set("teamName")(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStep3Finish(false)}
                      placeholder={isHu ? "pl. Értékesítési csapat" : "e.g. Sales Team"}
                      maxLength={60}
                      className={inputBase(!!errors.teamName)}
                      autoFocus
                    />
                    {errors.teamName && (
                      <span className="pl-1 text-xs text-bronze">{errors.teamName}</span>
                    )}
                  </div>

                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="min-h-[48px] rounded-lg border border-sand px-5 text-sm font-medium text-ink-body transition-colors hover:border-sage/40"
                    >
                      {isHu ? "← Vissza" : "← Back"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep3Finish(false)}
                      disabled={isSubmitting}
                      className="min-h-[48px] flex-1 rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                    >
                      {isSubmitting
                        ? (isHu ? "Létrehozás..." : "Creating...")
                        : (isHu ? "Csapat létrehozása →" : "Create team →")}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-center text-xs text-muted underline underline-offset-2 transition-colors hover:text-ink-body"
                  >
                    {isHu ? "Kihagyom most, beállítom később" : "Skip for now, set up later"}
                  </button>
                </>
              ) : (
                /* Invite link display */
                <div className="flex flex-col gap-5">
                  <div className="rounded-xl border border-sand bg-cream p-4">
                    <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">
                      {isHu ? "Meghívó link" : "Invite link"}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg border border-sand bg-white px-3 py-2 text-xs text-ink">
                        {inviteUrl}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition-all ${
                          copied
                            ? "bg-sage text-white"
                            : "bg-sage text-white hover:bg-sage-dark"
                        }`}
                      >
                        {copied
                          ? (isHu ? "✓ Másolva!" : "✓ Copied!")
                          : (isHu ? "Másolás" : "Copy")}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-ink-body/70">
                    {isHu
                      ? "Küldd el ezt a linket a csapattagjaidnak. Regisztráció után automatikusan csatlakoznak a csapathoz és elkezdhetik a felmérést."
                      : "Share this link with your teammates. After registration they will join the team automatically and can start the assessment."}
                  </p>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="min-h-[48px] w-full rounded-lg bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-body"
                  >
                    {isHu ? "Megyek a dashboardra →" : "Go to dashboard →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Kész ──────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {isHu ? "Lépés 04" : "Step 04"}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {isHu ? "Egy utolsó lépés" : "One final step"}
                </h2>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={state.consent}
                  onChange={(e) => {
                    setState((prev) => ({ ...prev, consent: e.target.checked }));
                    setErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-sand accent-sage focus:ring-sage/30"
                />
                <span className="text-sm text-ink-body">
                  {isHu
                    ? "Hozzájárulok adataim kezeléséhez az"
                    : "I consent to the processing of my data according to the"}{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-bronze underline hover:text-bronze-dark"
                  >
                    {isHu ? "Adatvédelmi tájékoztató" : "Privacy Policy"}
                  </a>{" "}
                  {isHu ? "alapján." : "."}
                </span>
              </label>

              {errors.consent && (
                <span className="text-sm text-bronze">{errors.consent}</span>
              )}

              <button
                type="button"
                onClick={handleStep4Finish}
                disabled={isSubmitting || !state.consent}
                className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {isSubmitting
                  ? (isHu ? "Mentés..." : "Saving...")
                  : (isHu ? "Beállítások mentése és tovább →" : "Save settings and continue →")}
              </button>
            </div>
          )}

        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {isHu
            ? "Bármikor módosíthatod ezeket a beállításokat a profil oldalon."
            : "You can update these settings anytime on your profile page."}
        </p>
      </div>

      {/* Country picker */}
      <Picker
        isOpen={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={(val) => set("country")(val)}
        options={countryOptions}
        selectedValue={state.country}
        searchable
        title={isHu ? "Ország" : "Country"}
        searchPlaceholder={isHu ? "Keresés..." : "Search..."}
      />
    </div>
  );
}
