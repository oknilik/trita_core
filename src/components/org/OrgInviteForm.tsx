"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrgRole = "ORG_ADMIN" | "ORG_MANAGER" | "ORG_MEMBER";

interface OrgInviteFormProps {
  orgId: string;
  locale: string;
  canInviteManager?: boolean; // ORG_ADMIN can set higher roles
}

export function OrgInviteForm({ orgId, locale, canInviteManager = false }: OrgInviteFormProps) {
  const router = useRouter();
  const isHu = locale !== "en";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("ORG_MEMBER");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "pending" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/org/${orgId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "ALREADY_MEMBER") {
          setError(isHu ? "Ez az emailcím már tag." : "This email is already a member.");
        } else if (data.error === "ALREADY_IN_ORG") {
          setError(isHu ? "Ez a felhasználó már tagja egy szervezetnek." : "This user already belongs to an organization.");
        } else if (data.error === "SELF_INVITE") {
          setError(isHu ? "Saját magadat nem hívhatod meg." : "You cannot invite yourself.");
        } else {
          setError(isHu ? "Hiba történt. Próbáld újra." : "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data.pending ? "pending" : "success");
      setEmail("");
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba. Próbáld újra." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-gray-700">
          {isHu ? "Email cím" : "Email address"}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isHu ? "kolléga@cég.hu" : "colleague@company.com"}
            required
            className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
          />
        </label>
        {canInviteManager && (
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
            {isHu ? "Szerepkör" : "Role"}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
            >
              <option value="ORG_MEMBER">{isHu ? "Tag" : "Member"}</option>
              <option value="ORG_MANAGER">{isHu ? "Menedzser" : "Manager"}</option>
              <option value="ORG_ADMIN">Admin</option>
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="min-h-[44px] rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading
            ? isHu ? "Meghívás..." : "Inviting..."
            : isHu ? "Meghívás" : "Invite"}
        </button>
      </form>

      {result === "success" && (
        <p className="text-sm text-green-600">
          {isHu ? "Tag hozzáadva!" : "Member added!"}
        </p>
      )}
      {result === "pending" && (
        <p className="text-sm text-amber-600">
          {isHu
            ? "Meghívó elküldve — amint regisztrálnak, automatikusan csatlakoznak."
            : "Invite sent — they'll join automatically once they register."}
        </p>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
