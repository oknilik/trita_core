"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { SectionCta } from "@/components/results/SectionCta";

// A kereslet-mérés ELSŐ foka: az ajánló a riport-oldal alján.
//
// Ugyanaz a `SectionCta`, mint a többi átvezetőnél — szándékosan: a
// felhasználó ne érezze külön reklám-sávnak. A különbség csak annyi, hogy a
// szöveg kimondja, hogy készülő funkcióról van szó, és hogy a megjelenést
// rögzítjük.
//
// Miért mérjük a megjelenést is: nevező nélkül a kattintás-szám olvashatatlan
// — nem tudnánk, hogy 10 kattintás sok-e vagy kevés. A rögzítés idempotens
// (felhasználónként egy sor) és nem blokkol: ha elhasal, a felhasználó ebből
// semmit nem vesz észre.

export function CareerPlusCta() {
  const { locale } = useLocale();
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void fetch("/api/career/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "cta_view" }),
    }).catch(() => {});
  }, []);

  return (
    <SectionCta
      eyebrow={t("results.careerPlusCtaEyebrow", locale)}
      title={t("results.careerPlusCtaTitle", locale)}
      body={t("results.careerPlusCtaBody", locale)}
      cta={t("results.careerPlusCtaButton", locale)}
      href="/career"
      motif="compass"
    />
  );
}
