"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

// Tanácsadói Kérdések fül — a szervezethez kötött beérkezett kérdések
// (contact form + in-app csatorna). Státusz-kezelés + jegyzet; a user/org
// link kezelése platform-admin hatáskör.

export interface OrgInquiryRow {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
  adminNote: string | null;
  source: string;
  createdAt: string;
  user: { username: string | null; email: string | null } | null;
}

const TOPIC_LABELS: Record<string, string> = {
  demo: "Demó igény",
  pricing: "Árazás",
  support: "Terméktámogatás",
  partnership: "Partnerség",
  question: "Felhasználói kérdés",
  other: "Egyéb",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "Új", className: "bg-amber-50 text-amber-700" },
  IN_PROGRESS: { label: "Folyamatban", className: "bg-sage/10 text-sage-dark" },
  CLOSED: { label: "Lezárva", className: "bg-cream text-muted" },
};

const STATUS_ORDER = ["NEW", "IN_PROGRESS", "CLOSED"] as const;

export function OrgInquiriesTab({
  orgId,
  inquiries,
  isHu,
}: {
  orgId: string;
  inquiries: OrgInquiryRow[];
  isHu: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusyId(body.inquiryId as string);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/inquiries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("PATCH_FAILED");
      router.refresh();
    } catch {
      setError(isHu ? "A módosítás nem sikerült — próbáld újra." : "Update failed — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
      <SectionEyebrow>
        {isHu ? "kérdések" : "inquiries"}
      </SectionEyebrow>
      <h2 className="mt-1 font-fraunces text-xl text-ink">
        {isHu ? "Beérkezett kérdések" : "Incoming inquiries"} ({inquiries.length})
      </h2>
      <p className="mt-1 text-xs text-ink-body">
        {isHu
          ? "A szervezet tagjaitól érkezett megkeresések — az új kérdésekről értesítést kapsz."
          : "Inquiries from members of this organization — you're notified of new ones."}
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {inquiries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {isHu ? "Még nincs beérkezett kérdés." : "No inquiries yet."}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {inquiries.map((row) => {
            const status = STATUS_META[row.status] ?? STATUS_META.NEW;
            const isOpen = openId === row.id;
            const busy = busyId === row.id;
            return (
              <div
                key={row.id}
                className={`rounded-xl border p-4 ${
                  row.status === "NEW" ? "border-amber-200 bg-amber-50/40" : "border-sand bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] text-ink-body">
                    {TOPIC_LABELS[row.topic] ?? row.topic}
                  </span>
                  <span className="text-sm font-semibold text-ink">{row.name}</span>
                  {/* Az e-mail egyetlen törhetetlen token — break-all nélkül
                      320px-en kilógott a kártyából. */}
                  <a
                    href={`mailto:${row.email}`}
                    className="min-w-0 max-w-full break-all text-xs text-bronze hover:underline"
                  >
                    {row.email}
                  </a>
                  <span className="ml-auto text-xs text-muted">
                    {new Date(row.createdAt).toLocaleString(isHu ? "hu-HU" : "en-GB")}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                  {row.message}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-3">
                  {STATUS_ORDER.filter((s) => s !== row.status).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => void patch({ inquiryId: row.id, action: "set_status", status: s })}
                      variant="secondary" size="sm" className="text-xs"
                    >
                      → {STATUS_META[s].label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setOpenId(isOpen ? null : row.id);
                      setNoteDraft(row.adminNote ?? "");
                    }}
                    variant="secondary" size="sm" className="text-xs"
                  >
                    {row.adminNote
                      ? isHu ? "Jegyzet szerkesztése" : "Edit note"
                      : isHu ? "Jegyzet" : "Note"}
                  </Button>
                  {row.adminNote && !isOpen && (
                    <span className="text-xs italic text-muted">„{row.adminNote}”</span>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={2}
                      placeholder={isHu ? "Belső jegyzet…" : "Internal note…"}
                      className="w-full flex-1 rounded-lg border border-sand bg-cream px-3 py-2 text-sm text-ink-body outline-none focus:border-sage/50"
                    />
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        await patch({ inquiryId: row.id, action: "set_note", note: noteDraft });
                        setOpenId(null);
                      }}
                      variant="primary" size="sm" className="shrink-0 self-start text-xs"
                    >
                      {isHu ? "Mentés" : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
