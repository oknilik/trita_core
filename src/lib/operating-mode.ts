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

// Self-riport paywall. false = mindenki a teljes egyéni riportot kapja
// (a getSelfAccessLevel mindenkinek self_plus szintet ad, az upsell/lock
// felületek maguktól eltűnnek, mert plus-szinthez kötöttek).
// VISSZAÁLLÍTÁS: állítsd true-ra — a Purchase/tagság-alapú szintlogika
// érintetlenül a helyén van, azonnal újra élesedik.
export const SELF_PAYWALL_ENABLED = false;
