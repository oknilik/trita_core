"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";

// ── Style helpers ──────────────────────────────────────────────────────────────

const toggleBtn = (active: boolean) =>
  `min-h-[44px] rounded-lg border px-4 text-sm font-medium transition-all cursor-pointer ${
    active
      ? "border-[#c8410a] bg-[#c8410a]/8 text-[#c8410a] font-semibold"
      : "border-[#e8e4dc] bg-white text-[#3d3a35] hover:border-[#c8410a]/40"
  }`;

const inputBase = (error?: boolean) =>
  `min-h-[48px] w-full rounded-lg border-2 px-4 text-sm font-normal text-[#1a1814] focus:outline-none transition-colors ${
    error
      ? "border-orange-400 bg-orange-50"
      : "border-[#e8e4dc] bg-white focus:border-[#c8410a]"
  }`;

// ── Constants ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male", label: "Férfi" },
  { value: "female", label: "Nő" },
  { value: "other", label: "Egyéb" },
  { value: "prefer_not_to_say", label: "Nem kívánom megadni" },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface JoinClientProps {
  inviteId: string;
  teamId: string;
  teamName: string;
  orgName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JoinClient({ inviteId, teamId, teamName, orgName }: JoinClientProps) {
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

      // 2. Join the team + org
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + context */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={48} showText={false} />
          <div className="text-center">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
              // meghívó
            </p>
            <h1 className="font-playfair text-3xl text-[#1a1814]">
              Csatlakozz a csapathoz
            </h1>
            <p className="mt-2 text-sm text-[#3d3a35]/70">
              <span className="font-semibold text-[#1a1814]">{orgName}</span>
              {orgName && " · "}
              <span>{teamName}</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">

            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
                // 01
              </p>
              <p className="font-playfair text-xl text-[#1a1814]">Néhány alap adat</p>
              <p className="mt-0.5 text-xs text-[#a09a90]">
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
                <span className="pl-1 text-xs text-[#c8410a]">{errors.username}</span>
              )}
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#1a1814]">Nem</span>
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
                <span className="pl-1 text-xs text-[#c8410a]">{errors.gender}</span>
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
              <span className={`pl-1 text-xs ${errors.birthYear ? "text-[#c8410a]" : "text-[#a09a90]"}`}>
                {errors.birthYear || `${minBirthYear}–${maxBirthYear} között`}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e8e4dc]" />

            {/* Consent */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors((p) => ({ ...p, consent: "" }));
                }}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[#c8410a]"
              />
              <span className="text-sm text-[#3d3a35]">
                Hozzájárulok adataim kezeléséhez a{" "}
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
              <span className="-mt-4 pl-8 text-xs text-[#c8410a]">{errors.consent}</span>
            )}

            {errors.submit && (
              <p className="text-center text-sm text-red-600">{errors.submit}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-h-[48px] w-full rounded-lg bg-[#c8410a] text-sm font-semibold text-white transition-colors hover:bg-[#a8340a] disabled:cursor-not-allowed disabled:bg-[#e8e4dc] disabled:text-[#a09a90]"
            >
              {isSubmitting ? "Csatlakozás..." : "Csatlakozás és felmérés indítása →"}
            </button>

          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#a09a90]">
          Ezeket az adatokat bármikor módosíthatod a profil oldalon.
        </p>

      </div>
    </div>
  );
}
