"use client";

// Jóváhagyásra váró KÜLSŐ observer-meghívók — a csapat oldalán, a
// menedzser / org admin / tanácsadó látja. Jóváhagyáskor megy ki a
// meghívó e-mail; elutasításkor a meghívó visszavonódik, a tag
// mindkét esetben értesítést kap.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives/Card";
import { Button } from "@/components/ui/primitives/Button";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";

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
        isHu
          ? "A döntést nem sikerült elmenteni. Próbáld újra!"
          : "Could not save the decision. Please retry.",
      );
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <section>
      <DashboardSectionHeader
        label={
          isHu
            ? "Jóváhagyásra váró külső értékelők"
            : "External observers awaiting approval"
        }
        className="mb-3"
      />
      <Card spacing="lg" className="@container">
        <p className="max-w-3xl text-caption text-muted">
          {isHu
            ? "Ebben a mérési körben jóváhagyás szükséges a szervezeten kívüli értékelők meghívásához. Jóváhagyás után azonnal elküldjük a meghívót e-mailben."
            : "Per the running measurement round's rules, observer invites outside the organization need approval. On approval the invitation email goes out immediately."}
        </p>
        <ul className="mt-5 divide-y divide-border-default border-t border-border-default">
          {visible.map((a) => (
            <li
              key={a.id}
              className="flex min-w-0 flex-col gap-4 py-5 last:pb-0 @xl:flex-row @xl:items-center @xl:justify-between"
            >
              <div className="min-w-0 flex-1">
                {/* A címkék gyakran nyers e-mail címek – törés nélkül
                    kifutnának a kártyából (oldal-szintű vízszintes scroll). */}
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-body text-ink [overflow-wrap:anywhere]">
                  <span className="font-semibold">{a.inviterName}</span>
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                  <span className="font-semibold">{a.targetLabel}</span>
                </p>
                <p className="mt-1 text-caption text-muted [overflow-wrap:anywhere]">
                  {a.campaignName} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString(
                    isHu ? "hu-HU" : "en-GB",
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 @xl:flex @xl:shrink-0">
                <Button
                  type="button"
                  disabled={decidingId !== null}
                  onClick={() => decide(a.id, "approve")}
                >
                  {decidingId === a.id ? "…" : isHu ? "Jóváhagyom" : "Approve"}
                </Button>
                <Button
                  type="button"
                  disabled={decidingId !== null}
                  onClick={() => decide(a.id, "decline")}
                  variant="secondary"
                >
                  {isHu ? "Elutasítom" : "Decline"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {error ? (
          <p
            role="alert"
            className="mt-4 text-caption font-semibold text-state-warning-fg"
          >
            {error}
          </p>
        ) : null}
      </Card>
    </section>
  );
}
