import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import matter from "gray-matter";
import { requireAdmin } from "@/lib/auth";
import {
  blogStoreMode,
  githubConfigured,
  readBlogSource,
  saveBlogSource,
  deleteBlogSource,
} from "@/lib/blog-store";

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
  artSeed: z.number().int().min(0).max(9999).optional(),
  artMotif: z.enum(["radar", "network", "bars", "waves"]).optional(),
  body: z.string().min(50).max(100_000),
  status: z.enum(["draft", "published"]),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
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

  // Frontmatter a gray-matter YAML-szerializálójával (idézőjelezés, ékezetek OK)
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
  if (p.artMotif) data.artMotif = p.artMotif;
  if (p.status === "draft") data.status = "draft";

  const mdx = matter.stringify("\n" + p.body.trim() + "\n", data);

  try {
    const result = await saveBlogSource({
      slug: p.slug,
      content: mdx,
      message: `content(blog): ${p.slug} (${p.status === "draft" ? "piszkozat" : "publikálás"})`,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[AdminBlog] Save failed:", error);
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}

const patchSchema = z.object({
  slug: z.string().regex(SLUG_RE).max(120),
  action: z.enum(["publish", "unpublish"]),
});

export async function PATCH(req: NextRequest) {
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
    console.error("[AdminBlog] Status change failed:", error);
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  slug: z.string().regex(SLUG_RE).max(120),
});

export async function DELETE(req: NextRequest) {
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
    console.error("[AdminBlog] Delete failed:", error);
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
