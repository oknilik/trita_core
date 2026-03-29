"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface OrgCreateFormProps {
  locale: string;
}

export function OrgCreateForm({ locale }: OrgCreateFormProps) {
  const router = useRouter();
  const loc = locale as Locale;
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ALREADY_IN_ORG") {
          setError(t("org.forms.alreadyInOrg", loc));
        } else {
          setError(t("org.forms.createGenericError", loc));
        }
        return;
      }
      // New orgs start in PENDING_SETUP — go to wizard
      router.push(`/org/${data.org.id}/setup`);
    } catch {
      setError(t("org.forms.createNetworkError", loc));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-ink">
        {t("org.forms.createOrgName", loc)}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("org.forms.createPlaceholder", loc)}
          maxLength={100}
          required
          className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm font-normal text-ink focus:border-sage focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="min-h-[44px] rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-body/50"
      >
        {loading
          ? t("org.forms.createLoading", loc)
          : t("org.forms.createButton", loc)}
      </button>
      {error && (
        <p className="w-full text-sm text-rose-600">{error}</p>
      )}
    </form>
  );
}
