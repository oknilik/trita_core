"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";

/**
 * A `<title>` / meta description / og:* kliens-oldali nyelv-szinkronja.
 *
 * A marketing-fa lapjai statikusan, a DEFAULT_LOCALE-lal prerenderelődnek
 * (a metadata szándékosan nem olvas sütit — az az egész fát dinamikussá
 * tenné). A tartalom nyelvét viszont a LocaleProvider a kliensen váltja,
 * így EN nézetben a `<title>` eddig magyar maradt (P0-3). Ez a komponens a
 * ténylegesen renderelt nyelvhez igazítja a fej-elemeket; a `<html lang>`-ot
 * a LocaleProvider már kezeli. Nem renderel semmit, a prerendert nem töri.
 */
export function LocalizedPageMeta({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    const title = t(titleKey, locale);
    const description = t(descriptionKey, locale);

    document.title = title;
    const set = (selector: string, value: string) => {
      document.querySelector(selector)?.setAttribute("content", value);
    };
    set('meta[name="description"]', description);
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', description);
    set('meta[name="twitter:title"]', title);
    set('meta[name="twitter:description"]', description);
  }, [titleKey, descriptionKey, locale]);

  return null;
}
