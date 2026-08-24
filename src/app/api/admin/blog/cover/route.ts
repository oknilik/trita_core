import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger.server";
import {
  BLOG_COVER_EXTENSIONS,
  BLOG_COVER_MAX_BYTES,
  sniffCoverExtension,
} from "@/lib/blog-cover-format";
import {
  blogStoreMode,
  blogStoreTarget,
  deleteBlogCover,
  githubConfigured,
  saveBlogCover,
} from "@/lib/blog-store";

export const runtime = "nodejs";

/**
 * Saját borítókép feltöltése egy cikkhez.
 *
 *   POST   { slug, filename, dataBase64 }  — feltöltés, visszaad: { path }
 *   DELETE { slug, extension }             — a feltöltött borító törlése
 *
 * A kép ugyanoda kerül, ahova a cikk: `github` módban commit a repóba
 * (`public/blog-covers/`), `fs` módban fájlírás. A frontmatter `coverImage`
 * mezőjét NEM ez az útvonal írja — azt a cikk következő mentése viszi be,
 * hogy a kép és a szöveg állapota egyetlen helyen dőljön el.
 *
 * A kép a publikus `/blog-covers/<slug>.<kiterjesztés>` úton szolgálódik ki.
 * A fájlnév a slugból jön, tehát cikkenként EGY borító van: az újabb
 * feltöltés lecseréli a régit, nem szemetel tele a repó.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const uploadSchema = z.object({
  slug: z.string().regex(SLUG_RE).min(3).max(120),
  filename: z.string().min(1).max(200),
  dataBase64: z.string().min(32).max(8 * 1024 * 1024),
});

const deleteSchema = z.object({
  slug: z.string().regex(SLUG_RE).min(3).max(120),
  extension: z.enum(BLOG_COVER_EXTENSIONS),
});

function storeGuard(): NextResponse | null {
  if (blogStoreMode() === "github" && !githubConfigured()) {
    return NextResponse.json({ error: "GITHUB_NOT_CONFIGURED" }, { status: 501 });
  }
  return null;
}

function failure(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "";
  const known = /^(GITHUB_(READ|WRITE|DELETE)_FAILED_\d{3}|GITHUB_NOT_CONFIGURED|BLOG_STORE_READ_ONLY)$/;
  return NextResponse.json(
    {
      error: "SAVE_FAILED",
      detail: known.test(message) ? message : "UNKNOWN",
      target: blogStoreTarget(),
    },
    { status: 500 },
  );
}

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("admin-blog-cover");
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = uploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const { slug, dataBase64 } = parsed.data;

  const guard = storeGuard();
  if (guard) return guard;

  const bytes = Buffer.from(dataBase64, "base64");
  if (bytes.length === 0) {
    return NextResponse.json({ error: "INVALID_IMAGE" }, { status: 400 });
  }
  if (bytes.length > BLOG_COVER_MAX_BYTES) {
    return NextResponse.json(
      { error: "TOO_LARGE", maxBytes: BLOG_COVER_MAX_BYTES },
      { status: 413 },
    );
  }

  const extension = sniffCoverExtension(bytes);
  if (!extension) {
    return NextResponse.json({ error: "UNSUPPORTED_FORMAT" }, { status: 415 });
  }

  const fileName = `${slug}.${extension}`;
  try {
    const result = await saveBlogCover({
      fileName,
      bytes,
      message: `content(blog): ${slug} borítókép`,
    });
    log.info(
      { event: "admin-blog.cover_uploaded", slug, extension, bytes: bytes.length },
      "Blog cover uploaded",
    );
    return NextResponse.json({
      ok: true,
      path: `/blog-covers/${fileName}`,
      extension,
      bytes: bytes.length,
      ...result,
    });
  } catch (error) {
    log.error({ event: "admin-blog.cover_upload_failed", err: error, slug }, "Cover upload failed");
    return failure(error);
  }
}

export async function DELETE(req: NextRequest) {
  const log = await getRequestLogger("admin-blog-cover");
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const guard = storeGuard();
  if (guard) return guard;

  const { slug, extension } = parsed.data;
  try {
    const result = await deleteBlogCover({
      fileName: `${slug}.${extension}`,
      message: `content(blog): ${slug} borítókép eltávolítása`,
    });
    // Hiányzó fájl nem hiba: a kért végállapot (nincs borító) így is teljesül.
    return NextResponse.json({ ok: true, removed: result !== null, ...(result ?? {}) });
  } catch (error) {
    log.error({ event: "admin-blog.cover_delete_failed", err: error, slug }, "Cover delete failed");
    return failure(error);
  }
}
