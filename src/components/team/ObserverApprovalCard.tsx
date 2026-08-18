"use client";

// Jóváhagyásra váró KÜLSŐ observer-meghívók — a csapat oldalán, a
// menedzser / org admin / tanácsadó látja. Jóváhagyáskor megy ki a
// meghívó e-mail; elutasításkor a meghívó visszavonódik, a tag
// mindkét esetben értesítést kap.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPanel, DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";

export interface PendingObserverApproval {
  id: string;
  inviterName: string;
  targetLabel: string;
  createdAt: string;
  campaignName: string;
}

export function ObserverApprovalCard({
  approvals,
  isHu,
}: {
  approvals: PendingObserverApproval[];
  isHu: boolean;
}) {
  const router = useRouter();
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decided, setDecided] = useState<Set<string>>(new Set());

  const visible = approvals.filter((a) => !decided.has(a.id));
  if (visible.length === 0) return null;

  const decide = async (id: string, action: "approve" | "decline") => {
    if (decidingId) return;
    setDecidingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/observer/invite/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setDecided((prev) => new Set(prev).add(id));
      router.refresh();
    } catch {
      setError(
        isHu ? "A döntést nem sikerült elmenteni. Próbáld újra!" : "Could not save the decision. Please retry.",
      );
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <section>
      <DashboardSectionHeader
        label={isHu ? "Jóváhagyásra váró külső értékelők" : "External observers awaiting approval"}
        className="mb-3"
      />
      <DashboardPanel>
        <p className="text-xs leading-relaxed text-muted">
          {isHu
            ? "A futó mérés-kör szabálya szerint a szervezeten kívüli értékelő-meghívókhoz jóváhagyás kell. Jóváhagyáskor a meghívó e-mail azonnal kimegy."
            : "Per the running measurement round's rules, observer invites outside the organization need approval. On approval the invitation email goes out immediately."}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {visible.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-2 rounded-xl border border-sand bg-cream/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                {/* A címkék gyakran nyers e-mail címek — törés nélkül
                    kifutnának a kártyából (oldal-szintű vízszintes scroll). */}
                <p className="break-words text-caption text-ink">
                  <span className="font-semibold">{a.inviterName}</span>
                  {" → "}
                  <span className="font-semibold">{a.targetLabel}</span>
                </p>
                <p className="break-words text-note text-muted">
                  {a.campaignName} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                <button
                  type="button"
                  disabled={decidingId !== null}
                  onClick={() => decide(a.id, "approve")}
                  className="inline-flex min-h-[36px] items-center rounded-[10px] bg-sage px-4 text-xs font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark disabled:opacity-50"
                >
                  {decidingId === a.id ? "…" : isHu ? "Jóváhagyom" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={decidingId !== null}
                  onClick={() => decide(a.id, "decline")}
                  className="inline-flex min-h-[36px] items-center rounded-[10px] border border-sand bg-surface-card px-4 text-xs font-semibold text-ink-body transition hover:bg-cream disabled:opacity-50"
                >
                  {isHu ? "Elutasítom" : "Decline"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {error ? <p className="mt-2 text-xs font-semibold text-state-warning-fg">{error}</p> : null}
      </DashboardPanel>
    </section>
  );
}
