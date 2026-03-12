"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
}

interface CandidateInviteFormProps {
  locale: string;
  teams: Team[];
  preselectedTeamId?: string;
}

interface CreatedInvite {
  id: string;
  token: string;
  email?: string | null;
  name?: string | null;
  position?: string | null;
}

export function CandidateInviteForm({ locale, teams, preselectedTeamId }: CandidateInviteFormProps) {
  const isHu = locale !== "en" && locale !== "de";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [teamId, setTeamId] = useState(preselectedTeamId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedInvite(null);
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (email.trim()) body.email = email.trim();
      if (name.trim()) body.name = name.trim();
      if (position.trim()) body.position = position.trim();
      if (teamId) body.teamId = teamId;

      const res = await fetch("/api/manager/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { invite?: CreatedInvite; error?: string };
      if (!res.ok) {
        setError(
          isHu
            ? "Hiba történt a meghívó létrehozása során."
            : "An error occurred while creating the invite.",
        );
        return;
      }
      if (data.invite) {
        setCreatedInvite(data.invite);
        setEmail("");
        setName("");
        setPosition("");
        setTeamId("");
        router.refresh();
      }
    } catch {
      setError(isHu ? "Hiba történt. Kérlek próbáld újra." : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!createdInvite) return;
    const link = `${appUrl}/apply/${createdInvite.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => {/* noop */});
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            {isHu ? "Email cím (opcionális)" : "Email address (optional)"}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isHu ? "jelolt@pelda.hu" : "candidate@example.com"}
              className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            {isHu ? "Jelölt neve (opcionális)" : "Candidate name (optional)"}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isHu ? "Kovács Anna" : "Jane Smith"}
              className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            {isHu ? "Pozíció (opcionális)" : "Position (optional)"}
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={isHu ? "pl. Termékmenedzser" : "e.g. Product Manager"}
              className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
            />
          </label>
          {teams.length > 0 && (
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              {isHu ? "Csapat (opcionális)" : "Team (optional)"}
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
              >
                <option value="">{isHu ? "— Nincs csapat —" : "— No team —"}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] self-start rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading
            ? (isHu ? "Létrehozás…" : "Creating…")
            : (isHu ? "Meghívó létrehozása" : "Create invite")}
        </button>
      </form>

      {createdInvite && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="mb-2 text-sm font-semibold text-emerald-800">
            {isHu ? "Meghívó létrehozva!" : "Invite created!"}
          </p>
          <p className="mb-3 text-xs text-emerald-700">
            {isHu
              ? "Másold ki az alábbi linket és küldd el a jelöltnek:"
              : "Copy the link below and send it to the candidate:"}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-gray-700">
              {`${appUrl}/apply/${createdInvite.token}`}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] shrink-0 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              {copied ? (isHu ? "Másolva!" : "Copied!") : (isHu ? "Másolás" : "Copy")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
