"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";

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
      <TextField
        label={t("org.forms.createOrgName", loc)}
        containerClassName="flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("org.forms.createPlaceholder", loc)}
        maxLength={100}
        required
      />
      <Button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-6"
      >
        {loading
          ? t("org.forms.createLoading", loc)
          : t("org.forms.createButton", loc)}
      </Button>
      {error && (
        <p className="w-full text-sm text-rose-600">{error}</p>
      )}
    </form>
  );
}
