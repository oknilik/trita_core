/**
 * Schema.org strukturált adat (JSON-LD) építők.
 *
 * MIÉRT KÜLÖN RÉTEG: a strukturált adat két, egyre fontosabb fogyasztónak
 * szól, és mindkettőnek MÁS kell:
 *
 * 1. Klasszikus kereső (Google/Bing) — rich result jogosultság: FAQ, Article,
 *    Breadcrumb, ItemList.
 * 2. AI-keresők és válaszmotorok (ChatGPT Search, Perplexity, Google AI
 *    Overviews, Claude) — ezek NEM „rangsorolnak", hanem IDÉZNEK. Ami
 *    idézhetővé tesz: (a) explicit entitás-azonosság (`@id` horgonyok, hogy a
 *    trita EGY entitás legyen a gráfban, ne oldalanként új), (b) gépi
 *    olvasásra kész, tényszerű állítás-párok (kérdés → rövid, önmagában is
 *    megálló válasz), (c) a hatókör/nyelv/terület explicit jelölése
 *    (`inLanguage`, `areaServed`) — magyar piacon ez dönti el, hogy egy
 *    magyar nyelvű kérdésre relevánsnak minősülünk-e.
 *
 * KONVENCIÓ: minden builder TISZTA függvény (nincs I/O, nincs `Date.now()`),
 * hogy unit-teszttel őrizhető legyen. A megjelenítést a `components/seo/JsonLd`
 * végzi.
 *
 * TILOS ide: bármilyen nem igaz vagy nem ellenőrizhető állítás (aggregateRating,
 * review, díjak, ügyfélszám). A hamis strukturált adat manuális büntetést hoz,
 * és az AI-válaszokban is visszaköszön — a hitelesség a termék alapelve.
 */

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/core";
import {
  BRAND_LOGO_PATH,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
  getAbsoluteUrl,
  getSiteUrl,
} from "@/lib/seo";

/** Publikus kapcsolati cím — ugyanaz, ami a /contact oldalon is látszik. */
export const CONTACT_EMAIL = "hello@trita.io";

/** A márka megjelenített neve a strukturált adatban (a logó kisbetűs). */
export const ORGANIZATION_NAME = "trita";

/** BCP-47 nyelvi címkék a belső `Locale` értékekhez (schema.org `inLanguage`). */
export const BCP47_LOCALES: Record<Locale, string> = {
  hu: "hu-HU",
  en: "en-US",
};

export type JsonLdObject = Record<string, unknown>;

// ── Entitás-horgonyok ───────────────────────────────────────────────────────
// Az `@id` a legfontosabb — és leggyakrabban kihagyott — mező. Nélküle minden
// oldal SAJÁT, névazonos Organization-t hirdet, és a gráfban N darab „trita"
// keletkezik egy helyett. A horgonyokkal minden oldal UGYANARRA az entitásra
// hivatkozik, így az állítások (mit csinál, milyen nyelven, hol) összeadódnak.

export function organizationId(): string {
  return `${getSiteUrl()}/#organization`;
}

export function webSiteId(): string {
  return `${getSiteUrl()}/#website`;
}

export function webPageId(path: string): string {
  return `${getAbsoluteUrl(path)}#webpage`;
}

// ── Alap-entitások ──────────────────────────────────────────────────────────

/**
 * NYELVEZET: a modellt NEM márkanévvel („HEXACO-alapú") kommunikáljuk, hanem
 * azzal, amit a látogató megért: hat személyiségdimenzió. Ahol modellnevet
 * kell mondani, ott „hatfaktoros személyiségmodell". A HEXACO megnevezés a
 * módszertani/irodalmi hivatkozásokban marad (results.ts hivatkozás-jegyzet,
 * `docs/product/tsfi-item-provenance.md`, `/llms.txt` módszertani sora) – ott
 * hitelesít, a marketing-szövegben viszont csak zajt visz.
 */
const ORG_DESCRIPTION: Record<Locale, string> = {
  hu: "A trita csapatintelligencia-platform: egyéni profilokból, csapatszerepekből, 360°-os visszajelzésből és közös mérésekből tanácsadó által értelmezett csapatképet készít.",
  en: "trita is a team intelligence platform that combines individual profiles, team roles, 360° feedback, and shared measures into a consultant-interpreted team picture.",
};

/**
 * `knowsAbout` – az entitás szakterületei.
 *
 * Ez a mező az AI-keresőknek szól: a témakör-egyezés alapján dől el, hogy egy
 * magyar nyelvű kérdésnél („milyen személyiségteszt van magyarul csapatra?")
 * a modell releváns forrásnak tekint-e minket. A címkék MAGYARUL is szerepelnek,
 * mert a magyar nyelvű lekérdezéseket magyar tokenek fedik le.
 */
const ORG_KNOWS_ABOUT: Record<Locale, string[]> = {
  // Sorrend: csapat-első (2026-09-05). A lista a márka SZAKTERÜLETEIT
  // mondja, nem a főoldal keresési szándékát — a főoldal maradhat az egyéni
  // teszt belépője, az entitás mégis csapatintelligencia-platformként áll.
  hu: [
    "csapatintelligencia",
    "csapatdiagnosztika",
    "csapatdinamika",
    "csapatszerepek",
    "pszichológiai biztonság",
    "bizalmi háló csapatban",
    "360 fokos visszajelzés",
    "csapatfejlesztés",
    "szervezetfejlesztés",
    "vezetőfejlesztés",
    "hatfaktoros személyiségmodell",
    "személyiségteszt",
    "munkahelyi személyiségfelmérés",
    "pszichometria",
  ],
  en: [
    "team intelligence",
    "team diagnostics",
    "team dynamics",
    "team roles",
    "psychological safety",
    "trust network in teams",
    "360-degree feedback",
    "team development",
    "organizational development",
    "leadership development",
    "six-factor personality model",
    "personality assessment",
    "workplace psychometrics",
    "psychometrics",
  ],
};

/**
 * Organization – a márka-entitás.
 *
 * `areaServed: HU` + `availableLanguage` – a magyar piacra hegyezés explicit
 * jelzése. Nélküle a modellnek a szövegből kell kikövetkeztetnie, hogy magyar
 * ügyfeleket szolgálunk ki; ez a két mező kimondja.
 */
export function buildOrganizationJsonLd(locale: Locale = DEFAULT_LOCALE): JsonLdObject {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: ORGANIZATION_NAME,
    alternateName: SITE_NAME,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}${BRAND_LOGO_PATH}`,
      contentUrl: `${siteUrl}${BRAND_LOGO_PATH}`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`,
    description: ORG_DESCRIPTION[locale],
    email: CONTACT_EMAIL,
    knowsAbout: ORG_KNOWS_ABOUT[locale],
    areaServed: [
      { "@type": "Country", name: "Hungary" },
      { "@type": "Country", name: "Magyarország" },
    ],
    availableLanguage: [
      { "@type": "Language", name: "Hungarian", alternateName: "hu" },
      { "@type": "Language", name: "English", alternateName: "en" },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        url: `${siteUrl}/contact`,
        availableLanguage: ["hu", "en"],
        areaServed: "HU",
      },
    ],
  };
}

/** WebSite – a publikus site-entitás, az Organization-höz kötve. */
export function buildWebSiteJsonLd(locale: Locale = DEFAULT_LOCALE): JsonLdObject {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": webSiteId(),
    name: ORGANIZATION_NAME,
    alternateName: SITE_NAME,
    url: siteUrl,
    description: ORG_DESCRIPTION[locale],
    inLanguage: [BCP47_LOCALES.hu, BCP47_LOCALES.en],
    publisher: { "@id": organizationId() },
  };
}

// ── Oldal-szintű entitások ──────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  /** Kanonikus útvonal, pl. "/blog". Az utolsó elemnél is kötelező. */
  path: string;
}

/**
 * BreadcrumbList – a hierarchia kimondása.
 *
 * A crawler a linkstruktúrából csak sejti, hogy a `/blog/<slug>` a `/blog`
 * gyereke; a breadcrumb kimondja. AI-válaszokban ez adja a „hol vagyunk a
 * site-on" kontextust, a találati listán pedig a URL helyett morzsa látszik.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.path),
    })),
  };
}

export interface WebPageInput {
  path: string;
  title: string;
  description: string;
  locale?: Locale;
  breadcrumb?: BreadcrumbItem[];
  /** A lap fő témája – entitás-kapcsolat az AI-nak (pl. „csapatmintázat"). */
  about?: string | readonly string[];
  /** ISO dátum, ha a laphoz értelmezhető tartalmi frissítés tartozik. */
  dateModified?: string;
}

/**
 * WebPage – az oldal maga, a site-hoz és a márkához kötve.
 *
 * `primaryImageOfPage` és `isPartOf` nélkül minden lap „árva" csomópont; ezzel
 * a gráf bejárható, és egy AI-válasz a lapot a márkához tudja kötni.
 */
export function buildWebPageJsonLd(input: WebPageInput): JsonLdObject {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const url = getAbsoluteUrl(input.path);
  const about = input.about
    ? (Array.isArray(input.about) ? input.about : [input.about]).map((name) => ({
        "@type": "Thing",
        name,
      }))
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": webPageId(input.path),
    url,
    name: input.title,
    description: input.description,
    inLanguage: BCP47_LOCALES[locale],
    isPartOf: { "@id": webSiteId() },
    about,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`,
    },
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.breadcrumb?.length
      ? { breadcrumb: buildBreadcrumbJsonLd(input.breadcrumb) }
      : {}),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQPage – a legerősebb AI-idézhetőségi formátum.
 *
 * Egy válaszmotor kérdés–válasz párokat keres: a `Question` + `acceptedAnswer`
 * pontosan ez, előre kivonatolva, a mi megfogalmazásunkban. Ez az egyetlen
 * hely, ahol a saját szavainkkal írjuk le, mit válaszoljon rólunk egy modell.
 *
 * FELTÉTEL: a Q&A-nak LÁTHATÓNAK kell lennie az oldalon is (Google-irányelv) –
 * ezért a hívók a felületen már megjelenő szövegből építik, nem külön SEO-
 * szövegből.
 */
export function buildFaqJsonLd(
  items: FaqItem[],
  locale: Locale = DEFAULT_LOCALE,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: BCP47_LOCALES[locale],
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface ArticleInput {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  locale: Locale;
  keywords?: string[];
  /** Olvasási idő percben – ISO-8601 időtartammá alakítjuk. */
  readingMinutes?: number;
  wordCount?: number;
  /** Rovat (a tag-lista első eleme), pl. „csapatdinamika". */
  section?: string;
  /** Saját OG-kép útvonala, ha van; alapértelmezés a márka-kép. */
  imagePath?: string;
}

/**
 * Article – blogcikk.
 *
 * `wordCount` + `timeRequired` + `keywords`: a modellek ezekből becslik a
 * tartalom mélységét és témáját idézés előtt. `isAccessibleForFree: true`
 * kimondja, hogy nincs fizetőfal – a paywall-gyanús tartalmat több crawler
 * eleve kihagyja.
 */
export function buildArticleJsonLd(input: ArticleInput): JsonLdObject {
  const siteUrl = getSiteUrl();
  const url = getAbsoluteUrl(input.path);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: BCP47_LOCALES[input.locale],
    isAccessibleForFree: true,
    image: [`${siteUrl}${input.imagePath ?? DEFAULT_OG_IMAGE_PATH}`],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    author: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    ...(input.readingMinutes ? { timeRequired: `PT${input.readingMinutes}M` } : {}),
  };
}

export interface ServiceOffering {
  name: string;
  description: string;
}

/**
 * Service – a tanácsadás-vezérelt kínálat.
 *
 * Ár NINCS benne, és ez szándékos: a platformon kívül, egyedi ajánlattal
 * számlázunk. Kitalált `price` mező hamis strukturált adat lenne; helyette a
 * `hasOfferCatalog` sorolja fel, MIT tartalmaz a program – pont ezt idézi
 * vissza egy „mit csinál a trita?" típusú AI-válasz.
 */
export function buildServiceJsonLd(input: {
  name: string;
  description: string;
  serviceType: string;
  offerings: ServiceOffering[];
  catalogName: string;
  locale?: Locale;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: { "@id": organizationId() },
    areaServed: { "@type": "Country", name: "Hungary" },
    availableLanguage: ["hu", "en"],
    audience: { "@type": "BusinessAudience", name: "B2B" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: input.catalogName,
      itemListElement: input.offerings.map((offering) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: offering.name,
          description: offering.description,
        },
      })),
    },
  };
}

/**
 * WebApplication – az ingyenes önkitöltős felmérés (`/try`).
 *
 * A `price: 0` itt IGAZ állítás (az egyéni felmérés ingyenes), és pont ez a
 * megkülönböztető tény, amit egy „ingyenes személyiségteszt magyarul" kérdésre
 * adott AI-válasz keres.
 */
export function buildAssessmentAppJsonLd(input: {
  name: string;
  description: string;
  path: string;
  featureList: string[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: getAbsoluteUrl(input.path),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "JavaScript",
    inLanguage: [BCP47_LOCALES.hu, BCP47_LOCALES.en],
    isAccessibleForFree: true,
    featureList: input.featureList,
    provider: { "@id": organizationId() },
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "HUF",
      availability: "https://schema.org/InStock",
    },
  };
}

export interface DefinedTermInput {
  name: string;
  description: string;
  /** Rövid azonosító a fogalom-készleten belül (pl. RIASEC-betű). */
  termCode?: string;
}

/**
 * DefinedTermSet – fogalom-magyarázó oldalak.
 *
 * FIGYELEM: jelenleg NINCS fogyasztója. Az egyetlen ilyen lap (/holland-kod)
 * 2026-08-07-én kikerült, mert a karrier-réteg fagyasztva van. A builder
 * szándékosan marad: általános SEO-segéd, teszttel együtt.
 *
 * Definíció-kérdésekre a válaszmotorok azt a forrást
 * idézik, amelyik a definíciót GÉPILEG olvasható formában adja. A prózában
 * elrejtett magyarázatot ki kell nyerni; ezt nem.
 */
export function buildDefinedTermSetJsonLd(input: {
  name: string;
  description: string;
  path: string;
  terms: DefinedTermInput[];
  locale?: Locale;
}): JsonLdObject {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const setId = `${getAbsoluteUrl(input.path)}#termset`;
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": setId,
    name: input.name,
    description: input.description,
    url: getAbsoluteUrl(input.path),
    inLanguage: BCP47_LOCALES[locale],
    hasDefinedTerm: input.terms.map((term) => ({
      "@type": "DefinedTerm",
      name: term.name,
      description: term.description,
      inDefinedTermSet: { "@id": setId },
      ...(term.termCode ? { termCode: term.termCode } : {}),
    })),
  };
}

export interface ItemListEntry {
  name: string;
  description: string;
  url?: string;
}

/**
 * ItemList – felsorolás-oldalak (16 csapatminta, cikklista).
 *
 * A „16 X" típusú tartalom listás kérdésekre a legidézhetőbb, DE csak akkor,
 * ha a lista tételei gépi formában is megvannak – egy kliens-oldali explorer
 * mögül a crawler nulla tételt lát.
 */
export function buildItemListJsonLd(input: {
  name: string;
  description: string;
  items: ItemListEntry[];
  locale?: Locale;
}): JsonLdObject {
  const locale = input.locale ?? DEFAULT_LOCALE;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    inLanguage: BCP47_LOCALES[locale],
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      description: item.description,
      ...(item.url ? { url: item.url } : {}),
    })),
  };
}

/** Blog (gyűjtő) – a cikklista-oldal entitása. */
export function buildBlogJsonLd(input: {
  name: string;
  description: string;
  path: string;
  posts: { title: string; description: string; path: string; datePublished: string }[];
  locale?: Locale;
}): JsonLdObject {
  const locale = input.locale ?? DEFAULT_LOCALE;
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${getAbsoluteUrl(input.path)}#blog`,
    name: input.name,
    description: input.description,
    url: getAbsoluteUrl(input.path),
    inLanguage: BCP47_LOCALES[locale],
    publisher: { "@id": organizationId() },
    isPartOf: { "@id": webSiteId() },
    blogPost: input.posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: getAbsoluteUrl(post.path),
      datePublished: post.datePublished,
      author: { "@id": organizationId() },
    })),
  };
}

/** ContactPage – kapcsolat-lap; a márka elérhetőségét köti az oldalhoz. */
export function buildContactPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
  locale?: Locale;
}): JsonLdObject {
  const locale = input.locale ?? DEFAULT_LOCALE;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": webPageId(input.path),
    url: getAbsoluteUrl(input.path),
    name: input.title,
    description: input.description,
    inLanguage: BCP47_LOCALES[locale],
    isPartOf: { "@id": webSiteId() },
    about: { "@id": organizationId() },
    mainEntity: {
      "@type": "Organization",
      "@id": organizationId(),
      email: CONTACT_EMAIL,
    },
  };
}
