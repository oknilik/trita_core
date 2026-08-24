"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { t, type Locale } from "@/lib/i18n/public";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

type PricingField = "name" | "email" | "message";
type PricingFieldErrors = Partial<Record<PricingField, string>>;

const PRICING_VALIDATION_COPY: Record<
  Locale,
  Record<"name" | "email" | "message" | "messageLong", string>
> = {
  hu: {
    name: "Adj meg egy legalább 2 karakteres nevet.",
    email: "Adj meg egy érvényes email címet.",
    message: "Az üzenet legalább 20 karakter legyen.",
    messageLong: "Az üzenet legfeljebb 4000 karakter lehet.",
  },
  en: {
    name: "Enter a name with at least 2 characters.",
    email: "Enter a valid email address.",
    message: "The message must be at least 20 characters.",
    messageLong: "The message can be at most 4000 characters.",
  },
};

const PRICING_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Villámkérdés-űrlap az Együttműködés oldalon — a /contact API-ra küld
 * (topic: "pricing"), de oldalelhagyás nélkül: a cél, hogy a kérdezésnek
 * nulla súrlódása legyen.
 */
export function PricingQuickAsk({ locale }: { locale: Locale }) {
  const fieldIdPrefix = useId().replaceAll(":", "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<PricingFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state === "sending") return;
    if (state === "error") setState("idle");

    const nextFieldErrors = validatePricingFields({ name, email, message }, locale);
    setFieldErrors(nextFieldErrors);
    const firstInvalidField = (["name", "email", "message"] as const).find(
      (field) => nextFieldErrors[field],
    );
    if (firstInvalidField) {
      ({ name: nameRef, email: emailRef, message: messageRef })[
        firstInvalidField
      ].current?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic: "pricing",
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setState("sent");
    } catch {
      setState("error");
      window.requestAnimationFrame(() => submitRef.current?.focus());
    }
  };

  const updateField = (field: PricingField, value: string) => {
    if (field === "name") setName(value);
    else if (field === "email") setEmail(value);
    else setMessage(value);

    if (!fieldErrors[field]) return;
    const nextValues = { name, email, message, [field]: value };
    const nextError = validatePricingFields(nextValues, locale)[field];
    setFieldErrors((current) => ({ ...current, [field]: nextError }));
  };

  if (state === "sent") {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <div className="text-4xl leading-none">🙌</div>
        <h2 className="mt-4 font-fraunces text-2xl text-white lg:text-3xl">
          {t("pricing.quickAskSuccessTitle", locale)}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/[0.7]">
          {t("pricing.quickAskSuccessBody", locale)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <SectionEyebrow tone="onDark">{t("pricing.quickAskEyebrow", locale)}</SectionEyebrow>
      </div>
      <h2 className="mt-2 text-center font-fraunces text-2xl text-white lg:text-3xl">
        {t("pricing.quickAskTitle", locale)}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-white/[0.7]">
        {t("pricing.quickAskBody", locale)}
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={state === "sending" || undefined}
        aria-describedby={state === "error" ? `${fieldIdPrefix}-pricing-error` : undefined}
        className="mt-7 flex flex-col gap-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldIdPrefix}-pricing-name`} className="sr-only">
              {t("pricing.quickAskName", locale)}
            </label>
            <input
              ref={nameRef}
              id={`${fieldIdPrefix}-pricing-name`}
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              disabled={state === "sending"}
              aria-invalid={Boolean(fieldErrors.name) || undefined}
              aria-describedby={fieldErrors.name ? `${fieldIdPrefix}-pricing-name-error` : undefined}
              value={name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder={t("pricing.quickAskName", locale)}
              className="min-h-[46px] w-full rounded-lg border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-white/40 focus:bg-white/15"
            />
            {fieldErrors.name ? (
              <p id={`${fieldIdPrefix}-pricing-name-error`} className="mt-1.5 text-xs text-[var(--color-text-on-inverse)]">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={`${fieldIdPrefix}-pricing-email`} className="sr-only">
              {t("pricing.quickAskEmail", locale)}
            </label>
            <input
              ref={emailRef}
              id={`${fieldIdPrefix}-pricing-email`}
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              disabled={state === "sending"}
              aria-invalid={Boolean(fieldErrors.email) || undefined}
              aria-describedby={fieldErrors.email ? `${fieldIdPrefix}-pricing-email-error` : undefined}
              value={email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder={t("pricing.quickAskEmail", locale)}
              className="min-h-[46px] w-full rounded-lg border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-white/40 focus:bg-white/15"
            />
            {fieldErrors.email ? (
              <p id={`${fieldIdPrefix}-pricing-email-error`} className="mt-1.5 text-xs text-[var(--color-text-on-inverse)]">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
        </div>
        <label htmlFor={`${fieldIdPrefix}-pricing-message`} className="sr-only">
          {t("contact.message", locale)}
        </label>
        <textarea
          ref={messageRef}
          id={`${fieldIdPrefix}-pricing-message`}
          name="message"
          required
          minLength={20}
          maxLength={4000}
          disabled={state === "sending"}
          aria-invalid={Boolean(fieldErrors.message) || undefined}
          aria-describedby={fieldErrors.message ? `${fieldIdPrefix}-pricing-message-error` : undefined}
          value={message}
          onChange={(e) => updateField("message", e.target.value)}
          rows={3}
          placeholder={t("pricing.quickAskPlaceholder", locale)}
          className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/55 outline-none transition focus:border-white/40 focus:bg-white/15"
        />
        {fieldErrors.message ? (
          <p id={`${fieldIdPrefix}-pricing-message-error`} className="text-xs text-[var(--color-text-on-inverse)]">
            {fieldErrors.message}
          </p>
        ) : null}
        {state === "error" && (
          <p
            id={`${fieldIdPrefix}-pricing-error`}
            role="alert"
            className="rounded-lg border border-state-error-solid/60 bg-white/[0.06] px-3 py-2 text-xs text-[var(--color-text-on-inverse)]"
          >
            {t("pricing.quickAskError", locale)}
          </p>
        )}
        <button
          ref={submitRef}
          type="submit"
          disabled={state === "sending"}
          className={`min-h-[48px] rounded-[10px] px-8 text-sm font-semibold transition-all ${
            state === "sending"
              ? "cursor-not-allowed border border-white/25 bg-white/10 text-white/70"
              : "bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] hover:-translate-y-px hover:brightness-[1.06]"
          }`}
        >
          {state === "sending"
            ? t("pricing.quickAskSending", locale)
            : t("pricing.quickAskSend", locale)}
        </button>
        <p className="text-center text-note text-white/[0.6]">
          {t("pricing.ctaTrust", locale)}
        </p>
      </form>
    </div>
  );
}

function validatePricingFields(
  values: { name: string; email: string; message: string },
  locale: Locale,
): PricingFieldErrors {
  const copy = PRICING_VALIDATION_COPY[locale];
  const errors: PricingFieldErrors = {};
  const trimmedName = values.name.trim();
  const trimmedEmail = values.email.trim();
  const trimmedMessage = values.message.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) errors.name = copy.name;
  if (!PRICING_EMAIL_PATTERN.test(trimmedEmail) || trimmedEmail.length > 320) {
    errors.email = copy.email;
  }
  if (trimmedMessage.length < 20) errors.message = copy.message;
  else if (trimmedMessage.length > 4000) errors.message = copy.messageLong;

  return errors;
}
