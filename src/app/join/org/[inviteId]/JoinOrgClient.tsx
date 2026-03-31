"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TritaLogo } from "@/components/TritaLogo";
import { useLocale } from "@/components/LocaleProvider";
import { inputBase, toggleBtn } from "@/lib/onboarding-styles";
import {
  getBirthYearBounds,
  getMembershipGenderOptions,
  getMembershipSubmitErrorMessage,
  submitMembershipJoin,
  submitMembershipProfile,
  validateMembershipProfileForm,
} from "@/lib/membership-onboarding/client";

// ── Props ──────────────────────────────────────────────────────────────────────

interface JoinOrgClientProps {
  inviteState:
    | "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
    | "INVITED_READY_TO_JOIN";
  inviteId: string;
  orgName: string;
  existingProfile: { username: string | null } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JoinOrgClient({
  inviteState,
  inviteId,
  orgName,
  existingProfile,
}: JoinOrgClientProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const isHu = locale !== "en";
  const requiresProfileOnboarding =
    inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE";

  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const { minBirthYear, maxBirthYear } = getBirthYearBounds(currentYear);
  const genderOptions = getMembershipGenderOptions(locale);
  const copy = {
    inviteEyebrow: isHu ? "// meghívó" : "// invite",
    pageTitle: isHu ? "Csatlakozz a szervezethez" : "Join organization",
    profileEyebrow: isHu ? "// 01" : "// 01",
    profileTitle: isHu ? "Néhány alap adat" : "A few basic details",
    profileSub: isHu
      ? "Ezek szükségesek a személyre szabott csapatképhez."
      : "These details are required for personalized team insight.",
    usernameLabel: isHu ? "Megjelenítési név" : "Display name",
    usernamePlaceholder: isHu ? "pl. Kovács Péter" : "e.g. Alex Walker",
    genderLabel: isHu ? "Nem" : "Gender",
    birthYearLabel: isHu ? "Születési év" : "Birth year",
    birthYearPlaceholder: isHu ? `pl. ${currentYear - 30}` : `e.g. ${currentYear - 30}`,
    birthYearHint: isHu
      ? `${minBirthYear}–${maxBirthYear} között`
      : `Between ${minBirthYear} and ${maxBirthYear}`,
    consentPrefix: isHu
      ? "Hozzájárulok adataim kezeléséhez a"
      : "I consent to the processing of my data according to the",
    privacyLabel: isHu ? "Adatvédelmi tájékoztató" : "Privacy Policy",
    consentSuffix: isHu ? "alapján." : ".",
    joinEyebrow: isHu ? "// csatlakozás" : "// join",
    welcome: isHu ? "Üdv" : "Welcome",
    readyText: isHu
      ? `Készen állsz csatlakozni a ${orgName} szervezethez. A meglévő személyes eredményeid megmaradnak.`
      : `You're ready to join ${orgName}. Your existing personal results remain available.`,
    submitting: isHu ? "Csatlakozás..." : "Joining...",
    submitNew: isHu
      ? "Csatlakozás és felmérés indítása →"
      : "Join and start assessment →",
    submitExisting: isHu ? "Csatlakozás →" : "Join →",
    profileHint: isHu
      ? "Ezeket az adatokat bármikor módosíthatod a profil oldalon."
      : "You can edit these details anytime on your profile page.",
  };

  const validate = () => {
    const formErrors = validateMembershipProfileForm(
      {
        username,
        gender,
        birthYear,
        consent,
      },
      { requireConsent: true, currentYear, locale },
    );
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleJoin = async () => {
    const joinResult = await submitMembershipJoin("/api/org/join", inviteId);
    if (!joinResult.ok) {
      throw new Error(joinResult.error);
    }
    router.push(joinResult.nextPath);
  };

  const handleSubmitWithProfile = async () => {
    if (isSubmitting || !validate()) return;
    setIsSubmitting(true);

    try {
      const profileResult = await submitMembershipProfile({
        username: username.trim(),
        gender,
        birthYear: Number(birthYear),
        country: "HU",
        consentedAt: new Date().toISOString(),
      });
      if (!profileResult.ok) throw new Error(profileResult.error);

      await handleJoin();
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : undefined;
      setErrors((prev) => ({
        ...prev,
        submit: getMembershipSubmitErrorMessage(errorCode, locale),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitExisting = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleJoin();
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : undefined;
      setErrors((prev) => ({
        ...prev,
        submit: getMembershipSubmitErrorMessage(errorCode, locale),
      }));
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
              {copy.inviteEyebrow}
            </p>
            <h1 className="font-fraunces text-3xl text-ink">
              {copy.pageTitle}
            </h1>
            <p className="mt-2 text-sm text-ink-body/70">
              <span className="font-semibold text-ink">{orgName}</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">
            {requiresProfileOnboarding ? (
              <>
                <div>
                  <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                    {copy.profileEyebrow}
                  </p>
                  <p className="font-fraunces text-xl text-ink">{copy.profileTitle}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {copy.profileSub}
                  </p>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-ink">
                    {copy.usernameLabel}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((p) => ({ ...p, username: "" }));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitWithProfile()}
                    placeholder={copy.usernamePlaceholder}
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
                  <span className="text-sm font-semibold text-ink">{copy.genderLabel}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {genderOptions.map((opt) => (
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
                  <label className="text-sm font-semibold text-ink">{copy.birthYearLabel}</label>
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
                    placeholder={copy.birthYearPlaceholder}
                    className={`${inputBase(!!errors.birthYear)} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                  />
                  <span className={`pl-1 text-xs ${errors.birthYear ? "text-bronze" : "text-muted"}`}>
                    {errors.birthYear || copy.birthYearHint}
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
                    {copy.consentPrefix}{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-bronze underline hover:text-bronze-dark"
                    >
                      {copy.privacyLabel}
                    </a>{" "}
                    {copy.consentSuffix}
                  </span>
                </label>
                {errors.consent && (
                  <span className="-mt-4 pl-8 text-xs text-bronze">{errors.consent}</span>
                )}
              </>
            ) : (
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                  {copy.joinEyebrow}
                </p>
                <h2 className="font-fraunces text-2xl text-ink">
                  {copy.welcome}
                  {existingProfile?.username ? `, ${existingProfile.username}` : ""}!
                </h2>
                <p className="mt-2 text-sm text-ink-body">
                  {copy.readyText}
                </p>
              </div>
            )}

            {errors.submit && (
              <p className="text-center text-sm text-red-600">{errors.submit}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={requiresProfileOnboarding ? handleSubmitWithProfile : handleSubmitExisting}
              disabled={isSubmitting}
              className="min-h-[48px] w-full rounded-lg bg-sage text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted"
            >
              {isSubmitting
                ? copy.submitting
                : requiresProfileOnboarding
                  ? copy.submitNew
                  : copy.submitExisting}
            </button>

          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {copy.profileHint}
        </p>

      </div>
    </div>
  );
}
