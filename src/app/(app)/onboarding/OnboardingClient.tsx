"use client";

import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
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
import { ExternalLinkIcon } from "@/components/ui/icons";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

function BrandStar({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    >
      <path d="M30 5v50M5 30h50M12 12l36 36M48 12 12 48" />
    </svg>
  );
}

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
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);
  const usernameFieldRef = useRef<HTMLDivElement>(null);
  const birthYearFieldRef = useRef<HTMLDivElement>(null);
  const genderFieldRef = useRef<HTMLDivElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);
  const consentFieldRef = useRef<HTMLLabelElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);
  const genderButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const fieldId = useId().replaceAll(":", "");
  const genderLabelId = `onboarding-gender-${fieldId}`;
  const genderErrorId = `onboarding-gender-error-${fieldId}`;
  const countryErrorId = `onboarding-country-error-${fieldId}`;
  const consentErrorId = `onboarding-consent-error-${fieldId}`;

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

  const focusField = (field: "username" | "birthYear" | "gender" | "country" | "consent") => {
    const target =
      field === "username" ? usernameFieldRef.current :
      field === "birthYear" ? birthYearFieldRef.current :
      field === "gender" ? genderFieldRef.current :
      field === "country" ? countryFieldRef.current :
      consentFieldRef.current;

    target?.scrollIntoView({ block: "center" });

    window.requestAnimationFrame(() => {
      if (field === "username") usernameInputRef.current?.focus();
      if (field === "birthYear") birthYearInputRef.current?.focus();
      if (field === "gender") genderButtonRefs.current[0]?.focus();
      if (field === "country") countryFieldRef.current?.querySelector("button")?.focus();
      if (field === "consent") consentCheckboxRef.current?.focus();
    });
  };

  const focusFirstInvalid = () => {
    if (!usernameValid) { focusField("username"); return; }
    if (!isClaimActivation) {
      if (!birthYearValid) { focusField("birthYear"); return; }
      if (gender === "") { focusField("gender"); return; }
      if (country === "") { focusField("country"); return; }
    }
    if (!consent) focusField("consent");
  };

  const handleGenderKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % GENDER_OPTIONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + GENDER_OPTIONS.length) % GENDER_OPTIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = GENDER_OPTIONS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    setGender(GENDER_OPTIONS[nextIndex].value);
    genderButtonRefs.current[nextIndex]?.focus();
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // UX-A11: egyképernyős onboarding — a korábbi 1. lépés mezővalidációja
    // a submitra került. A mentés + Clerk-szinkron logika változatlan.
    setUsernameTouched(true);
    if (!isClaimActivation) setBirthYearTouched(true);
    setValidationAttempted(true);
    if (!basicsValid || !consent) {
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

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  // UX-A11: egyetlen képernyő — nincs lépés-szerkezet, se step-progress jelző;
  // a consent-checkbox közvetlenül a submit gomb felett van.

  return (
    <div className="min-h-dvh bg-cream px-0 py-0 md:px-5 md:py-8 lg:flex lg:items-center lg:justify-center">
      <div className="w-full overflow-hidden border-sand bg-surface-card md:mx-auto md:max-w-5xl md:rounded-3xl md:border md:shadow-[var(--ui-shadow-lg)] lg:grid lg:grid-cols-[minmax(300px,0.9fr)_minmax(460px,1.1fr)]">
        <aside className="relative flex min-h-[350px] flex-col overflow-hidden bg-[var(--color-surface-self-accent-soft)] px-6 py-8 md:px-10 lg:min-h-[720px] lg:px-12 lg:py-12">
          <div className="relative z-10">
            <TritaLogo size={56} showText={false} className="items-start" />
            <p className="mt-14 text-label uppercase text-[var(--color-accent-primary-strong)]">
              {isClaimActivation
                ? t("onboarding.claimBlockHint", locale)
                : locale === "hu" ? "Még egy rövid lépés" : "One short step"}
            </p>
            <h1 className="mt-4 max-w-[9ch] font-fraunces text-4xl leading-[1.02] tracking-[-0.035em] text-[var(--color-accent-self-deep)] md:text-5xl">
              {isClaimActivation
                ? t("onboarding.claimTitle", locale)
                : locale === "hu" ? "A profilod rólad szól." : "Your profile is about you."}
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-body">
              {t(isClaimActivation ? "onboarding.claimSubtitle" : "onboarding.subtitle", locale)}
            </p>
          </div>

          <div aria-hidden className="absolute -right-28 top-48 h-72 w-72 rounded-full border border-sage/20 shadow-[0_0_0_40px_color-mix(in_srgb,var(--color-surface-self-accent)_6%,transparent),0_0_0_84px_color-mix(in_srgb,var(--color-surface-self-accent)_3%,transparent)]" />

          <div className="relative z-10 mt-auto flex items-start gap-3 border-t border-[var(--color-surface-self-border)] pt-5">
            <BrandStar className="h-7 w-7 shrink-0 text-[var(--color-action-primary-bg)]" />
            <p className="text-xs leading-relaxed text-ink-body">
              <strong className="block font-fraunces text-base font-medium text-[var(--color-accent-self-deep)]">
                {locale === "hu" ? "Te rendelkezel az adataiddal." : "You stay in control of your data."}
              </strong>
              {locale === "hu" ? "Szerkeszthető és törölhető bármikor." : "Edit or delete it whenever you want."}
            </p>
          </div>
        </aside>

        <div className="bg-[var(--color-surface-card-soft)] px-5 py-8 md:px-10 lg:px-12 lg:py-11">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
                {t(isClaimActivation ? "onboarding.claimBlockHint" : "onboarding.blockBasicsHint", locale)}
              </p>
              <h2 className="mt-2 font-fraunces text-3xl leading-tight text-ink">
                {t(isClaimActivation ? "onboarding.claimBlockTitle" : "onboarding.title", locale)}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {isClaimActivation
                  ? t("onboarding.claimOptionalHint", locale)
                  : locale === "hu" ? "Ismerkedjünk meg néhány alapadaton keresztül." : "Let's start with a few basic details."}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--color-surface-chip-warm)] px-3 py-2 text-micro font-semibold text-[var(--color-accent-earth-strong)]">
              {locale === "hu" ? "kb. 1 perc" : "about 1 min"}
            </span>
          </div>

        <form
          noValidate
          onSubmit={handleFormSubmit}
          className="rounded-2xl border border-sand bg-surface-card p-5 shadow-sm md:p-7"
        >

          <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">

                {/* Username */}
                <div ref={usernameFieldRef}>
                  <TextField
                    ref={usernameInputRef}
                    label={t("onboarding.usernameLabel", locale)}
                    name="username"
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder={t("onboarding.usernamePlaceholder", locale)}
                    minLength={2}
                    maxLength={20}
                    error={
                      (usernameTouched || validationAttempted) && !usernameValid
                        ? t("onboarding.usernameError", locale)
                        : undefined
                    }
                    helpText={
                      (usernameTouched || validationAttempted) && !usernameValid
                        ? undefined
                        : t("onboarding.usernameHint", locale)
                    }
                    helpTextClassName="pl-1 italic text-xs text-muted"
                    errorClassName="pl-1 italic text-xs text-[var(--color-accent-primary-strong)]"
                  />
                </div>

                {!isClaimActivation ? (
                  <>
                {/* Birth year */}
                <div ref={birthYearFieldRef}>
                  <TextField
                    ref={birthYearInputRef}
                    label={t("onboarding.birthYearLabel", locale)}
                    name="birthYear"
                    required
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
                      (birthYearTouched || validationAttempted) && !birthYearValid
                        ? t("onboarding.birthYearError", locale)
                        : undefined
                    }
                    helpText={`${t("onboarding.validRangeLabel", locale)}: ${minBirthYear} – ${maxBirthYear}`}
                    helpTextClassName={`pl-1 italic text-xs ${
                      (birthYearTouched || validationAttempted) && !birthYearValid
                        ? "text-[var(--color-accent-primary-strong)]"
                        : "text-muted"
                    }`}
                    inputClassName="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                {/* Gender */}
                <div
                  ref={genderFieldRef}
                  className={`flex flex-col gap-2 rounded-lg p-1 ${
                    validationAttempted && gender === "" ? "ring-2 ring-state-error-border" : ""
                  }`}
                >
                  <span id={genderLabelId} className="text-sm font-semibold text-ink">
                    {t("onboarding.genderLabel", locale)}
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby={genderLabelId}
                    aria-describedby={validationAttempted && gender === "" ? genderErrorId : undefined}
                    aria-invalid={validationAttempted && gender === "" ? "true" : undefined}
                    className="grid grid-cols-2 gap-2"
                  >
                    {GENDER_OPTIONS.map((opt, idx) => (
                      <button
                        key={opt.value}
                        ref={(node) => {
                          genderButtonRefs.current[idx] = node;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={gender === opt.value}
                        tabIndex={gender === opt.value || (gender === "" && idx === 0) ? 0 : -1}
                        onClick={() => setGender(opt.value)}
                        onKeyDown={(event) => handleGenderKeyDown(event, idx)}
                        className={toggleBtn(gender === opt.value)}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    ))}
                  </div>
                  {validationAttempted && gender === "" ? (
                    <p id={genderErrorId} role="alert" className="pl-1 text-xs text-state-error-fg">
                      {t("onboarding.genderRequired", locale)}
                    </p>
                  ) : null}
                </div>

                {/* Country */}
                <div
                  ref={countryFieldRef}
                  className={`rounded-lg ${
                    validationAttempted && country === "" ? "ring-2 ring-state-error-border p-1" : ""
                  }`}
                >
                  <PickerTrigger
                    label={t("onboarding.countryLabel", locale)}
                    value={countryLabel}
                    placeholder={t("onboarding.countryPlaceholder", locale)}
                    onClick={() => setCountryPickerOpen(true)}
                    isOpen={countryPickerOpen}
                    ariaInvalid={validationAttempted && country === ""}
                    ariaDescribedBy={validationAttempted && country === "" ? countryErrorId : undefined}
                  />
                  {validationAttempted && country === "" ? (
                    <p id={countryErrorId} role="alert" className="mt-2 pl-1 text-xs text-state-error-fg">
                      {t("onboarding.countryRequired", locale)}
                    </p>
                  ) : null}
                </div>

                {/* Karrier-háttér (opcionális) — a Karrier-iránytű előtöltéséhez */}
                <details className="group mt-2 border-t border-sand pt-4">
                  <summary className={`flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-lg text-xs font-semibold text-ink-body ${FOCUS_RING_CLASS}`}>
                    <span>
                      {t("onboarding.careerSectionLabel", locale)}
                      <span className="ml-1 font-normal text-muted">· {t("onboarding.optionalPlaceholder", locale)}</span>
                    </span>
                    <span aria-hidden className="text-lg text-sage transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="flex flex-col gap-4">
                    <PickerTrigger
                      label={t("onboarding.eduLabel", locale)}
                      value={eduOptions.find((o) => o.value === eduLevel)?.label ?? ""}
                      placeholder={t("onboarding.optionalPlaceholder", locale)}
                      onClick={() => setEduPickerOpen(true)}
                      isOpen={eduPickerOpen}
                    />
                    {eduLevel && eduLevel !== "primary" && (
                      <PickerTrigger
                        label={t("onboarding.eduFieldLabel", locale)}
                        value={eduFieldOptions.find((o) => o.value === eduField)?.label ?? ""}
                        placeholder={t("onboarding.optionalPlaceholder", locale)}
                        onClick={() => setEduFieldPickerOpen(true)}
                        isOpen={eduFieldPickerOpen}
                      />
                    )}
                    <PickerTrigger
                      label={t("onboarding.industryLabel", locale)}
                      value={industryOptions.find((o) => o.value === currentIndustry && o.value !== "")?.label ?? ""}
                      placeholder={t("onboarding.optionalPlaceholder", locale)}
                      onClick={() => setIndustryPickerOpen(true)}
                      isOpen={industryPickerOpen}
                    />
                  </div>
                </details>

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
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-t p-2 pt-5 ${
                  validationAttempted && !consent
                    ? "border-state-error-border ring-2 ring-state-error-border"
                    : "border-sand"
                }`}
              >
                <input
                  ref={consentCheckboxRef}
                  name="consent"
                  required
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={validationAttempted && !consent ? "true" : undefined}
                  aria-describedby={validationAttempted && !consent ? consentErrorId : undefined}
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
                            className="inline-flex items-center gap-1 font-medium text-[var(--color-accent-primary-strong)] underline hover:text-bronze-dark"
                          >
                            {t("onboarding.consentLinkText", locale)}
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                          </a>
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      ),
                    )}
                </span>
              </label>
              {validationAttempted && !consent ? (
                <p id={consentErrorId} role="alert" className="-mt-4 pl-2 text-xs text-state-error-fg">
                  {t("onboarding.consentRequired", locale)}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth
                size="lg"
              >
                {t(isClaimActivation ? "onboarding.claimSubmit" : "onboarding.submit", locale)}
              </Button>
          </div>

        </form>

        <p className="mt-5 text-center text-xs text-muted">
          {t(isClaimActivation ? "onboarding.claimFooterHint" : "onboarding.footerHint", locale)}
        </p>
        </div>
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
        closeLabel={t("common.close", locale)}
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
        closeLabel={t("common.close", locale)}
      />
      <Picker
        isOpen={eduFieldPickerOpen}
        onClose={() => setEduFieldPickerOpen(false)}
        onSelect={setEduField}
        options={eduFieldOptions}
        selectedValue={eduField}
        title={t("onboarding.eduFieldLabel", locale)}
        closeLabel={t("common.close", locale)}
      />
      <Picker
        isOpen={industryPickerOpen}
        onClose={() => setIndustryPickerOpen(false)}
        onSelect={setCurrentIndustry}
        options={industryOptions}
        selectedValue={currentIndustry}
        title={t("onboarding.industryLabel", locale)}
        closeLabel={t("common.close", locale)}
      />
        </>
      ) : null}
    </div>
  );
}
