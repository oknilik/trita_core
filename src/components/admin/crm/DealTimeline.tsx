"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { INQUIRY_TOPIC_LABELS } from "@/lib/inquiry-topics";
import { ACTIVITY_KIND_LABELS, type ActivityKind } from "@/lib/crm/constants";
import {
  CRM_INPUT_CLASS,
  CRM_TEXTAREA_CLASS,
  crmRequest,
  formatDateTime,
  formatDay,
} from "@/components/admin/crm/crm-ui";
import type { CrmActivityRow, CrmDetailInquiryRow } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Deal-idővonal — kézi bejegyzések és SYSTEM-események egy folyamban
// (desc). A SYSTEM halkabb (mono-eyebrow, tompított), nem szerkeszthető.
// Legalul virtuális elem: a csatolt inquiry-k eredeti üzenete — a deal
// története a legelső megkeresésig visszaolvasható.
// ─────────────────────────────────────────────────────────────────────

const ICON = "h-4 w-4 shrink-0";

function ActivityKindIcon({ kind }: { kind: string }) {
  switch (kind as ActivityKind) {
    case "CALL":
      return (
        <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2h3l1.5 3.5L5.8 7a9.5 9.5 0 0 0 3.2 3.2l1.5-1.7L14 10v3a1 1 0 0 1-1 1A11 11 0 0 1 2 3a1 1 0 0 1 1-1Z" />
        </svg>
      );
    case "EMAIL_OUT":
      return (
        <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="4" width="10" height="8" rx="1" />
          <path d="M1.5 5.5 6.5 9l5-3.5M11 7h3.5m0 0-2-2m2 2-2 2" />
        </svg>
      );
    case "EMAIL_IN":
      return (
        <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4.5" y="4" width="10" height="8" rx="1" />
          <path d="M4.5 5.5 9.5 9l5-3.5M5 7H1.5m0 0 2-2m-2 2 2 2" />
        </svg>
      );
    case "MEETING":
      return (
        <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="5" r="2.2" />
          <circle cx="11" cy="6" r="1.8" />
          <path d="M1.5 13.5a4 4 0 0 1 8 0M9.5 13.5a3.2 3.2 0 0 1 5 -2.6" />
        </svg>
      );
    case "NOTE":
      return (
        <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 2.5 13.5 4.5 6 12l-3 1 1-3 7.5-7.5Z" />
        </svg>
      );
    default:
      return (
        <svg className={ICON} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
        </svg>
      );
  }
}

export function DealTimeline({
  activities,
  inquiries,
}: {
  activities: CrmActivityRow[];
  inquiries: CrmDetailInquiryRow[];
}) {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveEdit(activityId: string) {
    if (!summaryDraft.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await crmRequest(`/api/admin/crm/activities/${activityId}`, {
      method: "PATCH",
      body: {
        summary: summaryDraft.trim(),
        body: bodyDraft.trim() ? bodyDraft.trim() : null,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditId(null);
    router.refresh();
  }

  async function remove(activityId: string) {
    setBusy(true);
    setError(null);
    const result = await crmRequest(`/api/admin/crm/activities/${activityId}`, {
      method: "DELETE",
    });
    setBusy(false);
    setConfirmDeleteId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <DashboardPanel className="p-5 md:p-6">
      <SectionEyebrow>idővonal</SectionEyebrow>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
          {error}
        </p>
      )}

      {activities.length === 0 && inquiries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Még nincs bejegyzés – az első hívás/email a fenti gyors-naplózóval
          rögzíthető.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {activities.map((activity) => {
            const isSystem = activity.kind === "SYSTEM";
            const isEditing = editId === activity.id;
            return (
              <li
                key={activity.id}
                className={
                  isSystem
                    ? "rounded-lg border border-sand/60 bg-cream/50 px-3.5 py-2.5"
                    : "rounded-xl border border-sand bg-surface-card p-3.5"
                }
              >
                <div
                  className={`flex flex-wrap items-center gap-2 ${
                    isSystem ? "text-muted" : "text-ink-body"
                  }`}
                >
                  <ActivityKindIcon kind={activity.kind} />
                  <span
                    className={
                      isSystem
                        ? "font-mono text-micro uppercase tracking-widest text-muted"
                        : "text-label uppercase text-[var(--color-accent-primary-strong)]"
                    }
                  >
                    {ACTIVITY_KIND_LABELS[activity.kind as ActivityKind] ?? activity.kind}
                  </span>
                  <span className="ml-auto text-xs text-muted">
                    {formatDateTime(activity.occurredAt)}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      type="text"
                      value={summaryDraft}
                      onChange={(event) => setSummaryDraft(event.target.value)}
                      maxLength={300}
                      aria-label="Összefoglaló szerkesztése"
                      className={CRM_INPUT_CLASS}
                    />
                    <textarea
                      value={bodyDraft}
                      onChange={(event) => setBodyDraft(event.target.value)}
                      rows={3}
                      maxLength={4000}
                      placeholder="Törzs (opcionális)"
                      aria-label="Törzs szerkesztése"
                      className={CRM_TEXTAREA_CLASS}
                    />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" loading={busy} onClick={() => void saveEdit(activity.id)}>
                        Mentés
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditId(null)}>
                        Mégse
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      className={`mt-1.5 text-sm ${
                        isSystem ? "text-muted" : "font-medium text-ink"
                      }`}
                    >
                      {activity.summary}
                    </p>
                    {activity.body && (
                      <p
                        className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${
                          isSystem ? "text-muted" : "text-ink-body"
                        }`}
                      >
                        {activity.body}
                      </p>
                    )}
                    {!isSystem && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditId(activity.id);
                            setSummaryDraft(activity.summary);
                            setBodyDraft(activity.body ?? "");
                            setConfirmDeleteId(null);
                          }}
                          className="inline-flex min-h-[44px] items-center text-[var(--color-accent-primary-strong)] underline underline-offset-2"
                        >
                          Szerkesztés
                        </button>
                        {confirmDeleteId === activity.id ? (
                          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-muted">Biztos?</span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void remove(activity.id)}
                              className="inline-flex min-h-[44px] items-center font-semibold text-state-error-fg underline underline-offset-2"
                            >
                              Törlés
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="inline-flex min-h-[44px] items-center text-muted underline underline-offset-2"
                            >
                              Mégse
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmDeleteId(activity.id)}
                            className="inline-flex min-h-[44px] items-center text-muted underline underline-offset-2 hover:text-ink-body"
                          >
                            Törlés
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}

          {/* Virtuális elemek: a csatolt megkeresések eredeti üzenete */}
          {[...inquiries]
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .map((inquiry) => (
              <li
                key={`inquiry-${inquiry.id}`}
                className="rounded-xl border border-dashed border-sand bg-cream/70 p-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-micro uppercase tracking-widest text-muted">
                    eredeti megkeresés
                  </span>
                  <span className="text-xs text-ink-body">
                    {inquiry.name} · {INQUIRY_TOPIC_LABELS[inquiry.topic] ?? inquiry.topic}
                  </span>
                  <span className="ml-auto text-xs text-muted">{formatDay(inquiry.createdAt)}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                  {inquiry.message}
                </p>
              </li>
            ))}
        </ol>
      )}
    </DashboardPanel>
  );
}
