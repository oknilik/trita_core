"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";

interface TeamCreateFormProps {
  locale: Locale;
  orgId?: string;
}

export function TeamCreateForm({ locale, orgId }: TeamCreateFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), ...(orgId ? { orgId } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "ERROR");
        return;
      }
      const { team } = await res.json();
      router.push(`/team/${team.id}`);
    } catch {
      setError("ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <TextField
        label={t("manager.teamCreate.teamName", locale)}
        containerClassName="flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("manager.teamCreate.placeholder", locale)}
        maxLength={80}
        disabled={loading}
        error={error ? t("manager.teamCreate.error", locale) : undefined}
      />
      <Button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-6"
      >
        {loading
          ? t("manager.teamCreate.creating", locale)
          : t("manager.teamCreate.create", locale)}
      </Button>
    </form>
  );
}
