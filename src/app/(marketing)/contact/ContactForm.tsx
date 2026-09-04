"use client";

import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/public";
import { t } from "@/lib/i18n/public";
import { track } from "@/lib/analytics/client";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

type Topic = "demo" | "pricing" | "support" | "partnership" | "other";
type ContactField = "name" | "email" | "company" | "message";
type ContactFieldErrors = Partial<Record<ContactField, string>>;

const CONTACT_VALIDATION_COPY: Record<
  Locale,
  Record<"nameRequired" | "nameLong" | "email" | "companyLong" | "messageRequired" | "messageLong", string>
> = {
  hu: {
    nameRequired: "Adj meg egy legalább 2 karakteres nevet.",
    nameLong: "A név legfeljebb 100 karakter lehet.",
    email: "Adj meg egy érvényes email címet.",
    companyLong: "A cégnév legfeljebb 120 karakter lehet.",
    messageRequired: "Az üzenet legalább 20 karakter legyen.",
    messageLong: "Az üzenet legfeljebb 4000 karakter lehet.",
  },
  en: {
    nameRequired: "Enter a name with at least 2 characters.",
    nameLong: "The name can be at most 100 characters.",
    email: "Enter a valid email address.",
    companyLong: "The company name can be at most 120 characters.",
    messageRequired: "The message must be at least 20 characters.",
    messageLong: "The message can be at most 4000 characters.",
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ locale }: { locale: Locale }) {
  const fieldIdPrefix = useId().replaceAll(":", "");
  const topicOptions: Array<{ value: Topic; label: string }> = useMemo(
    () => [
      { value: "demo", label: t("contact.topicDemo", locale) },
      { value: "pricing", label: t("contact.topicPricing", locale) },
      { value: "partnership", label: t("contact.topicPartnership", locale) },
      { value: "support", label: t("contact.topicSupport", locale) },
      { value: "other", label: t("contact.topicOther", locale) },
    ],
    [locale],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState<Topic>("demo");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // P5: az űrlap ELKEZDÉSE (első fókusz) — az elkezdett/beküldött arány
  // mutatja meg, hogy az űrlap maga tántorít-e el. Csak egyszer tüzel.
  const startTracked = useRef(false);
  function handleFormStart() {
    if (startTracked.current) return;
    startTracked.current = true;
    track("form.start", { form_id: "contact" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const nextFieldErrors = validateContactFields({ name, email, company, message }, locale);
    setFieldErrors(nextFieldErrors);
    const firstInvalidField = (["name", "email", "company", "message"] as const).find(
      (field) => nextFieldErrors[field],
    );
    if (firstInvalidField) {
      ({
        name: nameRef,
        email: emailRef,
        company: companyRef,
        message: messageRef,
      })[firstInvalidField].current?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: company || undefined,
          topic,
          message,
          website,
        }),
      });

      if (!res.ok) throw new Error("request_failed");

      // A beküldés TARTALMA sosem kerül eseménybe — csak a kimenet.
      track("form.submit", { form_id: "contact", outcome: "success" });

      setSuccess(true);
      setName("");
      setEmail("");
      setCompany("");
      setTopic("demo");
      setMessage("");
      setWebsite("");
    } catch {
      track("form.submit", { form_id: "contact", outcome: "error" });
      setError(t("contact.errorGeneric", locale));
      // A beküldés alatt a gomb disabled, ezért a böngésző leveszi róla a
      // fókuszt. Hiba után tegyük vissza, hogy billentyűzettel azonnal
      // újrapróbálható legyen az adatvesztés nélkül megmaradt űrlap.
      window.requestAnimationFrame(() => submitRef.current?.focus());
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[24px] border border-sage/15 bg-sage-soft px-6 py-8"
      >
        <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-sage-dark/70">
          {t("contact.successTitle", locale)}
        </p>
        <h3 className="mt-3 font-fraunces text-display leading-tight text-ink">
          {t("contact.successBody", locale)}
        </h3>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className={`mt-6 inline-flex min-h-[52px] items-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] transition-all hover:-translate-y-0.5 hover:brightness-105 ${FOCUS_RING_CLASS}`}
        >
          {t("contact.sendAnother", locale)}
        </button>
      </div>
    );
  }

  const inputClass =
    "min-h-[52px] w-full rounded-xl border border-sand bg-cream px-4 font-dm-sans text-base text-ink outline-none transition-all focus:border-[var(--color-action-primary-bg)]/50 focus:bg-surface-card focus:ring-2 focus:ring-[var(--color-action-primary-bg)]/10";
  const labelClass = "block text-sm font-medium text-ink";

  function updateField(field: ContactField, value: string) {
    if (field === "name") setName(value);
    else if (field === "email") setEmail(value);
    else if (field === "company") setCompany(value);
    else setMessage(value);

    if (!fieldErrors[field]) return;
    const nextValues = { name, email, company, message, [field]: value };
    const nextError = validateContactFields(nextValues, locale)[field];
    setFieldErrors((current) => ({ ...current, [field]: nextError }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      onFocusCapture={handleFormStart}
      aria-busy={loading || undefined}
      aria-describedby={error ? `${fieldIdPrefix}-contact-error` : undefined}
      className="grid gap-5"
    >
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">
          {t("contact.topicPrompt", locale)}{" "}
          <span aria-hidden="true" className="text-[var(--color-accent-primary-strong)]">*</span>
        </legend>
        <div data-contact-topics className="flex flex-wrap gap-2">
          {topicOptions.map((option) => {
            const id = `${fieldIdPrefix}-contact-topic-${option.value}`;
            return (
              <div key={option.value}>
                <input
                  id={id}
                  type="radio"
                  name="topic"
                  value={option.value}
                  checked={topic === option.value}
                  required
                  disabled={loading}
                  onChange={() => setTopic(option.value)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border border-sand bg-cream px-3.5 text-caption text-ink-body transition-colors hover:border-[var(--color-action-primary-bg)]/35 peer-checked:border-[var(--color-action-primary-bg)] peer-checked:bg-sage-soft peer-checked:text-sage-dark peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-focus-ring)] peer-focus-visible:ring-offset-2 ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${fieldIdPrefix}-contact-name`} className={labelClass}>
            <span className="mb-2 block">
              {t("contact.name", locale)}{" "}
              <span aria-hidden="true" className="text-[var(--color-accent-primary-strong)]">*</span>
            </span>
          </label>
          <input
            ref={nameRef}
            id={`${fieldIdPrefix}-contact-name`}
            name="name"
            required
            minLength={2}
            maxLength={100}
            type="text"
            autoComplete="name"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.name) || undefined}
            aria-describedby={fieldErrors.name ? `${fieldIdPrefix}-contact-name-error` : undefined}
            value={name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass}
          />
          {fieldErrors.name ? (
            <span id={`${fieldIdPrefix}-contact-name-error`} className="mt-2 block text-xs text-state-error-fg">
              {fieldErrors.name}
            </span>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${fieldIdPrefix}-contact-email`} className={labelClass}>
            <span className="mb-2 block">
              {t("contact.email", locale)}{" "}
              <span aria-hidden="true" className="text-[var(--color-accent-primary-strong)]">*</span>
            </span>
          </label>
          <input
            ref={emailRef}
            id={`${fieldIdPrefix}-contact-email`}
            name="email"
            required
            type="email"
            autoComplete="email"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.email) || undefined}
            aria-describedby={fieldErrors.email ? `${fieldIdPrefix}-contact-email-error` : undefined}
            value={email}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputClass}
          />
          {fieldErrors.email ? (
            <span id={`${fieldIdPrefix}-contact-email-error`} className="mt-2 block text-xs text-state-error-fg">
              {fieldErrors.email}
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor={`${fieldIdPrefix}-contact-company`} className={labelClass}>
          <span className="mb-2 block">{t("contact.company", locale)}</span>
        </label>
        <input
          ref={companyRef}
          id={`${fieldIdPrefix}-contact-company`}
          name="company"
          maxLength={120}
          type="text"
          autoComplete="organization"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.company) || undefined}
          aria-describedby={fieldErrors.company ? `${fieldIdPrefix}-contact-company-error` : undefined}
          value={company}
          onChange={(e) => updateField("company", e.target.value)}
          className={inputClass}
        />
        {fieldErrors.company ? (
          <span id={`${fieldIdPrefix}-contact-company-error`} className="mt-2 block text-xs text-state-error-fg">
            {fieldErrors.company}
          </span>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${fieldIdPrefix}-contact-message`} className={labelClass}>
          <span className="mb-2 block">
            {t("contact.message", locale)}{" "}
            <span aria-hidden="true" className="text-[var(--color-accent-primary-strong)]">*</span>
          </span>
        </label>
        <textarea
          ref={messageRef}
          id={`${fieldIdPrefix}-contact-message`}
          name="message"
          required
          minLength={20}
          maxLength={4000}
          rows={6}
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.message) || undefined}
          aria-describedby={fieldErrors.message ? `${fieldIdPrefix}-contact-message-error` : undefined}
          value={message}
          onChange={(e) => updateField("message", e.target.value)}
          className={`${inputClass} min-h-[156px] resize-y py-3.5 leading-relaxed`}
        />
        {fieldErrors.message ? (
          <span id={`${fieldIdPrefix}-contact-message-error`} className="mt-2 block text-xs text-state-error-fg">
            {fieldErrors.message}
          </span>
        ) : null}
      </div>

      <input
        id={`${fieldIdPrefix}-contact-website`}
        name="website"
        type="text"
        disabled={loading}
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {error ? (
        <p
          id={`${fieldIdPrefix}-contact-error`}
          role="alert"
          className="rounded-xl border border-state-error-border bg-state-error-soft px-4 py-3 text-sm text-state-error-fg"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-sand pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[31ch] text-note leading-relaxed text-ink-body">
          {t("contact.legalBody", locale)}
        </p>
        <button
          ref={submitRef}
          type="submit"
          disabled={loading}
          className={`inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASS}`}
        >
          {loading ? t("contact.submitting", locale) : t("contact.submit", locale)}
        </button>
      </div>
    </form>
  );
}

function validateContactFields(
  values: { name: string; email: string; company: string; message: string },
  locale: Locale,
): ContactFieldErrors {
  const copy = CONTACT_VALIDATION_COPY[locale];
  const errors: ContactFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedCompany = values.company.trim();
  const trimmedMessage = values.message.trim();

  if (trimmedName.length < 2) errors.name = copy.nameRequired;
  else if (trimmedName.length > 100) errors.name = copy.nameLong;
  if (!EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 320) errors.email = copy.email;
  if (trimmedCompany.length > 120) errors.company = copy.companyLong;
  if (trimmedMessage.length < 20) errors.message = copy.messageRequired;
  else if (trimmedMessage.length > 4000) errors.message = copy.messageLong;

  return errors;
}
