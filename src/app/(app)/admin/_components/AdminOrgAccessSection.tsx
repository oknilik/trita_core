"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ORG_BILLING_FIELDS,
  type OrgBillingProfile,
} from "@/lib/org-billing";
import { AdminListControls } from "@/app/(app)/admin/_components/AdminListControls";

interface OrgRow {
  id: string;
  name: string;
  status: string;
  billingProfile: OrgBillingProfile;
  hideCareerModule: boolean;
  createdAt: string;
  memberCount: number;
  consultants: Array<{ userId: string; email: string | null; username: string | null }>;
  subscription: {
    status: string;
    planType: string | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    candidateCredits: number;
  } | null;
}

interface Props {
  orgs: OrgRow[];
}

type RowState = { loading: boolean; error: string | null };

const PLAN_OPTIONS = ["team", "org", "scale"] as const;

// Alapesetben csak a legutóbbi 5 szervezet látszik (a lista createdAt desc).
const DEFAULT_VISIBLE = 5;

function subscriptionLabel(sub: OrgRow["subscription"]): {
  text: string;
  tone: "active" | "trial" | "off";
} {
  if (!sub || sub.status === "none") return { text: "nincs hozzáférés", tone: "off" };
  if (sub.status === "active") {
    const until = sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString("hu-HU")
      : "—";
    return { text: `aktív · ${sub.planType ?? "?"} · ${until}-ig`, tone: "active" };
  }
  if (sub.status === "trialing") {
    const until = sub.trialEndsAt
      ? new Date(sub.trialEndsAt).toLocaleDateString("hu-HU")
      : "—";
    return { text: `trial · ${until}-ig`, tone: "trial" };
  }
  return { text: sub.status, tone: "off" };
}

export function AdminOrgAccessSection({ orgs }: Props) {
  const router = useRouter();
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [planChoice, setPlanChoice] = useState<Record<string, string>>({});
  const [monthsChoice, setMonthsChoice] = useState<Record<string, number>>({});
  const [consultantEmail, setConsultantEmail] = useState<Record<string, string>>({});
  // Cégadatok (számlázás): lenyíló szerkesztő szervezetenként.
  const [billingOpen, setBillingOpen] = useState<Record<string, boolean>>({});
  const [billingDraft, setBillingDraft] = useState<Record<string, OrgBillingProfile>>({});
  const [billingState, setBillingState] = useState<
    Record<string, { saving: boolean; message: string | null; error: boolean }>
  >({});
  // Lista-vezérlés: névre keresés + „utolsó 5" kapu + kattintásra nyíló szerkesztő.
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((org) => {
      if (org.name.toLowerCase().includes(q)) return true;
      return org.consultants.some(
        (c) =>
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.username ?? "").toLowerCase().includes(q),
      );
    });
  }, [orgs, query]);

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_VISIBLE);

  async function saveBilling(orgId: string) {
    const draft = billingDraft[orgId] ?? {};
    setBillingState((s) => ({ ...s, [orgId]: { saving: true, message: null, error: false } }));
    try {
      const res = await fetch("/api/admin/org-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, action: "update_billing", billing: draft }),
      });
      if (!res.ok) throw new Error("save failed");
      setBillingState((s) => ({
        ...s,
        [orgId]: { saving: false, message: "Cégadatok mentve.", error: false },
      }));
      router.refresh();
    } catch {
      setBillingState((s) => ({
        ...s,
        [orgId]: { saving: false, message: "A mentés nem sikerült.", error: true },
      }));
    }
  }

  async function callAction(
    orgId: string,
    action:
      | "activate"
      | "trial"
      | "extend"
      | "deactivate"
      | "assign_consultant"
      | "remove_consultant"
      | "set_career_module",
    extra?: { consultantEmail?: string; hideCareerModule?: boolean },
  ) {
    setRowState((s) => ({ ...s, [orgId]: { loading: true, error: null } }));
    try {
      const res = await fetch("/api/admin/org-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          action,
          planType: (planChoice[orgId] ?? "team") as "team" | "org" | "scale",
          months: monthsChoice[orgId] ?? 12,
          ...(extra ?? {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data.error as string | undefined;
        const message =
          code === "USER_NOT_FOUND"
            ? "Nincs ilyen email-című felhasználó."
            : code === "ALREADY_MEMBER"
              ? "Ez a felhasználó már tagja a szervezetnek más szerepben."
              : code ?? "Hiba történt";
        throw new Error(message);
      }
      setRowState((s) => ({ ...s, [orgId]: { loading: false, error: null } }));
      router.refresh();
    } catch (err) {
      setRowState((s) => ({
        ...s,
        [orgId]: {
          loading: false,
          error: err instanceof Error ? err.message : "Hiba történt",
        },
      }));
    }
  }

  return (
    <section className="rounded-xl border border-sand bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          Szervezeti hozzáférések
        </h2>
        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-ink-body">
          {orgs.length} szervezet
        </span>
      </div>

      <p className="mb-4 text-xs text-muted">
        Kézi aktiválás — a fizetés a platformon kívül történik (tanácsadói számlázás).
      </p>

      {orgs.length === 0 ? (
        <p className="text-sm text-muted">Még nincs szervezet.</p>
      ) : (
        <>
          <AdminListControls
            query={query}
            onQueryChange={(v) => {
              setQuery(v);
              setShowAll(false);
            }}
            placeholder="Keresés névre vagy tanácsadó-emailre…"
            matched={filtered.length}
            total={orgs.length}
            limit={DEFAULT_VISIBLE}
            showAll={showAll}
            onToggleShowAll={() => setShowAll((v) => !v)}
            noun="szervezet"
          />

          {filtered.length === 0 && (
            <p className="text-sm text-muted">Nincs a keresésre illeszkedő szervezet.</p>
          )}

          <div className="flex flex-col gap-3">
            {visible.map((org) => {
              const state = rowState[org.id] ?? { loading: false, error: null };
              const sub = subscriptionLabel(org.subscription);
              const isOpen = openId === org.id;
              return (
                <div
                  key={org.id}
                  className="rounded-lg border border-sand bg-cream"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : org.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-sand/40"
                  >
                    <span className="w-3 shrink-0 text-xs text-muted">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {org.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {org.memberCount} tag ·{" "}
                        <span
                          className={
                            sub.tone === "active"
                              ? "font-semibold text-emerald-700"
                              : sub.tone === "trial"
                                ? "font-semibold text-amber-700"
                                : "text-muted"
                          }
                        >
                          {sub.text}
                        </span>
                        {org.subscription
                          ? ` · ${org.subscription.candidateCredits} kredit`
                          : ""}
                        {org.consultants.length > 0
                          ? ` · ${org.consultants.length} tanácsadó`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-micro uppercase tracking-widest text-muted">
                      {isOpen ? "bezár" : "szerkeszt"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-sand px-4 pb-4 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={planChoice[org.id] ?? "team"}
                            onChange={(e) =>
                              setPlanChoice((s) => ({ ...s, [org.id]: e.target.value }))
                            }
                            className="min-h-[40px] rounded-lg border border-sand bg-white px-2 text-xs text-ink"
                            aria-label="Csomag"
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <select
                            value={monthsChoice[org.id] ?? 12}
                            onChange={(e) =>
                              setMonthsChoice((s) => ({
                                ...s,
                                [org.id]: Number(e.target.value),
                              }))
                            }
                            className="min-h-[40px] rounded-lg border border-sand bg-white px-2 text-xs text-ink"
                            aria-label="Időtartam"
                          >
                            {[1, 3, 6, 12].map((m) => (
                              <option key={m} value={m}>
                                {m} hó
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={state.loading}
                            onClick={() => callAction(org.id, "activate")}
                            className="min-h-[40px] rounded-lg bg-sage px-3 text-xs font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
                          >
                            Aktiválás
                          </button>
                          <button
                            type="button"
                            disabled={state.loading}
                            onClick={() => callAction(org.id, "trial")}
                            className="min-h-[40px] rounded-lg border border-sand bg-white px-3 text-xs font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
                          >
                            Trial
                          </button>
                          {org.subscription && org.subscription.status !== "none" && (
                            <button
                              type="button"
                              disabled={state.loading}
                              onClick={() => callAction(org.id, "deactivate")}
                              className="min-h-[40px] rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              Lezárás
                            </button>
                          )}
                        </div>
                    </div>
                    <div className="mt-3 border-t border-sand pt-3">
                      <p className="mb-1.5 font-mono text-micro uppercase tracking-widest text-muted">
                        Tanácsadó
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {org.consultants.map((c) => (
                          <span
                            key={c.userId}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                          >
                            {c.username ?? c.email ?? c.userId}
                            <button
                              type="button"
                              disabled={state.loading}
                              onClick={() =>
                                c.email &&
                                callAction(org.id, "remove_consultant", { consultantEmail: c.email })
                              }
                              className="text-amber-600 transition hover:text-rose-600 disabled:opacity-50"
                              aria-label="Tanácsadó eltávolítása"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="email"
                          value={consultantEmail[org.id] ?? ""}
                          onChange={(e) =>
                            setConsultantEmail((s) => ({ ...s, [org.id]: e.target.value }))
                          }
                          placeholder="tanacsado@email.hu"
                          className="min-h-[40px] w-full min-w-0 max-w-full flex-1 rounded-lg border border-sand bg-white px-2.5 text-xs text-ink md:w-52 md:flex-none"
                        />
                        <button
                          type="button"
                          disabled={state.loading || !(consultantEmail[org.id] ?? "").includes("@")}
                          onClick={() => {
                            const email = (consultantEmail[org.id] ?? "").trim();
                            if (!email) return;
                            callAction(org.id, "assign_consultant", { consultantEmail: email });
                            setConsultantEmail((s) => ({ ...s, [org.id]: "" }));
                          }}
                          className="min-h-[40px] rounded-lg border border-sand bg-white px-3 text-xs font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
                        >
                          Hozzárendelés
                        </button>
                      </div>
                    </div>
                    {/* ── Modul-kapcsolók — csak trita admin ── */}
                    <div className="mt-3 border-t border-sand pt-3">
                      <p className="mb-1.5 font-mono text-micro uppercase tracking-widest text-muted">
                        Modulok
                      </p>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-body">
                        <input
                          type="checkbox"
                          checked={org.hideCareerModule}
                          disabled={state.loading}
                          onChange={(e) =>
                            callAction(org.id, "set_career_module", {
                              hideCareerModule: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-[var(--color-accent-primary)]"
                        />
                        <span>
                          Karrier-iránytű elrejtése a tagoknak
                          <span className="ml-1 text-muted">(fül + PDF-blokk)</span>
                        </span>
                        {org.hideCareerModule && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-micro font-semibold text-amber-700">
                            rejtve
                          </span>
                        )}
                      </label>
                    </div>
                    {state.error && (
                      <p className="mt-2 text-xs text-rose-600">{state.error}</p>
                    )}

                    {/* ── Cégadatok (számlázás) — csak itt, az admin nézetben ── */}
                    <div className="mt-3 border-t border-sand pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setBillingOpen((o) => ({ ...o, [org.id]: !o[org.id] }));
                          setBillingDraft((d) =>
                            d[org.id] ? d : { ...d, [org.id]: { ...org.billingProfile } },
                          );
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-body transition hover:text-bronze"
                      >
                        <span>{billingOpen[org.id] ? "▾" : "▸"}</span>
                        Cégadatok (számlázás)
                        {Object.keys(org.billingProfile).length > 0 ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-micro font-semibold text-emerald-700">
                            kitöltve
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-micro font-semibold text-amber-700">
                            hiányzik
                          </span>
                        )}
                      </button>

                      {billingOpen[org.id] && (
                        <div className="mt-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {ORG_BILLING_FIELDS.map((field) => {
                              const value =
                                (billingDraft[org.id]?.[field.key] as string | undefined) ?? "";
                              const onChange = (v: string) =>
                                setBillingDraft((d) => ({
                                  ...d,
                                  [org.id]: { ...(d[org.id] ?? {}), [field.key]: v },
                                }));
                              return (
                                <label key={field.key} className="flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-muted">
                                    {field.label}
                                  </span>
                                  {field.type === "textarea" ? (
                                    <textarea
                                      value={value}
                                      onChange={(e) => onChange(e.target.value)}
                                      placeholder={field.placeholder}
                                      rows={2}
                                      className="rounded-lg border border-sand bg-white px-3 py-2 text-xs text-ink outline-none transition focus:border-sage"
                                    />
                                  ) : (
                                    <input
                                      type={field.type ?? "text"}
                                      value={value}
                                      onChange={(e) => onChange(e.target.value)}
                                      placeholder={field.placeholder}
                                      className="min-h-[40px] rounded-lg border border-sand bg-white px-3 text-xs text-ink outline-none transition focus:border-sage"
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <button
                              type="button"
                              disabled={billingState[org.id]?.saving}
                              onClick={() => saveBilling(org.id)}
                              className="min-h-[40px] rounded-lg bg-action-primary-bg px-5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                            >
                              {billingState[org.id]?.saving ? "Mentés…" : "Cégadatok mentése"}
                            </button>
                            {billingState[org.id]?.message && (
                              <p
                                className={`text-xs font-medium ${
                                  billingState[org.id]?.error ? "text-rose-600" : "text-sage-dark"
                                }`}
                              >
                                {billingState[org.id]?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
