"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { INQUIRY_TOPIC_LABELS } from "@/lib/inquiry-topics";
import { crmRequest, formatDay } from "@/components/admin/crm/crm-ui";
import type { CrmDealDetailData } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Kapcsolatok panel — org/user-csatolás (a won-ágon az org-access hook
// ezen a linken találja meg a dealt!), csatolt megkeresések, belső
// jegyzet. A user-link email-egyezés alapján ajánlott (nincs user-kereső).
// ─────────────────────────────────────────────────────────────────────

export function DealLinksPanel({
  deal,
  orgs,
  suggestedUser,
}: {
  deal: CrmDealDetailData;
  orgs: { id: string; name: string }[];
  suggestedUser: { id: string; email: string | null; username: string | null } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    const result = await crmRequest(`/api/admin/crm/deals/${deal.id}`, {
      method: "PATCH",
      body,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <DashboardPanel className="p-5">
      <SectionEyebrow>kapcsolatok</SectionEyebrow>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
          {error}
        </p>
      )}

      {/* Szervezet */}
      <div className="mt-3">
        <p className="text-label uppercase text-muted">Szervezet</p>
        {deal.organization ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-ink">
            <span className="min-w-0 [overflow-wrap:anywhere]">{deal.organization.name}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ action: "unlink_org" })}
              title="Org-link oldása"
              className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-state-error-fg"
            >
              ×
            </button>
          </p>
        ) : (
          <select
            disabled={busy}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                void patch({ action: "link_org", organizationId: event.target.value });
              }
            }}
            aria-label="Szervezet hozzákötése"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-2 text-sm text-ink-body"
          >
            <option value="">Org hozzákötése…</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-muted">
          A won-ágon az org-aktiválás ezen a linken találja meg a dealt.
        </p>
      </div>

      {/* User */}
      <div className="mt-4 border-t border-sand/60 pt-3">
        <p className="text-label uppercase text-muted">Felhasználó</p>
        {deal.userProfile ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-ink">
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {deal.userProfile.username ?? deal.userProfile.email ?? deal.userProfile.id}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ action: "unlink_user" })}
              title="User-link oldása"
              className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-state-error-fg"
            >
              ×
            </button>
          </p>
        ) : suggestedUser ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            className="mt-1 max-w-full [overflow-wrap:anywhere]"
            onClick={() => void patch({ action: "link_user", userProfileId: suggestedUser.id })}
          >
            Csatolás: {suggestedUser.email ?? suggestedUser.username ?? suggestedUser.id}
          </Button>
        ) : (
          <p className="mt-1 text-xs text-muted">
            Nincs a kontakt-emailhez tartozó fiók.
          </p>
        )}
      </div>

      {/* Csatolt megkeresések */}
      <div className="mt-4 border-t border-sand/60 pt-3">
        <p className="text-label uppercase text-muted">
          Megkeresések ({deal.inquiries.length})
        </p>
        {deal.inquiries.length === 0 ? (
          <p className="mt-1 text-xs text-muted">
            Nincs csatolt megkeresés — a Beérkezőből csatolható.
          </p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1.5">
            {deal.inquiries.map((inquiry) => (
              <li key={inquiry.id} className="flex items-center gap-2 text-sm text-ink-body">
                <span className="truncate">
                  {INQUIRY_TOPIC_LABELS[inquiry.topic] ?? inquiry.topic} ·{" "}
                  {formatDay(inquiry.createdAt)}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patch({ action: "detach_inquiry", inquiryId: inquiry.id })}
                  title="Leválasztás a dealről"
                  className="-my-2 ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-state-error-fg"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Belső jegyzet */}
      <div className="mt-4 border-t border-sand/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-label uppercase text-muted">Háttér-jegyzet</p>
          <button
            type="button"
            onClick={() => {
              setNoteDraft(deal.adminNote ?? "");
              setNoteOpen((open) => !open);
            }}
            className="-my-2 inline-flex min-h-[44px] shrink-0 items-center text-xs text-[var(--color-accent-primary-strong)] underline underline-offset-2"
          >
            {noteOpen ? "Bezárás" : deal.adminNote ? "Szerkesztés" : "Jegyzet"}
          </button>
        </div>
        {noteOpen ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Döntéshozó, motiváció, kontextus — csak admin látja."
              aria-label="Háttér-jegyzet"
              className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm text-ink-body outline-none transition focus:border-bronze"
            />
            <Button
              type="button"
              size="sm"
              loading={busy}
              className="self-start"
              onClick={async () => {
                const ok = await patch({
                  action: "set_note",
                  note: noteDraft.trim() ? noteDraft.trim() : null,
                });
                if (ok) setNoteOpen(false);
              }}
            >
              Mentés
            </Button>
          </div>
        ) : deal.adminNote ? (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
            {deal.adminNote}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            Döntéshozó, motiváció, kontextus — ide érdemes felírni.
          </p>
        )}
      </div>
    </DashboardPanel>
  );
}
