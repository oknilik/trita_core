"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";

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
      <TextField
        label={t("org.forms.renameLabel", loc)}
        containerClassName="flex-1"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
        maxLength={100}
        required
      />
      <Button
        type="submit"
        disabled={loading || name.trim() === currentName}
        loading={loading}
        className="px-5 disabled:opacity-50"
      >
        {t("org.forms.save", loc)}
      </Button>
      {saved && (
        <p className="text-xs text-green-600">{t("org.forms.saved", loc)}</p>
      )}
      {error && (
        <p className="text-xs text-state-error-solid">{error}</p>
      )}
    </form>
  );
}
