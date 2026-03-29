"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Topic = "demo" | "pricing" | "support" | "partnership" | "other";

export function ContactForm({ locale }: { locale: Locale }) {
  const topicOptions: Array<{ value: Topic; label: string }> = useMemo(() => [
    { value: "demo", label: t("contact.topicDemo", locale) },
    { value: "pricing", label: t("contact.topicPricing", locale) },
    { value: "support", label: t("contact.topicSupport", locale) },
    { value: "partnership", label: t("contact.topicPartnership", locale) },
    { value: "other", label: t("contact.topicOther", locale) },
  ], [locale]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState<Topic>("demo");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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

      if (!res.ok) {
        throw new Error("request_failed");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setCompany("");
      setTopic("demo");
      setMessage("");
      setWebsite("");
    } catch {
      setError(t("contact.errorGeneric", locale));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded border border-[#d7ebde] bg-sage-soft p-6">
        <h3 className="font-fraunces text-2xl text-ink">{t("contact.successTitle", locale)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-body">{t("contact.successBody", locale)}</p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-5 inline-flex min-h-[44px] items-center rounded bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-body"
        >
          {t("contact.sendAnother", locale)}
        </button>
      </div>
    );
  }

  const inputClass = "min-h-[46px] w-full rounded border border-sand bg-cream px-3 text-sm text-ink outline-none transition-colors focus:border-sage";
  const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-ink";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className={labelClass}>
          {t("contact.name", locale)} *
          <input
            required
            minLength={2}
            maxLength={100}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          {t("contact.email", locale)} *
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className={labelClass}>
          {t("contact.company", locale)}
          <input
            maxLength={120}
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          {t("contact.topic", locale)} *
          <select
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value as Topic)}
            className={inputClass}
          >
            {topicOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        {t("contact.message", locale)} *
        <textarea
          required
          minLength={20}
          maxLength={4000}
          rows={7}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y py-2.5 leading-relaxed`}
        />
      </label>

      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {error ? (
        <p className="rounded border border-sage-ring bg-sage-soft px-4 py-3 text-sm text-bronze-dark">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-dm-sans text-[11px] uppercase tracking-[1px] text-ink-body">
          {t("contact.requiredHint", locale)}
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[46px] items-center rounded bg-sage px-6 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sage-soft"
        >
          {loading ? t("contact.submitting", locale) : t("contact.submit", locale)}
        </button>
      </div>
    </form>
  );
}
