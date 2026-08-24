/**
 * Feltöltött borító formátumának felismerése a TARTALOMBÓL.
 *
 * A kiterjesztés a feltöltő állítása; a bájtok a bizonyíték. Egy `.jpg`-re
 * átnevezett SVG (vagy bármi más) így nem kerül be a repóba, és nem lesz
 * belőle a saját domainünkről kiszolgált, tetszőleges tartalom.
 */

export const BLOG_COVER_EXTENSIONS = ["jpg", "png", "webp"] as const;
export type BlogCoverExtension = (typeof BLOG_COVER_EXTENSIONS)[number];

/** ~3 MB — egy 1600 px széles borítóhoz bőven elég. */
export const BLOG_COVER_MAX_BYTES = 3 * 1024 * 1024;

/** A szerkesztői borító minimális hasznos mérete és elfogadott aránya. */
export const BLOG_COVER_MIN_WIDTH = 1200;
export const BLOG_COVER_MIN_HEIGHT = 630;
export const BLOG_COVER_MIN_RATIO = 1.4;
export const BLOG_COVER_MAX_RATIO = 2.15;
export const BLOG_COVER_OUTPUT_WIDTH = 1600;

export type BlogCoverValidationError =
  | "INVALID_IMAGE"
  | "IMAGE_TOO_SMALL"
  | "INVALID_ASPECT_RATIO";

export interface OptimizedBlogCover {
  bytes: Buffer;
  width: number;
  height: number;
}

export function sniffCoverExtension(bytes: Buffer): BlogCoverExtension | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";

  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }

  return null;
}

/**
 * A publikus borító mindig normalizált WebP. A `sharp` csak a szerveroldali
 * írási útvonalon töltődik be, így nem növeli a kliens bundle-t.
 */
export async function optimizeBlogCover(
  bytes: Buffer,
): Promise<OptimizedBlogCover> {
  const sharp = (await import("sharp")).default;
  let metadata;
  try {
    metadata = await sharp(bytes, { failOn: "error" }).metadata();
  } catch {
    throw new Error("INVALID_IMAGE" satisfies BlogCoverValidationError);
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width < BLOG_COVER_MIN_WIDTH || height < BLOG_COVER_MIN_HEIGHT) {
    throw new Error("IMAGE_TOO_SMALL" satisfies BlogCoverValidationError);
  }

  const ratio = width / height;
  if (ratio < BLOG_COVER_MIN_RATIO || ratio > BLOG_COVER_MAX_RATIO) {
    throw new Error("INVALID_ASPECT_RATIO" satisfies BlogCoverValidationError);
  }

  const optimized = await sharp(bytes, { failOn: "error" })
    .rotate()
    .resize({ width: BLOG_COVER_OUTPUT_WIDTH, withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    bytes: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
  };
}
