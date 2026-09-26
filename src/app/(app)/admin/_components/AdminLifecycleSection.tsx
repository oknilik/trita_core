"use client";

import { useCallback, useEffect, useState } from "react";
import { REASONS } from "@/lib/lifecycle/copy";

interface Row {
  id: string; rule: string; status: string; reason: string; dueAt: string; count: number; locale: "hu" | "en";
  profile: { email: string | null; username: string | null };
  copy: Record<"hu" | "en", { title: string; body: string; cta: string }>;
}
interface Data {
  mode: string; rows: Row[]; nextCursor: string | null;
  recent: { id: string; rule: string; recipient: string; status: string; claimedAt: string; errorCode: string | null }[];
  completed: { id: string; rule: string; completedAt: string | null; profile: { email: string | null } }[];
  run: { startedAt: string | null; finishedAt: string | null; summary: { errors?: string[] } | null } | null;
}
const modes: Record<string, string> = { off: "Kikapcsolva", preview: "Előnézet", manual: "Kézi küldés", automatic: "Automatikus" };
const states: Record<string, string> = { CLAIMED: "Folyamatban", ACCEPTED: "Szolgáltató átvette", DELIVERED: "Kézbesítve", FAILED: "Sikertelen", UNKNOWN: "Bizonytalan — ellenőrzést igényel", CANCELED: "Visszavonva", BOUNCED: "Visszapattant", COMPLAINED: "Panasz", SUPPRESSED: "Letiltva", LEGACY: "Korábbi emlékeztető" };
function date(value: string) { return new Date(value).toLocaleString("hu-HU"); }

export function AdminLifecycleSection() {
  const [data, setData] = useState<Data | null>(null);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [locale, setLocale] = useState<"hu" | "en">("hu");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const query = new URLSearchParams({ search: activeSearch, ...(cursor ? { cursor } : {}) });
      const response = await fetch(`/api/admin/lifecycle?${query}`);
      if (!response.ok) throw new Error();
      setData(await response.json());
    } catch { setError("Nem sikerült betölteni az utánkövetési listát."); }
    finally { setBusy(false); }
  }, [activeSearch, cursor]);
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: "send" | "snooze" | "dismiss") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/lifecycle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const body = await response.json();
      if (!response.ok) { setError(REASONS[body.error] ?? "A művelet nem sikerült. Ellenőrizd a küldési naplót."); return; }
      await load();
    } catch { setError("Hálózati hiba történt. Frissítsd a listát a küldés újrapróbálása előtt."); }
    finally { setBusy(false); }
  }

  return <section className="mt-8 rounded-xl border border-sand bg-surface-card p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="font-fraunces text-heading text-ink">Profilok utánkövetése</h2>
        <p className="mt-2 text-sm text-muted">Következő lépés, levélelőnézet és küldési napló. Két levél között legalább 72 óra, legfeljebb 3 levél 30 nap alatt.</p></div>
      <span className="rounded-full bg-sage-ghost px-3 py-1 text-sm text-sage-dark">{data ? modes[data.mode] : "Betöltés…"}</span>
    </div>
    <form className="mt-6 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); setCursor(undefined); setActiveSearch(search); if (search === activeSearch && !cursor) void load(); }}>
      <label className="flex flex-1 flex-col gap-1 text-sm">Név vagy emailcím
        <input value={search} onChange={event => setSearch(event.target.value)} maxLength={100} className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 text-ink" placeholder="Üresen az elmúlt 30 nap regisztrálói" /></label>
      <button disabled={busy} className="self-end rounded-lg border border-sand px-4 py-3 text-sm disabled:opacity-50">Lista frissítése</button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-state-danger-fg">{error}</p>}
    {data?.run && <p className="mt-4 text-xs text-muted">Utolsó napi feldolgozás: {data.run.finishedAt ? date(data.run.finishedAt) : "Még nem fejeződött be"} · Hibák: {data.run.summary?.errors?.length ?? 0}</p>}
    <div aria-busy={busy} className="mt-6 space-y-4">
      {data?.rows.map(row => <article key={row.id} className="rounded-lg border border-sand p-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div><h3 className="font-semibold text-ink">{row.profile.username ?? row.profile.email}</h3><p className="text-xs text-muted">{row.profile.email}</p></div>
          <span className="text-sm text-ink-body">{REASONS[row.reason] ?? row.reason}</span>
        </div>
        <p className="mt-3 text-sm font-medium">{row.copy.hu.title}</p>
        <p className="mt-1 text-xs text-muted">Esedékesség: {date(row.dueAt)} · Emlékeztetők: {row.count}/2 · Levél nyelve: {row.locale.toUpperCase()}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setPreview(preview === row.id ? null : row.id); setLocale(row.locale); }} className="min-h-[44px] rounded-lg border border-sand px-3 text-sm">Levélelőnézet</button>
          <button type="button" disabled={busy || row.reason !== "READY" || !["manual", "automatic"].includes(data.mode)} onClick={() => act(row.id, "send")} className="min-h-[44px] rounded-lg bg-sage px-3 text-sm text-[var(--color-action-primary-fg)] disabled:opacity-40">Emlékeztető küldése</button>
          {row.status === "OPEN" && <><button type="button" disabled={busy} onClick={() => act(row.id, "snooze")} className="min-h-[44px] px-3 text-sm underline">Halasztás 7 napra</button><button type="button" disabled={busy} onClick={() => act(row.id, "dismiss")} className="min-h-[44px] px-3 text-sm underline">Kihagyás</button></>}
        </div>
        {preview === row.id && <div className="mt-4 rounded-lg bg-surface-subtle p-4">
          <label className="text-sm">Előnézet nyelve <select aria-label="Előnézet nyelve" value={locale} onChange={e => setLocale(e.target.value as "hu" | "en")} className="ml-2 rounded border border-sand bg-surface-card p-2"><option value="hu">Magyar</option><option value="en">English</option></select></label>
          <p className="mt-4 font-semibold">{row.copy[locale].title}</p><p className="mt-3 text-sm leading-relaxed">{row.copy[locale].body}</p>
          <p className="mt-3 text-sm font-medium">Gomb: {row.copy[locale].cta}</p>
          <p className="mt-2 text-xs text-muted">A címzett belépés után a saját, aktuálisan elérhető lépéséhez jut. A levél halasztási és leiratkozási linket is tartalmaz.</p>
        </div>}
      </article>)}
      {data && !data.rows.length && <p className="text-sm text-muted">Ezen az oldalon nincs utánkövetési cél. Kereshetsz korábbi felhasználóra is.</p>}
    </div>
    {data?.nextCursor && <button type="button" disabled={busy} onClick={() => setCursor(data.nextCursor!)} className="mt-4 min-h-[44px] px-3 text-sm underline">Következő felhasználók</button>}
    {data && <details className="mt-6"><summary className="cursor-pointer py-2 font-semibold">Legutóbbi küldési kísérletek és teljesült célok</summary>
      <div className="overflow-x-auto"><table className="mt-3 w-full text-left text-xs"><thead><tr><th className="p-2">Címzett</th><th className="p-2">Típus</th><th className="p-2">Állapot</th><th className="p-2">Időpont</th></tr></thead><tbody>
        {data.recent.map(row => <tr key={row.id} className="border-t border-sand"><td className="p-2">{row.recipient}</td><td className="p-2">{row.rule}</td><td className="p-2">{states[row.status] ?? row.status}{row.errorCode ? ` (${row.errorCode})` : ""}</td><td className="p-2">{date(row.claimedAt)}</td></tr>)}
      </tbody></table></div>
      <ul className="mt-4 space-y-2 text-sm">{data.completed.map(row => <li key={row.id}>{row.profile.email} · {row.rule} · teljesült {row.completedAt ? date(row.completedAt) : ""}</li>)}</ul>
    </details>}
  </section>;
}
