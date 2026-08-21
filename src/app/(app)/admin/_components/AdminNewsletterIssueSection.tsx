"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { SelectField } from "@/components/ui/primitives/SelectField";

/**
 * Szerkesztett hírlevél-szám összeállítása.
 *
 * A cikk-értesítő gépi; ez a forma emberi: nyitó szöveg + beválogatott cikkek.
 * A munkamenet szándékosan háromlépcsős — **mentés → előnézet → küldés** —,
 * mert a küldés visszafordíthatatlan, és az előnézet mondja meg, hogy a
 * beválogatott slugok tényleg publikált cikkek-e, illetve hánynak menne ki.
 *
 * A KIKÜLDÖTT szám nem szerkeszthető és nem törölhető: a levél kiment, a
 * szövegét utólag átírni azt jelentené, hogy a napló mást mond, mint amit a
 * címzettek kaptak.
 */

export interface IssueRow {
  id: string;
  locale: "hu" | "en";
  subject: string;
  intro: string;
  postSlugs: string[];
  status: "DRAFT" | "SENT";
  sentAt: string | null;
  recipients: number;
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

const EMPTY: IssueForm = {
  subject: "",
  intro: "",
  locale: "hu",
  postSlugs: [],
};

export function AdminNewsletterIssueSection({ issues, posts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IssueForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setMessage(null);
    setOpen(true);
  };

  const startEdit = (issue: IssueRow) => {
    setEditingId(issue.id);
    setForm({
      subject: issue.subject,
      intro: issue.intro,
      locale: issue.locale,
      postSlugs: issue.postSlugs,
    });
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
      setMessage("A művelet nem sikerült — nézd meg a szerver-naplót.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const data = editingId
      ? await call("PATCH", { id: editingId, ...form })
      : await call("POST", { ...form });
    if (!data) return;
    if (!editingId && typeof data.id === "string") setEditingId(data.id);
    setMessage("Piszkozat mentve.");
    router.refresh();
  };

  const preview = async () => {
    if (!editingId) {
      setMessage("Előbb mentsd el a piszkozatot.");
      return;
    }
    const data = await call("PATCH", { id: editingId, action: "preview" });
    if (!data) return;
    const items = (data.items as Array<{ title: string }> | undefined) ?? [];
    setMessage(
      `Előnézet: ${items.length} cikk kerülne bele, ${data.recipients ?? 0} címzettnek menne ki.` +
        (items.length < form.postSlugs.length
          ? " Figyelem: van olyan slug, amihez nincs publikált cikk ezen a nyelven — az kimarad."
          : ""),
    );
  };

  const send = async () => {
    if (!editingId) return;
    const data = await call("PATCH", { id: editingId, action: "send" });
    if (!data) return;
    setMessage(`Kiküldve ${data.recipients ?? 0} címzettnek.`);
    setOpen(false);
    router.refresh();
  };

  const remove = async (id: string) => {
    const data = await call("DELETE", { id });
    if (!data) return;
    if (editingId === id) setOpen(false);
    router.refresh();
  };

  const localePosts = posts.filter((p) => p.locale === form.locale);

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
        A cikk-értesítő magától megy minden új cikkről. Ez a másik forma: te
        írod a kísérőszöveget, és beválogatsz 2-3 cikket — havi több cikknél ez
        kíméletesebb a listának. Csak a `newsletter` topicra feliratkozottaknak megy.
      </p>

      {issues.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-sand px-4 py-3"
            >
              <span
                className={`rounded-full px-2 py-0.5 text-note font-medium ${
                  issue.status === "SENT"
                    ? "bg-sage/15 text-sage-dark"
                    : "bg-cream text-ink-body"
                }`}
              >
                {issue.status === "SENT" ? "Kiküldve" : "Piszkozat"}
              </span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-note text-ink-body">
                {issue.locale}
              </span>
              <span className="text-sm font-semibold text-ink">{issue.subject}</span>
              <span className="text-xs text-muted">
                {issue.postSlugs.length} cikk
                {issue.status === "SENT"
                  ? ` · ${issue.recipients} címzett · ${
                      issue.sentAt ? new Date(issue.sentAt).toLocaleDateString("hu-HU") : ""
                    }`
                  : ""}
              </span>
              {issue.status === "DRAFT" ? (
                <span className="ml-auto flex gap-2">
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => startEdit(issue)}>
                    Szerkesztés
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void remove(issue.id)}
                  >
                    Törlés
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-sand bg-cream/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <TextField
              label="Tárgy"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              containerClassName="flex-1"
            />
            <SelectField
              label="Nyelv"
              value={form.locale}
              onChange={(e) =>
                // Nyelvváltásnál a beválogatás ürül: a másik nyelv cikkei
                // úgysem kerülnének bele (a levél egynyelvű).
                setForm({ ...form, locale: e.target.value as "hu" | "en", postSlugs: [] })
              }
            >
              <option value="hu">hu</option>
              <option value="en">en</option>
            </SelectField>
          </div>

          <TextareaField
            label="Bevezető"
            rows={6}
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
            helpText="Sima szöveg. Üres sor = új bekezdés. HTML nem megy át."
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Cikkek (max 6)</p>
            <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-lg border border-sand bg-surface-card p-2">
              {localePosts.map((post) => {
                const checked = form.postSlugs.includes(post.slug);
                return (
                  <label
                    key={post.slug}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 px-2 text-caption text-ink-body"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm({
                          ...form,
                          postSlugs: checked
                            ? form.postSlugs.filter((s) => s !== post.slug)
                            : [...form.postSlugs, post.slug].slice(0, 6),
                        })
                      }
                      className="h-4 w-4 accent-[var(--color-accent-primary)]"
                    />
                    {post.title}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => void save()}>
              Mentés
            </Button>
            <Button variant="secondary" disabled={busy || !editingId} onClick={() => void preview()}>
              Előnézet
            </Button>
            <Button disabled={busy || !editingId} loading={busy} onClick={() => void send()}>
              Kiküldés
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Bezárás
            </Button>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-caption text-ink-body">{message}</p> : null}
    </section>
  );
}

function errorText(code: string): string {
  switch (code) {
    case "ALREADY_SENT":
      return "Ez a szám már kiment — nem szerkeszthető és nem küldhető újra.";
    case "EMPTY":
      return "Üres szám: kell bele legalább egy bevezető vagy egy cikk.";
    case "NOT_FOUND":
      return "Nincs ilyen szám.";
    case "INVALID_PAYLOAD":
      return "Hiányzó vagy hibás mező (a tárgy min. 3, a bevezető min. 10 karakter).";
    default:
      return "A művelet nem sikerült.";
  }
}
