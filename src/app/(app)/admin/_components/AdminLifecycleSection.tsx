"use client";

import { useCallback, useEffect, useState } from "react";
import { REASONS, RULE_LABELS, DELIVERY_LABELS, MODE_LABELS } from "@/lib/lifecycle/copy";
import { t, tf } from "@/lib/i18n";

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
const text = (key: string) => t(`lifecycle.admin.${key}`, "hu");
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
    } catch { setError(text("loadError")); }
    finally { setBusy(false); }
  }, [activeSearch, cursor]);
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: "send" | "snooze" | "dismiss") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/lifecycle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const body = await response.json();
      if (!response.ok) { setError(REASONS[body.error] ?? text("actionError")); return; }
      await load();
    } catch { setError(text("networkError")); }
    finally { setBusy(false); }
  }

  return <section className="mt-8 rounded-xl border border-sand bg-surface-card p-6 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="font-fraunces text-heading text-ink">{text("title")}</h2>
        <p className="mt-2 text-sm text-muted">{text("body")}</p></div>
      <span className="rounded-full bg-sage-ghost px-3 py-1 text-sm text-sage-dark">{data ? MODE_LABELS[data.mode] : text("loading")}</span>
    </div>
    <form className="mt-6 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); setCursor(undefined); setActiveSearch(search); if (search === activeSearch && !cursor) void load(); }}>
      <label className="flex flex-1 flex-col gap-1 text-sm">{text("searchLabel")}
        <input value={search} onChange={event => setSearch(event.target.value)} maxLength={100} className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-3 text-ink" placeholder={text("searchPlaceholder")} /></label>
      <button disabled={busy} className="self-end rounded-lg border border-sand px-4 py-3 text-sm disabled:opacity-50">{text("refresh")}</button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-state-danger-fg">{error}</p>}
    {data?.run && <p className="mt-4 text-xs text-muted">{tf("lifecycle.admin.lastRun", "hu", { date: data.run.finishedAt ? date(data.run.finishedAt) : text("unfinished"), count: data.run.summary?.errors?.length ?? 0 })}</p>}
    <div aria-busy={busy} className="mt-6 space-y-4">
      {data?.rows.map(row => <article key={row.id} className="rounded-lg border border-sand p-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div><h3 className="font-semibold text-ink">{row.profile.username ?? row.profile.email}</h3><p className="text-xs text-muted">{row.profile.email}</p></div>
          <span className="text-sm text-ink-body">{REASONS[row.reason] ?? row.reason}</span>
        </div>
        <p className="mt-3 text-sm font-medium">{row.copy.hu.title}</p>
        <p className="mt-1 text-xs text-muted">{tf("lifecycle.admin.rowMeta", "hu", { date: date(row.dueAt), count: row.count, language: row.locale === "hu" ? text("hungarian") : text("english") })}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setPreview(preview === row.id ? null : row.id); setLocale(row.locale); }} className="min-h-[44px] rounded-lg border border-sand px-3 text-sm">{text("preview")}</button>
          <button type="button" disabled={busy || row.reason !== "READY" || !["manual", "automatic"].includes(data.mode)} onClick={() => act(row.id, "send")} className="min-h-[44px] rounded-lg bg-sage px-3 text-sm text-[var(--color-action-primary-fg)] disabled:opacity-40">{text("send")}</button>
          {row.status === "OPEN" && <><button type="button" disabled={busy} onClick={() => act(row.id, "snooze")} className="min-h-[44px] px-3 text-sm underline">{text("snooze")}</button><button type="button" disabled={busy} onClick={() => act(row.id, "dismiss")} className="min-h-[44px] px-3 text-sm underline">{text("dismiss")}</button></>}
        </div>
        {preview === row.id && <div className="mt-4 rounded-lg bg-surface-subtle p-4">
          <label className="text-sm">{text("previewLanguage")} <select aria-label={text("previewLanguage")} value={locale} onChange={e => setLocale(e.target.value as "hu" | "en")} className="ml-2 rounded border border-sand bg-surface-card p-2"><option value="hu">{text("hungarian")}</option><option value="en">{text("english")}</option></select></label>
          <p className="mt-4 font-semibold">{row.copy[locale].title}</p><p className="mt-3 text-sm leading-relaxed">{row.copy[locale].body}</p>
          <p className="mt-3 text-sm font-medium">{tf("lifecycle.admin.buttonLabel", "hu", { label: row.copy[locale].cta })}</p>
          <p className="mt-2 text-xs text-muted">{text("previewHint")}</p>
        </div>}
      </article>)}
      {data && !data.rows.length && <p className="text-sm text-muted">{text("empty")}</p>}
    </div>
    {data?.nextCursor && <button type="button" disabled={busy} onClick={() => setCursor(data.nextCursor!)} className="mt-4 min-h-[44px] px-3 text-sm underline">{text("next")}</button>}
    {data && <details className="mt-6"><summary className="cursor-pointer py-2 font-semibold">{text("history")}</summary>
      <div className="overflow-x-auto"><table className="mt-3 w-full text-left text-xs"><thead><tr><th className="p-2">{text("recipient")}</th><th className="p-2">{text("type")}</th><th className="p-2">{text("status")}</th><th className="p-2">{text("time")}</th></tr></thead><tbody>
        {data.recent.map(row => <tr key={row.id} className="border-t border-sand"><td className="p-2">{row.recipient}</td><td className="p-2">{RULE_LABELS[row.rule] ?? row.rule}</td><td className="p-2">{DELIVERY_LABELS[row.status] ?? row.status}{row.errorCode ? ` (${row.errorCode})` : ""}</td><td className="p-2">{date(row.claimedAt)}</td></tr>)}
      </tbody></table></div>
      <ul className="mt-4 space-y-2 text-sm">{data.completed.map(row => <li key={row.id}>{row.profile.email} · {RULE_LABELS[row.rule] ?? row.rule} · {tf("lifecycle.admin.completed", "hu", { date: row.completedAt ? date(row.completedAt) : "" })}</li>)}</ul>
    </details>}
  </section>;
}
