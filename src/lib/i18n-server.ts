import { cookies } from "next/headers";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("trita_locale")?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);
  return DEFAULT_LOCALE;
}
