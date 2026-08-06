import type { Metadata } from "next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

/** Az OG-vocabulary locale-kódjai a belső `Locale` értékekhez. */
export const OG_LOCALES: Record<Locale, string> = {
  hu: "hu_HU",
  en: "en_US",
};

export const SITE_NAME = "trita";

/**
 * A gyökér `src/app/opengraph-image.tsx` route-ja (1200×630 PNG). Ez a
 * márka-alapértelmezett közösségi kép minden olyan publikus laphoz, amelynek
 * nincs saját, egy mappában lévő `opengraph-image.tsx`-e.
 */
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);

  return trimTrailingSlash(fromEnv ?? "https://trita.hu");
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}

export function getCanonicalPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAbsoluteUrl(path: string): string {
  return `${getSiteUrl()}${getCanonicalPath(path)}`;
}

/**
 * hreflang EGY URL-es, kliens-oldalon nyelvet váltó oldalakhoz.
 *
 * A marketing-fa minden lapja ugyanazon az URL-en szolgálja ki a HU és az EN
 * tartalmat (LocaleProvider, cookie/böngésző-nyelv alapján) — nincs `/en/…`
 * változat. Ilyenkor a `hu -> /x` + `en -> /x` pár önmagára mutató, nulla
 * információt hordozó annotáció lenne, ráadásul félrevezető: a prerenderelt
 * HTML `lang="hu"`, tehát a crawler számára az „ez az EN oldal" állítás nem
 * igaz. A Google által dokumentált helyes jelölés erre az esetre az
 * `x-default` önmagában: „ez az URL nincs egy nyelvre kihegyezve".
 * A második nyelv jelenlétét OG-oldalon az `alternateLocale` közli.
 */
export function getSharedUrlLanguageAlternates(path: string): Record<string, string> {
  return { "x-default": getCanonicalPath(path) };
}

/**
 * hreflang VALÓDI, nyelvenként külön URL-lel bíró tartalomhoz (blogcikkek:
 * minden poszt saját slug + `translationSlug` a nyelvi párjára). Itt a
 * reciprok hu/en annotációnak van értelme; az `x-default` az alapértelmezett
 * nyelvű (HU) változatra mutat, ha az létezik.
 */
export function getTranslatedLanguageAlternates(entries: Partial<Record<Locale, string>>): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    const value = entries[locale];
    if (value) languages[locale] = getCanonicalPath(value);
  }
  const fallback = entries[DEFAULT_LOCALE] ?? Object.values(entries).find(Boolean);
  if (fallback) languages["x-default"] = getCanonicalPath(fallback);
  return languages;
}

/**
 * Meta-description hosszra vágása MONDATHATÁRON.
 *
 * Néhány oldal leírása egy hosszabb bevezető bekezdésből jön (i18n-kulcs,
 * ami a felületen is meg kell jelenjen) — a keresők ~155-165 karakternél
 * levágják. Itt az utolsó, még beleférő mondatvégnél vágunk, hogy a snippet
 * teljes mondat maradjon; ha nincs mondathatár, szóhatáron vágunk `…`-tal.
 * Nyelvfüggetlen, így HU és EN kulcson egyaránt működik.
 */
export function clampMetaDescription(text: string, max = 165): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;

  const head = normalized.slice(0, max);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentenceEnd > max * 0.5) return head.slice(0, sentenceEnd + 1).trim();

  const wordEnd = head.lastIndexOf(" ");
  return `${(wordEnd > 0 ? head.slice(0, wordEnd) : head).trim()}…`;
}

/**
 * Márka-utótag hozzáfűzése a `<title>`-höz CSAK akkor, ha belefér.
 *
 * A blogcikkek címe önmagában is 60-90 karakter; a fix „| trita blog" utótag
 * ilyenkor csak annyit ér el, hogy a kereső a találati listán elvágja a
 * címet — a márkanév pedig pont a levágott végén van. Ha nem fér bele, a
 * cikk saját címe marad (a márkát a `og:site_name` így is közli).
 */
export function appendSiteSuffix(title: string, suffix: string, max = 60): string {
  const combined = `${title} | ${suffix}`;
  return combined.length <= max ? combined : title;
}

export interface PageSeoInput {
  /** Kanonikus útvonal, pl. "/pricing". */
  path: string;
  /** `<title>` — egyedi, ~60 karakter alatt. */
  title: string;
  /** `<meta name="description">` — egyedi, ~150-160 karakter. */
  description: string;
  /** Ha az OG-cím eltér a `<title>`-től (pl. a "| trita" utótag nélkül). */
  ogTitle?: string;
  /** Ha az OG-leírás rövidebb/ütősebb a meta-description-nél. */
  ogDescription?: string;
  type?: "website" | "article";
  /** Csak `type: "article"` esetén. */
  publishedTime?: string;
  /** Csak `type: "article"` esetén. */
  modifiedTime?: string;
  /** A tartalom elsődleges nyelve (default: HU). */
  locale?: Locale;
  /** Több nyelvű URL-eknél az `alternates.languages` felülírása. */
  languages?: Record<string, string>;
  /**
   * OG-kép útvonala. Alapértelmezés: a gyökér `/opengraph-image` route.
   * `null` = ne állítsuk be — ezt CSAK az a szegmens használja, amelyiknek
   * SAJÁT, egy mappában lévő `opengraph-image.tsx`-e van (blogcikkek), mert
   * ott a fájl-konvenció adja a képet, és a kézi beállítás duplázna.
   */
  ogImage?: string | null;
}

/**
 * Egységes metadata-építő a publikus (indexelhető) oldalakhoz.
 *
 * Amit garantál minden oldalon: egyedi title + description, kanonikus URL,
 * teljes openGraph (title/description/url/type/locale/siteName) és
 * twitter summary_large_image kártya.
 *
 * og:image — FONTOS: a fájl-konvenciós `opengraph-image.tsx` NEM öröklődik
 * lefelé abba a szegmensbe, amelyik saját `openGraph`-ot exportál: a Next a
 * metadata-objektumokat szegmensenként FELÜLÍRJA (nem mélyen mergeli), és a
 * fájl-konvenciós képet a saját szegmense metadata-jába teszi. Ezért a gyökér
 * `src/app/opengraph-image.tsx` képe kimaradt minden olyan lapról, amelyik
 * `openGraph`-ot ad meg (/pricing, /blog, /privacy, /contact, /pilot,
 * /holland-kod, /patterns) — a `summary_large_image` twitter-kártya kép
 * nélkül maradt. Itt ezért explicit beállítjuk a gyökér-képet; ahol a
 * szegmensnek SAJÁT `opengraph-image.tsx`-e van (blogcikkek), a hívó
 * `ogImage: null`-t ad, és a fájl-konvenció marad az egyetlen forrás.
 */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const canonical = getCanonicalPath(input.path);
  const locale = input.locale ?? DEFAULT_LOCALE;
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;
  const alternateLocales = SUPPORTED_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]);

  const ogImage = input.ogImage === undefined ? DEFAULT_OG_IMAGE_PATH : input.ogImage;

  const sharedOg = {
    title: ogTitle,
    description: ogDescription,
    url: canonical,
    siteName: SITE_NAME,
    locale: OG_LOCALES[locale],
    alternateLocale: alternateLocales,
    ...(ogImage
      ? { images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }] }
      : {}),
  };

  const openGraph: Metadata["openGraph"] =
    input.type === "article"
      ? {
          ...sharedOg,
          type: "article",
          ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
          ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
        }
      : { ...sharedOg, type: "website" };

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: input.languages ?? getSharedUrlLanguageAlternates(canonical),
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}
