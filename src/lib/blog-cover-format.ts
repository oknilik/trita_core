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
