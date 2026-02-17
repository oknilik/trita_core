import { SUPPORTED_LOCALES } from "@/lib/i18n";

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

export function getLanguageAlternates(path: string): Record<string, string> {
  const canonicalPath = getCanonicalPath(path);
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = canonicalPath;
  }
  languages["x-default"] = canonicalPath;
  return languages;
}
