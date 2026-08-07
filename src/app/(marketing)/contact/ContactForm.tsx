"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/public";
import { t } from "@/lib/i18n/public";
import { track } from "@/lib/analytics/client";

type Topic = "demo" | "pricing" | "support" | "partnership" | "other";

export function ContactForm({ locale }: { locale: Locale }) {
  const topicOptions: Array<{ value: Topic; label: string }> = useMemo(
    () => [
      { value: "demo", label: t("contact.topicDemo", locale) },
      { value: "pricing", label: t("contact.topicPricing", locale) },
      { value: "support", label: t("contact.topicSupport", locale) },
      { value: "partnership", label: t("contact.topicPartnership", locale) },
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
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-[24px] border border-sage/15 bg-sage-soft px-6 py-8">
        <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-sage-dark/70">
          {t("contact.successTitle", locale)}
        </p>
        <h3 className="mt-3 font-fraunces text-[32px] leading-tight text-ink">
          {t("contact.successBody", locale)}
        </h3>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 inline-flex min-h-[50px] items-center rounded-xl bg-action-primary-bg px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-body"
        >
          {t("contact.sendAnother", locale)}
        </button>
      </div>
    );
  }

  const inputClass =
    "min-h-[52px] w-full rounded-xl border border-sand bg-cream px-4 font-fraunces text-[16px] tracking-[-0.012em] text-ink outline-none transition-all md:text-body focus:border-bronze/40 focus:bg-white focus:ring-2 focus:ring-bronze/12";
  const labelClass = "block text-sm font-medium text-ink";

  return (
    <form onSubmit={handleSubmit} onFocusCapture={handleFormStart} className="grid gap-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className={labelClass}>
          <span className="mb-2 block">
            {t("contact.name", locale)} <span className="text-bronze">*</span>
          </span>
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
          <span className="mb-2 block">
            {t("contact.email", locale)} <span className="text-bronze">*</span>
          </span>
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
          <span className="mb-2 block">{t("contact.company", locale)}</span>
          <input
            maxLength={120}
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          <span className="mb-2 block">
            {t("contact.topic", locale)} <span className="text-bronze">*</span>
          </span>
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
        <span className="mb-2 block">
          {t("contact.message", locale)} <span className="text-bronze">*</span>
        </span>
        <textarea
          required
          minLength={20}
          maxLength={4000}
          rows={7}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} min-h-[180px] resize-y py-3.5 leading-relaxed`}
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
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-sand pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-dm-sans text-[11px] uppercase tracking-widest text-ink-body">
          {t("contact.requiredHint", locale)}
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-bronze px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bronze-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t("contact.submitting", locale) : t("contact.submit", locale)}
        </button>
      </div>
    </form>
  );
}
