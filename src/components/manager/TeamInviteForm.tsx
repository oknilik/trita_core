"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

interface TeamInviteFormProps {
  teamId: string;
  locale: Locale;
}

export function TeamInviteForm({ teamId, locale }: TeamInviteFormProps) {
  const isHu = locale !== "en";
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
          ALREADY_MEMBER: isHu ? "Ez a személy már tagja a csapatnak (vagy meghívó küldve)." : "This person is already a member or has a pending invite.",
        };
        setError(messages[code] ?? (isHu ? "Hiba. Próbáld újra." : "Something went wrong."));
        return;
      }
      setSuccess(data.pending ? "pending" : "added");
      setEmail("");
      router.refresh();
    } catch {
      setError(isHu ? "Hiba. Próbáld újra." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-sm font-semibold text-ink">
            {isHu ? "Emailcím" : "Email address"}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isHu ? "kolléga@cég.hu" : "colleague@company.com"}
            className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm font-normal text-ink focus:border-sage focus:outline-none"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="min-h-[44px] rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-body/50"
        >
          {loading
            ? isHu ? "Hozzáadás…" : "Adding…"
            : isHu ? "Hozzáadás" : "Add member"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {success === "added" && (
        <p className="text-xs text-green-600">
          {isHu ? "Tag sikeresen hozzáadva." : "Member added successfully."}
        </p>
      )}
      {success === "pending" && (
        <p className="text-xs text-amber-600">
          {isHu
            ? "Meghívó elküldve. Automatikusan csatlakozik, ha regisztrál."
            : "Invite sent. They'll join automatically once they register."}
        </p>
      )}
    </form>
  );
}
