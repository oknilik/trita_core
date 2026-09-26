import type { PersonalRule } from "./rules";
import type { Locale } from "@/lib/i18n/core";

export const FOLLOWUP_COPY: Record<PersonalRule | "REFLECTION", Record<Locale, { title: string; body: string; cta: string }>> = {
  START_SELF: {
    hu: { title: "Ismerd meg a saját működésedet", body: "A trita önértékelése segít átgondolni, hogyan működsz a mindennapokban. Amikor alkalmas, elkezdheted a kérdőívet; a válaszaidat menet közben mentjük.", cta: "Elkezdem az önértékelést" },
    en: { title: "Explore how you work", body: "The trita self-assessment helps you reflect on how you work day to day. Start whenever it suits you; your answers are saved as you go.", cta: "Start my self-assessment" },
  },
  RESUME_SELF: {
    hu: { title: "Folytathatod a megkezdett önértékelésedet", body: "A korábban mentett válaszaid megvannak. Amikor alkalmas, folytathatod a kérdőívet, és elkészülhet a személyes eredményed.", cta: "Folytatom a kitöltést" },
    en: { title: "Continue your self-assessment", body: "Your saved answers are still here. Continue whenever it suits you to receive your personal results.", cta: "Continue my assessment" },
  },
  INVITE_FIRST_OBSERVERS: {
    hu: { title: "Mit látnak belőled azok, akikkel együtt dolgozol?", body: "Elkészült a saját trita-eredményed. Ha szeretnéd, most kollégáktól is kérhetsz visszajelzést, és összevetheted a saját képedet az ő tapasztalataikkal. Válassz olyanokat, akik ismerik a mindennapi munkádat.", cta: "Visszajelzést kérek" },
    en: { title: "How do the people you work with see you?", body: "Your personal trita results are ready. If you like, ask colleagues for feedback and compare your own perspective with their experience. Choose people who know your day-to-day work.", cta: "Ask for feedback" },
  },
  REFLECTION: {
    hu: { title: "Egy hét telt el – mit láttál magadból?", body: "Gondolj vissza az elmúlt hét egy közös munkájára. Mit ismertél fel a saját működésedből? A páros összehasonlításban tovább vizsgálhatod, hogyan működtök együtt.", cta: "Megnézem az összehasonlítást" },
    en: { title: "A week has passed – what did you notice?", body: "Think back to a time you worked with someone this week. What did you recognise about how you work? Explore working together further with the pair comparison.", cta: "Explore the comparison" },
  },
};

export const REASONS: Record<string, string> = {
  READY: "Küldhető", NOT_DUE: "Még nem esedékes", COMPLETED: "Teljesült", EXPIRED: "Lejárt",
  DISMISSED: "Kihagyva", SNOOZED: "Elhalasztva", INELIGIBLE: "Már nem aktuális",
  EMAIL_OPTED_OUT: "Leiratkozott az utánkövető levelekről", EMAIL_UNVERIFIED: "A cím hitelesítése még nincs szinkronizálva",
  EMAIL_MISSING: "Nincs emailcím", EMAIL_SUPPRESSED: "A cím kézbesítési hiba vagy panasz miatt kizárt",
  CONTACT_COOLDOWN: "Várakozás a korábbi emlékeztető után", CONTACT_LIMIT: "Elérte a 30 napos levélkeretet",
  SEQUENCE_LIMIT: "Már megkapta mindkét emlékeztetőt", DELIVERY_EXISTS: "A küldési kísérlet már naplózva van",
  MODE_DISABLED: "Ebben az üzemmódban nincs küldés", OUTSIDE_COHORT: "Az automatikus körön kívül van",
  OUTSIDE_ALLOWLIST: "A próbakör címzettlistáján kívül van", ACCOUNT_UNAVAILABLE: "A fiók nem elérhető",
  EXCLUDED_ACCOUNT: "Admin vagy tanácsadói fiók", MANAGED_JOURNEY: "Szervezeti vagy kampányfolyamat",
  ASSESSMENT_SKIPPED: "Tudatosan kihagyott önértékelés", ONBOARDING_INCOMPLETE: "Az alapbeállítások hiányoznak",
};
