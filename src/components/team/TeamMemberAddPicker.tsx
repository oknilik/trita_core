"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";

export interface AddableOrgMember {
  userId: string;
  label: string;
}

// Meglévő szervezeti tag hozzáadása a csapathoz — a manager-út.
// (E-mailes meghívó admin-paritáshoz kötött; a manager innen, a szervezet
// taglistájából választ. Racionalizálási döntés, 2026-07-22.)
export function TeamMemberAddPicker({
  teamId,
  candidates,
  isHu,
}: {
  teamId: string;
  candidates: AddableOrgMember[];
  isHu: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const messages: Record<string, string> = {
          ALREADY_MEMBER: isHu ? "Már tagja a csapatnak." : "Already a member of this team.",
          TARGET_NOT_ORG_MEMBER: isHu
            ? "A kiválasztott felhasználó nem aktív szervezeti tag."
            : "The selected user is not an active organization member.",
        };
        setError(
          messages[data.error] ??
            (isHu ? "Nem sikerült hozzáadni a tagot." : "Could not add the member."),
        );
        return;
      }
      setSelected("");
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba — próbáld újra." : "Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (candidates.length === 0) {
    return (
      <p className="text-xs text-muted">
        {isHu
          ? "A szervezet minden tagja már ebben a csapatban van."
          : "Every organization member is already in this team."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="min-h-[40px] flex-1 rounded-lg border border-sand bg-white px-3 text-sm text-ink focus:border-sage focus:outline-none"
        >
          <option value="">
            {isHu ? "Válassz szervezeti tagot…" : "Pick an organization member…"}
          </option>
          {candidates.map((c) => (
            <option key={c.userId} value={c.userId}>
              {c.label}
            </option>
          ))}
        </select>
        <Button onClick={handleAdd} disabled={!selected || loading}>
          {loading
            ? isHu ? "Hozzáadás…" : "Adding…"
            : isHu ? "Hozzáadás a csapathoz" : "Add to team"}
        </Button>
      </div>
      {error ? <InlineBanner variant="error">{error}</InlineBanner> : null}
    </div>
  );
}
