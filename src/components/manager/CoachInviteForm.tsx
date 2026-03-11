"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CoachInviteFormProps {
  locale: string;
}

export function CoachInviteForm({ locale }: CoachInviteFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const labels =
    locale === "en"
      ? {
          placeholder: "Client email address",
          submit: "Invite",
          submitting: "Inviting…",
          alreadyClient: "This person is already your client.",
          selfInvite: "You cannot invite yourself.",
          slotsFull: "You have reached the maximum client limit.",
          noAccount: "Invitation sent — they don't have a Trita account yet.",
          created: "Client added successfully.",
          reactivated: "Relationship reactivated.",
          unknown: "An error occurred. Please try again.",
        }
      : {
          placeholder: "Kliens email cím",
          submit: "Meghívás",
          submitting: "Meghívás…",
          alreadyClient: "Ez a személy már a kliensed.",
          selfInvite: "Magadat nem hívhatod meg.",
          slotsFull: "Elérted a maximális klienslimitet.",
          noAccount: "Meghívó elküldve — még nincs Trita fiókjuk.",
          created: "Kliens sikeresen hozzáadva.",
          reactivated: "Kapcsolat újraaktiválva.",
          unknown: "Hiba történt. Kérlek próbáld újra.",
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/manager/clients/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMap: Record<string, string> = {
          ALREADY_CLIENT: labels.alreadyClient,
          SELF_INVITE: labels.selfInvite,
          CLIENT_SLOTS_FULL: labels.slotsFull,
        };
        setError(errorMap[data.error] ?? labels.unknown);
      } else {
        const successMap: Record<string, string> = {
          INVITED_NO_ACCOUNT: labels.noAccount,
          CREATED: labels.created,
          REACTIVATED: labels.reactivated,
        };
        setSuccess(successMap[data.status] ?? labels.created);
        setEmail("");
        router.refresh();
      }
    } catch {
      setError(labels.unknown);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.placeholder}
          className="min-h-[44px] flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="min-h-[44px] rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading ? labels.submitting : labels.submit}
        </button>
      </div>
      {error && (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </p>
      )}
    </form>
  );
}
