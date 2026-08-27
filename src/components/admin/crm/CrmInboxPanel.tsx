"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives/Button";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { EmptyState } from "@/components/ui/primitives/EmptyState";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { INQUIRY_TOPIC_LABELS } from "@/lib/inquiry-topics";
import { buildDealTitleFromInquiry } from "@/lib/crm/guards";
import {
  CRM_FIELD_LABEL_CLASS,
  CRM_INPUT_CLASS,
  crmRequest,
  dayInputToIso,
  formatDateTime,
} from "@/components/admin/crm/crm-ui";
import type { CrmIntakeRow, CrmOpenDealOption } from "@/components/admin/crm/types";
import { NewsletterEngagementBadge } from "@/components/admin/crm/NewsletterEngagementBadge";

// ─────────────────────────────────────────────────────────────────────
// Beérkező — kvalifikációs kapu: NEW státuszú, deal nélküli inquiry-k.
// Három döntés soronként: „Pipeline-ba” (deal-létrehozás előtöltve),
// „Csatolás meglévőhöz” (email-match ajánlattal), „Nem sales” (a meglévő
// inquiry-PATCH CLOSED — a pipeline-statisztikát nem érinti).
// ─────────────────────────────────────────────────────────────────────

interface DealDraft {
  inquiryId: string;
  title: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  expectedValue: string;
  nextDate: string;
  nextNote: string;
}

function draftFromInquiry(row: CrmIntakeRow): DealDraft {
  return {
    inquiryId: row.id,
    title: buildDealTitleFromInquiry({
      name: row.name,
      company: row.company,
      topicLabel: INQUIRY_TOPIC_LABELS[row.topic] ?? row.topic,
    }),
    contactName: row.name,
    contactEmail: row.email,
    contactPhone: "",
    company: row.company ?? "",
    expectedValue: "",
    nextDate: "",
    nextNote: "",
  };
}

export function CrmInboxPanel({
  inquiries,
  openDeals,
}: {
  inquiries: CrmIntakeRow[];
  openDeals: CrmOpenDealOption[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DealDraft | null>(null);
  const [attachId, setAttachId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function closeAsNotSales(inquiryId: string) {
    setBusyId(inquiryId);
    setError(null);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, action: "set_status", status: "CLOSED" }),
      });
      if (!res.ok) throw new Error("PATCH_FAILED");
      router.refresh();
    } catch {
      setError("A lezárás nem sikerült – próbáld újra.");
    } finally {
      setBusyId(null);
    }
  }

  async function attachTo(inquiryId: string, dealId: string) {
    setBusyId(inquiryId);
    setError(null);
    const result = await crmRequest(`/api/admin/crm/deals/${dealId}`, {
      method: "PATCH",
      body: { action: "attach_inquiry", inquiryId },
    });
    setBusyId(null);
    setAttachId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function createDeal() {
    if (!draft || saving) return;
    setSaving(true);
    setModalError(null);
    const expected = Number.parseInt(draft.expectedValue, 10);
    const result = await crmRequest("/api/admin/crm/deals", {
      method: "POST",
      body: {
        inquiryId: draft.inquiryId,
        title: draft.title.trim() || undefined,
        contactName: draft.contactName.trim() || undefined,
        contactEmail: draft.contactEmail.trim() || undefined,
        contactPhone: draft.contactPhone.trim() || undefined,
        company: draft.company.trim() || undefined,
        ...(Number.isFinite(expected) && expected >= 0 ? { expectedValue: expected } : {}),
        ...(draft.nextDate
          ? {
              nextActionAt: dayInputToIso(draft.nextDate),
              ...(draft.nextNote.trim() ? { nextActionNote: draft.nextNote.trim() } : {}),
            }
          : {}),
      },
    });
    setSaving(false);
    if (!result.ok) {
      setModalError(result.error);
      return;
    }
    setDraft(null);
    router.refresh();
  }

  const patchDraft = (changes: Partial<DealDraft>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current));

  return (
    <DashboardPanel className="p-5 md:p-6">
      <SectionEyebrow>beérkező</SectionEyebrow>
      <h2 className="mt-1 font-fraunces text-xl text-ink">
        Kvalifikálásra váró megkeresések {inquiries.length > 0 ? `(${inquiries.length})` : ""}
      </h2>
      <p className="mt-1 text-xs text-ink-body">
        Új, dealhez még nem kötött megkeresések. A pipeline-ba kerülés döntés:
        ami nem sales, azt zárd le itt – nem torzítja a win-rate-et.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
          {error}
        </p>
      )}

      {inquiries.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="Nincs kvalifikálásra váró megkeresés."
          description="Új contact-űrlapos megkeresés automatikusan itt landol; nyitott dealhez tartozó email-ről érkező üzenet magától a deal idővonalára kerül."
        />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {inquiries.map((row) => {
            const busy = busyId === row.id;
            const attaching = attachId === row.id;
            return (
              <div key={row.id} className="rounded-xl border border-sand bg-surface-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip variant="info">
                    {INQUIRY_TOPIC_LABELS[row.topic] ?? row.topic}
                  </StatusChip>
                  <span className="text-sm font-semibold text-ink">{row.name}</span>
                  <a
                    href={`mailto:${row.email}`}
                    className="min-w-0 max-w-full break-all text-xs text-[var(--color-accent-primary-strong)] hover:underline"
                  >
                    {row.email}
                  </a>
                  {row.company && <span className="text-xs text-muted">· {row.company}</span>}
                  <NewsletterEngagementBadge engagement={row.newsletter} />
                  <span className="ml-auto text-xs text-muted">{formatDateTime(row.createdAt)}</span>
                </div>

                {row.openDealMatch && (
                  <p className="mt-2 rounded-lg bg-state-info-bg px-3 py-2 text-xs text-state-info-fg">
                    Ez az email már pipeline-ban van:{" "}
                    <Link
                      href={`/admin/crm/${row.openDealMatch.id}`}
                      className="font-semibold underline underline-offset-2"
                    >
                      {row.openDealMatch.title}
                    </Link>{" "}
                    – valószínűleg oda tartozik.
                  </p>
                )}

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                  {row.message}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setModalError(null);
                      setDraft(draftFromInquiry(row));
                    }}
                  >
                    Pipeline-ba
                  </Button>
                  {row.openDealMatch ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      className="max-w-full [overflow-wrap:anywhere]"
                      onClick={() => void attachTo(row.id, row.openDealMatch!.id)}
                    >
                      Csatolás: {row.openDealMatch.title}
                    </Button>
                  ) : openDeals.length > 0 ? (
                    attaching ? (
                      <select
                        autoFocus
                        disabled={busy}
                        defaultValue=""
                        onChange={(event) => {
                          if (event.target.value) void attachTo(row.id, event.target.value);
                        }}
                        onBlur={() => setAttachId(null)}
                        aria-label="Deal kiválasztása csatoláshoz"
                        className="min-h-[44px] w-full min-w-0 max-w-full flex-1 rounded-lg border border-sand bg-surface-card px-2 text-sm text-ink-body md:w-auto md:flex-none"
                      >
                        <option value="">Melyik dealhez?</option>
                        {openDeals.map((deal) => (
                          <option key={deal.id} value={deal.id}>
                            {deal.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => setAttachId(row.id)}
                      >
                        Csatolás meglévőhöz
                      </Button>
                    )
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void closeAsNotSales(row.id)}
                    className="ml-auto"
                  >
                    Nem sales – lezárás
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deal-létrehozó modal – előtöltve az inquiry-ből */}
      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        eyebrow="pipeline-ba"
        title="Deal létrehozása"
        description="A kontakt-adatok a megkeresésből jönnek – az üzenet a deal idővonalára kerül."
      >
        {draft && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void createDeal();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className={CRM_FIELD_LABEL_CLASS}>Deal címe</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                maxLength={200}
                className={CRM_INPUT_CLASS}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Kontakt neve</span>
                <input
                  type="text"
                  value={draft.contactName}
                  onChange={(event) => patchDraft({ contactName: event.target.value })}
                  maxLength={200}
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Email</span>
                <input
                  type="email"
                  value={draft.contactEmail}
                  onChange={(event) => patchDraft({ contactEmail: event.target.value })}
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Telefon</span>
                <input
                  type="tel"
                  value={draft.contactPhone}
                  onChange={(event) => patchDraft({ contactPhone: event.target.value })}
                  maxLength={50}
                  placeholder="+36 …"
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Cég</span>
                <input
                  type="text"
                  value={draft.company}
                  onChange={(event) => patchDraft({ company: event.target.value })}
                  maxLength={200}
                  className={CRM_INPUT_CLASS}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 sm:max-w-[220px]">
              <span className={CRM_FIELD_LABEL_CLASS}>Becsült érték (nettó Ft)</span>
              <input
                type="number"
                min={0}
                step={50_000}
                value={draft.expectedValue}
                onChange={(event) => patchDraft({ expectedValue: event.target.value })}
                className={`${CRM_INPUT_CLASS} tabular-nums`}
              />
            </label>
            <div className="rounded-xl border border-sand bg-cream/60 p-3">
              <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">Első következő lépés</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                <input
                  type="date"
                  value={draft.nextDate}
                  onChange={(event) => patchDraft({ nextDate: event.target.value })}
                  aria-label="Következő lépés dátuma"
                  className={CRM_INPUT_CLASS}
                />
                <input
                  type="text"
                  value={draft.nextNote}
                  onChange={(event) => patchDraft({ nextNote: event.target.value })}
                  maxLength={1000}
                  placeholder="pl. válasz-email + hívás egyeztetése"
                  aria-label="Következő lépés jegyzete"
                  className={CRM_INPUT_CLASS}
                />
              </div>
            </div>

            {modalError && (
              <p role="alert" className="rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
                {modalError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDraft(null)}>
                Mégse
              </Button>
              <Button type="submit" loading={saving}>
                Létrehozás
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardPanel>
  );
}
