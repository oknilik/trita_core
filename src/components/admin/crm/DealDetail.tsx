"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives/Button";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { EditorialBackControl } from "@/components/ui/primitives/EditorialBackHeader";
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
  CRM_FIELD_LABEL_CLASS,
  CRM_INPUT_CLASS,
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
import { NewsletterEngagementBadge } from "@/components/admin/crm/NewsletterEngagementBadge";

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
  const latestQuote = deal.quotes[0] ?? null;
  const primaryAction = (() => {
    if (latestQuote?.status === "ACCEPTED") {
      return {
        label: "Megrendelőlap készítése",
        href: `/admin/crm/quotes/${latestQuote.id}/documents`,
        message: "Az ajánlatot elfogadták. A következő lépés a megrendelőlap elkészítése.",
      };
    }
    if (!open) return null;
    if (latestQuote?.status === "DRAFT") {
      return {
        label: "Ajánlat folytatása",
        href: `/admin/quote?dealId=${deal.id}&from=${latestQuote.id}`,
        message: "Az ajánlat piszkozatként elkészült, még nincs kiküldve.",
      };
    }
    if (latestQuote?.status === "SENT") {
      return {
        label: "Válasz rögzítése",
        href: "#ajanlatok",
        message: "Az ajánlat kint van, most az ügyfél döntésére vársz.",
      };
    }
    return {
      label: latestQuote ? "Új ajánlat készítése" : "Ajánlat készítése",
      href: `/admin/quote?dealId=${deal.id}`,
      message: latestQuote
        ? "A korábbi ajánlat lezárult. Innen új ajánlatot készíthetsz."
        : "Az egyeztetés alapján elkészítheted az első ajánlatot.",
    };
  })();

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
      setCloseError("Az eredmény nélküli lezáráshoz kötelező okot választani.");
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
        <EditorialBackControl
          href="/admin?tab=crm"
          backLabel="Vissza a CRM-hez"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SectionEyebrow>ügy</SectionEyebrow>
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
            className="-my-2 inline-flex min-h-[44px] shrink-0 items-center text-sm text-[var(--color-accent-primary-strong)] underline underline-offset-2"
          >
            Szerkesztés
          </button>
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-body">
          <span className="font-semibold text-ink">{deal.contactName}</span>
          {deal.company && <span>{deal.company}</span>}
          <a
            href={`mailto:${deal.contactEmail}`}
            className="min-w-0 max-w-full break-all text-[var(--color-accent-primary-strong)] hover:underline"
          >
            {deal.contactEmail}
          </a>
          {deal.contactPhone && (
            <a href={`tel:${deal.contactPhone.replaceAll(" ", "")}`} className="whitespace-nowrap text-[var(--color-accent-primary-strong)] hover:underline">
              {deal.contactPhone}
            </a>
          )}
          <NewsletterEngagementBadge engagement={deal.newsletter} />
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

        {primaryAction && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-sage/40 bg-sage-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-label uppercase text-sage-dark">Következő lépés</p>
              <p className="mt-1 text-sm text-ink-body">{primaryAction.message}</p>
            </div>
            <Link
              href={primaryAction.href}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] bg-action-primary-bg px-[var(--ui-space-5)] text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover"
            >
              {primaryAction.label}
            </Link>
          </div>
        )}

        {/* Ritka állapotműveletek */}
        <details className="mt-4 border-t border-sand/60 pt-2">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-sm font-semibold text-muted marker:content-none hover:text-ink">
            További műveletek
          </summary>
          <div className="flex flex-wrap items-center gap-2 pb-1">
          {open ? (
            <>
              <label className="flex items-center gap-2 text-xs text-muted">
                Állapot:
                <select
                  value={deal.stage}
                  disabled={busy}
                  onChange={(event) => {
                    if (event.target.value !== deal.stage) {
                      void patch({ action: "set_stage", stage: event.target.value });
                    }
                  }}
                  aria-label="Állapot váltása"
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
                  Megnyertként lezárás
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
                  Lezárás eredmény nélkül
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-muted">Újranyitás ebben az állapotban:</span>
              <select
                value={reopenStage}
                disabled={busy}
                onChange={(event) => setReopenStage(event.target.value)}
                aria-label="Újranyitás állapota"
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
        </details>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
            {error}
          </p>
        )}
      </DashboardPanel>

      {/* ── Tartalom: a napi munka elöl, az előzmények és kapcsolatok lenyitva ── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex flex-col gap-4">
          {/* Mindig látható – lezárt (WON) dealen is naplózható ügyfél-történet. */}
          <DashboardPanel tone="cream" className="p-5">
            <SectionEyebrow>esemény rögzítése</SectionEyebrow>
            <div className="mt-3">
              <QuickLogForm dealId={deal.id} />
            </div>
          </DashboardPanel>
          <details className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-sand bg-surface-card px-5 py-3 text-sm font-semibold text-ink shadow-[var(--ui-shadow-sm)] marker:content-none">
              <span>Előzmények ({deal.activities.length + deal.inquiries.length})</span>
              <span className="text-xs font-normal text-muted group-open:hidden">Megnyitás</span>
              <span className="hidden text-xs font-normal text-muted group-open:inline">Bezárás</span>
            </summary>
            <div className="mt-2">
              <DealTimeline activities={deal.activities} inquiries={deal.inquiries} />
            </div>
          </details>
        </div>

        <div className="flex flex-col gap-4">
          <DealNextActionCard deal={deal} />
          <DealQuotesPanel dealId={deal.id} quotes={deal.quotes} />
          <details className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-sand bg-surface-card px-5 py-3 text-sm font-semibold text-ink shadow-[var(--ui-shadow-sm)] marker:content-none">
              <span>Kapcsolatok és hozzáférés</span>
              <span className="text-xs font-normal text-muted group-open:hidden">Megnyitás</span>
              <span className="hidden text-xs font-normal text-muted group-open:inline">Bezárás</span>
            </summary>
            <div className="mt-2">
              <DealLinksPanel deal={deal} orgs={orgs} suggestedUser={suggestedUser} />
            </div>
          </details>
        </div>
      </div>

      {/* ── Szerkesztés-modal ──────────────────────────────────────── */}
      <Modal
        isOpen={details !== null}
        onClose={() => setDetails(null)}
        eyebrow="ügy"
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
              <span className={CRM_FIELD_LABEL_CLASS}>Cím</span>
              <input
                type="text"
                value={details.title}
                onChange={(event) => setDetails({ ...details, title: event.target.value })}
                maxLength={200}
                className={CRM_INPUT_CLASS}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Kapcsolattartó neve</span>
                <input
                  type="text"
                  value={details.contactName}
                  onChange={(event) => setDetails({ ...details, contactName: event.target.value })}
                  maxLength={200}
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Email</span>
                <input
                  type="email"
                  value={details.contactEmail}
                  onChange={(event) => setDetails({ ...details, contactEmail: event.target.value })}
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Telefon</span>
                <input
                  type="tel"
                  value={details.contactPhone}
                  onChange={(event) => setDetails({ ...details, contactPhone: event.target.value })}
                  maxLength={50}
                  placeholder="+36 …"
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Cég</span>
                <input
                  type="text"
                  value={details.company}
                  onChange={(event) => setDetails({ ...details, company: event.target.value })}
                  maxLength={200}
                  className={CRM_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={CRM_FIELD_LABEL_CLASS}>Forrás</span>
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
                <span className={CRM_FIELD_LABEL_CLASS}>Becsült érték (Ft)</span>
                <input
                  type="number"
                  min={0}
                  step={50_000}
                  value={details.expectedValue}
                  onChange={(event) => setDetails({ ...details, expectedValue: event.target.value })}
                  className={`${CRM_INPUT_CLASS} tabular-nums`}
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
        title={closeOutcome === "WON" ? "Ügy megnyerve" : "Ügy lezárása"}
        description={
          closeOutcome === "WON"
            ? "Az ügy lekerül a napi teendők közül. A tanulság rögzítése opcionális."
            : "Mi volt a döntő ok? A rövid tanulság később segít jobb döntéseket hozni."
        }
      >
        <div className="flex flex-col gap-3">
          {closeOutcome === "WON" && !deal.organization && (
            <p className="rounded-lg bg-state-warning-bg px-3 py-2 text-sm text-state-warning-fg">
              Nincs szervezet linkelve – az org-hozzáférés aktiválása így nem
              találja meg automatikusan ezt az ügyet. Egyéni ügynél ez rendben van.
            </p>
          )}
          <label className="flex flex-col gap-1">
            <span className={CRM_FIELD_LABEL_CLASS}>
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
            <span className={CRM_FIELD_LABEL_CLASS}>Tanulság (opcionális)</span>
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
              {closeOutcome === "WON" ? "Lezárás megnyertként" : "Ügy lezárása"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
