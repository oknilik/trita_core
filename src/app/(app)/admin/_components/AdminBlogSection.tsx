"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { BlogArtVisual, type BlogArtMotif } from "@/components/blog/BlogArtVisual";
import {
  BLOG_ART_CONCEPTS,
  BLOG_ART_CONCEPT_LABELS_HU,
  BLOG_ART_FAMILIES,
  BLOG_ART_FAMILY_LABELS_HU,
  BLOG_ART_LINE_MODES,
  BLOG_ART_LINE_MODE_LABELS_HU,
  blogArtCandidates,
  inferBlogArtConcept,
  resolveBlogArt,
  type BlogArtConcept,
  type BlogArtFamily,
  type BlogArtLineMode,
} from "@/lib/blog-art";

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
  artFamily?: BlogArtFamily;
  artConcept?: BlogArtConcept;
  artLineMode?: BlogArtLineMode;
  coverImage?: string;
  coverFocalX?: number;
  coverFocalY?: number;
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
  artFamily: "" | BlogArtFamily;
  artConcept: "" | BlogArtConcept;
  artLineMode: "" | BlogArtLineMode;
  /** Feltöltött borító publikus útja — üresen a generatív vizuál megy. */
  coverImage: string;
  coverFocalX: number;
  coverFocalY: number;
  body: string;
}

interface PendingCover {
  filename: string;
  dataBase64: string;
  previewUrl: string;
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
  artFamily: "",
  artConcept: "",
  artLineMode: "",
  coverImage: "",
  coverFocalX: 50,
  coverFocalY: 50,
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

function CoverCropPreview({
  src,
  label,
  className,
  focalX,
  focalY,
}: {
  src: string;
  label: string;
  className: string;
  focalX: number;
  focalY: number;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <div className={`relative overflow-hidden rounded-lg border border-sand bg-cream ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-accent-primary)] shadow"
          style={{ left: `${focalX}%`, top: `${focalY}%` }}
        />
      </div>
    </div>
  );
}

export function AdminBlogSection({
  posts,
  storeMode,
  githubReady,
  branch,
}: {
  posts: AdminBlogPost[];
  storeMode: "fs" | "github";
  githubReady: boolean;
  /** Melyik ágra megy a commit — a futó deploy sajátja, ha nincs felülírva. */
  branch: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  // A betöltéskori tároló-sha. Ezt visszük mentéskor: ha a tároló időközben
  // megváltozott (pl. egy korábbi mentés commitja), a szerver 409-et ad
  // némán felülíró commit helyett. `null` = új cikk (még nem létezhet).
  const [baseSha, setBaseSha] = useState<string | null>(null);
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
  const [coverBusy, setCoverBusy] = useState(false);
  const [pendingCover, setPendingCover] = useState<PendingCover | null>(null);
  const [removeCoverOnSave, setRemoveCoverOnSave] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // A portál csak kliensen létezik (SSR-en nincs document).
  const [mounted, setMounted] = useState(false);
  const [artPreviewRound, setArtPreviewRound] = useState(0);

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

  const formTags = useMemo(
    () => form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    [form.tags],
  );
  const artPreviewSlug = form.slug || slugify(form.title) || "uj-cikk";
  const inferredArtConcept = useMemo(
    () => inferBlogArtConcept({ slug: artPreviewSlug, title: form.title, tags: formTags }),
    [artPreviewSlug, form.title, formTags],
  );
  const previewConcept = form.artConcept || inferredArtConcept;
  const currentArt = useMemo(
    () => resolveBlogArt({
      slug: artPreviewSlug,
      title: form.title,
      tags: formTags,
      seed: form.artSeed ? Number(form.artSeed) : undefined,
      family: form.artFamily || undefined,
      concept: form.artConcept || undefined,
      lineMode: form.artLineMode || undefined,
      motif: form.artMotif || undefined,
    }),
    [artPreviewSlug, form.title, formTags, form.artSeed, form.artFamily, form.artConcept, form.artLineMode, form.artMotif],
  );
  const artCandidates = useMemo(
    () => blogArtCandidates(artPreviewSlug, artPreviewRound),
    [artPreviewSlug, artPreviewRound],
  );
  const activeCoverImage = pendingCover?.previewUrl
    ?? (removeCoverOnSave ? "" : form.coverImage);

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
    setBaseSha(null);
    setSlugTouched(false);
    setForm(EMPTY_FORM);
    setPendingCover(null);
    setRemoveCoverOnSave(false);
    setArtPreviewRound(0);
    setConfirmEditorDiscard(false);
  };

  const startNew = () => {
    resetForm();
    setNotice(null);
    setEditorOpen(true);
  };

  const applyPost = (post: AdminBlogPost) => {
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
      artFamily: post.artFamily ?? "",
      artConcept: post.artConcept ?? "",
      artLineMode: post.artLineMode ?? "",
      coverImage: post.coverImage ?? "",
      coverFocalX: post.coverFocalX ?? 50,
      coverFocalY: post.coverFocalY ?? 50,
      body: post.body,
    });
  };

  /**
   * Szerkesztésre nyitás — a tartalom a TÁROLÓBÓL jön, nem a listából.
   *
   * A lista a futó példány fájlrendszeréből épül, ami github módban a
   * legutóbbi DEPLOY állapota. Ha a mentés utáni build még fut, ez a régi
   * szöveg — abból mentve az imént mentett módosítás némán visszaíródna.
   * A sha ugyanitt jön, és mentéskor zárja a kört.
   */
  const startEdit = async (post: AdminBlogPost) => {
    setNotice(null);
    setBusy(`load:${post.slug}`);
    try {
      const res = await fetch(`/api/admin/blog?slug=${encodeURIComponent(post.slug)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({
          kind: "error",
          text: json.error === "NOT_FOUND"
            ? "A cikk nincs meg a tárolóban — lehet, hogy időközben törölték."
            : json.error === "LOAD_FAILED"
              ? `${storeErrorText(json, res.status)} A biztonság kedvéért nem nyitom meg szerkesztésre.`
              : `Nem sikerült betölteni a cikket a tárolóból: ${json.error ?? res.status}. A biztonság kedvéért nem nyitom meg szerkesztésre.`,
        });
        return;
      }

      const fm = (json.frontmatter ?? {}) as Record<string, unknown>;
      const str = (value: unknown): string =>
        typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
      const rawTags = fm.tags;

      applyPost({
        ...post,
        title: str(fm.title) || post.title,
        description: str(fm.description) || post.description,
        locale: fm.locale === "en" ? "en" : "hu",
        tags: Array.isArray(rawTags) ? rawTags.map(String) : post.tags,
        publishedAt: str(fm.publishedAt) || post.publishedAt,
        translationSlug: str(fm.translationSlug) || undefined,
        heroQuote: str(fm.heroQuote) || undefined,
        startHere: Number(fm.startHere) > 0 ? Number(fm.startHere) : undefined,
        artSeed: Number(fm.artSeed) > 0 ? Number(fm.artSeed) : undefined,
        artMotif: ["radar", "network", "bars", "waves"].includes(str(fm.artMotif))
          ? str(fm.artMotif) as BlogArtMotif
          : undefined,
        artFamily: BLOG_ART_FAMILIES.includes(str(fm.artFamily) as BlogArtFamily)
          ? str(fm.artFamily) as BlogArtFamily
          : undefined,
        artConcept: BLOG_ART_CONCEPTS.includes(str(fm.artConcept) as BlogArtConcept)
          ? str(fm.artConcept) as BlogArtConcept
          : undefined,
        artLineMode: BLOG_ART_LINE_MODES.includes(str(fm.artLineMode) as BlogArtLineMode)
          ? str(fm.artLineMode) as BlogArtLineMode
          : undefined,
        coverImage: str(fm.coverImage) || undefined,
        coverFocalX: Number(fm.coverFocalX) >= 0 && Number(fm.coverFocalX) <= 100
          ? Number(fm.coverFocalX)
          : undefined,
        coverFocalY: Number(fm.coverFocalY) >= 0 && Number(fm.coverFocalY) <= 100
          ? Number(fm.coverFocalY)
          : undefined,
        body: String(json.body ?? ""),
      });
      setPendingCover(null);
      setRemoveCoverOnSave(false);
      setBaseSha((json.sha as string | null) ?? null);
      setEditingSlug(post.slug);
      setSlugTouched(true);
      setArtPreviewRound(0);
      setConfirmEditorDiscard(false);
      setEditorOpen(true);
    } catch {
      setNotice({
        kind: "error",
        text: "Hálózati hiba a cikk betöltésekor — nem nyitom meg szerkesztésre.",
      });
    } finally {
      setBusy(null);
    }
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

  /**
   * A tároló hibájának emberi fordítása. A szerver `detail` mezője a
   * whitelistelt kód (pl. GITHUB_WRITE_FAILED_401) — ebből itt lesz
   * cselekvési utasítás, hogy ne a Vercel-logban kelljen kezdeni.
   */
  const storeErrorText = (json: Record<string, unknown>, fallbackStatus: number): string => {
    const detail = typeof json.detail === "string" ? json.detail : "";
    const target = (json.target ?? {}) as { repo?: string | null; branch?: string };
    const where = target.repo
      ? `${target.repo}${target.branch ? `@${target.branch}` : ""}`
      : "a beállított repó";

    if (detail === "BLOG_STORE_READ_ONLY") {
      return "A szerver fájlrendszerbe próbált írni, ami élesben csak olvasható — "
        + "vagyis hiányzik a GITHUB_TOKEN vagy a GITHUB_REPO env. Állítsd be őket a "
        + "Vercelen, és indíts egy redeployt (az env-változás csak új deployban él).";
    }
    if (detail === "GITHUB_NOT_CONFIGURED") {
      return "A GitHub-mentés nincs beállítva (GITHUB_TOKEN + GITHUB_REPO env kell).";
    }

    const httpMatch = /^GITHUB_(?:READ|WRITE|DELETE)_FAILED_(\d{3})$/.exec(detail);
    if (httpMatch) {
      const status = httpMatch[1];
      if (status === "401") {
        return `A GitHub elutasította a tokent (401) — jellemzően lejárt vagy visszavont `
          + `GITHUB_TOKEN. Generálj újat, cseréld a Vercelen, és deployolj újra. (${where})`;
      }
      if (status === "403") {
        return `A token nem kapott írásjogot (403) — a fine-grained PAT-on a `
          + `Contents: Read and write engedély kell erre a repóra. (${where})`;
      }
      if (status === "404") {
        return `A GitHub nem találja a célt (404) — vagy a GITHUB_REPO hibás, vagy a `
          + `cél-ág nem létezik a repóban, vagy a token nem látja ezt a repót. (${where})`;
      }
      if (status === "409" || status === "422") {
        return `A GitHub visszautasította az írást (${status}) — jellemzően időközbeni `
          + `módosítás. Nyisd meg újra a cikket, és mentsd újra. (${where})`;
      }
      return `A GitHub hibát adott (${status}). (${where})`;
    }

    return `Mentés sikertelen: ${detail || fallbackStatus}`;
  };

  /**
   * Borító kiválasztása. A fájl csak helyi előnézet: a cikkel EGY mentési
   * műveletben kerül a szerverre, így a félbehagyott szerkesztés nem hagy
   * árva fájlt a repóban.
   */
  const stageCover = async (file: File) => {
    const slug = form.slug.trim() || slugify(form.title);
    if (slug.length < 3) {
      setNotice({ kind: "error", text: "Előbb adj címet vagy slugot — a borító fájlneve abból lesz." });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setNotice({ kind: "error", text: "A kép túl nagy (max. 3 MB). Kicsinyítsd le — 1600 px széles bőven elég." });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice({ kind: "error", text: "Csak JPG, PNG vagy WebP tölthető fel." });
      return;
    }

    setNotice(null);
    setCoverBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const chunks: string[] = [];
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
      }
      const dataBase64 = btoa(chunks.join(""));
      const previewUrl = `data:${file.type};base64,${dataBase64}`;
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("INVALID_IMAGE"));
        image.src = previewUrl;
      });
      const ratio = dimensions.width / dimensions.height;
      if (dimensions.width < 1200 || dimensions.height < 630) {
        setNotice({ kind: "error", text: "A borító legalább 1200×630 px legyen, hogy minden felületen éles maradjon." });
        return;
      }
      if (ratio < 1.4 || ratio > 2.15) {
        setNotice({ kind: "error", text: "A kép legyen fekvő, nagyjából 16:9 vagy 1,91:1 arányú." });
        return;
      }

      setPendingCover({ filename: file.name, dataBase64, previewUrl });
      setRemoveCoverOnSave(false);
      set({ slug });
      setSlugTouched(true);
      setNotice({
        kind: "ok",
        text: "Borító előkészítve. A cikk mentésekor optimalizálva kerül fel; addig a publikus kép nem változik.",
      });
    } catch {
      setNotice({ kind: "error", text: "A képfájl nem olvasható. Próbálj másik JPG, PNG vagy WebP fájlt." });
    } finally {
      setCoverBusy(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  /** A törlés is csak a cikk mentésekor lép életbe. */
  const stageCoverRemoval = () => {
    setPendingCover(null);
    setRemoveCoverOnSave(Boolean(form.coverImage));
    setNotice({ kind: "ok", text: "A borító eltávolítása előkészítve. A cikk mentésével lép életbe." });
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
      ...(form.coverImage && !removeCoverOnSave ? { coverImage: form.coverImage } : {}),
      ...(pendingCover
        ? { coverUpload: { filename: pendingCover.filename, dataBase64: pendingCover.dataBase64 } }
        : {}),
      ...(removeCoverOnSave ? { removeCover: true } : {}),
      coverFocalX: form.coverFocalX,
      coverFocalY: form.coverFocalY,
      ...(form.startHere ? { startHere: Number(form.startHere) } : {}),
      ...(form.artSeed ? { artSeed: Number(form.artSeed) } : {}),
      ...(form.artFamily ? { artFamily: form.artFamily } : {}),
      ...(form.artConcept ? { artConcept: form.artConcept } : {}),
      ...(form.artLineMode ? { artLineMode: form.artLineMode } : {}),
      ...(!form.artFamily && !form.artConcept && !form.artLineMode && form.artMotif ? { artMotif: form.artMotif } : {}),
      body: form.body,
      status,
      baseSha: editingSlug ? baseSha : null,
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
              : json.error === "CONFLICT"
                ? (editingSlug
                    ? "A cikk a tárolóban időközben megváltozott (jellemzően egy korábbi mentés commitja). A mentés NEM történt meg, hogy ne írja felül. Zárd be a szerkesztőt, nyisd meg újra a cikket, és vidd át a módosítást."
                    : "Ezen a sluggal már van cikk a tárolóban. Válassz másik slugot, vagy a listából nyisd meg a meglévőt.")
                : json.error === "SAVE_FAILED"
                  ? storeErrorText(json, res.status)
                  : json.error === "IMAGE_TOO_SMALL"
                    ? "A borító legalább 1200×630 px legyen."
                    : json.error === "INVALID_ASPECT_RATIO"
                      ? "A borító legyen fekvő, nagyjából 16:9 vagy 1,91:1 arányú."
                      : json.error === "INVALID_IMAGE"
                        ? "A kiválasztott fájl nem feldolgozható kép."
                  : `Mentés sikertelen: ${json.detail ?? json.error ?? res.status}`,
        });
        return;
      }
      setNotice({ kind: "ok", text: successText(json.mode) });
      setEditingSlug(payload.slug);
      setBaseSha((json.sha as string | null) ?? null);
      if (typeof json.coverImage === "string") {
        set({ coverImage: json.coverImage });
      } else if (removeCoverOnSave) {
        set({ coverImage: "" });
      }
      setPendingCover(null);
      setRemoveCoverOnSave(false);
      setSlugTouched(true);
      router.refresh();
    } catch {
      setNotice({ kind: "error", text: "Hálózati hiba a cikk mentésekor — a módosítás nem veszett el." });
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
        setNotice({
          kind: "error",
          text: json.error === "CONFLICT"
            ? "A cikk a tárolóban időközben megváltozott — a státusz-váltás nem történt meg. Frissítsd az oldalt, és próbáld újra."
            : json.error === "SAVE_FAILED"
              ? storeErrorText(json, res.status)
              : `Nem sikerült: ${json.error ?? res.status}`,
        });
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
          <>
            GitHub-commit a{" "}
            <span className="font-dm-mono text-caption text-ink">{branch}</span> ágra →
            automatikus Vercel deploy (~pár perc a megjelenésig).
            {branch !== "main" && (
              <span className="text-muted">
                {" "}
                Ez nem az éles ág: a cikk a publikus blogon csak a main-be olvasztás
                után jelenik meg.
              </span>
            )}
          </>
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

              {/* Cikk-vizuál: jelentésréteg + négy közös Trita-kézírás. */}
              <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">Cikk-vizuál</span>
                  <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-xs text-ink-body">
                    {BLOG_ART_FAMILY_LABELS_HU[currentArt.family]} · {BLOG_ART_CONCEPT_LABELS_HU[currentArt.concept]} · {BLOG_ART_LINE_MODE_LABELS_HU[currentArt.lineMode]}
                  </span>
                  <span className="text-xs text-muted">
                    {form.artFamily || form.artConcept || form.artLineMode || form.artSeed || form.artMotif ? "kiválasztva" : "automatikus"}
                  </span>
                </div>

                {/* A feltöltés az elsődleges szerkesztői út; a generatív kép tartalék. */}
                <div className="mb-4 rounded-lg border border-sand bg-surface-card p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">Szerkesztői borítókép</span>
                    <span className="text-xs text-muted">
                      {pendingCover
                        ? "új kép előkészítve — mentéskor kerül fel"
                        : activeCoverImage
                          ? "feltöltve — minden blogfelületen ez jelenik meg"
                          : "nincs — a Trita generatív tartalékképe jelenik meg"}
                    </span>
                  </div>

                  {activeCoverImage ? (
                    <div className="mt-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.35fr_1fr_0.62fr]">
                        <CoverCropPreview
                          src={activeCoverImage}
                          label="Kiemelt · 16:10"
                          className="aspect-[16/10]"
                          focalX={form.coverFocalX}
                          focalY={form.coverFocalY}
                        />
                        <CoverCropPreview
                          src={activeCoverImage}
                          label="Kártya és cikk · 16:9"
                          className="aspect-video"
                          focalX={form.coverFocalX}
                          focalY={form.coverFocalY}
                        />
                        <CoverCropPreview
                          src={activeCoverImage}
                          label="Mini · 1:1"
                          className="aspect-square"
                          focalX={form.coverFocalX}
                          focalY={form.coverFocalY}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-xs text-ink-body">
                          <span className="mb-1 block">Fókusz vízszintesen · {form.coverFocalX}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={form.coverFocalX}
                            onChange={(event) => set({ coverFocalX: Number(event.target.value) })}
                            className="min-h-11 w-full accent-[var(--color-accent-primary)]"
                          />
                        </label>
                        <label className="text-xs text-ink-body">
                          <span className="mb-1 block">Fókusz függőlegesen · {form.coverFocalY}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={form.coverFocalY}
                            onChange={(event) => set({ coverFocalY: Number(event.target.value) })}
                            className="min-h-11 w-full accent-[var(--color-accent-primary)]"
                          />
                        </label>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={coverBusy}
                          onClick={stageCoverRemoval}
                        >
                          Borító eltávolítása
                        </Button>
                        {pendingCover ? (
                          <span className="text-xs text-muted">{pendingCover.filename}</span>
                        ) : form.coverImage ? (
                          <span className="font-dm-mono text-xs text-muted">{form.coverImage}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      ref={coverFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={coverBusy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void stageCover(file);
                      }}
                      className="text-xs text-ink-body file:mr-3 file:min-h-[44px] file:rounded-full file:border file:border-sand file:bg-cream file:px-4 file:text-xs file:text-ink-body"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    JPG, PNG vagy WebP, legalább 1200×630 px, legfeljebb 3 MB. A szerver
                    1600 px széles WebP-vé optimalizálja. A fókuszpont tartja a fontos részletet
                    a kiemelt, 16:9 és négyzetes kivágásban is. Csak a cikk mentésekor lép életbe.
                  </p>
                  {/* A HU–EN pár két külön fájl: a borító nem öröklődik át. */}
                  {form.translationSlug.trim() && (pendingCover || form.coverImage) ? (
                    <p className="mt-2 text-xs text-ink-body">
                      A párcikk (<span className="font-dm-mono">{form.translationSlug.trim()}</span>)
                      borítója ettől NEM változik — ha ugyanazt a képet szeretnéd ott is, töltsd fel
                      külön, és állítsd be ugyanezt a fókuszpontot.
                    </p>
                  ) : null}
                </div>

                {activeCoverImage ? (
                  <p className="text-xs text-muted">
                    A generatív beállítások el vannak rejtve, amíg szerkesztői borító van
                    a cikken. A borító eltávolítása után a stabil tartalékkép tér vissza.
                  </p>
                ) : (
                  <>
                {/* A mentett/automatikus kép két valódi felületi méretben. */}
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-muted">Kiemelt kártya</span>
                    <div className="h-[120px] overflow-hidden rounded-lg border border-sand">
                      <BlogArtVisual
                        slug={artPreviewSlug}
                        title={form.title}
                        tags={formTags}
                        seed={form.artSeed ? Number(form.artSeed) : 0}
                        motif={form.artMotif || undefined}
                        family={form.artFamily || undefined}
                        concept={form.artConcept || undefined}
                        lineMode={form.artLineMode || undefined}
                        variant="featured"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-muted">Lista és cikkfejléc</span>
                    <div className="h-[120px] overflow-hidden rounded-lg border border-sand">
                      <BlogArtVisual
                        slug={artPreviewSlug}
                        title={form.title}
                        tags={formTags}
                        seed={form.artSeed ? Number(form.artSeed) : 0}
                        motif={form.artMotif || undefined}
                        family={form.artFamily || undefined}
                        concept={form.artConcept || undefined}
                        lineMode={form.artLineMode || undefined}
                        variant="card"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="mb-2 block text-xs font-semibold text-text-primary">Miről szóljon a kompozíció?</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => set({ artConcept: "", artMotif: "" })}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        !form.artConcept
                          ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                          : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
                      }`}
                    >
                      Auto: {BLOG_ART_CONCEPT_LABELS_HU[inferredArtConcept]}
                    </button>
                    {BLOG_ART_CONCEPTS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set({ artConcept: value, artMotif: "" })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          form.artConcept === value
                            ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                            : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
                        }`}
                      >
                        {BLOG_ART_CONCEPT_LABELS_HU[value]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="mb-2 block text-xs font-semibold text-text-primary">Mennyi tintavonal maradjon?</span>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOG_ART_LINE_MODES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set({ artLineMode: value, artMotif: "" })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          currentArt.lineMode === value
                            ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                            : "border-sand bg-surface-card text-ink-body hover:border-sage-ring"
                        }`}
                      >
                        {BLOG_ART_LINE_MODE_LABELS_HU[value]}{value === "minimal" ? " · alap" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-primary">Válassz a nyolc változatból</span>
                  <Button variant="secondary" size="sm" onClick={() => setArtPreviewRound((round) => round + 1)}>
                    Új nyolc variáció
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {artCandidates.map((candidate) => {
                    const selected = form.artFamily === candidate.family
                      && Number(form.artSeed) === candidate.seed;
                    return (
                      <button
                        key={`${candidate.family}-${candidate.seed}`}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${BLOG_ART_FAMILY_LABELS_HU[candidate.family]}, ${BLOG_ART_CONCEPT_LABELS_HU[previewConcept]}, ${BLOG_ART_LINE_MODE_LABELS_HU[currentArt.lineMode]}, ${candidate.seed}. variáció`}
                        onClick={() => set({
                          artFamily: candidate.family,
                          artConcept: previewConcept,
                          artSeed: String(candidate.seed),
                          artMotif: "",
                        })}
                        className={`overflow-hidden rounded-lg border bg-surface-card text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-ring ${
                          selected
                            ? "border-sage ring-2 ring-sage-ring"
                            : "border-sand hover:border-sage-ring"
                        }`}
                      >
                        <span className="block h-[72px] overflow-hidden">
                          <BlogArtVisual
                            slug={artPreviewSlug}
                            title={form.title}
                            tags={formTags}
                            seed={candidate.seed}
                            family={candidate.family}
                            concept={previewConcept}
                            lineMode={currentArt.lineMode}
                            variant="card"
                          />
                        </span>
                        <span className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs">
                          <span className="font-medium text-ink-body">{BLOG_ART_FAMILY_LABELS_HU[candidate.family]}</span>
                          <span className="text-muted">#{candidate.seed}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(form.artSeed || form.artFamily || form.artConcept || form.artLineMode || form.artMotif) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => set({ artSeed: "", artMotif: "", artFamily: "", artConcept: "", artLineMode: "" })}
                    >
                      Automatikus választás
                    </Button>
                  )}
                  {currentArt.legacyMotif ? (
                    <span className="text-xs text-muted">
                      Korábbi motívum megőrizve. Új kártya választásával kerül át a többcsaládos rendszerbe.
                    </span>
                  ) : (
                    <span className="text-xs text-muted">
                      A választás ugyanígy jelenik meg a blogban, az OG-képen és a hírlevélben.
                    </span>
                  )}
                </div>
                  </>
                )}
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
                className={`rounded-full px-2.5 py-0.5 text-label uppercase ${
                  post.status === "draft"
                    ? "bg-state-warning-bg text-state-warning-fg"
                    : "bg-state-success-bg text-state-success-fg"
                }`}
              >
                {post.status === "draft" ? "Piszkozat" : "Publikált"}
              </span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-label uppercase text-ink-warm">
                {post.locale}
              </span>
              {isFutureDated(post) && (
                <span
                  className="rounded-full bg-state-warning-bg px-2 py-0.5 text-note font-semibold text-state-warning-fg"
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
                <Button
                  variant="ghost"
                  size="sm"
                  loading={busy === `load:${post.slug}`}
                  disabled={busy !== null}
                  onClick={() => void startEdit(post)}
                >
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
