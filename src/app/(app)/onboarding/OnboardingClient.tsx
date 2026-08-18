"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { Picker, PickerTrigger } from "@/components/ui/Picker";
import { TextField } from "@/components/ui/primitives/TextField";
import { Button } from "@/components/ui/primitives/Button";
import { t } from "@/lib/i18n";
import { getCountryOptions } from "@/lib/countries";
import { INDUSTRIES } from "@/lib/industry-fit";
import { TritaLogo } from "@/components/TritaLogo";
import { GENDER_OPTIONS } from "@/lib/onboarding-options";
import { toggleBtn } from "@/lib/onboarding-styles";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";




// ── Main component ───────────────────────────────────────────────────────────

export type OnboardingVariant = "full" | "claim";

export function OnboardingClient({
  variant = "full",
  onComplete,
}: {
  variant?: OnboardingVariant;
  /** Tesztelési seam; élesben teljes oldalbetöltéses journey-handoff fut. */
  onComplete?: () => void;
}) {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const isClaimActivation = variant === "claim";

  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  // Karrier-háttér (opcionális) — a Karrier-iránytű előtöltéséhez
  const [eduLevel, setEduLevel] = useState("");
  const [eduField, setEduField] = useState("");
  const [currentIndustry, setCurrentIndustry] = useState("");
  const [eduPickerOpen, setEduPickerOpen] = useState(false);
  const [eduFieldPickerOpen, setEduFieldPickerOpen] = useState(false);
  const [industryPickerOpen, setIndustryPickerOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [usernameTouched, setUsernameTouched] = useState(false);
  const [birthYearTouched, setBirthYearTouched] = useState(false);
  const [invalidFieldFlash, setInvalidFieldFlash] = useState<
    | "username"
    | "birthYear"
    | "gender"
    | "country"
    | null
  >(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const invalidFlashTimerRef = useRef<number | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const usernameFieldRef = useRef<HTMLDivElement>(null);
  const birthYearFieldRef = useRef<HTMLDivElement>(null);
  const genderFieldRef = useRef<HTMLDivElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);
  const consentFieldRef = useRef<HTMLLabelElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (invalidFlashTimerRef.current !== null) {
        window.clearTimeout(invalidFlashTimerRef.current);
      }
    };
  }, []);

  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);

  const eduOptions = useMemo(() => ([
    { value: "primary", label: t("results.ccEduPrimary", locale) },
    { value: "secondary", label: t("results.ccEduSecondary", locale) },
    { value: "vocational", label: t("results.ccEduVocational", locale) },
    { value: "higher", label: t("results.ccEduHigher", locale) },
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
    ...INDUSTRIES.map((i) => ({ value: i.key, label: locale === "hu" ? i.hu : i.en })),
    { value: "", label: t("results.ccCurrentNone", locale) },
  ]), [locale]);
  const countryLabel = useMemo(
    () => countryOptions.find((c) => c.value === country)?.label,
    [country, countryOptions],
  );

  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 16;

  const usernameValid = username.trim().length >= 2 && username.trim().length <= 20;
  const birthYearNum = Number(birthYear);
  const birthYearValid =
    birthYear !== "" &&
    birthYear.length === 4 &&
    Number.isInteger(birthYearNum) &&
    birthYearNum >= minBirthYear &&
    birthYearNum <= maxBirthYear;

  const basicsValid = isClaimActivation
    ? usernameValid
    : usernameValid && birthYearValid && gender !== "" && country !== "";

  // ── Flash + focus logic ──────────────────────────────────────────────────

  const flashField = (
    field: "username" | "birthYear" | "gender" | "country",
  ) => {
    setInvalidFieldFlash(field);
    if (invalidFlashTimerRef.current !== null) window.clearTimeout(invalidFlashTimerRef.current);
    invalidFlashTimerRef.current = window.setTimeout(() => {
      setInvalidFieldFlash(null);
      invalidFlashTimerRef.current = null;
    }, 1000);

    const target =
      field === "username" ? usernameFieldRef.current :
      field === "birthYear" ? birthYearFieldRef.current :
      field === "gender" ? genderFieldRef.current :
      countryFieldRef.current;

    target?.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderFirstButtonRef.current?.focus();
      if (field === "country") countryFieldRef.current?.querySelector("button")?.focus();
    }, 180);
  };

  const focusFirstInvalid = () => {
    if (!usernameValid) { flashField("username"); return; }
    if (isClaimActivation) return;
    if (!birthYearValid) { flashField("birthYear"); return; }
    if (gender === "") { flashField("gender"); return; }
    if (country === "") { flashField("country"); }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmitting || !consent) return;

    // UX-A11: egyképernyős onboarding — a korábbi 1. lépés mezővalidációja
    // a submitra került. A mentés + Clerk-szinkron logika változatlan.
    setUsernameTouched(true);
    if (!isClaimActivation) setBirthYearTouched(true);
    if (!basicsValid) {
      focusFirstInvalid();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          ...(!isClaimActivation && {
            birthYear: birthYearNum,
            gender,
            country,
          }),
          consentedAt: new Date().toISOString(),
          ...(eduLevel && { eduLevel }),
          ...(eduLevel && eduLevel !== "primary" && eduField && { eduField }),
          ...(currentIndustry && { currentIndustry }),
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      window.dispatchEvent(new CustomEvent("profile-updated"));
      // Next 16 alatt a kliens-routerből induló, szerver redirecttel végződő
      // handoff időnként Router hook-sorrend hibába fut. Az onboarding egyszeri
      // határátlépés, ezért itt a dokumentum-navigáció a stabil és helyes út.
      if (onComplete) {
        onComplete();
      } else {
        window.location.assign(JOURNEY_HOME_HANDOFF_PATH);
      }
    } catch {
      showToast(t("onboarding.errorGeneric", locale), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  // UX-A11: egyetlen képernyő — nincs lépés-szerkezet, se step-progress jelző;
  // a consent-checkbox közvetlenül a submit gomb felett van.

  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo + title */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <TritaLogo size={40} showText={false} />
          <div className="text-center">
            <h1 className="font-fraunces text-3xl text-ink">
              {t(isClaimActivation ? "onboarding.claimTitle" : "onboarding.title", locale)}
            </h1>
            <p className="mt-2 text-sm text-ink-body/70 max-w-sm">
              {t(isClaimActivation ? "onboarding.claimSubtitle" : "onboarding.subtitle", locale)}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-card rounded-2xl border border-sand p-6 md:p-8 shadow-sm">

          <div className="flex flex-col gap-6">
              <div>
                <p className="font-fraunces text-xl text-ink">
                  {t(isClaimActivation ? "onboarding.claimBlockTitle" : "onboarding.blockBasicsTitle", locale)}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {t(isClaimActivation ? "onboarding.claimBlockHint" : "onboarding.blockBasicsHint", locale)}
                </p>
              </div>

              <div className="flex flex-col gap-5">

                {/* Username */}
                <div ref={usernameFieldRef}>
                  <TextField
                    ref={usernameInputRef}
                    label={t("onboarding.usernameLabel", locale)}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder={t("onboarding.usernamePlaceholder", locale)}
                    minLength={2}
                    maxLength={20}
                    error={
                      usernameTouched && username.trim() !== "" && !usernameValid
                        ? t("onboarding.usernameError", locale)
                        : undefined
                    }
                    helpText={
                      usernameTouched && username.trim() !== "" && !usernameValid
                        ? undefined
                        : t("onboarding.usernameHint", locale)
                    }
                    helpTextClassName="pl-1 italic text-xs text-muted"
                    errorClassName="pl-1 italic text-xs text-[var(--color-accent-primary-strong)]"
                    inputClassName={invalidFieldFlash === "username" ? "ring-2 ring-sage/30" : undefined}
                  />
                </div>

                {!isClaimActivation ? (
                  <>
                {/* Birth year */}
                <div ref={birthYearFieldRef}>
                  <TextField
                    ref={birthYearInputRef}
                    label={t("onboarding.birthYearLabel", locale)}
                    type="number"
                    inputMode="numeric"
                    value={birthYear}
                    onChange={(e) => {
                      if (e.target.value.length <= 4) setBirthYear(e.target.value);
                    }}
                    onBlur={() => setBirthYearTouched(true)}
                    placeholder={t("onboarding.birthYearPlaceholder", locale)}
                    min={minBirthYear}
                    max={maxBirthYear}
                    error={
                      birthYearTouched && birthYear !== "" && !birthYearValid
                        ? t("onboarding.birthYearError", locale)
                        : undefined
                    }
                    helpText={`${t("onboarding.validRangeLabel", locale)}: ${minBirthYear} – ${maxBirthYear}`}
                    helpTextClassName={`pl-1 italic text-xs ${
                      birthYearTouched && birthYear !== "" && !birthYearValid
                        ? "text-[var(--color-accent-primary-strong)]"
                        : "text-muted"
                    }`}
                    inputClassName={`[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none${
                      invalidFieldFlash === "birthYear" ? " ring-2 ring-sage/30" : ""
                    }`}
                  />
                </div>

                {/* Gender */}
                <div
                  ref={genderFieldRef}
                  className={`flex flex-col gap-2 rounded-lg p-1 transition ${
                    invalidFieldFlash === "gender" ? "ring-2 ring-sage/30 bg-bronze-100/40" : ""
                  }`}
                >
                  <span className="text-sm font-semibold text-ink">
                    {t("onboarding.genderLabel", locale)}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.value}
                        ref={idx === 0 ? genderFirstButtonRef : undefined}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={toggleBtn(gender === opt.value)}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div
                  ref={countryFieldRef}
                  className={`rounded-lg transition ${
                    invalidFieldFlash === "country" ? "ring-2 ring-sage/30 bg-bronze-100/40 p-1" : ""
                  }`}
                >
                  <PickerTrigger
                    label={t("onboarding.countryLabel", locale)}
                    value={countryLabel}
                    placeholder={t("onboarding.countryPlaceholder", locale)}
                    onClick={() => setCountryPickerOpen(true)}
                  />
                </div>

                {/* Karrier-háttér (opcionális) — a Karrier-iránytű előtöltéséhez */}
                <div className="mt-2 border-t border-sand pt-4">
                  <p className="mb-3 text-label uppercase text-muted">
                    {t("onboarding.careerSectionLabel", locale)}
                  </p>
                  <div className="flex flex-col gap-4">
                    <PickerTrigger
                      label={t("onboarding.eduLabel", locale)}
                      value={eduOptions.find((o) => o.value === eduLevel)?.label ?? ""}
                      placeholder={t("onboarding.optionalPlaceholder", locale)}
                      onClick={() => setEduPickerOpen(true)}
                    />
                    {eduLevel && eduLevel !== "primary" && (
                      <PickerTrigger
                        label={t("onboarding.eduFieldLabel", locale)}
                        value={eduFieldOptions.find((o) => o.value === eduField)?.label ?? ""}
                        placeholder={t("onboarding.optionalPlaceholder", locale)}
                        onClick={() => setEduFieldPickerOpen(true)}
                      />
                    )}
                    <PickerTrigger
                      label={t("onboarding.industryLabel", locale)}
                      value={industryOptions.find((o) => o.value === currentIndustry && o.value !== "")?.label ?? ""}
                      placeholder={t("onboarding.optionalPlaceholder", locale)}
                      onClick={() => setIndustryPickerOpen(true)}
                    />
                  </div>
                </div>

                  </>
                ) : (
                  <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3">
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {t("onboarding.claimOptionalHint", locale)}
                    </p>
                  </div>
                )}

              </div>

              {/* Hozzájárulás — UX-A11: nem külön lépés, közvetlenül a
                  submit gomb felett. */}
              <label
                ref={consentFieldRef}
                className="flex cursor-pointer items-start gap-3 rounded-lg border-t border-sand p-2 pt-5"
              >
                <input
                  ref={consentCheckboxRef}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-sand accent-sage focus:ring-sage/30"
                />
                <span className="text-sm text-ink-body">
                  {t("onboarding.consentLabel", locale)
                    .split("{link}")
                    .map((part, i, arr) =>
                      i < arr.length - 1 ? (
                        <span key={i}>
                          {part}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[var(--color-accent-primary-strong)] underline hover:text-bronze-dark"
                          >
                            {t("onboarding.consentLinkText", locale)}
                          </a>
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      ),
                    )}
                </span>
              </label>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !consent}
                loading={isSubmitting}
                fullWidth
                size="lg"
              >
                {t(isClaimActivation ? "onboarding.claimSubmit" : "onboarding.submit", locale)}
              </Button>
          </div>

        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-xs text-muted">
          {t(isClaimActivation ? "onboarding.claimFooterHint" : "onboarding.footerHint", locale)}
        </p>

      </div>

      {/* A gyors aktiválásban ezek a pickerek nem nyithatók meg, de a
          komponensek mountolása sem indokolt. */}
      {!isClaimActivation ? (
        <>
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
      <Picker
        isOpen={eduPickerOpen}
        onClose={() => setEduPickerOpen(false)}
        onSelect={setEduLevel}
        options={eduOptions}
        selectedValue={eduLevel}
        title={t("onboarding.eduLabel", locale)}
      />
      <Picker
        isOpen={eduFieldPickerOpen}
        onClose={() => setEduFieldPickerOpen(false)}
        onSelect={setEduField}
        options={eduFieldOptions}
        selectedValue={eduField}
        title={t("onboarding.eduFieldLabel", locale)}
      />
      <Picker
        isOpen={industryPickerOpen}
        onClose={() => setIndustryPickerOpen(false)}
        onSelect={setCurrentIndustry}
        options={industryOptions}
        selectedValue={currentIndustry}
        title={t("onboarding.industryLabel", locale)}
      />
        </>
      ) : null}
    </div>
  );
}
