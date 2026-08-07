"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives/Button";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  DEAL_SOURCES,
  DEAL_SOURCE_LABELS,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_TONES,
  OPEN_DEAL_STAGES,
  OUTCOME_KINDS,
  OUTCOME_KIND_LABELS,
  type DealSource,
  type DealStage,
  type OutcomeKind,
} from "@/lib/crm/constants";
import { isOpenStage } from "@/lib/crm/guards";
import {
  crmRequest,
  formatDay,
  huf,
  toneToChipVariant,
} from "@/components/admin/crm/crm-ui";
import { QuickLogForm } from "@/components/admin/crm/QuickLogForm";
import { DealNextActionCard } from "@/components/admin/crm/DealNextActionCard";
import { DealTimeline } from "@/components/admin/crm/DealTimeline";
import { DealQuotesPanel } from "@/components/admin/crm/DealQuotesPanel";
import { DealLinksPanel } from "@/components/admin/crm/DealLinksPanel";
import type { CrmDealDetailData } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Deal-részletnézet — fejléc (cím, kontakt tel:/mailto:, stage-váltó),
// következő-lépés sáv, gyors-naplózó, idővonal, ajánlatok, kapcsolatok.
// A lezárás modalos: LOST-hoz kötelező az ok (a szerver is kikényszeríti),
// WON-nál figyelmeztetés, ha nincs org linkelve (az access-hook vak lenne).
// ─────────────────────────────────────────────────────────────────────

interface DetailsDraft {
  title: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  source: string;
  expectedValue: string;
}

export function DealDetail({
  deal,
  orgs,
  suggestedUser,
}: {
  deal: CrmDealDetailData;
  orgs: { id: string; name: string }[];
  suggestedUser: { id: string; email: string | null; username: string | null } | null;
}) {
  const router = useRouter();
  const open = isOpenStage(deal.stage);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsDraft | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<"WON" | "LOST" | null>(null);
  const [outcomeKind, setOutcomeKind] = useState<string>("");
  const [outcomeNote, setOutcomeNote] = useState("");
  const [closeError, setCloseError] = useState<string | null>(null);
  const [reopenStage, setReopenStage] = useState<string>("DISCOVERY");

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

  async function saveDetails() {
    if (!details) return;
    const expected = Number.parseInt(details.expectedValue, 10);
    const ok = await patch({
      action: "set_details",
      ...(details.title.trim() ? { title: details.title.trim() } : {}),
      ...(details.contactName.trim() ? { contactName: details.contactName.trim() } : {}),
      ...(details.contactEmail.trim() ? { contactEmail: details.contactEmail.trim() } : {}),
      contactPhone: details.contactPhone.trim() ? details.contactPhone.trim() : null,
      company: details.company.trim() ? details.company.trim() : null,
      ...(DEAL_SOURCES.includes(details.source as DealSource)
        ? { source: details.source }
        : {}),
      expectedValue: Number.isFinite(expected) && expected >= 0 ? expected : null,
    });
    if (ok) setDetails(null);
  }

  async function submitClose() {
    if (!closeOutcome) return;
    if (closeOutcome === "LOST" && !outcomeKind) {
      setCloseError("Elveszett lezáráshoz kötelező okot választani.");
      return;
    }
    setBusy(true);
    setCloseError(null);
    const result = await crmRequest(`/api/admin/crm/deals/${deal.id}`, {
      method: "PATCH",
      body: {
        action: closeOutcome === "WON" ? "close_won" : "close_lost",
        ...(outcomeKind ? { outcomeKind } : {}),
        ...(outcomeNote.trim() ? { outcomeNote: outcomeNote.trim() } : {}),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setCloseError(result.error);
      return;
    }
    setCloseOutcome(null);
    setOutcomeKind("");
    setOutcomeNote("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Fejléc ─────────────────────────────────────────────────── */}
      <DashboardPanel className="p-5 md:p-6">
        <Link
          href="/admin?tab=crm"
          className="inline-flex min-h-[44px] items-center text-sm text-bronze underline underline-offset-2"
        >
          ← CRM
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SectionEyebrow>deal</SectionEyebrow>
          <StatusChip
            variant={toneToChipVariant(DEAL_STAGE_TONES[deal.stage as DealStage] ?? "neutral")}
          >
            {DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage}
          </StatusChip>
          <StatusChip variant="neutral">
            {DEAL_SOURCE_LABELS[deal.source as DealSource] ?? deal.source}
          </StatusChip>
          {!open && deal.outcomeKind && (
            <StatusChip variant="neutral">
              {OUTCOME_KIND_LABELS[deal.outcomeKind as OutcomeKind] ?? deal.outcomeKind}
            </StatusChip>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="min-w-0 font-fraunces text-2xl text-ink [overflow-wrap:anywhere]">
            {deal.title}
          </h1>
          <button
            type="button"
            onClick={() =>
              setDetails({
                title: deal.title,
                contactName: deal.contactName,
                contactEmail: deal.contactEmail,
                contactPhone: deal.contactPhone ?? "",
                company: deal.company ?? "",
                source: deal.source,
                expectedValue: deal.expectedValue != null ? String(deal.expectedValue) : "",
              })
            }
            className="-my-2 inline-flex min-h-[44px] shrink-0 items-center text-sm text-bronze underline underline-offset-2"
          >
            Szerkesztés
          </button>
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-body">
          <span className="font-semibold text-ink">{deal.contactName}</span>
          {deal.company && <span>{deal.company}</span>}
          <a
            href={`mailto:${deal.contactEmail}`}
            className="min-w-0 max-w-full break-all text-bronze hover:underline"
          >
            {deal.contactEmail}
          </a>
          {deal.contactPhone && (
            <a href={`tel:${deal.contactPhone.replaceAll(" ", "")}`} className="whitespace-nowrap text-bronze hover:underline">
              {deal.contactPhone}
            </a>
          )}
          <span className="text-xs text-muted">
            létrehozva: {formatDay(deal.createdAt)}
            {deal.closedAt ? ` · lezárva: ${formatDay(deal.closedAt)}` : ""}
          </span>
          {deal.expectedValue != null && (
            <span className="text-xs text-muted">
              becsült érték: <span className="tabular-nums">{huf(deal.expectedValue)}</span>
            </span>
          )}
        </p>

        {!open && deal.outcomeNote && (
          <p className="mt-2 text-sm italic text-ink-body">„{deal.outcomeNote}”</p>
        )}

        {/* Stage-vezérlők */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-3">
          {open ? (
            <>
              <label className="flex items-center gap-2 text-xs text-muted">
                Stage:
                <select
                  value={deal.stage}
                  disabled={busy}
                  onChange={(event) => {
                    if (event.target.value !== deal.stage) {
                      void patch({ action: "set_stage", stage: event.target.value });
                    }
                  }}
                  aria-label="Stage váltása"
                  className="min-h-[40px] rounded-lg border border-sand bg-surface-card px-2 text-sm text-ink"
                >
                  {OPEN_DEAL_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {DEAL_STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setOutcomeKind("");
                    setOutcomeNote("");
                    setCloseError(null);
                    setCloseOutcome("WON");
                  }}
                >
                  Megnyert
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setOutcomeKind("");
                    setOutcomeNote("");
                    setCloseError(null);
                    setCloseOutcome("LOST");
                  }}
                >
                  Elveszett
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-muted">Újranyitás ide:</span>
              <select
                value={reopenStage}
                disabled={busy}
                onChange={(event) => setReopenStage(event.target.value)}
                aria-label="Újranyitás stage-e"
                className="min-h-[40px] rounded-lg border border-sand bg-surface-card px-2 text-sm text-ink"
              >
                {OPEN_DEAL_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {DEAL_STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void patch({ action: "reopen", stage: reopenStage })}
              >
                Újranyitás
              </Button>
            </>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
            {error}
          </p>
        )}
      </DashboardPanel>

      {/* ── Tartalom: bal (naplózó + idővonal) · jobb (lépés, ajánlat, linkek) ── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex flex-col gap-4">
          {/* Mindig látható — lezárt (WON) dealen is naplózható ügyfél-történet. */}
          <DashboardPanel tone="cream" className="p-5">
            <SectionEyebrow>gyors-naplózó</SectionEyebrow>
            <div className="mt-3">
              <QuickLogForm dealId={deal.id} />
            </div>
          </DashboardPanel>
          <DealTimeline activities={deal.activities} inquiries={deal.inquiries} />
        </div>

        <div className="flex flex-col gap-4">
          <DealNextActionCard deal={deal} />
          <DealQuotesPanel dealId={deal.id} quotes={deal.quotes} />
          <DealLinksPanel deal={deal} orgs={orgs} suggestedUser={suggestedUser} />
        </div>
      </div>

      {/* ── Szerkesztés-modal ──────────────────────────────────────── */}
      <Modal
        isOpen={details !== null}
        onClose={() => setDetails(null)}
        eyebrow="deal"
        title="Adatok szerkesztése"
      >
        {details && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveDetails();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-label uppercase text-muted">Cím</span>
              <input
                type="text"
                value={details.title}
                onChange={(event) => setDetails({ ...details, title: event.target.value })}
                maxLength={200}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none transition focus:border-bronze"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-label uppercase text-muted">Kontakt neve</span>
                <input
                  type="text"
                  value={details.contactName}
                  onChange={(event) => setDetails({ ...details, contactName: event.target.value })}
                  maxLength={200}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none transition focus:border-bronze"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label uppercase text-muted">Email</span>
                <input
                  type="email"
                  value={details.contactEmail}
                  onChange={(event) => setDetails({ ...details, contactEmail: event.target.value })}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none transition focus:border-bronze"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label uppercase text-muted">Telefon</span>
                <input
                  type="tel"
                  value={details.contactPhone}
                  onChange={(event) => setDetails({ ...details, contactPhone: event.target.value })}
                  maxLength={50}
                  placeholder="+36 …"
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none transition focus:border-bronze"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label uppercase text-muted">Cég</span>
                <input
                  type="text"
                  value={details.company}
                  onChange={(event) => setDetails({ ...details, company: event.target.value })}
                  maxLength={200}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink outline-none transition focus:border-bronze"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label uppercase text-muted">Forrás</span>
                <select
                  value={details.source}
                  onChange={(event) => setDetails({ ...details, source: event.target.value })}
                  className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-2 text-sm text-ink"
                >
                  {DEAL_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {DEAL_SOURCE_LABELS[source]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label uppercase text-muted">Becsült érték (Ft)</span>
                <input
                  type="number"
                  min={0}
                  step={50_000}
                  value={details.expectedValue}
                  onChange={(event) => setDetails({ ...details, expectedValue: event.target.value })}
                  className="min-h-[44px] w-full rounded-lg border border-sand bg-surface-card px-3 text-sm tabular-nums text-ink outline-none transition focus:border-bronze"
                />
              </label>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDetails(null)}>
                Mégse
              </Button>
              <Button type="submit" loading={busy}>
                Mentés
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Lezárás-modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={closeOutcome !== null}
        onClose={() => setCloseOutcome(null)}
        eyebrow="lezárás"
        title={closeOutcome === "WON" ? "Deal megnyerve" : "Deal elveszett"}
        description={
          closeOutcome === "WON"
            ? "A deal lekerül a napi teendők közül; a tanulság rögzítése opcionális."
            : "Mi volt a döntő ok? A strukturált win/loss tanulság a termék-visszacsatolás alapja."
        }
      >
        <div className="flex flex-col gap-3">
          {closeOutcome === "WON" && !deal.organization && (
            <p className="rounded-lg bg-state-warning-bg px-3 py-2 text-sm text-state-warning-fg">
              Nincs szervezet linkelve — az org-hozzáférés aktiválása így nem
              találja meg automatikusan ezt a dealt. Egyéni ügynél ez rendben van.
            </p>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-label uppercase text-muted">
              Ok{closeOutcome === "LOST" ? " (kötelező)" : " (opcionális)"}
            </span>
            <select
              value={outcomeKind}
              onChange={(event) => setOutcomeKind(event.target.value)}
              data-testid="crm-close-outcome-kind"
              className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-2 text-sm text-ink"
            >
              <option value="">Válassz…</option>
              {OUTCOME_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {OUTCOME_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label uppercase text-muted">Tanulság (opcionális)</span>
            <textarea
              value={outcomeNote}
              onChange={(event) => setOutcomeNote(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Mit tanultunk ebből az ügyből?"
              className="w-full rounded-lg border border-sand bg-surface-card px-3 py-2 text-sm text-ink-body outline-none transition focus:border-bronze"
            />
          </label>
          {closeError && (
            <p role="alert" data-testid="crm-close-error" className="rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
              {closeError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setCloseOutcome(null)}>
              Mégse
            </Button>
            <Button
              type="button"
              loading={busy}
              data-testid="crm-close-submit"
              onClick={() => void submitClose()}
            >
              {closeOutcome === "WON" ? "Lezárás megnyertként" : "Lezárás elveszettként"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
