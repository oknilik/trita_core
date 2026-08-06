import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/**
 * Indexelhető publikus felületek. Együtt kell mozogniuk a `sitemap.ts`
 * bejegyzéseivel: ami itt tiltott, az nem kerülhet a sitemapbe.
 * (A `/founding` szándékosan hiányzik a sitemapből: az csak 307-es
 * átirányítás a `/pilot`-ra, de bejárhatónak kell maradnia, hogy a
 * kereső követni tudja az átirányítást.)
 */
const PUBLIC_PATHS = [
  "/",
  "/blog",
  "/contact",
  "/founding",
  "/holland-kod",
  "/patterns",
  "/pilot",
  "/pricing",
  "/privacy",
  "/try",
];

/**
 * Bejelentkezés mögötti / token-alapú / tranzakciós felületek. Ezeknek nincs
 * kereső-értékük, több közülük személyes adatot jelenít meg.
 * Megjegyzés: a `/try/claim` és `/try/complete` hosszabb (specifikusabb)
 * szabály, mint a `/try` allow — a Googlebot a leghosszabb egyezést
 * alkalmazza, így a lead-magnet `/try` indexelhető marad, a flow belseje nem.
 */
const PRIVATE_PATHS = [
  "/admin",
  "/advisory",
  "/api/",
  "/apply/",
  "/assessment",
  "/assessment-layers",
  "/career",
  "/dashboard",
  "/email-preferences",
  "/hiring/",
  "/interaction",
  "/join/",
  "/manager",
  "/observe/",
  "/onboarding",
  "/org",
  "/profile",
  "/share/",
  "/sign-in",
  "/sign-out",
  "/sign-up",
  "/tasks",
  "/team",
  "/try/claim",
  "/try/complete",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  // Preview/dev deploy: SEMMI nem indexelhető — a preview-URL-ek nem
  // versenyezhetnek az éles domainnel. (Ettől mutat a PSI a previewn
  // „is-crawlable" bukást; éles domainen ez az ág nem fut le.)
  if (process.env.VERCEL_ENV !== "production") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
