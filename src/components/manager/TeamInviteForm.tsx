"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";
import { TextField } from "@/components/ui/primitives/TextField";

interface TeamInviteFormProps {
  teamId: string;
  locale: Locale;
}

export function TeamInviteForm({ teamId, locale }: TeamInviteFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<"added" | "pending" | false>(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/team/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = data.error ?? "ERROR";
        const messages: Record<string, string> = {
          ALREADY_MEMBER: t("manager.teamInvite.alreadyMember", locale),
        };
        setError(messages[code] ?? t("manager.teamInvite.error", locale));
        return;
      }
      setSuccess(data.pending ? "pending" : "added");
      setEmail("");
      router.refresh();
    } catch {
      setError(t("manager.teamInvite.error", locale));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <TextField
          label={t("manager.teamInvite.emailLabel", locale)}
          containerClassName="flex-1"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("manager.teamInvite.emailPlaceholder", locale)}
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className="px-5"
        >
          {loading
            ? t("manager.teamInvite.adding", locale)
            : t("manager.teamInvite.add", locale)}
        </Button>
      </div>
      {error ? (
        <InlineBanner variant="error" className="text-xs">
          {error}
        </InlineBanner>
      ) : null}
      {success === "added" && (
        <InlineBanner variant="success" className="text-xs">
          {t("manager.teamInvite.memberAdded", locale)}
        </InlineBanner>
      )}
      {success === "pending" && (
        <InlineBanner variant="warning" className="text-xs">
          {t("manager.teamInvite.inviteSent", locale)}
        </InlineBanner>
      )}
    </form>
  );
}
