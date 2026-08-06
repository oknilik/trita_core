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

/**
 * AI-keresők és válaszmotorok crawlerei.
 *
 * MIÉRT KÜLÖN SZABÁLY, ha a `*` amúgy is engedi őket: mert ezek a botok
 * jellemzően NEM a `*` blokkot olvassák, ha találnak saját nevükre szólót, és
 * több üzemeltető alapból tiltja őket — így az „engedélyezettség" ma nem
 * evidencia, hanem szándéknyilatkozat. Kimondva egyértelmű, hogy a publikus
 * marketing-tartalom idézhető; a bejelentkezés mögötti és token-alapú
 * felületek (személyes eredmények, observer-linkek) viszont NEM.
 *
 * A lista két csoportja szándékosan MÁS:
 *
 * • KERESÉS/IDÉZÉS (OAI-SearchBot, ChatGPT-User, PerplexityBot,
 *   Perplexity-User, Claude-User, Claude-SearchBot, Google-Extended,
 *   Applebot-Extended, Bingbot, DuckDuckBot) — ezek egy KONKRÉT felhasználói
 *   kérdésre keresnek forrást, és HIVATKOZNAK ránk. Ez az AI-keresőoptimalizálás
 *   értelme: a magyar nyelvű „mi az a HEXACO?" / „csapatdiagnosztika" típusú
 *   kérdéseknél mi legyünk az idézett forrás. Ezeket ENGEDJÜK.
 *
 * • TANÍTÓADAT-GYŰJTÉS (GPTBot, ClaudeBot, CCBot, meta-externalagent,
 *   Bytespider) — modell-tréninghez másolják le a tartalmat, hivatkozás és
 *   látogató nélkül. Ezt is engedjük: a publikus tartalmunk célja pont az,
 *   hogy a modellek ismerjék a fogalmainkat és a márkát — de a privát
 *   felületek itt is tiltottak maradnak.
 *
 * Ha később üzleti döntés lesz a tanítóadat-gyűjtés tiltása, elég a
 * `TRAINING_CRAWLERS` tömböt `disallow: "/"`-ra állítani — a kereső/idéző
 * botok engedélye ettől függetlenül megmarad.
 */
const AI_SEARCH_CRAWLERS = [
  // OpenAI
  "OAI-SearchBot",
  "ChatGPT-User",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Anthropic
  "Claude-User",
  "Claude-SearchBot",
  // Google AI (Gemini / AI Overviews külön user-agentje)
  "Google-Extended",
  // Apple Intelligence
  "Applebot-Extended",
  // Microsoft Copilot alapja
  "Bingbot",
  "DuckDuckBot",
];

const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
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
      {
        userAgent: AI_SEARCH_CRAWLERS,
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: TRAINING_CRAWLERS,
        allow: PUBLIC_PATHS,
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
