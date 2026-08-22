import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import matter from "gray-matter";
import { requireAdmin } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger.server";
import {
  blogStoreMode,
  githubConfigured,
  readBlogSource,
  saveBlogSource,
  deleteBlogSource,
} from "@/lib/blog-store";
import { BLOG_ART_CONCEPTS, BLOG_ART_FAMILIES, BLOG_ART_LINE_MODES } from "@/lib/blog-art";

export const runtime = "nodejs";

// Admin blog-kezelés (2026-07-24): cikk mentése piszkozatként vagy
// publikálva (POST), illetve publikálás/visszavonás státusz-billentéssel
// (PATCH). A tartalom forrásigazsága a git marad — github módban minden
// mentés commit, amit a Vercel automatikusan élesít (~pár perc).

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const postSchema = z.object({
  slug: z.string().regex(SLUG_RE).min(3).max(120),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  locale: z.enum(["hu", "en"]),
  tags: z.array(z.string().min(1).max(40)).max(6),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  translationSlug: z.string().regex(SLUG_RE).max(120).optional(),
  heroQuote: z.string().max(300).optional(),
  startHere: z.number().int().min(1).max(3).optional(),
  artSeed: z.number().int().min(1).max(9999).optional(),
  artMotif: z.enum(["radar", "network", "bars", "waves"]).optional(),
  artFamily: z.enum(BLOG_ART_FAMILIES).optional(),
  artConcept: z.enum(BLOG_ART_CONCEPTS).optional(),
  artLineMode: z.enum(BLOG_ART_LINE_MODES).optional(),
  body: z.string().min(50).max(100_000),
  status: z.enum(["draft", "published"]),
});

type PostInput = z.infer<typeof postSchema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Frontmatter + törzs .mdx-szé — a gray-matter YAML-szerializálójával
 * (idézőjelezés, ékezetek OK). Minden mentési út ezen megy át. */
function buildMdx(p: PostInput): string {
  const data: Record<string, unknown> = {
    title: p.title,
    description: p.description,
    publishedAt: p.publishedAt ?? todayIso(),
    locale: p.locale,
    tags: p.tags,
  };
  if (p.translationSlug) data.translationSlug = p.translationSlug;
  if (p.heroQuote) data.heroQuote = p.heroQuote;
  if (p.startHere) data.startHere = p.startHere;
  if (p.artSeed) data.artSeed = p.artSeed;
  if (p.artFamily) data.artFamily = p.artFamily;
  if (p.artConcept) data.artConcept = p.artConcept;
  if (p.artLineMode) data.artLineMode = p.artLineMode;
  if (p.artMotif && !p.artFamily && !p.artConcept && !p.artLineMode) data.artMotif = p.artMotif;
  if (p.status === "draft") data.status = "draft";

  return matter.stringify("\n" + p.body.trim() + "\n", data);
}

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("admin-blog");
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_PAYLOAD", detail: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }
  const p = parsed.data;

  if (blogStoreMode() === "github" && !githubConfigured()) {
    return NextResponse.json({ error: "GITHUB_NOT_CONFIGURED" }, { status: 501 });
  }

  const mdx = buildMdx(p);

  try {
    const result = await saveBlogSource({
      slug: p.slug,
      content: mdx,
      message: `content(blog): ${p.slug} (${p.status === "draft" ? "piszkozat" : "publikálás"})`,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error({ event: "admin-blog.save_failed", err: error }, "Save failed");
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}

// ── Közvetlen .mdx feltöltés (PUT) ────────────────────────────────────
// A kész fájl frontmatterét a szerver olvassa (gray-matter), így a kliens
// nem YAML-parsolgat. A feltöltött cikk MINDIG piszkozatként landol — a
// publikálás külön, tudatos lépés a listából.
const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  raw: z.string().min(20).max(200_000),
  /** Létező slug felülírása (a git-történelemben megmarad az előző állapot). */
  overwrite: z.boolean().optional(),
});

function frontmatterString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

export async function PUT(req: NextRequest) {
  const log = await getRequestLogger("admin-blog");
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const { filename, raw, overwrite } = parsed.data;

  if (blogStoreMode() === "github" && !githubConfigured()) {
    return NextResponse.json({ error: "GITHUB_NOT_CONFIGURED" }, { status: 501 });
  }

  const slug = filename
    .replace(/\.(mdx|md)$/i, "")
    .trim()
    .toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length < 3 || slug.length > 120) {
    return NextResponse.json({ error: "INVALID_SLUG", slug }, { status: 400 });
  }

  let data: Record<string, unknown>;
  let content: string;
  try {
    const parsedFile = matter(raw);
    data = parsedFile.data as Record<string, unknown>;
    content = parsedFile.content;
  } catch {
    return NextResponse.json({ error: "FRONTMATTER_PARSE_FAILED" }, { status: 400 });
  }

  // YAML dátum-objektum vagy string — mindkettőt ISO-napra normalizáljuk
  const rawDate = data.publishedAt;
  const publishedAt =
    rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : frontmatterString(rawDate);

  const rawTags = data.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6)
    : typeof rawTags === "string"
      ? rawTags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 6)
      : [];

  const candidate = postSchema.safeParse({
    slug,
    title: frontmatterString(data.title) ?? "",
    description: frontmatterString(data.description) ?? "",
    locale: data.locale === "en" ? "en" : "hu",
    tags,
    ...(publishedAt && /^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ? { publishedAt } : {}),
    ...(frontmatterString(data.translationSlug)
      ? { translationSlug: frontmatterString(data.translationSlug) }
      : {}),
    ...(frontmatterString(data.heroQuote) ? { heroQuote: frontmatterString(data.heroQuote) } : {}),
    ...(Number.isInteger(Number(data.startHere)) && Number(data.startHere) > 0
      ? { startHere: Number(data.startHere) }
      : {}),
    ...(Number.isInteger(Number(data.artSeed)) && Number(data.artSeed) > 0
      ? { artSeed: Number(data.artSeed) }
      : {}),
    ...(typeof data.artMotif === "string" ? { artMotif: data.artMotif } : {}),
    ...(typeof data.artFamily === "string" ? { artFamily: data.artFamily } : {}),
    ...(typeof data.artConcept === "string" ? { artConcept: data.artConcept } : {}),
    ...(typeof data.artLineMode === "string" ? { artLineMode: data.artLineMode } : {}),
    body: content,
    status: "draft" as const,
  });
  if (!candidate.success) {
    return NextResponse.json(
      {
        error: "INVALID_FRONTMATTER",
        detail: candidate.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .slice(0, 3)
          .join("; "),
      },
      { status: 400 },
    );
  }

  try {
    if (!overwrite && (await readBlogSource(slug))) {
      return NextResponse.json({ error: "SLUG_EXISTS", slug }, { status: 409 });
    }

    const result = await saveBlogSource({
      slug,
      content: buildMdx(candidate.data),
      message: `content(blog): ${slug} (mdx-feltöltés, piszkozat)`,
    });
    log.info({ event: "admin-blog.uploaded", slug, overwrite: Boolean(overwrite) }, "MDX uploaded");
    return NextResponse.json({ ok: true, slug, ...result });
  } catch (error) {
    log.error({ event: "admin-blog.upload_failed", err: error, slug }, "Upload failed");
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}

const patchSchema = z.object({
  slug: z.string().regex(SLUG_RE).max(120),
  action: z.enum(["publish", "unpublish"]),
});

export async function PATCH(req: NextRequest) {
  const log = await getRequestLogger("admin-blog");
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const { slug, action } = parsed.data;

  if (blogStoreMode() === "github" && !githubConfigured()) {
    return NextResponse.json({ error: "GITHUB_NOT_CONFIGURED" }, { status: 501 });
  }

  try {
    const source = await readBlogSource(slug);
    if (!source) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const { data, content } = matter(source);
    const wasDraft = data.status === "draft";

    if (action === "publish") {
      delete data.status;
      // Első publikáláskor a dátum a publikálás napja legyen
      if (wasDraft || !data.publishedAt) data.publishedAt = todayIso();
    } else {
      data.status = "draft";
    }

    const result = await saveBlogSource({
      slug,
      content: matter.stringify(content, data),
      message: `content(blog): ${slug} (${action === "publish" ? "publikálás" : "visszavonás"})`,
    });
    return NextResponse.json({ ok: true, status: action === "publish" ? "published" : "draft", ...result });
  } catch (error) {
    log.error({ event: "admin-blog.status_change_failed", err: error }, "Status change failed");
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  slug: z.string().regex(SLUG_RE).max(120),
});

export async function DELETE(req: NextRequest) {
  const log = await getRequestLogger("admin-blog");
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  if (blogStoreMode() === "github" && !githubConfigured()) {
    return NextResponse.json({ error: "GITHUB_NOT_CONFIGURED" }, { status: 501 });
  }

  try {
    const result = await deleteBlogSource({
      slug: parsed.data.slug,
      message: `content(blog): ${parsed.data.slug} törlése (elvetés)`,
    });
    if (!result) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error({ event: "admin-blog.delete_failed", err: error }, "Delete failed");
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
