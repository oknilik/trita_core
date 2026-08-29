// PUBLIKUS szótár — a marketing-fa (landing, blog, contact, pricing, pilot,
// privacy) és a közös publikus króm (fejléc, lábléc, nyelvváltó, értesítés-
// panel) kliens-komponenseinek.
//
// MIÉRT: az index.ts modul-szinten fésüli össze mind a 10 domént (436 KB
// forrás), amiből az org.ts + results.ts + assessment.ts önmagában 307 KB —
// ezekre egy marketing-oldalnak semmi szüksége. Mivel a merge modul-szintű,
// bármelyik kliens-komponens t()-hívása az EGÉSZ gráfot behúzta: a landing
// kezdő JS-ének legnagyobb egyetlen tétele egy 110 KB-os chunk volt a teljes
// app-szótárral (mérve Lighthouse network-records-ból).
//
// HASZNÁLAT: publikus KLIENS-komponensben `@/lib/i18n/public`, mindenhol
// máshol `@/lib/i18n`. A t/tf API azonos — csak a mögötte lévő szótár szűkebb.
//
// ŐRZÉS: tests/unit/i18n/public-dictionary.test.ts elbukik, ha egy publikus
// kliens-fájl olyan kulcsot használ, amit ez a szótár nem old fel (HU+EN).
// Új publikus felület új doménnel: vedd fel ide a domain-importot is.

import { commonTranslations } from "./common";
import { landingTranslations } from "./landing";
import { authTranslations } from "./auth";
import { profileTranslations } from "./profile";
import { notificationTranslations } from "./notifications";
import { navigationTranslations } from "./navigation";
import { sharedLabelTranslations } from "./shared-labels";
import { legalTranslations } from "./legal";
import { createTranslator, mergeDomains } from "./core";

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  type Locale,
} from "./core";

export const PUBLIC_TRANSLATION_DOMAINS = [
  commonTranslations,
  landingTranslations,
  authTranslations,
  profileTranslations,
  notificationTranslations,
  navigationTranslations,
  sharedLabelTranslations,
  legalTranslations,
];

const publicTranslations = mergeDomains(PUBLIC_TRANSLATION_DOMAINS);

const translator = createTranslator(publicTranslations);

export const t = translator.t;
export const tf = translator.tf;
