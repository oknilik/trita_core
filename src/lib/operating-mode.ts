// Platform működési mód — consulting-led vs. self-serve.
//
// Consulting-led (2026-07 üzleti modell): az ügyfél-szervezeteket a
// tanácsadó hozza létre és adminisztrálja (tagfelvétel, csapatba sorolás,
// kampányok); az org admin/manager felületek léteznek, de az értékesítési
// út a tanácsadón keresztül megy.
//
// VISSZAÁLLÍTÁS self-serve irányba: állítsd az OPERATING_MODE-ot
// "self_serve"-re — ettől a tanácsadói org-létrehozás (POST /api/org
// asConsultant ága, /org/new oldal, nav-linkje) eltűnik, minden más
// (admin/manager jogosultság-rendszer) változatlanul működik, mert a
// consulting-led mód csak ADDITÍV kapukat nyit.

export type OperatingMode = "consulting_led" | "self_serve";

export const OPERATING_MODE: OperatingMode = "consulting_led";

export function isConsultingLed(): boolean {
  return OPERATING_MODE === "consulting_led";
}

// Kérdőív-forma a kiszolgált flow-kban (self, try, observer, candidate).
// "short" = TSFI-S (60 item, ~10 perc) — a sima felhasználói út ezt kapja.
// "full" = teljes 100 itemes bank. KÉSŐBBI FUNKCIÓ: tanácsadói választás
// kampány-szinten (Campaign mezőként) — akkor ez a konstans lesz a default,
// és a kampány felülbírálhatja. A pontozás formától független (a teljes
// konfigból dolgozik, a meg nem válaszolt itemek nem számítanak).
export type { AssessmentForm } from "@/lib/questions/types";
export const DEFAULT_ASSESSMENT_FORM: "short" | "full" = "short";

// Self-riport paywall. false = mindenki a teljes egyéni riportot kapja
// (a getSelfAccessLevel mindenkinek self_plus szintet ad, az upsell/lock
// felületek maguktól eltűnnek, mert plus-szinthez kötöttek).
// VISSZAÁLLÍTÁS: állítsd true-ra — a Purchase/tagság-alapú szintlogika
// érintetlenül a helyén van, azonnal újra élesedik.
export const SELF_PAYWALL_ENABLED = false;

// Jelölt-flow kapu (2026-07-23, jelölt-flow újraélesztés). false = a
// jelölt-meghívás nem fogyaszt kreditet és nem előfizetés-függő
// (candidateEvaluate capability-t nem ellenőrizzük) — a hozzáférést a
// tanácsadói kör adja (isConsultantSurface: ORG_CONSULTANT / platform-
// tanácsadó / trita-admin). VISSZAÁLLÍTÁS: állítsd true-ra — a kredit- és
// capability-logika érintetlenül a helyén van, azonnal újra élesedik.
export const CANDIDATE_GATING_ENABLED = false;

export function isCandidateGatingEnabled(): boolean {
  return CANDIDATE_GATING_ENABLED;
}
