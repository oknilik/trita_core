"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { SelectField } from "@/components/ui/primitives/SelectField";
import { t } from "@/lib/i18n";
import { presentUserError } from "@/lib/user-errors";

export type IssueStatus = "DRAFT" | "READY" | "SENDING" | "PARTIAL" | "SENT" | "FAILED";

export interface IssueRow {
  id: string;
  locale: "hu" | "en";
  subject: string;
  intro: string;
  postSlugs: string[];
  status: IssueStatus;
  sentAt: string | null;
  recipients: number;
  failures: number;
  createdAt: string;
}

interface Props {
  issues: IssueRow[];
  posts: Array<{ slug: string; title: string; locale: "hu" | "en" }>;
}

interface IssueForm {
  subject: string;
  intro: string;
  locale: "hu" | "en";
  postSlugs: string[];
}

interface PreviewData {
  html: string;
  previewHash: string;
  recipients: number;
  items: Array<{ title: string }>;
}

const EMPTY: IssueForm = { subject: "", intro: "", locale: "hu", postSlugs: [] };
const formKey = (form: IssueForm) => JSON.stringify(form);

export function AdminNewsletterIssueSection({ issues, posts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IssueForm>(EMPTY);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = savedKey !== formKey(form);
  const localePosts = useMemo(
    () => posts.filter((post) => post.locale === form.locale),
    [form.locale, posts],
  );

  const resetPreview = () => {
    setPreviewData(null);
    setConfirmOpen(false);
  };

  const updateForm = (next: IssueForm) => {
    setForm(next);
    resetPreview();
  };

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setSavedKey(null);
    setReadOnly(false);
    resetPreview();
    setMessage(null);
    setOpen(true);
  };

  const startEdit = (issue: IssueRow) => {
    const next = {
      subject: issue.subject,
      intro: issue.intro,
      locale: issue.locale,
      postSlugs: issue.postSlugs,
    } satisfies IssueForm;
    setEditingId(issue.id);
    setForm(next);
    setSavedKey(formKey(next));
    setReadOnly(["PARTIAL", "FAILED"].includes(issue.status));
    resetPreview();
    setMessage(null);
    setOpen(true);
  };

  const call = async (
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/newsletter/issues", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setMessage(errorText(String(data.error ?? "")));
        return null;
      }
      return data;
    } catch {
      setMessage(t(presentUserError({ code: "NETWORK_ERROR" }), "hu"));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (readOnly) return;
    const data = editingId
      ? await call("PATCH", { id: editingId, ...form })
      : await call("POST", { ...form });
    if (!data) return;
    if (!editingId && typeof data.id === "string") setEditingId(data.id);
    setSavedKey(formKey(form));
    resetPreview();
    setMessage("Piszkozat mentve. Most készíthetsz tényleges e-mail-előnézetet.");
    router.refresh();
  };

  const preview = async () => {
    if (!editingId || dirty) {
      setMessage("Előbb mentsd el a legutóbbi módosításokat.");
      return;
    }
    const data = await call("PATCH", { id: editingId, action: "preview" });
    if (!data) return;
    const next: PreviewData = {
      html: String(data.html ?? ""),
      previewHash: String(data.previewHash ?? ""),
      recipients: Number(data.recipients ?? 0),
      items: (data.items as Array<{ title: string }> | undefined) ?? [],
    };
    setPreviewData(next);
    setMessage(
      `Előnézet kész: ${next.items.length} cikk, ${next.recipients} hátralévő címzett.`,
    );
    router.refresh();
  };

  const send = async () => {
    if (!editingId || !previewData || dirty) return;
    const data = await call("PATCH", {
      id: editingId,
      action: "send",
      previewHash: previewData.previewHash,
    });
    if (!data) return;

    const status = String(data.status ?? "SENT") as IssueStatus;
    const accepted = Number(data.recipients ?? 0);
    const failed = Number(data.failed ?? 0);
    setConfirmOpen(false);
    setPreviewData(null);
    router.refresh();

    if (status === "SENT") {
      setMessage(`A szolgáltató ${accepted} címzett levelét átvette. A szám lezárva.`);
      setOpen(false);
      return;
    }

    setReadOnly(true);
    setMessage(
      `Részleges eredmény: ${accepted} átvett, ${failed} hibás vagy bizonytalan. `
      + "Készíts új előnézetet, majd folytasd csak a kimaradt címzettekkel.",
    );
  };

  const remove = async (id: string) => {
    const data = await call("DELETE", { id });
    if (!data) return;
    if (editingId === id) setOpen(false);
    router.refresh();
  };

  return (
    <section className="mb-8 rounded-2xl border border-sand bg-surface-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-dm-mono text-micro font-semibold uppercase tracking-widest text-muted">
          Szerkesztett szám
        </p>
        <Button size="sm" variant="secondary" onClick={startNew} disabled={busy}>
          Új szám
        </Button>
      </div>

      <p className="mt-2 text-micro leading-relaxed text-muted">
        Biztonságos munkamenet: mentés → valódi HTML-előnézet → címzett- és
        tárgyellenőrzés → küldés. Részleges hiba után csak a kimaradt címzettek
        kapják meg a változtathatatlan számot.
      </p>

      {issues.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {issues.map((issue) => (
            <li key={issue.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-sand px-4 py-3">
              <span className={`rounded-full px-2 py-0.5 text-note font-medium ${statusTone(issue.status)}`}>
                {statusLabel(issue.status)}
              </span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-note text-ink-body">
                {issue.locale}
              </span>
              <span className="text-sm font-semibold text-ink">{issue.subject}</span>
              <span className="text-xs text-muted">
                {issue.postSlugs.length} cikk
                {issue.recipients > 0 ? ` · ${issue.recipients} átvett` : ""}
                {issue.failures > 0 ? ` · ${issue.failures} hiba` : ""}
              </span>
              {issue.status !== "SENT" && issue.status !== "SENDING" ? (
                <span className="ml-auto flex gap-2">
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => startEdit(issue)}>
                    {["PARTIAL", "FAILED"].includes(issue.status) ? "Folytatás" : "Szerkesztés"}
                  </Button>
                  {["DRAFT", "READY"].includes(issue.status) ? (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove(issue.id)}>
                      Törlés
                    </Button>
                  ) : null}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-sand bg-cream/40 p-4">
          {readOnly ? (
            <p className="rounded-lg bg-sage/10 px-3 py-2 text-xs text-sage-dark">
              Ennek a számnak a küldése már megkezdődött, ezért a tartalma nem módosítható.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 md:flex-row">
            <TextField
              label="Tárgy"
              value={form.subject}
              disabled={readOnly}
              onChange={(event) => updateForm({ ...form, subject: event.target.value })}
              containerClassName="flex-1"
            />
            <SelectField
              label="Nyelv"
              value={form.locale}
              disabled={readOnly}
              onChange={(event) => updateForm({
                ...form,
                locale: event.target.value as "hu" | "en",
                postSlugs: [],
              })}
            >
              <option value="hu">hu</option>
              <option value="en">en</option>
            </SelectField>
          </div>

          <TextareaField
            label="Bevezető"
            rows={6}
            value={form.intro}
            disabled={readOnly}
            onChange={(event) => updateForm({ ...form, intro: event.target.value })}
            helpText="Sima szöveg; üres sor = új bekezdés. A sablon nem tesz elé külön köszönést."
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Cikkek (max. 6)</p>
            <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-lg border border-sand bg-surface-card p-2">
              {localePosts.map((post) => {
                const checked = form.postSlugs.includes(post.slug);
                return (
                  <label key={post.slug} className="flex min-h-[44px] cursor-pointer items-center gap-2 px-2 text-caption text-ink-body">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={readOnly}
                      onChange={() => updateForm({
                        ...form,
                        postSlugs: checked
                          ? form.postSlugs.filter((slug) => slug !== post.slug)
                          : [...form.postSlugs, post.slug].slice(0, 6),
                      })}
                      className="h-4 w-4 accent-[var(--color-accent-primary)]"
                    />
                    {post.title}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!readOnly ? (
              <Button variant="secondary" disabled={busy || !dirty} onClick={() => void save()}>
                Mentés
              </Button>
            ) : null}
            <Button
              variant="secondary"
              disabled={busy || !editingId || dirty}
              onClick={() => void preview()}
            >
              HTML-előnézet
            </Button>
            <Button
              disabled={busy || !previewData || dirty}
              onClick={() => setConfirmOpen(true)}
            >
              Küldés ellenőrzése
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Bezárás
            </Button>
          </div>

          {dirty ? (
            <p className="text-xs text-state-warning-fg">Nem mentett módosítás — az előnézet és a küldés le van tiltva.</p>
          ) : null}

          {previewData ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-sand bg-surface-card">
              <div className="border-b border-sand bg-cream px-4 py-3 text-xs text-ink-body">
                Valódi e-mail HTML · {previewData.recipients} hátralévő címzett
              </div>
              <iframe
                title="Hírlevél HTML-előnézet"
                srcDoc={previewData.html}
                sandbox=""
                className="h-[680px] w-full bg-surface-card"
              />
            </div>
          ) : null}

          {confirmOpen && previewData ? (
            <div className="rounded-xl border border-state-warning-border bg-state-warning-bg p-4">
              <p className="font-semibold text-ink">Végleges küldési ellenőrzés</p>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-body">
                <dt className="text-muted">Tárgy</dt><dd>{form.subject}</dd>
                <dt className="text-muted">Nyelv</dt><dd>{form.locale}</dd>
                <dt className="text-muted">Címzettek</dt><dd>{previewData.recipients}</dd>
                <dt className="text-muted">Cikkek</dt><dd>{previewData.items.length}</dd>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button loading={busy} disabled={busy} onClick={() => void send()}>
                  Igen, kiküldöm
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => setConfirmOpen(false)}>
                  Mégsem
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite" className="mt-3 text-caption text-ink-body">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function statusLabel(status: IssueStatus): string {
  return {
    DRAFT: "Piszkozat",
    READY: "Előnézett",
    SENDING: "Küldés alatt",
    PARTIAL: "Részleges",
    SENT: "Kiküldve",
    FAILED: "Sikertelen",
  }[status];
}

function statusTone(status: IssueStatus): string {
  if (status === "SENT") return "bg-sage/15 text-sage-dark";
  if (status === "PARTIAL" || status === "FAILED") {
    return "bg-state-warning-bg text-state-warning-fg";
  }
  return "bg-cream text-ink-body";
}

function errorText(code: string): string {
  switch (code) {
    case "ALREADY_SENT":
      return "Ez a szám már lezárult.";
    case "ISSUE_IMMUTABLE":
      return "A részben vagy teljesen kiküldött szám tartalma már nem módosítható.";
    case "PREVIEW_REQUIRED":
    case "PREVIEW_UNAVAILABLE":
      return "A mentett tartalomról új HTML-előnézet szükséges.";
    case "SENDING":
      return "Ezt a számot egy másik folyamat már küldi.";
    case "EMPTY":
      return "Üres szám: kell bele legalább egy bevezető vagy egy cikk.";
    case "INVALID_ARTICLES":
      return "A kiválasztott cikkek egyike már nem publikus, vagy nem ezen a nyelven érhető el.";
    case "NO_RECIPIENTS":
      return "Nincs hátralévő, erre a témára feliratkozott címzett.";
    case "NOT_FOUND":
      return "Nincs ilyen szám.";
    case "INVALID_PAYLOAD":
      return "Hiányzó vagy hibás mező (a tárgy min. 3, a bevezető min. 10 karakter).";
    default:
      return "A művelet nem sikerült.";
  }
}
