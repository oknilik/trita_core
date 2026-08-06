// i18n mag — típusok, deep merge, feloldó és fordító-gyár.
//
// Miért külön fájl: a szótár DOMÉNENKÉNT szeletelhető legyen. A teljes
// szótár (index.ts) 436 KB forrás, aminek a nagyját az org/results/assessment
// adja — egy marketing-oldalnak ezekre nincs szüksége. Mivel az index.ts
// modul-szinten fésül össze mindent, bármelyik KLIENS-komponens t()-hívása
// az egész gráfot behúzta a bundle-be (mérve: 110 KB a landing kezdő JS-ében).
// A mag kiemelésével a publikus fa saját, szűk szótárat kap (public.ts), a
// hívási helyek API-ja (t/tf) változatlanul.

export type Locale = "hu" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["hu", "en"];
export const DEFAULT_LOCALE: Locale = "hu";

export type LocaleRecord = Record<Locale, string>;
export type TranslationNode = Record<string, unknown>;

function isLeafRecord(value: unknown): boolean {
  return value != null && typeof value === "object" && "hu" in (value as object);
}

// MÉLY összefésülés — a korábbi sekély spread a top-level névtér-ütközésnél
// (pl. results.ts és org.ts egyaránt definiált `dashboard` blokkot) a teljes
// korábbi blokkot ELDOBTA: ~80 dashboard.* kulcs tűnt el, a felületen nyers
// kulcsnevek jelentek meg (feedback form, journey-kártyák). A deep merge a
// levél-rekordokat ({hu, en}) egyben tartja, a névtereket összefésüli.
export function deepMergeTranslations(
  target: TranslationNode,
  source: TranslationNode,
): TranslationNode {
  for (const key of Object.keys(source)) {
    const incoming = source[key];
    const existing = target[key];
    if (
      incoming != null &&
      typeof incoming === "object" &&
      !isLeafRecord(incoming) &&
      existing != null &&
      typeof existing === "object" &&
      !isLeafRecord(existing)
    ) {
      deepMergeTranslations(existing as TranslationNode, incoming as TranslationNode);
    } else {
      target[key] = incoming;
    }
  }
  return target;
}

export function mergeDomains(domains: unknown[]): TranslationNode {
  return domains.reduce<TranslationNode>(
    (merged, domain) => deepMergeTranslations(merged, domain as TranslationNode),
    {},
  );
}

function resolvePath(obj: unknown, path: string[]): LocaleRecord | undefined {
  let current: unknown = obj;
  for (const segment of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (
    current != null &&
    typeof current === "object" &&
    "hu" in (current as object)
  ) {
    return current as LocaleRecord;
  }
  return undefined;
}

export interface Translator {
  t: (key: string, locale: Locale) => string;
  tf: (key: string, locale: Locale, vars: Record<string, string | number>) => string;
}

/** Fordító-pár egy adott szótárhoz. A hiányzó kulcs a kulcsot adja vissza. */
export function createTranslator(dictionary: TranslationNode): Translator {
  const t = (key: string, locale: Locale): string => {
    const record = resolvePath(dictionary, key.split("."));
    if (!record) return key;
    return record[locale] ?? record[DEFAULT_LOCALE] ?? key;
  };

  const tf = (
    key: string,
    locale: Locale,
    vars: Record<string, string | number>,
  ): string => {
    let text = t(key, locale);
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
    return text;
  };

  return { t, tf };
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  if (value === "hu") return "hu";
  if (value.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}
