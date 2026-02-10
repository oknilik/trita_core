import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get("trita_locale")?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);
  const accept = headerStore.get("accept-language");
  return normalizeLocale(accept ?? DEFAULT_LOCALE);
}
