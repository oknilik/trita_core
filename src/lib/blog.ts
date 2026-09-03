import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import {
  isBlogArtConcept,
  isBlogArtFamily,
  isBlogArtLineMode,
  isLegacyBlogArtMotif,
  type BlogArtConcept,
  type BlogArtFamily,
  type BlogArtLineMode,
  type LegacyBlogArtMotif,
} from "@/lib/blog-art";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/**
 * Olvasási idő a cikk törzsszövegéből. A listanézet és a cikkoldal külön
 * olvassa be ugyanazt a fájlt, ezért a számítás itt lakik: két külön
 * másolat idővel elcsúszhatna, és a blogindexen más perc jelenne meg,
 * mint magán a cikken.
 */
function computeReadingMinutes(content: string): number {
  return Math.ceil(readingTime(content).minutes);
}

/** A percérték megjelenítési formája — a locale dönti el a feliratot. */
function formatReadingTime(minutes: number, locale: "hu" | "en"): string {
  return locale === "hu" ? `${minutes} perc` : `${minutes} min read`;
}


export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  locale: "hu" | "en";
  translationSlug?: string;
  tags: string[];
  readingTime: string;
  /** Percben — a TOC „még ~X perc" becsléséhez. */
  readingMinutes: number;
  /** Featured-panel kulcs-állítás (frontmatter heroQuote) — fallback: description. */
  heroQuote?: string;
  /** „Kezdd itt" sáv sorrendje (1–3) — frontmatter startHere. */
  startHere?: number;
  /** Piszkozat-állapot (frontmatter status) — hiányzó érték = published. */
  status: "draft" | "published";
  /** Generatív vizuál variáció-seedje (frontmatter artSeed). */
  artSeed?: number;
  /** Generatív vizuál motívum-felülbírálása (frontmatter artMotif). */
  artMotif?: LegacyBlogArtMotif;
  /** Vizuális kézírás: konstelláció, lágy Bauhaus vagy élő vonal. */
  artFamily?: BlogArtFamily;
  /** Szerkesztői jelentésréteg — nem mérési állítás. */
  artConcept?: BlogArtConcept;
  /** Dekoratív tintavonal mennyisége. */
  artLineMode?: BlogArtLineMode;
  /**
   * Feltöltött borítókép publikus útja (`/blog-covers/<fájl>`). Ha van, ez
   * VÁLTJA a generatív vizuált minden felületen — listán, cikk-fejlécen,
   * OG-képen és a hírlevél borítóján is.
   */
  coverImage?: string;
  /** A fontos képrész helye százalékban; minden eltérő crop ezt követi. */
  coverFocalX?: number;
  coverFocalY?: number;
  content: string;
}


/**
 * Feltöltött borító útjának ellenőrzése.
 *
 * A frontmatter szerkeszthető (admin, .mdx-feltöltés), az érték pedig
 * `<img src>`-ként és fájlútként is landol — ezért a `/blog-covers/` prefix
 * és a szigorú fájlnév-alak kötelező. Bármi más (külső URL, `../`,
 * `javascript:`) NINCS borító, nem pedig „majd valahogy".
 */
const COVER_IMAGE_RE = /^\/blog-covers\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/;

export function isBlogCoverImage(value: unknown): value is string {
  return typeof value === "string" && COVER_IMAGE_RE.test(value);
}

/**
 * A fókuszpont mindig 0–100 közötti EGÉSZ százalék — ugyanaz az alak, amit a
 * mentő végpont zod-sémája elfogad. A kézzel írt frontmatter törtszámát
 * kerekítjük, nem dobjuk el: a szándék egyértelmű.
 */
export function blogCoverFocalPoint(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? Math.round(value)
    : undefined;
}

/**
 * A slughoz TARTOZÓ, generált borító felismerése.
 *
 * A takarítás csak azt a fájlt törölheti, amit ehhez a cikkhez generáltunk
 * (`<slug>-<10 hex>.webp`). Puszta prefix-egyezés nem elég: a slugok között
 * van prefix-viszony (`hexaco-vs-mbti` ⊂ `hexaco-vs-mbti-why-it-matters`),
 * és a HU–EN párok kézzel felvett, közös illusztráción osztozhatnak — azokhoz
 * egy cikk törlése sem nyúlhat.
 */
export function isOwnedBlogCover(coverImage: unknown, slug: string): coverImage is string {
  if (!isBlogCoverImage(coverImage)) return false;
  const fileName = coverImage.slice("/blog-covers/".length);
  return new RegExp(`^${escapeRegExp(slug)}-[0-9a-f]{10}\\.webp$`).test(fileName);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getAllPosts(
  locale: "hu" | "en" = "hu",
  options?: { includeDrafts?: boolean },
): Omit<BlogPost, "content">[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
      const { data, content } = matter(raw);

      if (data.locale && data.locale !== locale) return null;
      if (data.status === "draft" && !options?.includeDrafts) return null;

      const minutes = computeReadingMinutes(content);

      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        publishedAt: data.publishedAt as string,
        locale: (data.locale ?? "hu") as "hu" | "en",
        tags: (data.tags ?? []) as string[],
        readingTime: formatReadingTime(minutes, locale),
        readingMinutes: minutes,
        heroQuote: data.heroQuote as string | undefined,
        startHere: data.startHere as number | undefined,
        status: (data.status === "draft" ? "draft" : "published") as "draft" | "published",
        artSeed: data.artSeed as number | undefined,
        artMotif: isLegacyBlogArtMotif(data.artMotif) ? data.artMotif : undefined,
        artFamily: isBlogArtFamily(data.artFamily) ? data.artFamily : undefined,
        artConcept: isBlogArtConcept(data.artConcept) ? data.artConcept : undefined,
        artLineMode: isBlogArtLineMode(data.artLineMode) ? data.artLineMode : undefined,
        coverImage: isBlogCoverImage(data.coverImage) ? data.coverImage : undefined,
        coverFocalX: blogCoverFocalPoint(data.coverFocalX),
        coverFocalY: blogCoverFocalPoint(data.coverFocalY),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.publishedAt).getTime() - new Date(a!.publishedAt).getTime()
    ) as Omit<BlogPost, "content">[];
}

/**
 * Kanonikus slug-alak: kisbetűs szó-darabok kötőjellel. Ugyanaz a minta, amit
 * az admin blog-API és a hírlevél-szám validál – itt is kimondjuk, mert ez az
 * EGYETLEN hely, ahol slugból fájlrendszer-út lesz.
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 120;

/**
 * Slug → fájlút, KÖNYVTÁRHATÁRRAL.
 *
 * MIÉRT KELL (2026-08-21): a slug útvonal-paraméterből jön, és a Next
 * dekódolja – a `placeholder%2f..%2fvalodi-cikk` alak tehát `../`-ként ér ide,
 * és a `path.join` engedelmesen kilép a `content/blog` mappából. Ma nincs
 * máshol becsomagolt `.mdx`, ezért nem szivárgott adat, de a lehetőség valódi
 * volt. Két, egymástól független kapu:
 *
 *   1. alak- és hosszellenőrzés (a `/`, `.` és `\` szerkezetileg kizárva),
 *   2. `path.resolve` utáni prefix-vizsgálat – ez akkor is tart, ha a minta
 *      valaha megengedőbbre változik.
 */
function resolvePostPath(slug: string): string | null {
  if (typeof slug !== "string") return null;
  if (slug.length === 0 || slug.length > SLUG_MAX_LENGTH) return null;
  if (!SLUG_RE.test(slug)) return null;

  const resolved = path.resolve(BLOG_DIR, `${slug}.mdx`);
  const root = path.resolve(BLOG_DIR);
  if (path.dirname(resolved) !== root) return null;

  return resolved;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = resolvePostPath(slug);
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const minutes = computeReadingMinutes(content);
  const locale = (data.locale ?? "hu") as "hu" | "en";

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    publishedAt: data.publishedAt as string,
    locale,
    translationSlug: data.translationSlug as string | undefined,
    tags: (data.tags ?? []) as string[],
    readingTime: formatReadingTime(minutes, locale),
    readingMinutes: minutes,
    heroQuote: data.heroQuote as string | undefined,
    startHere: data.startHere as number | undefined,
    status: (data.status === "draft" ? "draft" : "published") as "draft" | "published",
    artSeed: data.artSeed as number | undefined,
    artMotif: isLegacyBlogArtMotif(data.artMotif) ? data.artMotif : undefined,
    artFamily: isBlogArtFamily(data.artFamily) ? data.artFamily : undefined,
    artConcept: isBlogArtConcept(data.artConcept) ? data.artConcept : undefined,
    artLineMode: isBlogArtLineMode(data.artLineMode) ? data.artLineMode : undefined,
    coverImage: isBlogCoverImage(data.coverImage) ? data.coverImage : undefined,
    coverFocalX: blogCoverFocalPoint(data.coverFocalX),
    coverFocalY: blogCoverFocalPoint(data.coverFocalY),
    content,
  };
}

// ─── TOC-segédek ─────────────────────────────────────────────────────────────
// A h2 fejezetcímek id-ját a TOC-nak és az MDX h2-komponensnek UGYANÍGY kell
// képeznie – ez a közös forrás.

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface ArticleHeading {
  id: string;
  text: string;
}

/** MDX-forrásból kigyűjti a `## ` szintű fejezetcímeket (kódblokkokat kihagyva). */
export function extractHeadings(content: string): ArticleHeading[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, "");
  const headings: ArticleHeading[] = [];
  for (const line of withoutCode.split("\n")) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m && !m[1].startsWith("#")) {
      const text = m[1].replace(/\*\*/g, "").trim();
      headings.push({ id: slugifyHeading(text), text });
    }
  }
  return headings;
}
