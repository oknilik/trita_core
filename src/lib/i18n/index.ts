// TELJES szótár — minden domén összefésülve. Ezt használja a bejelentkezett
// app-fa (results, org, team, admin, assessment, observer…).
//
// A publikus (marketing) fa NEM ezt használja, hanem a szűkebb `./public`
// szótárat — a teljes szótár ~110 KB-tal terhelte a landing kezdő JS-ét.
// A típusok, a merge és a feloldó a `./core`-ban él, hogy a két szótár
// ugyanazon a viselkedésen osztozzon.

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  type Locale,
} from "./core";

import { createTranslator, mergeDomains } from "./core";

// ── Domain imports ──────────────────────────────────────────────────────────
import { commonTranslations } from "./common";
import { landingTranslations } from "./landing";
import { authTranslations } from "./auth";
import { assessmentTranslations } from "./assessment";
import { resultsTranslations } from "./results";
import { profileTranslations } from "./profile";
import { orgTranslations } from "./org";
import { notificationTranslations } from "./notifications";
import { fakeDoorTranslations } from "./fakedoor";
import { navigationTranslations } from "./navigation";
import { sharedLabelTranslations } from "./shared-labels";

// ── Merged dictionary ───────────────────────────────────────────────────────
const translations = mergeDomains([
  commonTranslations,
  landingTranslations,
  authTranslations,
  assessmentTranslations,
  resultsTranslations,
  profileTranslations,
  orgTranslations,
  notificationTranslations,
  fakeDoorTranslations,
  navigationTranslations,
  sharedLabelTranslations,
]);

// ── Public API ──────────────────────────────────────────────────────────────
const translator = createTranslator(translations);

export const t = translator.t;
export const tf = translator.tf;
