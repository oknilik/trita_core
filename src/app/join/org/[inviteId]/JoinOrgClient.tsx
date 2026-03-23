"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";

// ── Style helpers ──────────────────────────────────────────────────────────────

const toggleBtn = (active: boolean) =>
  `min-h-[44px] rounded-lg border px-4 text-sm font-medium transition-all cursor-pointer ${
    active
      ? "border-sage bg-sage/8 text-bronze font-semibold"
      : "border-sand bg-white text-ink-body hover:border-sage/40"
  }`;

const inputBase = (error?: boolean) =>
  `min-h-[48px] w-full rounded-lg border-2 px-4 text-sm font-normal text-ink focus:outline-none transition-colors ${
    error
      ? "border-orange-400 bg-orange-50"
      : "border-sand bg-white focus:border-sage"
  }`;

// ── Constants ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male", label: "Férfi" },
  { value: "female", label: "Nő" },
  { value: "other", label: "Egyéb" },
  { value: "prefer_not_to_say", label: "Nem kívánom megadni" },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface JoinOrgClientProps {
  inviteId: string;
  orgName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JoinOrgClient({ inviteId, orgName }: JoinOrgClientProps) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;

  const validate = () => {
    const e: Record<string, string> = {};
    const u = username.trim();
    if (u.length < 2) e.username = "Legalább 2 karakter szükséges";
    else if (u.length > 20) e.username = "Maximum 20 karakter";
    if (!gender) e.gender = "Kérjük válassz";
    const yr = Number(birthYear);
    if (!birthYear || birthYear.length !== 4 || yr < minBirthYear || yr > maxBirthYear) {
      e.birthYear = `${minBirthYear}–${maxBirthYear} között`;
    }
    if (!consent) e.consent = "A hozzájárulás szükséges";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validate()) return;
    setIsSubmitting(true);

    try {
      // 1. Save minimal profile data
      const profileRes = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          gender,
          birthYear: Number(birthYear),
          country: "HU",
          consentedAt: new Date().toISOString(),
        }),
      });
      if (!profileRes.ok) throw new Error("profile_save_failed");

      // 2. Join the org
      const joinRes = await fetch("/api/org/join", {
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + context */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={48} showText={false} />
          <div className="text-center">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              // meghívó
            </p>
            <h1 className="font-fraunces text-3xl text-ink">
              Csatlakozz a szervezethez
            </h1>
            <p className="mt-2 text-sm text-ink-body/70">
              <span className="font-semibold text-ink">{orgName}</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">

            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                // 01
              </p>
              <p className="font-fraunces text-xl text-ink">Néhány alap adat</p>
              <p className="mt-0.5 text-xs text-muted">
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
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="pl. Kovács Péter"
                maxLength={20}
                className={inputBase(!!errors.username)}
                autoFocus
              />
              {errors.username && (
                <span className="pl-1 text-xs text-bronze">{errors.username}</span>
              )}
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

            {/* Divider */}
            <div className="h-px bg-sand" />

            {/* Consent */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors((p) => ({ ...p, consent: "" }));
                }}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-sage"
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
              <span className="-mt-4 pl-8 text-xs text-bronze">{errors.consent}</span>
            )}

            {errors.submit && (
              <p className="text-center text-sm text-red-600">{errors.submit}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted"
            >
              {isSubmitting ? "Csatlakozás..." : "Csatlakozás és felmérés indítása →"}
            </button>

          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Ezeket az adatokat bármikor módosíthatod a profil oldalon.
        </p>

      </div>
    </div>
  );
}
