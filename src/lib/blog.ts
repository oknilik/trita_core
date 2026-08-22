import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import {
  isBlogArtConcept,
  isBlogArtFamily,
  isLegacyBlogArtMotif,
  type BlogArtConcept,
  type BlogArtFamily,
  type LegacyBlogArtMotif,
} from "@/lib/blog-art";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

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
  content: string;
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

      const rt = readingTime(content);
      const minutes = Math.ceil(rt.minutes);

      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        publishedAt: data.publishedAt as string,
        locale: (data.locale ?? "hu") as "hu" | "en",
        tags: (data.tags ?? []) as string[],
        readingTime: locale === "hu" ? `${minutes} perc` : `${minutes} min read`,
        readingMinutes: minutes,
        heroQuote: data.heroQuote as string | undefined,
        startHere: data.startHere as number | undefined,
        status: (data.status === "draft" ? "draft" : "published") as "draft" | "published",
        artSeed: data.artSeed as number | undefined,
        artMotif: isLegacyBlogArtMotif(data.artMotif) ? data.artMotif : undefined,
        artFamily: isBlogArtFamily(data.artFamily) ? data.artFamily : undefined,
        artConcept: isBlogArtConcept(data.artConcept) ? data.artConcept : undefined,
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
 * az admin blog-API és a hírlevél-szám validál — itt is kimondjuk, mert ez az
 * EGYETLEN hely, ahol slugból fájlrendszer-út lesz.
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 120;

/**
 * Slug → fájlút, KÖNYVTÁRHATÁRRAL.
 *
 * MIÉRT KELL (2026-08-21): a slug útvonal-paraméterből jön, és a Next
 * dekódolja — a `placeholder%2f..%2fvalodi-cikk` alak tehát `../`-ként ér ide,
 * és a `path.join` engedelmesen kilép a `content/blog` mappából. Ma nincs
 * máshol becsomagolt `.mdx`, ezért nem szivárgott adat, de a lehetőség valódi
 * volt. Két, egymástól független kapu:
 *
 *   1. alak- és hosszellenőrzés (a `/`, `.` és `\` szerkezetileg kizárva),
 *   2. `path.resolve` utáni prefix-vizsgálat — ez akkor is tart, ha a minta
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
  const rt = readingTime(content);
  const minutes = Math.ceil(rt.minutes);
  const locale = (data.locale ?? "hu") as "hu" | "en";

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    publishedAt: data.publishedAt as string,
    locale,
    translationSlug: data.translationSlug as string | undefined,
    tags: (data.tags ?? []) as string[],
    readingTime: locale === "hu" ? `${minutes} perc` : `${minutes} min read`,
    readingMinutes: minutes,
    heroQuote: data.heroQuote as string | undefined,
    startHere: data.startHere as number | undefined,
    status: (data.status === "draft" ? "draft" : "published") as "draft" | "published",
    artSeed: data.artSeed as number | undefined,
    artMotif: isLegacyBlogArtMotif(data.artMotif) ? data.artMotif : undefined,
    artFamily: isBlogArtFamily(data.artFamily) ? data.artFamily : undefined,
    artConcept: isBlogArtConcept(data.artConcept) ? data.artConcept : undefined,
    content,
  };
}

// ─── TOC-segédek ─────────────────────────────────────────────────────────────
// A h2 fejezetcímek id-ját a TOC-nak és az MDX h2-komponensnek UGYANÍGY kell
// képeznie — ez a közös forrás.

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
