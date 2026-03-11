"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function BecomeCoachForm({ prefillEmail }: { prefillEmail?: string }) {
  const { locale } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [background, setBackground] = useState("");
  const [motivation, setMotivation] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/manager/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, background, motivation, specializations: specializations || undefined }),
      });
      if (!res.ok) throw new Error("failed");
      setSuccess(true);
    } catch {
      setError(t("becomeCoach.errorGeneric", locale));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50 p-6 text-center">
        <div className="mb-3 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 20 20" className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10l4 4 8-8" />
            </svg>
          </span>
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900">
          {t("becomeCoach.successTitle", locale)}
        </h3>
        <p className="text-sm text-gray-600">
          {t("becomeCoach.successBody", locale)}
        </p>
      </div>
    );
  }

  const inputClass = "min-h-[44px] w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none";
  const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className={labelClass}>
          {t("becomeCoach.nameLabel", locale)}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("becomeCoach.namePlaceholder", locale)}
            required
            minLength={2}
            maxLength={100}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          {t("becomeCoach.emailLabel", locale)}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("becomeCoach.emailPlaceholder", locale)}
            required
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        {t("becomeCoach.backgroundLabel", locale)}
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder={t("becomeCoach.backgroundPlaceholder", locale)}
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </label>

      <label className={labelClass}>
        {t("becomeCoach.motivationLabel", locale)}
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder={t("becomeCoach.motivationPlaceholder", locale)}
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </label>

      <label className={labelClass}>
        {t("becomeCoach.specializationsLabel", locale)}
        <input
          type="text"
          value={specializations}
          onChange={(e) => setSpecializations(e.target.value)}
          placeholder={t("becomeCoach.specializationsPlaceholder", locale)}
          maxLength={500}
          className={inputClass}
        />
      </label>

      {error && (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="min-h-[44px] rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {loading ? t("becomeCoach.submitting", locale) : t("becomeCoach.submitButton", locale)}
      </button>
    </form>
  );
}
