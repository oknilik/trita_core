"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { BlogArtVisual, type BlogArtMotif } from "@/components/blog/BlogArtVisual";

// Admin Blog szekció: a cikk-lista a fő nézet (státusz-szűrők + keresés),
// a szerkesztő gombra nyíló oldalpanelben jön elő — a lista nem mozdul.
// Kész .mdx fájl közvetlenül feltölthető (PUT /api/admin/blog → piszkozat).
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

type StatusFilter = "all" | "published" | "draft" | "future";

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Mind" },
  { key: "published", label: "Publikus" },
  { key: "draft", label: "Nem publikus (piszkozat)" },
  { key: "future", label: "Jövő dátum" },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Publikált, de jövőbeli dátummal — élesben már látszik, csak a lista végén. */
function isFutureDated(post: AdminBlogPost): boolean {
  return post.status === "published" && post.publishedAt > todayIso();
}

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

  // Lista-vezérlés: a szerkesztő panelben nyílik, a lista marad a fő nézet.
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [localeFilter, setLocaleFilter] = useState<"all" | "hu" | "en">("all");
  const [overwriteUploads, setOverwriteUploads] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // A portál csak kliensen létezik (SSR-en nincs document).
  const [mounted, setMounted] = useState(false);

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }),
    [posts],
  );

  const counts = useMemo(
    () => ({
      all: sorted.length,
      published: sorted.filter((p) => p.status === "published").length,
      draft: sorted.filter((p) => p.status === "draft").length,
      future: sorted.filter(isFutureDated).length,
    }),
    [sorted],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((post) => {
      if (statusFilter === "published" && post.status !== "published") return false;
      if (statusFilter === "draft" && post.status !== "draft") return false;
      if (statusFilter === "future" && !isFutureDated(post)) return false;
      if (localeFilter !== "all" && post.locale !== localeFilter) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [sorted, statusFilter, localeFilter, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape zárja a panelt, nyitva a háttér nem scrollozik.
  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditorOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [editorOpen]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const resetForm = () => {
    setEditingSlug(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
    setConfirmEditorDiscard(false);
  };

  const startNew = () => {
    resetForm();
    setNotice(null);
    setEditorOpen(true);
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
    setConfirmEditorDiscard(false);
    setEditorOpen(true);
  };

  // Kész .mdx (vagy .md) fájlok feltöltése — a szerver olvassa a
  // frontmattert, minden feltöltött cikk piszkozatként landol.
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setNotice(null);
    setUploadBusy(true);
    const ok: string[] = [];
    const failed: string[] = [];
    try {
      for (const file of files) {
        const raw = await file.text();
        const res = await fetch("/api/admin/blog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, raw, overwrite: overwriteUploads }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          ok.push(json.slug ?? file.name);
          continue;
        }
        const reason =
          json.error === "SLUG_EXISTS"
            ? "már van ilyen slug (pipáld be a felülírást)"
            : json.error === "INVALID_SLUG"
              ? "a fájlnév nem érvényes slug (kisbetű, kötőjel, min. 3 karakter)"
              : json.error === "INVALID_FRONTMATTER"
                ? `hiányos frontmatter — ${json.detail ?? "nézd meg a title/description/törzs mezőket"}`
                : json.error === "FRONTMATTER_PARSE_FAILED"
                  ? "a frontmatter nem olvasható (YAML-hiba)"
                  : json.error === "GITHUB_NOT_CONFIGURED"
                    ? "a GitHub-mentés nincs beállítva"
                    : `hiba: ${json.error ?? res.status}`;
        failed.push(`${file.name} — ${reason}`);
      }
      setNotice(
        failed.length === 0
          ? {
              kind: "ok",
              text: `Feltöltve piszkozatként: ${ok.join(", ")}. A publikáláshoz használd a lista Publikálás gombját.`,
            }
          : {
              kind: "error",
              text: [
                ok.length > 0 ? `Sikeres: ${ok.join(", ")}.` : null,
                `Nem sikerült: ${failed.join(" · ")}`,
              ]
                .filter(Boolean)
                .join(" "),
            },
      );
      if (ok.length > 0) router.refresh();
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
      if (editingSlug === slug) {
        resetForm();
        setEditorOpen(false);
      }
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
    resetForm();
    setEditorOpen(false);
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
      <div className="rounded-xl border border-sand bg-surface-card p-4 text-sm text-ink-body">
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

      {/* Szerkesztő — gombra nyíló oldalpanel, a lista nézete nem mozdul.
          Portálban megy (document.body), így semmilyen szülő-konténer
          overflow/stacking szabálya nem vágja el. */}
      {editorOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div
            className="absolute inset-0 bg-black/35"
            aria-hidden
            onClick={() => setEditorOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingSlug ? `Cikk szerkesztése: ${editingSlug}` : "Új cikk"}
            className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-sand bg-surface-card shadow-2xl md:max-w-4xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-sand px-6 py-4">
              <h2 className="min-w-0 truncate font-fraunces text-xl text-ink">
                {editingSlug ? `Szerkesztés: ${editingSlug}` : "Új cikk"}
              </h2>
              <span className="flex shrink-0 items-center gap-2">
                {editingSlug && (
                  <Button variant="ghost" size="sm" onClick={startNew}>
                    + Új cikk
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setEditorOpen(false)}>
                  Bezárás
                </Button>
              </span>
            </div>

            {/* min-h-0: flex-oszlopban ez kell, hogy a görgetés tényleg
                itt legyen és ne nőjön ki a panel a tartalommal */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
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
                            ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                            : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
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
                              ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                              : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
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
                  className="w-full rounded-xl border border-sand bg-surface-card p-4 font-mono text-caption leading-relaxed text-ink outline-none transition focus:border-sage-ring focus:ring-2 focus:ring-sage-ring/40"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-sand px-6 py-4">
              {notice && (
                <div
                  className={`mb-3 rounded-lg border p-3 text-xs ${
                    notice.kind === "ok"
                      ? "border-state-success-border bg-state-success-bg text-state-success-fg"
                      : "border-state-error-border bg-state-error-bg text-state-error-fg"
                  }`}
                >
                  {notice.text}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
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
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Cikk-lista — ez a fő nézet */}
      <section className="rounded-2xl border border-sand bg-surface-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand px-6 py-4">
          <h2 className="font-fraunces text-xl text-ink">
            Cikkek{" "}
            {filtered.length === sorted.length
              ? `(${sorted.length})`
              : `(${filtered.length} / ${sorted.length})`}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={startNew}>
              + Új cikk
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={uploadBusy}
              disabled={uploadBusy}
              onClick={() => fileRef.current?.click()}
            >
              .mdx feltöltése
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".mdx,.md"
              multiple
              className="hidden"
              onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []))}
            />
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-body">
              <input
                type="checkbox"
                checked={overwriteUploads}
                onChange={(e) => setOverwriteUploads(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent-primary)]"
              />
              felülírás engedve
            </label>
          </div>
        </div>

        {/* Szűrők */}
        <div className="flex flex-wrap items-center gap-2 border-b border-sand px-6 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés címre, slugra, tagre…"
            aria-label="Keresés a cikkek között"
            className="min-h-[40px] min-w-[220px] flex-1 rounded-lg border border-sand bg-surface-card px-3 text-xs text-ink outline-none transition focus:border-sage"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.filter(
              (filter) => filter.key !== "future" || counts.future > 0,
            ).map((filter) => {
              const count =
                filter.key === "all"
                  ? counts.all
                  : filter.key === "published"
                    ? counts.published
                    : filter.key === "draft"
                      ? counts.draft
                      : counts.future;
              const active = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  aria-pressed={active}
                  className={`min-h-[40px] rounded-full border px-3 text-xs font-semibold transition ${
                    active
                      ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                      : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
                  }`}
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "hu", "en"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocaleFilter(loc)}
                aria-pressed={localeFilter === loc}
                className={`min-h-[40px] rounded-full border px-3 text-xs font-semibold uppercase transition ${
                  localeFilter === loc
                    ? "border-bronze bg-bronze text-[var(--color-text-on-accent)]"
                    : "border-sand bg-surface-card text-ink-body hover:border-bronze/50"
                }`}
              >
                {loc === "all" ? "HU+EN" : loc}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted">
            {sorted.length === 0
              ? "Még nincs cikk — kezdj egy újat, vagy tölts fel egy .mdx fájlt."
              : "Nincs a szűrőkre illeszkedő cikk."}
          </p>
        )}

        <ul className="divide-y divide-sand">
          {filtered.map((post) => (
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
              {isFutureDated(post) && (
                <span
                  className="rounded-full bg-state-warning-bg px-2 py-0.5 text-[11px] font-semibold text-state-warning-fg"
                  title="Publikált cikk jövőbeli dátummal — élesben már látszik."
                >
                  jövő dátum
                </span>
              )}
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
