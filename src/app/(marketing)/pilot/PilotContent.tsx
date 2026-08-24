"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { t, type Locale } from "@/lib/i18n/public";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";

const INPUT_CLASS = "w-full rounded-xl border border-sand bg-cream px-4 py-3.5 text-ink placeholder:text-ink-body/45 transition-all focus:border-[var(--color-layer-team-accent)]/40 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-[var(--color-layer-team-accent)]/10";

type PilotFormValues = { name: string; email: string; company: string; size: string; message: string };
type PilotField = keyof PilotFormValues;
type PilotFieldErrors = Partial<Record<PilotField, string>>;

const PILOT_VALIDATION_COPY: Record<
  Locale,
  Record<"name" | "email" | "company" | "size" | "message", string>
> = {
  hu: {
    name: "Adj meg egy 2–100 karakteres nevet.",
    email: "Adj meg egy érvényes email címet.",
    company: "A cégnév 1–120 karakter lehet.",
    size: "A csapatméret legfeljebb 60 karakter lehet.",
    message: "A kérdés legfeljebb 4000 karakter lehet.",
  },
  en: {
    name: "Enter a name between 2 and 100 characters.",
    email: "Enter a valid email address.",
    company: "The company name must be between 1 and 120 characters.",
    size: "The team size can be at most 60 characters.",
    message: "The question can be at most 4000 characters.",
  },
};

const PILOT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PilotContent() {
  const { locale } = useLocale();
  const fieldIdPrefix = useId().replaceAll(":", "");
  const [form, setForm] = useState<PilotFormValues>({ name: "", email: "", company: "", size: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<PilotFieldErrors>({});
  const formStarted = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Az async hiba state commitja utan a gomb mar biztosan nincs disabled
  // allapotban. A catch-bol inditott rAF React concurrent render mellett
  // megelozhette ezt a commitot, ilyenkor a focus() csendben hatastalan volt.
  useEffect(() => {
    if (status === "error") submitRef.current?.focus();
  }, [status]);

  // Űrlap első érintése — a pilot-tölcsér eddig mérétlen volt (P1.2).
  const handleFormStart = () => {
    if (formStarted.current) return;
    formStarted.current = true;
    track("form.start", { form_id: "pilot_apply" });
  };

  const benefitGroups = [
    [
      { number: "01", title: t("pilot.benefit1Title", locale), desc: t("pilot.benefit1Desc", locale) },
      { number: "02", title: t("pilot.benefit2Title", locale), desc: t("pilot.benefit2Desc", locale) },
    ],
    [
      { number: "03", title: t("pilot.benefit5Title", locale), desc: t("pilot.benefit5Desc", locale) },
      { number: "04", title: t("pilot.benefit6Title", locale), desc: t("pilot.benefit6Desc", locale) },
    ],
  ];

  const steps = [
    { step: "01", title: t("pilot.step1Title", locale), desc: t("pilot.step1Desc", locale) },
    { step: "02", title: t("pilot.step2Title", locale), desc: t("pilot.step2Desc", locale) },
    { step: "03", title: t("pilot.step3Title", locale), desc: t("pilot.step3Desc", locale) },
  ];

  const commitments = [
    { title: t("pilot.commitment1Title", locale), desc: t("pilot.commitment1Desc", locale) },
    { title: t("pilot.commitment2Title", locale), desc: t("pilot.commitment2Desc", locale) },
    { title: t("pilot.commitment3Title", locale), desc: t("pilot.commitment3Desc", locale) },
  ];

  const signals = [
    { value: t("pilot.signal1Value", locale), label: t("pilot.signal1Label", locale) },
    { value: t("pilot.signal2Value", locale), label: t("pilot.signal2Label", locale) },
    { value: t("pilot.signal3Value", locale), label: t("pilot.signal3Label", locale) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (status === "error") setStatus("idle");

    const nextFieldErrors = validatePilotFields(form, locale);
    setFieldErrors(nextFieldErrors);
    const firstInvalidField = (["name", "email", "company", "size", "message"] as const).find(
      (field) => nextFieldErrors[field],
    );
    if (firstInvalidField) {
      ({
        name: nameRef,
        email: emailRef,
        company: companyRef,
        size: sizeRef,
        message: messageRef,
      })[firstInvalidField].current?.focus();
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/pilot-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });

      if (!res.ok) throw new Error("Failed");
      track("form.submit", { form_id: "pilot_apply", outcome: "success" });
      setStatus("sent");
    } catch {
      track("form.submit", { form_id: "pilot_apply", outcome: "error" });
      setStatus("error");
    }
  };

  const updateFormField = (field: PilotField, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    if (!fieldErrors[field]) return;
    const nextError = validatePilotFields(nextForm, locale)[field];
    setFieldErrors((current) => ({ ...current, [field]: nextError }));
  };

  return (
    <main className="overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[6%] top-[10%] h-[72%] w-[46%] rounded-full bg-[var(--color-layer-team-soft)]/55 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1120px] px-7 pb-20 pt-12 md:pb-28 md:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_410px] lg:items-center">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <SectionEyebrow tone="team">{t("pilot.eyebrow", locale)}</SectionEyebrow>
                <span className="inline-flex items-center rounded-full border border-[var(--color-layer-team-accent)]/20 bg-surface-card/70 px-4 py-1.5 text-caption font-medium text-[var(--color-layer-team-accent)] backdrop-blur-sm">
                  {t("pilot.badge", locale)}
                </span>
              </div>

              <h1 className="max-w-[12ch] font-fraunces text-fluid-display tracking-tight text-ink">
                {t("pilot.heroTitle", locale)}<em className="not-italic text-[var(--color-layer-team-accent)]">{t("pilot.heroTitleEm", locale)}</em>
              </h1>

              <p className="mt-6 max-w-[620px] text-base leading-relaxed text-ink-body">
                {t("pilot.heroBody", locale)}
              </p>

              <MarketingActions
                className="mt-8"
                primary={{ href: "#jelentkezes", label: t("pilot.heroCta", locale) }}
                secondary={{
                  href: "#mit-kapsz",
                  label: t("pilot.heroCtaSecondary", locale),
                  iconRight: <ChevronRightIcon />,
                }}
              />

              <div className="mt-6 flex flex-wrap gap-2.5">
                <MetaChip>{t("pilot.metaChip1", locale)}</MetaChip>
                <MetaChip>{t("pilot.metaChip2", locale)}</MetaChip>
                <MetaChip>{t("pilot.metaChip3", locale)}</MetaChip>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[28px] bg-[var(--color-layer-team-hero-from)] p-6 text-[var(--color-text-on-inverse)] shadow-[0_28px_80px_rgba(26,26,46,0.16)] md:p-7">
              <div className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10" />
              <div className="absolute -right-8 -top-12 size-48 rounded-full border border-white/10" />
              <div className="relative border-b border-white/10 pb-5">
                <p className="text-label uppercase text-[var(--color-text-on-inverse)]">
                  {t("pilot.asideEyebrow", locale)}
                </p>
                <p className="mt-3 font-fraunces text-title leading-tight">
                  {t("pilot.asideTitle", locale)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-on-inverse)]">
                  {t("pilot.asideBody", locale)}
                </p>
              </div>

              <div className="relative grid gap-4 pt-5">
                <div className="grid grid-cols-3 gap-2.5">
                  {signals.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-4">
                      <div className="font-fraunces text-3xl leading-none text-[var(--color-text-on-inverse)]">{signal.value}</div>
                      <div className="mt-2 text-note leading-relaxed text-[var(--color-text-on-inverse)]">{signal.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[var(--color-layer-team-glow)]/35 bg-white/10 px-5 py-5">
                  <p className="text-label uppercase text-[var(--color-text-on-inverse)]">
                    {t("pilot.aside90Eyebrow", locale)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-on-inverse)]">
                    {t("pilot.aside90Body", locale)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <EditorialSection
        id="mit-kapsz"
        eyebrow={t("pilot.benefitsEyebrow", locale)}
        title={t("pilot.benefitsTitle", locale)}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {benefitGroups.map((group, columnIndex) => (
            <div key={columnIndex} className="grid gap-5">
              {group.map((item) => (
                <FeatureCard key={item.number} {...item} />
              ))}
            </div>
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow={t("pilot.stepsEyebrow", locale)}
        title={t("pilot.stepsTitle", locale)}
        tone="warm"
      >
        <div className="grid gap-5">
          {steps.map((item) => (
            <StepCard key={item.step} {...item} />
          ))}
        </div>
      </EditorialSection>

      <EditorialSection
        eyebrow={t("pilot.commitmentsEyebrow", locale)}
        title={t("pilot.commitmentsTitle", locale)}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {commitments.map((item) => (
            <CommitmentCard key={item.title} {...item} commitmentLabel={t("pilot.commitmentLabel", locale)} />
          ))}
        </div>
      </EditorialSection>

      <section id="jelentkezes" className="bg-[var(--color-layer-team-soft)]/45">
        <div className="mx-auto h-px w-[calc(100%-1.5rem)] max-w-[1180px] bg-sand" />
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <SectionEyebrow tone="team" className="mb-4">{t("pilot.formEyebrow", locale)}</SectionEyebrow>
            <h2 className="font-fraunces text-fluid-title tracking-tight text-ink">
              {t("pilot.formTitle", locale)}
            </h2>
            <p className="mt-5 max-w-[28rem] text-base leading-8 text-ink-body">
              {t("pilot.formBody", locale)}
            </p>
            <div className="mt-7 rounded-[20px] border border-[var(--color-layer-team-accent)]/20 bg-surface-card/65 px-5 py-5">
              <p className="text-label uppercase text-[var(--color-layer-team-accent)]">
                {t("pilot.fitEyebrow", locale)}
              </p>
              <p className="mt-2 text-sm leading-7 text-ink-body">
                {t("pilot.fitBody", locale)}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-sand bg-surface-card p-6 shadow-[0_24px_70px_rgba(26,26,46,0.08)] md:p-8">
            {status === "sent" ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-[22px] border border-sage/15 bg-sage-soft px-6 py-10 text-center"
              >
                <div className="font-fraunces text-5xl leading-none text-bronze">+</div>
                <h3 className="mt-4 font-fraunces text-3xl leading-tight text-ink">
                  {t("pilot.successTitle", locale)}
                </h3>
                <p className="mt-3 text-base leading-8 text-ink-body">
                  {t("pilot.successBody", locale)}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-5">
                  <div>
                    <p className="font-fraunces text-title leading-tight text-ink">{t("pilot.formHeading", locale)}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-body">
                      {t("pilot.formSubheading", locale)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--color-layer-team-accent)]/20 bg-[var(--color-layer-team-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-layer-team-accent)]">
                    {t("pilot.formSpotsLabel", locale)}
                  </span>
                </div>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  onFocus={handleFormStart}
                  aria-busy={status === "sending" || undefined}
                  aria-describedby={status === "error" ? `${fieldIdPrefix}-pilot-api-error` : undefined}
                  className="grid gap-5"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      id={`${fieldIdPrefix}-pilot-name`}
                      label={t("pilot.labelName", locale)}
                      required
                      error={fieldErrors.name}
                      errorId={`${fieldIdPrefix}-pilot-name-error`}
                    >
                      <input
                        ref={nameRef}
                        id={`${fieldIdPrefix}-pilot-name`}
                        name="name"
                        required
                        minLength={2}
                        maxLength={100}
                        type="text"
                        autoComplete="name"
                        disabled={status === "sending"}
                        aria-invalid={Boolean(fieldErrors.name) || undefined}
                        aria-describedby={fieldErrors.name ? `${fieldIdPrefix}-pilot-name-error` : undefined}
                        value={form.name}
                        onChange={(e) => updateFormField("name", e.target.value)}
                        placeholder={t("pilot.placeholderName", locale)}
                        className={INPUT_CLASS}
                      />
                    </FormField>

                    <FormField
                      id={`${fieldIdPrefix}-pilot-email`}
                      label={t("pilot.labelEmail", locale)}
                      required
                      error={fieldErrors.email}
                      errorId={`${fieldIdPrefix}-pilot-email-error`}
                    >
                      <input
                        ref={emailRef}
                        id={`${fieldIdPrefix}-pilot-email`}
                        name="email"
                        required
                        maxLength={320}
                        type="email"
                        autoComplete="email"
                        disabled={status === "sending"}
                        aria-invalid={Boolean(fieldErrors.email) || undefined}
                        aria-describedby={fieldErrors.email ? `${fieldIdPrefix}-pilot-email-error` : undefined}
                        value={form.email}
                        onChange={(e) => updateFormField("email", e.target.value)}
                        placeholder={t("pilot.placeholderEmail", locale)}
                        className={INPUT_CLASS}
                      />
                    </FormField>
                  </div>

                  <FormField
                    id={`${fieldIdPrefix}-pilot-company`}
                    label={t("pilot.labelCompany", locale)}
                    required
                    error={fieldErrors.company}
                    errorId={`${fieldIdPrefix}-pilot-company-error`}
                  >
                    <input
                      ref={companyRef}
                      id={`${fieldIdPrefix}-pilot-company`}
                      name="company"
                      required
                      maxLength={120}
                      type="text"
                      autoComplete="organization"
                      disabled={status === "sending"}
                      aria-invalid={Boolean(fieldErrors.company) || undefined}
                      aria-describedby={fieldErrors.company ? `${fieldIdPrefix}-pilot-company-error` : undefined}
                      value={form.company}
                      onChange={(e) => updateFormField("company", e.target.value)}
                      placeholder={t("pilot.placeholderCompany", locale)}
                      className={INPUT_CLASS}
                    />
                  </FormField>

                  <FormField
                    id={`${fieldIdPrefix}-pilot-size`}
                    label={t("pilot.labelSize", locale)}
                    error={fieldErrors.size}
                    errorId={`${fieldIdPrefix}-pilot-size-error`}
                  >
                    <select
                      ref={sizeRef}
                      id={`${fieldIdPrefix}-pilot-size`}
                      name="size"
                      disabled={status === "sending"}
                      aria-invalid={Boolean(fieldErrors.size) || undefined}
                      aria-describedby={fieldErrors.size ? `${fieldIdPrefix}-pilot-size-error` : undefined}
                      value={form.size}
                      onChange={(e) => updateFormField("size", e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">{t("pilot.sizeOption0", locale)}</option>
                      <option value="5-10">{t("pilot.sizeOption1", locale)}</option>
                      <option value="11-25">{t("pilot.sizeOption2", locale)}</option>
                      <option value="26-50">{t("pilot.sizeOption3", locale)}</option>
                      <option value="51-80">{t("pilot.sizeOption4", locale)}</option>
                      <option value="80+">{t("pilot.sizeOption5", locale)}</option>
                    </select>
                  </FormField>

                  <FormField
                    id={`${fieldIdPrefix}-pilot-message`}
                    label={t("pilot.labelQuestion", locale)}
                    error={fieldErrors.message}
                    errorId={`${fieldIdPrefix}-pilot-message-error`}
                  >
                    <textarea
                      ref={messageRef}
                      id={`${fieldIdPrefix}-pilot-message`}
                      name="message"
                      maxLength={4000}
                      disabled={status === "sending"}
                      aria-invalid={Boolean(fieldErrors.message) || undefined}
                      aria-describedby={fieldErrors.message ? `${fieldIdPrefix}-pilot-message-error` : undefined}
                      value={form.message}
                      onChange={(e) => updateFormField("message", e.target.value)}
                      rows={4}
                      placeholder={t("pilot.placeholderQuestion", locale)}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </FormField>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      ref={submitRef}
                      type="submit"
                      disabled={status === "sending"}
                      className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-8 py-3.5 text-base font-semibold text-[var(--color-action-primary-fg)] transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "sending" ? t("pilot.submitSending", locale) : t("pilot.submitDefault", locale)}
                    </button>
                    <p className="text-sm leading-6 text-ink-body">
                      {t("pilot.preferEmail", locale)}{" "}
                      <a href="mailto:hello@trita.io" className="font-medium text-sage transition-colors hover:text-sage-dark">
                        hello@trita.io
                      </a>
                    </p>
                  </div>

                  {status === "error" && (
                    <p
                      id={`${fieldIdPrefix}-pilot-api-error`}
                      role="alert"
                      className="rounded-xl border border-state-error-border bg-state-error-soft px-4 py-3 text-sm text-state-error-fg"
                    >
                      {t("pilot.errorMessage", locale)}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function EditorialSection({
  id,
  eyebrow,
  title,
  children,
  tone = "default",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  tone?: "default" | "warm";
}) {
  return (
    <section id={id} className={tone === "warm" ? "bg-warm" : "bg-cream"}>
      <div className="mx-auto h-px w-[calc(100%-1.5rem)] max-w-[1180px] bg-sand" />
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <SectionEyebrow tone={tone === "warm" ? "team" : "bronze"}>{eyebrow}</SectionEyebrow>
        </div>
        <div>
          <h2 className="max-w-[13ch] font-fraunces text-fluid-title tracking-tight text-ink">
            {title}
          </h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sand bg-surface-card px-3 py-1.5 text-sm text-ink-body">
      {children}
    </span>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        <span>
          {label}
          {required && (
            <span
              aria-hidden="true"
              className="ml-1 text-[var(--color-accent-primary-strong)]"
            >
              *
            </span>
          )}
        </span>
      </label>
      {children}
      {error ? (
        <span id={errorId} className="mt-2 block text-xs text-state-error-fg">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function validatePilotFields(values: PilotFormValues, locale: Locale): PilotFieldErrors {
  const copy = PILOT_VALIDATION_COPY[locale];
  const errors: PilotFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedCompany = values.company.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) errors.name = copy.name;
  if (!PILOT_EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 320) {
    errors.email = copy.email;
  }
  if (trimmedCompany.length < 1 || trimmedCompany.length > 120) {
    errors.company = copy.company;
  }
  if (values.size.trim().length > 60) errors.size = copy.size;
  if (values.message.trim().length > 4000) errors.message = copy.message;

  return errors;
}

function FeatureCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-[24px] border border-sand bg-surface-card p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)] transition-transform hover:-translate-y-0.5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-[var(--color-layer-team-soft)] font-fraunces text-sm text-[var(--color-layer-team-accent)]">
          {number}
        </span>
        <div className="h-px flex-1 bg-sand" />
      </div>
      <h3 className="font-fraunces text-title leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <article className="grid gap-5 rounded-[24px] border border-sand bg-surface-card p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)] md:grid-cols-[88px_minmax(0,1fr)] md:items-start">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-layer-team-accent)]/20 bg-[var(--color-layer-team-soft)] font-fraunces text-2xl text-[var(--color-layer-team-accent)]">
        {step}
      </div>
      <div>
        <h3 className="font-fraunces text-title leading-tight text-ink">{title}</h3>
        <p className="mt-3 max-w-[56rem] text-base leading-8 text-ink-body">{desc}</p>
      </div>
    </article>
  );
}

function CommitmentCard({ title, desc, commitmentLabel }: { title: string; desc: string; commitmentLabel: string }) {
  return (
    <article className="rounded-[24px] border border-[var(--color-layer-team-accent)]/15 bg-[var(--color-layer-team-soft)] px-6 py-6">
      <p className="text-label uppercase text-[var(--color-layer-team-accent)]">
        {commitmentLabel}
      </p>
      <h3 className="mt-2 break-words font-fraunces text-heading leading-tight text-ink [hyphens:auto]">{title}</h3>
      <p className="mt-3 text-base leading-8 text-ink-body">{desc}</p>
    </article>
  );
}
