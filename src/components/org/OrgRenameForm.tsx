"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface OrgRenameFormProps {
  orgId: string;
  currentName: string;
  locale: string;
}

export function OrgRenameForm({ orgId, currentName, locale }: OrgRenameFormProps) {
  const router = useRouter();
  const loc = locale as Locale;
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === currentName) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        setError(t("org.forms.renameError", loc));
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t("org.forms.renameNetworkError", loc));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
          {t("org.forms.renameLabel", loc)}
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            maxLength={100}
            required
            className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm font-normal text-ink focus:border-sage focus:outline-none"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading || name.trim() === currentName}
        className="min-h-[44px] rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
      >
        {loading ? "..." : t("org.forms.save", loc)}
      </button>
      {saved && (
        <p className="text-xs text-green-600">{t("org.forms.saved", loc)}</p>
      )}
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
    </form>
  );
}
