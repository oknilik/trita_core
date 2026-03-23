"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";
import { toggleBtn, inputBase } from "@/lib/onboarding-styles";

// ── Constants ─────────────────────────────────────────────────────────────────

type Step = 1 | 2;

const GENDER_OPTIONS = [
  { value: "male", label: "Férfi" },
  { value: "female", label: "Nő" },
  { value: "other", label: "Egyéb" },
  { value: "prefer_not_to_say", label: "Nem kívánom megadni" },
];

const STEP_LABELS = ["Profil", "Kész"];

// ── Props ──────────────────────────────────────────────────────────────────────

interface JoinClientProps {
  inviteId: string;
  teamId: string;
  teamName: string;
  orgName: string;
  existingProfile: { username: string | null; onboardedAt: string } | null;
  existingOrg: { orgId: string; orgName: string } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JoinClient({
  inviteId,
  teamId: _teamId,
  teamName,
  orgName,
  existingProfile,
  existingOrg,
}: JoinClientProps) {
  const router = useRouter();

  const isNewUser = !existingProfile;
  const isExistingFree = Boolean(existingProfile) && !existingOrg;
  const isOrgSwitch = Boolean(existingProfile) && Boolean(existingOrg);

  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;

  const progress = ((step - 1) / 1) * 100;

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    const u = username.trim();
    if (u.length < 2) e.username = "Legalább 2 karakter szükséges";
    else if (u.length > 20) e.username = "Maximum 20 karakter";
    if (!gender) e.gender = "Kérjük válassz";
    const yr = Number(birthYear);
    if (!birthYear || birthYear.length !== 4 || yr < minBirthYear || yr > maxBirthYear) {
      e.birthYear = `${minBirthYear}–${maxBirthYear} között`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleJoinNew = async () => {
    if (isSubmitting || !consent) return;
    setIsSubmitting(true);
    try {
      const profileRes = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          gender,
          birthYear: Number(birthYear),
          consentedAt: new Date().toISOString(),
        }),
      });
      if (!profileRes.ok) throw new Error("profile_save_failed");

      const joinRes = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!joinRes.ok) throw new Error("join_failed");

      router.push("/assessment");
    } catch {
      setErrors((prev) => ({ ...prev, submit: "Hiba történt, kérjük próbáld újra." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinExisting = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const joinRes = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!joinRes.ok) throw new Error("join_failed");
      router.push("/dashboard");
    } catch {
      setErrors((prev) => ({ ...prev, submit: "Hiba történt, kérjük próbáld újra." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchOrg = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const switchRes = await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!switchRes.ok) throw new Error("switch_failed");
      router.push("/dashboard");
    } catch {
      setErrors((prev) => ({ ...prev, submit: "Hiba történt, kérjük próbáld újra." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + context */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              // meghívó
            </p>
            <h1 className="font-fraunces text-3xl text-ink">
              Csatlakozz a csapathoz
            </h1>
            <p className="mt-2 text-sm text-ink-body/70">
              <span className="font-semibold text-ink">{orgName}</span>
              {orgName && " · "}
              <span>{teamName}</span>
            </p>
          </div>
        </div>

        {/* Step indicator — only for new users */}
        {isNewUser && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              {STEP_LABELS.map((label, i) => (
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
                    className={`text-xs font-medium ${
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
        )}

        {/* Card */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">

          {/* ── Org switch ─────────────────────────────────────────────────── */}
          {isOrgSwitch && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  // szervezetváltás
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  Már tartozol egy szervezethez
                </h2>
                <p className="mt-2 text-sm text-ink-body">
                  Jelenleg a{" "}
                  <span className="font-semibold text-ink">{existingOrg!.orgName}</span>{" "}
                  tagja vagy. Ha csatlakozol a{" "}
                  <span className="font-semibold text-ink">{orgName}</span> szervezethez,
                  az előző tagságod törlésre kerül.
                </p>
              </div>

              {errors.submit && (
                <p className="text-sm text-bronze">{errors.submit}</p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSwitchOrg}
                  disabled={isSubmitting}
                  className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting ? "Váltás..." : `Átváltás a(z) ${orgName} szervezetbe →`}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="min-h-[44px] w-full rounded-lg border border-sand text-sm font-medium text-ink-body hover:bg-cream"
                >
                  Maradok a jelenlegi szervezetben
                </button>
              </div>
            </div>
          )}

          {/* ── Existing free user ─────────────────────────────────────────── */}
          {isExistingFree && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  // csatlakozás
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  Üdv,{existingProfile?.username ? ` ${existingProfile.username}` : ""}!
                </h2>
                <p className="mt-2 text-sm text-ink-body">
                  Csatlakozol a{" "}
                  <span className="font-semibold text-ink">{orgName}</span> szervezethez
                  és a <span className="font-semibold text-ink">{teamName}</span> csapathoz.
                  A meglévő eredményeid megmaradnak.
                </p>
              </div>

              {errors.submit && (
                <p className="text-sm text-bronze">{errors.submit}</p>
              )}

              <button
                type="button"
                onClick={handleJoinExisting}
                disabled={isSubmitting}
                className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {isSubmitting ? "Csatlakozás..." : "Csatlakozás →"}
              </button>
            </div>
          )}

          {/* ── New user: Step 1 — Személyes adatok ───────────────────────── */}
          {isNewUser && step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">// 01</p>
                <h2 className="font-fraunces text-2xl text-ink">Személyes adatok</h2>
                <p className="mt-1 text-sm text-ink-body/70">
                  Ezek szükségesek a személyre szabott csapatképhez.
                </p>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-ink">
                  Megjelenítési név
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((p) => ({ ...p, username: "" }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
                  placeholder="pl. Kovács Péter"
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
                  Születési év
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => {
                    if (e.target.value.length <= 4) {
                      setBirthYear(e.target.value);
                      setErrors((p) => ({ ...p, birthYear: "" }));
                    }
                  }}
                  placeholder={`pl. ${currentYear - 30}`}
                  className={`${inputBase(!!errors.birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <span className={`pl-1 text-xs ${errors.birthYear ? "text-bronze" : "text-muted"}`}>
                  {errors.birthYear || `${minBirthYear}–${maxBirthYear} között`}
                </span>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink">Nem</span>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setGender(opt.value);
                        setErrors((p) => ({ ...p, gender: "" }));
                      }}
                      className={toggleBtn(gender === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <span className="pl-1 text-xs text-bronze">{errors.gender}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStep1Next}
                className="mt-2 min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                Tovább →
              </button>
            </div>
          )}

          {/* ── New user: Step 2 — Kész ────────────────────────────────────── */}
          {isNewUser && step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">// 02</p>
                <h2 className="font-fraunces text-2xl text-ink">Egy utolsó lépés</h2>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setErrors((p) => ({ ...p, consent: "" }));
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-sand accent-sage focus:ring-sage/30"
                />
                <span className="text-sm text-ink-body">
                  Hozzájárulok adataim kezeléséhez a{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-bronze underline hover:text-bronze-dark"
                  >
                    Adatvédelmi tájékoztató
                  </a>{" "}
                  alapján.
                </span>
              </label>

              {errors.consent && (
                <span className="text-sm text-bronze">{errors.consent}</span>
              )}

              {errors.submit && (
                <p className="text-center text-sm text-bronze">{errors.submit}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] rounded-lg border border-sand px-5 text-sm font-medium text-ink-body transition-colors hover:border-sage/40"
                >
                  ← Vissza
                </button>
                <button
                  type="button"
                  onClick={handleJoinNew}
                  disabled={isSubmitting || !consent}
                  className="min-h-[48px] flex-1 rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting ? "Csatlakozás..." : "Csatlakozás és felmérés indítása →"}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Ezeket az adatokat bármikor módosíthatod a profil oldalon.
        </p>

      </div>
    </div>
  );
}
