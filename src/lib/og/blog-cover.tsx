import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getPostBySlug, isBlogCoverImage } from "@/lib/blog";
import { COLORS } from "@/lib/design-tokens";
import { BlogArtVisual } from "@/components/blog/BlogArtVisual";
import type { ArtPalette } from "@/lib/miro-primitives";

/**
 * A cikk-borító VÁSZNA — két hívóval, egyetlen rajzzal.
 *
 *   1. `blog/[slug]/opengraph-image.tsx` — a link-előnézetek (közösségi média,
 *      üzenetküldők) fájl-konvenciós route-ja.
 *   2. `/api/newsletter/cover/[slug]` — a HÍRLEVÉL borítója.
 *
 * MIÉRT KELL A MÁSODIK, HA AZ ELSŐ UGYANEZ (2026-08-21): a Next a metadata-
 * image route-nak build-generált utótagot ad (`…/opengraph-image-<hash>`), és
 * ez az utótag oldalkódból nem olvasható ki. Az utótag nélküli
 * `/blog/<slug>/opengraph-image` **404** — ezt a `blog/[slug]/page.tsx`
 * JSON-LD-megjegyzése is rögzíti, és mérve is így viselkedik. A levélbe
 * viszont a küldéskor kell egy STABIL, kívülről is betölthető URL, mert a
 * levél hónapokig él a postafiókban. Ezért van a hírlevélnek saját, nem
 * hashelt route-ja, ami ugyanezt a vásznat rendereli.
 */

export const BLOG_COVER_SIZE = { width: 1200, height: 630 };
export const BLOG_COVER_CONTENT_TYPE = "image/png";
export const BLOG_COVER_ALT = "trita blog";

const OG_ART_PALETTE: ArtPalette = {
  line: COLORS.ink,
  form: COLORS.bronze,
  sun: COLORS.bronzeSoft,
  counterweight: COLORS.sage,
};

/**
 * ISMERETLEN SLUG: a rajzolás DRÁGA (két fontfájl + 1200×630 raszter), a CDN
 * cache-kulcsa pedig az URL — ezért ismeretlen slugra SOHA nem rajzolunk,
 * hanem a hívó irányít át a prerendelt márka-képre. A metadata-image route
 * ezt nem tudja megtenni (fix Response-alakja van), ott marad a cím nélküli
 * vászon; oda viszont csak a saját `generateStaticParams` slugjai jutnak el.
 */

/**
 * Feltöltött borító beolvasása data URI-ként.
 *
 * MIÉRT NEM URL-LEL: a satori tudna távoli képet tölteni, de ez a vászon
 * build-időben is renderelődik (metadata-image route), amikor a saját
 * domain még nem szolgál ki semmit — a kép tehát a lemezről jön. Hiányzó
 * fájlnál `null`, és a hívó visszaesik a generatív vizuálra: egy törölt kép
 * miatt ne legyen üres lyuk a link-előnézetben.
 */
async function readCoverDataUri(coverImage: string): Promise<string | null> {
  if (!isBlogCoverImage(coverImage)) return null;
  const fileName = coverImage.slice("/blog-covers/".length);
  const filePath = path.join(process.cwd(), "public", "blog-covers", fileName);
  try {
    const bytes = await readFile(filePath);
    const mime = fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderBlogCoverImage(slug: string): Promise<ImageResponse> {
  const post = getPostBySlug(slug);
  const published = post?.status === "published" ? post : null;
  const title = published?.title ?? "trita blog";
  const tag = published?.tags[0];
  const isHu = published?.locale !== "en";

  // Statikus (nem variable) font-példányok: a satori nem tud variable TTF-et.
  const [fraunces, dmSans] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/og/Fraunces-400.ttf")),
    readFile(path.join(process.cwd(), "assets/og/DMSans-400.ttf")),
  ]);

  const coverDataUri = published?.coverImage
    ? await readCoverDataUri(published.coverImage)
    : null;

  // Hosszú címnél kisebb betű, hogy ne csorduljon ki a vászonról.
  const fontSize = title.length > 70 ? 52 : title.length > 45 ? 60 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.cream,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              backgroundColor: COLORS.bronze,
            }}
          />
          <div
            style={{
              fontFamily: "DM Sans",
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.sage,
            }}
          >
            trita blog
          </div>
          {tag ? (
            <div
              style={{
                marginLeft: 12,
                fontFamily: "DM Sans",
                fontSize: 22,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: COLORS.bronze,
                border: `2px solid ${COLORS.bronzeEdge}`,
                borderRadius: 9999,
                padding: "6px 18px",
              }}
            >
              {tag}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 30, width: "100%" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize,
              lineHeight: 1.18,
              color: COLORS.ink,
              maxWidth: 670,
              flexGrow: 1,
            }}
          >
            {title}
          </div>
          {published ? (
            <div
              style={{
                display: "flex",
                width: 340,
                height: 168,
                borderRadius: 26,
                overflow: "hidden",
                border: `2px solid ${COLORS.sand}`,
                flexShrink: 0,
              }}
            >
              {coverDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverDataUri}
                  alt=""
                  width={340}
                  height={168}
                  style={{ width: 340, height: 168, objectFit: "cover" }}
                />
              ) : (
                <BlogArtVisual
                  slug={published.slug}
                  title={published.title}
                  tags={published.tags}
                  seed={published.artSeed}
                  motif={published.artMotif}
                  family={published.artFamily}
                  concept={published.artConcept}
                  lineMode={published.artLineMode}
                  variant="card"
                  palette={OG_ART_PALETTE}
                  background={COLORS.warm}
                />
              )}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontFamily: "DM Sans", fontSize: 26, color: COLORS.inkBody }}>
            {isHu
              ? "Csapatdinamika, személyiség, tudatos HR"
              : "Team dynamics, personality, intentional HR"}
          </div>
          <div
            style={{
              width: 120,
              height: 6,
              borderRadius: 9999,
              backgroundColor: COLORS.bronze,
            }}
          />
        </div>
      </div>
    ),
    {
      ...BLOG_COVER_SIZE,
      fonts: [
        { name: "Fraunces", data: fraunces, style: "normal", weight: 400 },
        { name: "DM Sans", data: dmSans, style: "normal", weight: 400 },
      ],
    },
  );
}
