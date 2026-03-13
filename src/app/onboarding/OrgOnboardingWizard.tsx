"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { toggleBtn, inputBase } from "@/lib/onboarding-styles";
import { getCountryOptions } from "@/lib/countries";

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
  { value: "male", label: "Férfi" },
  { value: "female", label: "Nő" },
  { value: "other", label: "Egyéb" },
  { value: "prefer_not_to_say", label: "Nem kívánom megadni" },
];

const ROLE_OPTIONS = ["CEO", "Vezető", "HR", "Egyéb"] as const;
const INDUSTRY_OPTIONS = ["Tech / SaaS", "Gyártás", "Kereskedelem", "Szolgáltatás", "Egyéb"] as const;
const TEAM_SIZE_OPTIONS = ["1–9", "10–49", "50–249", "250+"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function OrgOnboardingWizard() {
  const router = useRouter();
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

  const countryOptions = useMemo(() => getCountryOptions("hu"), []);
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
    if (u.length < 2) e.username = "Legalább 2 karakter szükséges";
    else if (u.length > 20) e.username = "Maximum 20 karakter";
    const yr = Number(state.birthYear);
    if (
      !state.birthYear ||
      state.birthYear.length !== 4 ||
      !Number.isInteger(yr) ||
      yr < minBirthYear ||
      yr > maxBirthYear
    ) {
      e.birthYear = `${minBirthYear}–${maxBirthYear} között`;
    }
    if (!state.gender) e.gender = "Kérjük válassz";
    if (!state.country) e.country = "Kérjük válassz";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: FieldError = {};
    const n = state.orgName.trim();
    if (!n) e.orgName = "A cég neve kötelező";
    else if (n.length > 100) e.orgName = "Maximum 100 karakter";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: FieldError = {};
    const n = state.teamName.trim();
    if (!n) e.teamName = "A csapat neve kötelező";
    else if (n.length > 60) e.teamName = "Maximum 60 karakter";
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
        setErrors((prev) => ({ ...prev, orgName: "Hiba történt, próbáld újra" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, orgName: "Hiba történt, próbáld újra" }));
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
    const teamName = skip ? "Első csapatom" : state.teamName.trim();
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
      setErrors((prev) => ({ ...prev, consent: "Hiba történt, kérjük próbáld újra." }));
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

  const stepLabels = ["Profil", "Cég", "Csapat", "Kész"];
  const progress = ((step - 1) / 3) * 100;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + heading */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <h1 className="font-playfair text-3xl text-[#1a1814]">
              Üdvözlünk a tritán.
            </h1>
            <p className="mt-2 text-sm text-[#3d3a35]/70">
              3 perc és látod az első csapatképet.
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
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">

          {/* ── Step 1: Profil ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">// 01</p>
                <h2 className="font-playfair text-2xl text-[#1a1814]">Személyes adatok</h2>
                <p className="mt-1 text-sm text-[#3d3a35]/70">
                  Ezek szükségesek a személyre szabott csapatképhez.
                </p>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1a1814]">
                  Megjelenítési név
                </label>
                <input
                  type="text"
                  value={state.username}
                  onChange={(e) => set("username")(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
                  placeholder="pl. Kovács Péter"
                  maxLength={20}
                  className={inputBase(!!errors.username)}
                  autoFocus
                />
                {errors.username && (
                  <span className="pl-1 text-xs text-[#c8410a]">{errors.username}</span>
                )}
              </div>

              {/* Birth year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1a1814]">
                  Születési év
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={state.birthYear}
                  onChange={(e) => {
                    if (e.target.value.length <= 4) set("birthYear")(e.target.value);
                  }}
                  placeholder={`pl. ${currentYear - 30}`}
                  min={minBirthYear}
                  max={maxBirthYear}
                  className={`${inputBase(!!errors.birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <span className={`pl-1 text-xs ${errors.birthYear ? "text-[#c8410a]" : "text-[#a09a90]"}`}>
                  {errors.birthYear || `${minBirthYear}–${maxBirthYear} között`}
                </span>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#1a1814]">Nem</span>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("gender")(opt.value)}
                      className={toggleBtn(state.gender === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <span className="pl-1 text-xs text-[#c8410a]">{errors.gender}</span>
                )}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-2">
                <PickerTrigger
                  label="Ország"
                  value={countryLabel}
                  placeholder="Válassz országot"
                  onClick={() => setCountryPickerOpen(true)}
                />
                {errors.country && (
                  <span className="pl-1 text-xs text-[#c8410a]">{errors.country}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="mt-2 min-h-[48px] w-full rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:opacity-50"
              >
                Tovább →
              </button>
            </div>
          )}

          {/* ── Step 2: Cég ───────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">// 02</p>
                <h2 className="font-playfair text-2xl text-[#1a1814]">A céged</h2>
                <p className="mt-1 text-sm text-[#3d3a35]/70">
                  Ezek az adatok segítenek személyre szabni a csapatképet.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1a1814]">
                  Mi a szerepköröd?{" "}
                  <span className="font-normal text-[#a09a90]">(opcionális)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("role")(state.role === r ? "" : r)}
                      className={toggleBtn(state.role === r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1a1814]">
                  Cég neve <span className="text-[#c8410a]">*</span>
                </label>
                <input
                  type="text"
                  value={state.orgName}
                  onChange={(e) => set("orgName")(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStep2Next()}
                  placeholder="pl. Kovács és Társa Kft."
                  maxLength={100}
                  className={inputBase(!!errors.orgName)}
                  autoFocus
                />
                {errors.orgName && (
                  <span className="pl-1 text-xs text-[#c8410a]">{errors.orgName}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1a1814]">
                  Iparág{" "}
                  <span className="font-normal text-[#a09a90]">(opcionális)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => set("industry")(state.industry === ind ? "" : ind)}
                      className={toggleBtn(state.industry === ind)}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1a1814]">
                  Csapat mérete{" "}
                  <span className="font-normal text-[#a09a90]">(opcionális)</span>
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
                  className="min-h-[48px] rounded-lg border border-[#e8e4dc] px-5 text-sm font-medium text-[#3d3a35] transition-colors hover:border-[#c8410a]/40"
                >
                  ← Vissza
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  disabled={isSubmitting}
                  className="min-h-[48px] flex-1 rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:opacity-50"
                >
                  {isSubmitting ? "Létrehozás..." : "Tovább →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Csapat ────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">// 03</p>
                <h2 className="font-playfair text-2xl text-[#1a1814]">Az első csapatod</h2>
                <p className="mt-1 text-sm text-[#3d3a35]/70">
                  Adj nevet a csapatnak, majd oszd meg a meghívó linket a tagokkal.
                </p>
              </div>

              {!teamId ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#1a1814]">
                      Csapat neve <span className="text-[#c8410a]">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.teamName}
                      onChange={(e) => set("teamName")(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStep3Finish(false)}
                      placeholder="pl. Értékesítési csapat"
                      maxLength={60}
                      className={inputBase(!!errors.teamName)}
                      autoFocus
                    />
                    {errors.teamName && (
                      <span className="pl-1 text-xs text-[#c8410a]">{errors.teamName}</span>
                    )}
                  </div>

                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="min-h-[48px] rounded-lg border border-[#e8e4dc] px-5 text-sm font-medium text-[#3d3a35] transition-colors hover:border-[#c8410a]/40"
                    >
                      ← Vissza
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep3Finish(false)}
                      disabled={isSubmitting}
                      className="min-h-[48px] flex-1 rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:opacity-50"
                    >
                      {isSubmitting ? "Létrehozás..." : "Csapat létrehozása →"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-center text-xs text-[#a09a90] underline underline-offset-2 transition-colors hover:text-[#3d3a35]"
                  >
                    Kihagyom most, beállítom később
                  </button>
                </>
              ) : (
                /* Invite link display */
                <div className="flex flex-col gap-5">
                  <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4">
                    <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[#a09a90]">
                      // meghívó link
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg border border-[#e8e4dc] bg-white px-3 py-2 text-xs text-[#1a1814]">
                        {inviteUrl}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition-all ${
                          copied
                            ? "bg-[#1a5c3a] text-white"
                            : "bg-[#c8410a] text-white hover:bg-[#a8340a]"
                        }`}
                      >
                        {copied ? "✓ Másolva!" : "Másolás"}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[#3d3a35]/70">
                    Küldd el ezt a linket a csapattagjaidnak. Regisztráció után automatikusan
                    csatlakoznak a csapathoz és elkezdhetik a felmérést.
                  </p>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="min-h-[48px] w-full rounded-lg bg-[#1a1814] text-sm font-semibold text-white transition-colors hover:bg-[#3d3a35]"
                  >
                    Megyek a dashboardra →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Kész ──────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">// 04</p>
                <h2 className="font-playfair text-2xl text-[#1a1814]">Egy utolsó lépés</h2>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={state.consent}
                  onChange={(e) => {
                    setState((prev) => ({ ...prev, consent: e.target.checked }));
                    setErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#e8e4dc] accent-[#c8410a] focus:ring-[#c8410a]/30"
                />
                <span className="text-sm text-[#3d3a35]">
                  Hozzájárulok adataim kezeléséhez az{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#c8410a] underline hover:text-[#a8340a]"
                  >
                    Adatvédelmi tájékoztató
                  </a>{" "}
                  alapján.
                </span>
              </label>

              {errors.consent && (
                <span className="text-sm text-[#c8410a]">{errors.consent}</span>
              )}

              <button
                type="button"
                onClick={handleStep4Finish}
                disabled={isSubmitting || !state.consent}
                className="min-h-[48px] w-full rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:opacity-50"
              >
                {isSubmitting ? "Mentés..." : "Beállítások mentése és tovább →"}
              </button>
            </div>
          )}

        </div>

        <p className="mt-6 text-center text-xs text-[#a09a90]">
          Bármikor módosíthatod ezeket a beállításokat a profil oldalon.
        </p>
      </div>

      {/* Country picker */}
      <Picker
        isOpen={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={(val) => set("country")(val)}
        options={countryOptions}
        selectedValue={state.country}
        title="Ország"
        searchable
        searchPlaceholder="Keresés..."
      />
    </div>
  );
}
