import type { MetadataRoute } from "next";
import { getSiteUrl, getTranslatedLanguageAlternates } from "@/lib/seo";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

/**
 * A statikus marketing-oldalak tartalmi felülvizsgálatának dátuma.
 *
 * Szándékosan NEM `new Date()`: a build ideje minden deploynál változik, így a
 * `<lastmod>` minden oldalon „ma"-t mondana akkor is, ha a szöveghez hozzá sem
 * nyúltunk — a Google az ilyen sitemapek lastmod-ját megbízhatatlannak
 * tekinti és figyelmen kívül hagyja. Ezt a konstanst akkor bumpold, amikor a
 * marketing-oldalak tartalma érdemben változik.
 */
const CONTENT_REVIEWED_AT = new Date("2026-08-27T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const reviewedAt = CONTENT_REVIEWED_AT;
  const blogActive = isPortfolioSurfaceActive("blog");

  // Piszkozat nélkül (getAllPosts alapból kiszűri) — ami nincs kint, az nem
  // kerülhet a sitemapbe sem.
  const huPosts = blogActive ? getAllPosts("hu") : [];
  const enPosts = blogActive ? getAllPosts("en") : [];
  const posts = [...huPosts, ...enPosts];

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => {
    // A cikkeknek nyelvenként KÜLÖN URL-jük van (slug + translationSlug),
    // ezért itt valódi reciprok hreflang-pár képezhető.
    //
    // A `translationSlug` mezőt a `getAllPosts` listája NEM adja vissza (csak
    // a `getPostBySlug`), ezért cikkenként visszaolvassuk. Build-time fut, egy
    // tucat fájlról van szó — a plusz olvasás nem kerül semmibe.
    const translationSlug = getPostBySlug(post.slug)?.translationSlug;
    const otherLocale = post.locale === "hu" ? "en" : "hu";
    const languages = translationSlug
      ? getTranslatedLanguageAlternates({
          [post.locale]: `/blog/${post.slug}`,
          [otherLocale]: `/blog/${translationSlug}`,
        })
      : undefined;

    return {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(languages
        ? {
            alternates: {
              languages: Object.fromEntries(
                Object.entries(languages).map(([key, path]) => [key, `${baseUrl}${path}`]),
              ),
            },
          }
        : {}),
    };
  });

  // A bloglista frissessége a legfrissebb cikk dátuma (nem a build ideje, és
  // nem is a `reviewedAt`): ha `reviewedAt`-tel indítanánk a reduce-t, az
  // felső korlátként viselkedne, és a /blog lastmodja mindig a felülvizsgálat
  // napját mondaná akkor is, ha a lista hetek óta változatlan – pont az a
  // „megbízhatatlan lastmod", amit a fenti konstans elkerülni hivatott.
  const newestPostAt =
    posts.reduce<Date | null>((acc, post) => {
      const published = new Date(post.publishedAt);
      return acc === null || published > acc ? published : acc;
    }, null) ?? reviewedAt;

  return [
    { url: `${baseUrl}/`, lastModified: reviewedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/self-awareness`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/team-dynamics`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/how-we-work`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/try`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.9 },
    ...(isPortfolioSurfaceActive("patternExplorer")
      ? [{ url: `${baseUrl}/patterns`, lastModified: reviewedAt, changeFrequency: "monthly" as const, priority: 0.7 }]
      : []),
    { url: `${baseUrl}/pilot`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.6 },
    ...(blogActive
      ? [{ url: `${baseUrl}/blog`, lastModified: newestPostAt, changeFrequency: "weekly" as const, priority: 0.8 }]
      : []),
    ...blogUrls,
    {
      url: `${baseUrl}/privacy`,
      lastModified: reviewedAt,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    },
    { url: `${baseUrl}/legal`, lastModified: new Date("2026-08-29T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/legal/platform-terms`, lastModified: new Date("2026-08-29T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/legal/business-terms`, lastModified: new Date("2026-08-29T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/dpa`, lastModified: new Date("2026-08-29T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: reviewedAt, changeFrequency: "monthly", priority: 0.4 },
  ];
}
