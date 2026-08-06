"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import type { Locale } from "@/lib/i18n/public";

// Statikus cikk-oldalon a nyelvváltást kliens-oldalon követjük: ha a
// felület nyelve eltér a cikk nyelvétől és van fordítás-pár, átirányítunk
// rá (a korábbi cookie-alapú szerver-redirect a statikus renderrel nem fér
// össze).
export function TranslationRedirect({
  postLocale,
  translationSlug,
}: {
  postLocale: Locale;
  translationSlug?: string;
}) {
  const { locale } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (translationSlug && locale !== postLocale) {
      router.replace(`/blog/${translationSlug}`);
    }
  }, [locale, postLocale, translationSlug, router]);

  return null;
}
