"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { AdminListControls } from "@/app/(app)/admin/_components/AdminListControls";

// ─────────────────────────────────────────────────────────────────────
// Admin → Tanácsadók fül: platform-szintű tanácsadók kezelése.
//   · meghívás emaillel (regisztrációkor automatikusan érvényesül)
//   · nyitott meghívók visszavonása
//   · szervezet-kiosztás (ORG_CONSULTANT tagság) és visszavonás
//   · tanácsadó eltávolítása a platformról
// API: /api/admin/consultants (action-alapú POST)
// ─────────────────────────────────────────────────────────────────────

interface ConsultantOrg {
  id: string;
  name: string;
}

interface Consultant {
  id: string;
  email: string | null;
  username: string | null;
  createdAt: string;
  orgs: ConsultantOrg[];
}

interface Invite {
  id: string;
  email: string;
  note: string | null;
  createdAt: string;
}

// Alapesetben csak a legutóbbi 10 tanácsadó látszik.
const DEFAULT_VISIBLE = 10;

export function AdminConsultantsSection({ orgs }: { orgs: ConsultantOrg[] }) {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Lista-vezérlés: névre/emailre keresés + „utolsó 10" kapu + nyíló szerkesztő.
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return consultants;
    return consultants.filter(
      (c) =>
        (c.username ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.orgs.some((o) => o.name.toLowerCase().includes(q)),
    );
  }, [consultants, query]);

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/consultants");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setConsultants(data.consultants ?? []);
      setInvites(data.invites ?? []);
    } catch {
      setError("Nem sikerült betölteni a tanácsadókat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(body: Record<string, string>, key: string) {
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "ACTION_FAILED");
      }
      await load();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "HAS_REAL_MEMBERSHIP"
          ? "Ez a felhasználó valódi (admin/tag) tagsággal van az org-ban — tanácsadóként nem osztható ki."
          : "A művelet nem sikerült.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          email: inviteEmail.trim(),
          note: inviteNote.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("invite failed");
      const data = await res.json();
      setInviteMessage(
        data.appliedNow
          ? "Kész — a fiók már létezett, azonnal tanácsadó lett."
          : "Meghívó rögzítve — regisztrációkor automatikusan tanácsadó lesz.",
      );
      setInviteEmail("");
      setInviteNote("");
      await load();
    } catch {
      setError("A meghívás nem sikerült.");
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Meghívás */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <SectionEyebrow>
          tanácsadó meghívása
        </SectionEyebrow>
        <h2 className="mt-1 font-fraunces text-xl text-ink">Onboardolás a tritára</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-body">
          Add meg az emailt — ha a fiók már létezik, azonnal tanácsadó lesz; ha még
          nincs, regisztrációkor automatikusan az lesz. A tanácsadó nem kényszerül
          tesztre, és szervezetekhez innen tudod kiosztani.
        </p>
        <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="tanacsado@email.hu"
            className="min-h-[44px] flex-1 rounded-lg border border-sand bg-white px-4 text-sm text-ink outline-none transition focus:border-sage"
          />
          <input
            type="text"
            value={inviteNote}
            onChange={(e) => setInviteNote(e.target.value)}
            placeholder="Megjegyzés (opcionális)"
            className="min-h-[44px] flex-1 rounded-lg border border-sand bg-white px-4 text-sm text-ink outline-none transition focus:border-sage"
          />
          <button
            type="submit"
            disabled={inviteBusy || !inviteEmail.trim()}
            className="min-h-[44px] rounded-lg bg-action-primary-bg px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviteBusy ? "Meghívás…" : "Meghívás"}
          </button>
        </form>
        {inviteMessage && (
          <p className="mt-3 text-sm font-medium text-sage-dark">{inviteMessage}</p>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Nyitott meghívók */}
      {invites.length > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Nyitott meghívók ({invites.length})
          </p>
          <div className="flex flex-col divide-y divide-sand">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{inv.email}</p>
                  {inv.note && <p className="truncate text-xs text-muted">{inv.note}</p>}
                </div>
                <button
                  type="button"
                  disabled={busyKey === `revoke-${inv.id}`}
                  onClick={() => action({ action: "revoke_invite", inviteId: inv.id }, `revoke-${inv.id}`)}
                  className="shrink-0 rounded-lg border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-rose-200 hover:text-rose-600"
                >
                  Visszavonás
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tanácsadók */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          Tanácsadók ({consultants.length})
        </p>
        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Betöltés…</p>
        ) : consultants.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Még nincs tanácsadó a platformon — hívd meg az elsőt fent.
          </p>
        ) : (
          <>
          <AdminListControls
            query={query}
            onQueryChange={(v) => {
              setQuery(v);
              setShowAll(false);
            }}
            placeholder="Keresés névre, emailre vagy szervezetre…"
            matched={filtered.length}
            total={consultants.length}
            limit={DEFAULT_VISIBLE}
            showAll={showAll}
            onToggleShowAll={() => setShowAll((v) => !v)}
            noun="tanácsadó"
          />

          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              Nincs a keresésre illeszkedő tanácsadó.
            </p>
          )}

          <div className="flex flex-col divide-y divide-sand">
            {visible.map((c) => {
              const assignedIds = new Set(c.orgs.map((o) => o.id));
              const assignable = orgs.filter((o) => !assignedIds.has(o.id));
              const selection = assignSelection[c.id] ?? "";
              const isOpen = openId === c.id;
              return (
                <div key={c.id} className="flex flex-col gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : c.id)}
                    aria-expanded={isOpen}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-cream"
                  >
                    <span className="w-3 shrink-0 text-xs text-muted">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {c.username ?? c.email ?? "—"}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {c.username && c.email ? `${c.email} · ` : ""}
                        {c.orgs.length === 0
                          ? "nincs szervezet"
                          : c.orgs.length === 1
                            ? c.orgs[0].name
                            : `${c.orgs.length} szervezet`}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-micro uppercase tracking-widest text-muted">
                      {isOpen ? "bezár" : "szerkeszt"}
                    </span>
                  </button>

                  {isOpen && (
                    <>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={busyKey === `remove-${c.id}`}
                        onClick={() =>
                          action({ action: "remove_consultant", profileId: c.id }, `remove-${c.id}`)
                        }
                        className="shrink-0 rounded-lg border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-rose-200 hover:text-rose-600"
                      >
                        Eltávolítás
                      </button>
                    </div>

                    {/* Kiosztott szervezetek */}
                    <div className="flex flex-wrap items-center gap-2">
                      {c.orgs.length === 0 && (
                        <span className="text-xs text-muted">Még nincs szervezethez rendelve.</span>
                      )}
                      {c.orgs.map((o) => (
                        <span
                          key={o.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/5 px-3 py-1 text-xs font-medium text-sage-dark"
                        >
                          {o.name}
                          <button
                            type="button"
                            aria-label={`${o.name} — kiosztás visszavonása`}
                            disabled={busyKey === `unassign-${c.id}-${o.id}`}
                            onClick={() =>
                              action(
                                { action: "unassign_org", profileId: c.id, orgId: o.id },
                                `unassign-${c.id}-${o.id}`,
                              )
                            }
                            className="text-sage-dark/60 transition hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Új kiosztás */}
                    {assignable.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={selection}
                          onChange={(e) =>
                            setAssignSelection((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          className="min-h-[38px] rounded-lg border border-sand bg-white px-3 text-xs text-ink outline-none"
                        >
                          <option value="">Szervezet kiválasztása…</option>
                          {assignable.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selection || busyKey === `assign-${c.id}`}
                          onClick={() =>
                            action(
                              { action: "assign_org", profileId: c.id, orgId: selection },
                              `assign-${c.id}`,
                            )
                          }
                          className="min-h-[38px] rounded-lg bg-sage px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Kiosztás
                        </button>
                      </div>
                    )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
      </section>
    </div>
  );
}
