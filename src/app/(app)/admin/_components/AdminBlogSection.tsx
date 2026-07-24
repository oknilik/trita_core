"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { BlogArtVisual, type BlogArtMotif } from "@/components/blog/BlogArtVisual";

// Admin Blog szekció: cikk-lista státusszal + szerkesztő űrlap.
// Mentés a /api/admin/blog végpontra; fs módban azonnal él (dev),
// github módban commit → Vercel deploy (~pár perc).

interface AdminBlogPost {
  slug: string;
  title: string;
  description: string;
  locale: "hu" | "en";
  tags: string[];
  publishedAt: string;
  translationSlug?: string;
  heroQuote?: string;
  startHere?: number;
  status: "draft" | "published";
  artSeed?: number;
  artMotif?: BlogArtMotif;
  readingTime: string;
  body: string;
}

interface FormState {
  slug: string;
  title: string;
  description: string;
  locale: "hu" | "en";
  tags: string;
  publishedAt: string;
  translationSlug: string;
  heroQuote: string;
  startHere: string;
  artSeed: string;
  artMotif: "" | BlogArtMotif;
  body: string;
}

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  description: "",
  locale: "hu",
  tags: "",
  publishedAt: "",
  translationSlug: "",
  heroQuote: "",
  startHere: "",
  artSeed: "",
  artMotif: "",
  body: "",
};

const SNIPPETS: Array<{ label: string; text: string }> = [
  { label: "Callout", text: '\n<Callout>Kiemelt gondolat egy-két mondatban.</Callout>\n' },
  {
    label: "StatRow",
    text: '\n<StatRow>\n  <StatCard value="93%" label="első adat" />\n  <StatCard value="24%" label="második adat" />\n  <StatCard value="3×" label="harmadik adat" />\n</StatRow>\n',
  },
  { label: "KeyInsight", text: "\n<KeyInsight>A szakasz kulcs-tanulsága egy mondatban.</KeyInsight>\n" },
  { label: "PullQuote", text: '\n<PullQuote source="kulcsgondolat">„Idézet a szövegritmus tördelésére."</PullQuote>\n' },
  {
    label: "CompareTable",
    text: '\n<CompareTable\n  leftLabel="Bal oszlop"\n  rightLabel="Jobb oszlop"\n  rows={[\n    ["első sor bal", "első sor jobb"],\n    ["második sor bal", "második sor jobb"],\n  ]}\n/>\n',
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function AdminBlogSection({
  posts,
  storeMode,
  githubReady,
}: {
  posts: AdminBlogPost[];
  storeMode: "fs" | "github";
  githubReady: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEditorDiscard, setConfirmEditorDiscard] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }),
    [posts],
  );

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const startNew = () => {
    setEditingSlug(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
    setNotice(null);
    setConfirmEditorDiscard(false);
  };

  const startEdit = (post: AdminBlogPost) => {
    setEditingSlug(post.slug);
    setSlugTouched(true);
    setForm({
      slug: post.slug,
      title: post.title,
      description: post.description,
      locale: post.locale,
      tags: post.tags.join(", "),
      publishedAt: post.publishedAt ?? "",
      translationSlug: post.translationSlug ?? "",
      heroQuote: post.heroQuote ?? "",
      startHere: post.startHere ? String(post.startHere) : "",
      artSeed: post.artSeed ? String(post.artSeed) : "",
      artMotif: post.artMotif ?? "",
      body: post.body,
    });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const insertSnippet = (text: string) => {
    const el = bodyRef.current;
    if (!el) {
      set({ body: form.body + text });
      return;
    }
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? start;
    const next = form.body.slice(0, start) + text + form.body.slice(end);
    set({ body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  };

  const successText = (mode: "fs" | "github", extra?: string) =>
    mode === "github"
      ? `Commit létrehozva — a Vercel buildel, a változás pár percen belül él.${extra ? ` (${extra})` : ""}`
      : "Fájl mentve a content/blog mappába — a dev /blog oldalon azonnal látszik; élesítés git push-sal.";

  const save = async (status: "draft" | "published") => {
    setNotice(null);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      locale: form.locale,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ...(form.publishedAt ? { publishedAt: form.publishedAt } : {}),
      ...(form.translationSlug.trim() ? { translationSlug: form.translationSlug.trim() } : {}),
      ...(form.heroQuote.trim() ? { heroQuote: form.heroQuote.trim() } : {}),
      ...(form.startHere ? { startHere: Number(form.startHere) } : {}),
      ...(form.artSeed ? { artSeed: Number(form.artSeed) } : {}),
      ...(form.artMotif ? { artMotif: form.artMotif } : {}),
      body: form.body,
      status,
    };
    setBusy(status === "draft" ? "save-draft" : "save-publish");
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({
          kind: "error",
          text:
            json.error === "GITHUB_NOT_CONFIGURED"
              ? "A GitHub-mentés nincs beállítva (GITHUB_TOKEN + GITHUB_REPO env kell)."
              : `Mentés sikertelen: ${json.detail ?? json.error ?? res.status}`,
        });
        return;
      }
      setNotice({ kind: "ok", text: successText(json.mode) });
      setEditingSlug(payload.slug);
      setSlugTouched(true);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = async (slug: string, action: "publish" | "unpublish") => {
    setNotice(null);
    setBusy(`${action}:${slug}`);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: "error", text: `Nem sikerült: ${json.error ?? res.status}` });
        return;
      }
      setNotice({
        kind: "ok",
        text: `${action === "publish" ? "Publikálva" : "Visszavonva (piszkozat)"} — ${successText(json.mode)}`,
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const removePost = async (slug: string) => {
    setNotice(null);
    setBusy(`delete:${slug}`);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: "error", text: `Törlés sikertelen: ${json.error ?? res.status}` });
        return;
      }
      setNotice({
        kind: "ok",
        text:
          json.mode === "github"
            ? "Cikk elvetve — törlő-commit létrejött (a git-történelemből visszaállítható), a deploy után tűnik el élesből."
            : "Cikk elvetve — a fájl törölve a content/blog mappából (gitből visszaállítható).",
      });
      if (editingSlug === slug) startNew();
      router.refresh();
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  };

  // A szerkesztőben nyitott cikk elvetése: mentetlen új cikknél csak az
  // űrlap ürül; mentett cikknél a cikk is törlődik (removePost).
  const discardEditor = async () => {
    if (editingSlug) {
      await removePost(editingSlug);
      return;
    }
    startNew();
    setNotice({ kind: "ok", text: "Piszkozat elvetve — nem volt mentve, nem törlődött semmi." });
  };

  const hasEditorContent =
    Boolean(editingSlug) ||
    form.title.trim().length > 0 ||
    form.body.trim().length > 0 ||
    form.description.trim().length > 0;

  const canSave =
    form.slug.trim().length >= 3 &&
    form.title.trim().length >= 3 &&
    form.description.trim().length >= 10 &&
    form.body.trim().length >= 50;

  return (
    <div className="space-y-8">
      {/* Mód-jelző */}
      <div className="rounded-xl border border-sand bg-white p-4 text-sm text-ink-body">
        <span className="font-semibold text-ink">Mentési mód: </span>
        {storeMode === "github" ? (
          <>GitHub-commit → automatikus Vercel deploy (~pár perc a megjelenésig).</>
        ) : (
          <>
            helyi fájlírás (content/blog) — dev-ben azonnal látszik, élesítés git push-sal.
            {!githubReady && (
              <span className="text-muted">
                {" "}
                Az éles admin-mentéshez GITHUB_TOKEN + GITHUB_REPO env kell (ld.
                docs/development/blog-admin.md).
              </span>
            )}
          </>
        )}
        <span className="mt-1 block text-xs text-muted">
          Piszkozat: a cikk a repóba kerül, de a publikus blogon, sitemapben nem jelenik meg
          (dev /blog oldalon látszik). A publikálás/visszavonás egy státusz-billentő commit.
        </span>
      </div>

      {notice && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            notice.kind === "ok"
              ? "border-state-success-border bg-state-success-bg text-state-success-fg"
              : "border-state-error-border bg-state-error-bg text-state-error-fg"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Szerkesztő */}
      <section className="rounded-2xl border border-sand bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-fraunces text-xl text-ink">
            {editingSlug ? `Szerkesztés: ${editingSlug}` : "Új cikk"}
          </h2>
          {editingSlug && (
            <Button variant="ghost" size="sm" onClick={startNew}>
              + Új cikk
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Cím"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              set(slugTouched ? { title } : { title, slug: slugify(title) });
            }}
            placeholder="A cikk címe"
          />
          <TextField
            label="Slug (URL)"
            value={form.slug}
            disabled={Boolean(editingSlug)}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value });
            }}
            helpText={editingSlug ? "Meglévő cikknél a slug nem módosítható." : "Kisbetű, kötőjel."}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-text-primary">Nyelv</span>
            <div className="flex gap-2">
              {(["hu", "en"] as const).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => set({ locale: loc })}
                  className={`min-h-[40px] flex-1 rounded-lg border px-4 text-sm font-semibold transition ${
                    form.locale === loc
                      ? "border-sage bg-sage text-white"
                      : "border-sand bg-white text-ink-body hover:border-sage-ring"
                  }`}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <TextField
            label="Tagek (vesszővel)"
            value={form.tags}
            onChange={(e) => set({ tags: e.target.value })}
            placeholder="csapatdinamika, mérés"
          />
          <TextField
            label="Fordítás-pár slugja (opcionális)"
            value={form.translationSlug}
            onChange={(e) => set({ translationSlug: e.target.value })}
            placeholder="the-english-pair-slug"
          />
          <TextField
            label="Dátum (üresen: publikáláskor mai)"
            value={form.publishedAt}
            onChange={(e) => set({ publishedAt: e.target.value })}
            placeholder="2026-07-24"
          />
        </div>

        <div className="mt-4">
          <TextareaField
            label="Leírás (meta + lista)"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
            placeholder="1–2 mondatos összefoglaló — ez megy a keresőbe és a listakártyára."
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Featured-idézet (opcionális)"
            value={form.heroQuote}
            onChange={(e) => set({ heroQuote: e.target.value })}
            helpText="A kiemelt kártya nagy idézete — enélkül a leírás első mondata megy."
          />
          <TextField
            label="„Kezdd itt” sorrend (1–3, opcionális)"
            value={form.startHere}
            onChange={(e) => set({ startHere: e.target.value.replace(/[^1-3]/g, "").slice(0, 1) })}
            placeholder="pl. 1"
          />
        </div>

        {/* Cikk-vizuál előkép + variáció */}
        <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">Cikk-vizuál</span>
            <span className="text-xs text-muted">
              generált — a slugból és a variációból determinisztikus, minden felületen ugyanez jelenik meg
            </span>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <div className="h-[110px] w-[220px] overflow-hidden rounded-lg border border-sand">
              <BlogArtVisual
                slug={form.slug || "uj-cikk"}
                tags={form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)}
                seed={form.artSeed ? Number(form.artSeed) : 0}
                motif={form.artMotif || undefined}
                variant="featured"
              />
            </div>
            <div className="h-[110px] w-[220px] overflow-hidden rounded-lg border border-sand">
              <BlogArtVisual
                slug={form.slug || "uj-cikk"}
                tags={form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)}
                seed={form.artSeed ? Number(form.artSeed) : 0}
                motif={form.artMotif || undefined}
                variant="card"
              />
            </div>
            <div className="flex min-w-[220px] flex-1 flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {([
                  ["", "Auto"],
                  ["radar", "Radar"],
                  ["network", "Háló"],
                  ["bars", "Sávok"],
                  ["waves", "Hullám"],
                ] as Array<["" | BlogArtMotif, string]>).map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set({ artMotif: value })}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      form.artMotif === value
                        ? "border-sage bg-sage text-white"
                        : "border-sand bg-white text-ink-body hover:border-sage-ring"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => set({ artSeed: String(1 + Math.floor(Math.random() * 9999)) })}
                >
                  Új variáció
                </Button>
                {(form.artSeed || form.artMotif) && (
                  <Button variant="ghost" size="sm" onClick={() => set({ artSeed: "", artMotif: "" })}>
                    Alaphelyzet
                  </Button>
                )}
                {form.artSeed && (
                  <span className="text-xs text-muted">variáció #{form.artSeed}</span>
                )}
              </div>
              <span className="text-xs text-muted">
                Bal: kiemelt (sötét) · jobb: kártya/lista változat. A választás a
                mentéskor a cikkbe kerül (artSeed/artMotif).
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">Törzs (MDX)</span>
            <span className="mx-1 h-4 w-px bg-sand" />
            {SNIPPETS.map((snippet) => (
              <button
                key={snippet.label}
                type="button"
                onClick={() => insertSnippet(snippet.text)}
                className="rounded-full border border-sand bg-cream px-3 py-1 text-xs text-ink-body transition hover:border-sage-ring hover:text-sage-deep"
              >
                + {snippet.label}
              </button>
            ))}
          </div>
          <textarea
            ref={bodyRef}
            value={form.body}
            onChange={(e) => set({ body: e.target.value })}
            rows={18}
            placeholder={"Markdown + komponensek: ## fejezetcímek adják a tartalomjegyzéket.\n\nA sablon-gombokkal Callout / StatRow / KeyInsight / PullQuote / CompareTable szúrható be."}
            className="w-full rounded-xl border border-sand bg-white p-4 font-mono text-caption leading-relaxed text-ink outline-none transition focus:border-sage-ring focus:ring-2 focus:ring-sage-ring/40"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            disabled={!canSave || busy !== null}
            loading={busy === "save-draft"}
            onClick={() => save("draft")}
          >
            Mentés piszkozatként
          </Button>
          <Button
            variant="primary"
            disabled={!canSave || busy !== null}
            loading={busy === "save-publish"}
            onClick={() => save("published")}
          >
            Mentés és publikálás
          </Button>
          {!canSave && (
            <span className="text-xs text-muted">
              Cím, slug, leírás és legalább 50 karakternyi törzs kell a mentéshez.
            </span>
          )}
          {hasEditorContent && (
            <span className="ml-auto flex items-center gap-2">
              {confirmEditorDiscard ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    loading={editingSlug ? busy === `delete:${editingSlug}` : false}
                    disabled={busy !== null}
                    onClick={discardEditor}
                  >
                    {editingSlug ? "Biztos? Cikk törlése" : "Biztos? Elvetés"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => setConfirmEditorDiscard(false)}
                  >
                    Mégse
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => setConfirmEditorDiscard(true)}
                >
                  {editingSlug ? "Cikk elvetése" : "Piszkozat elvetése"}
                </Button>
              )}
            </span>
          )}
        </div>
      </section>

      {/* Cikk-lista */}
      <section className="rounded-2xl border border-sand bg-white">
        <div className="border-b border-sand px-6 py-4">
          <h2 className="font-fraunces text-xl text-ink">Cikkek ({sorted.length})</h2>
        </div>
        <ul className="divide-y divide-sand">
          {sorted.map((post) => (
            <li key={post.slug} className="flex flex-wrap items-center gap-3 px-6 py-4">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  post.status === "draft"
                    ? "bg-state-warning-bg text-state-warning-fg"
                    : "bg-state-success-bg text-state-success-fg"
                }`}
              >
                {post.status === "draft" ? "Piszkozat" : "Publikált"}
              </span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold uppercase text-ink-warm">
                {post.locale}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{post.title}</span>
                <span className="block text-xs text-muted">
                  {post.slug} · {post.publishedAt} · {post.readingTime}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(post)}>
                  Szerkesztés
                </Button>
                {post.status === "draft" ? (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={busy === `publish:${post.slug}`}
                    disabled={busy !== null}
                    onClick={() => changeStatus(post.slug, "publish")}
                  >
                    Publikálás
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busy === `unpublish:${post.slug}`}
                    disabled={busy !== null}
                    onClick={() => changeStatus(post.slug, "unpublish")}
                  >
                    Visszavonás
                  </Button>
                )}
                {confirmDelete === post.slug ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      loading={busy === `delete:${post.slug}`}
                      disabled={busy !== null}
                      onClick={() => removePost(post.slug)}
                    >
                      Biztos? Elvetés
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => setConfirmDelete(null)}
                    >
                      Mégse
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => setConfirmDelete(post.slug)}
                  >
                    Elvetés
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
