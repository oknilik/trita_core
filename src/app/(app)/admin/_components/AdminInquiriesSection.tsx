"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

// Kérdések / érdeklődések admin-nézet: contact formról érkező megkeresések
// listája státusz-kezeléssel, jegyzettel és user/org hozzákötéssel.
// A tanácsadó-továbbítás alapja az org-link: a bekötött szervezet
// ORG_CONSULTANT tagjai már beküldéskor notifot kapnak.

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  topic: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; username: string | null; email: string | null } | null;
  org: { id: string; name: string } | null;
}

const TOPIC_LABELS: Record<string, string> = {
  demo: "Demó igény",
  pricing: "Árazás",
  support: "Terméktámogatás",
  partnership: "Partnerség",
  other: "Egyéb",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "Új", className: "bg-state-warning-bg text-state-warning-fg" },
  IN_PROGRESS: { label: "Folyamatban", className: "bg-sage/10 text-sage-dark" },
  CLOSED: { label: "Lezárva", className: "bg-cream text-muted" },
};

const STATUS_ORDER = ["NEW", "IN_PROGRESS", "CLOSED"] as const;

export function AdminInquiriesSection({
  inquiries,
  orgs,
}: {
  inquiries: InquiryRow[];
  orgs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusyId(body.inquiryId as string);
    setError(null);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("PATCH_FAILED");
      router.refresh();
    } catch {
      setError("A módosítás nem sikerült — próbáld újra.");
    } finally {
      setBusyId(null);
    }
  }

  const newCount = inquiries.filter((i) => i.status === "NEW").length;

  return (
    <div className="mt-8 flex flex-col gap-6">
      <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
        <SectionEyebrow>
          kérdések
        </SectionEyebrow>
        <h2 className="mt-1 font-fraunces text-xl text-ink">
          Beérkezett kérdések ({inquiries.length}{newCount > 0 ? ` · ${newCount} új` : ""})
        </h2>
        <p className="mt-1 text-xs text-ink-body">
          A /contact űrlapról érkező megkeresések. Ha a beküldő email alapján
          azonosítható, a user és a szervezete automatikusan hozzákötve — kézzel
          is módosítható. A bekötött szervezet tanácsadója notifot kap az új
          kérdésekről.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">{error}</p>
        )}

        {inquiries.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Még nincs beérkezett kérdés.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {inquiries.map((row) => {
              const status = STATUS_META[row.status] ?? STATUS_META.NEW;
              const isOpen = openId === row.id;
              const busy = busyId === row.id;
              return (
                <div
                  key={row.id}
                  className={`rounded-xl border p-4 transition ${
                    row.status === "NEW" ? "border-state-warning-border bg-state-warning-bg/40" : "border-sand bg-surface-card"
                  }`}
                >
                  {/* Fejléc-sor */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-note font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-note text-ink-body">
                      {TOPIC_LABELS[row.topic] ?? row.topic}
                    </span>
                    <span className="text-sm font-semibold text-ink">{row.name}</span>
                    <a
                      href={`mailto:${row.email}`}
                      className="min-w-0 max-w-full break-all text-xs text-[var(--color-accent-primary-strong)] hover:underline"
                    >
                      {row.email}
                    </a>
                    {row.company && (
                      <span className="text-xs text-muted">· {row.company}</span>
                    )}
                    <span className="ml-auto text-xs text-muted">
                      {new Date(row.createdAt).toLocaleString("hu-HU")}
                    </span>
                  </div>

                  {/* Kapcsolatok */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {row.user ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/10 px-2 py-0.5 text-sage-dark">
                        User: {row.user.username ?? row.user.email ?? row.user.id}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void patch({ inquiryId: row.id, action: "unlink_user" })}
                          className="text-sage-dark/60 hover:text-sage-dark"
                          title="User-link oldása"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <span className="rounded-full bg-cream px-2 py-0.5 text-muted">Nincs user-link</span>
                    )}
                    {row.org ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/10 px-2 py-0.5 text-sage-dark">
                        Org: {row.org.name}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void patch({ inquiryId: row.id, action: "unlink_org" })}
                          className="text-sage-dark/60 hover:text-sage-dark"
                          title="Org-link oldása"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <select
                        disabled={busy}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            void patch({ inquiryId: row.id, action: "link_org", organizationId: e.target.value });
                          }
                        }}
                        className="rounded-lg border border-sand bg-surface-card px-2 py-1 text-xs text-ink-body"
                      >
                        <option value="">Org hozzákötése…</option>
                        {orgs.map((o) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Üzenet */}
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                    {row.message}
                  </p>

                  {/* Jegyzet + akciók */}
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
                      {row.adminNote ? "Jegyzet szerkesztése" : "Jegyzet"}
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
                        placeholder="Belső jegyzet (csak admin látja)…"
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
                        Mentés
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
