"use client";

import type { AnalyticsEventName, AnalyticsEventProps } from "@/lib/analytics/events";

/**
 * KLIENS-OLDALI eseményküldés — nulla függőség, ~1 kB.
 *
 * MIÉRT SAJÁT VÉGPONT (`/api/e`) ÉS NEM KÜLSŐ SCRIPT:
 * - a marketing-fa JS-fogyókúrája megmarad (ld. next.config.ts érvelését),
 * - az azonos eredetű (same-origin) kérést az ad-blockerek nem szűrik,
 * - a CSP szűk maradhat (`connect-src 'self'`),
 * - a látogató IP-je nem jut ki harmadik félhez, mert nincs harmadik fél.
 *
 * MŰKÖDÉS: az események sorba állnak, és `navigator.sendBeacon`-nal mennek ki
 * kötegelve — ez akkor is kézbesít, ha a felhasználó közben elnavigál (a
 * `fetch` ilyenkor megszakadna, és pont a tölcsér VÉGÉT veszítenénk el).
 *
 * SOHA nem dob kivételt, és soha nem blokkol renderelést.
 */

const ENDPOINT = "/api/e";
/** Ennyi esemény után azonnal ürítünk (nem várunk a lapelhagyásra). */
const FLUSH_THRESHOLD = 8;
/** Tétlenségi ürítés — így a hosszú munkamenet sem gyűlik egy csomóba. */
const FLUSH_DEBOUNCE_MS = 4000;
/** Egy kérésben legfeljebb ennyi esemény (a szerver is ennyit fogad). */
const MAX_BATCH = 20;

interface QueuedEvent {
  name: string;
  props?: Record<string, unknown>;
  /** A lap útvonala a küldés pillanatában (a szerver normalizálja). */
  path?: string;
  /** `document.referrer` — a szerver AZONNAL hostra redukálja. */
  ref?: string;
  /** Kliens-oldali időbélyeg — sorrendhez; a szerver a sajátját is rögzíti. */
  ts: number;
}

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

/**
 * Tiszteletben tartjuk a böngésző nyomkövetés-tiltó jelzését.
 *
 * A GPC (Global Privacy Control) egyes joghatóságokban kötelező erejű; a DNT
 * nem az, de a termék pozicionálásával összhangban azt is tiszteljük. A
 * veszteség pár százalék, a cserébe kapott állítás („ha nemet mondasz, nem
 * mérünk") viszont ellenőrizhető és igaz.
 */
function isTrackingRefused(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  if (nav.globalPrivacyControl === true) return true;
  if (nav.doNotTrack === "1" || nav.msDoNotTrack === "1") return true;
  return false;
}

function send(batch: QueuedEvent[]): void {
  if (batch.length === 0) return;
  const payload = JSON.stringify({ events: batch });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      // A Blob explicit content-type-ot ad — enélkül a szerver text/plain-t lát.
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    // Tartalék: keepalive fetch (a beacon kvótája elfogyhat).
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* a mérés soha nem panaszkodik */
    });
  } catch {
    /* a mérés soha nem panaszkodik */
  }
}

export function flushAnalytics(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const batch = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  send(batch);
  // Ha a túlcsordulás miatt maradt még, azt is kiküldjük.
  if (queue.length > 0) flushAnalytics();
}

function bindLifecycleListeners(): void {
  if (listenersBound || typeof document === "undefined") return;
  listenersBound = true;

  // `visibilitychange` + `pagehide`: ez a két esemény az, amit a mobil
  // böngészők megbízhatóan tüzelnek lapváltáskor/bezáráskor. A `beforeunload`
  // mobilon gyakran elmarad, ezért nem arra építünk.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAnalytics();
  });
  window.addEventListener("pagehide", () => flushAnalytics());
}

/**
 * Esemény rögzítése a böngészőből.
 *
 * Típusos: az esemény neve és a tulajdonságai a katalógusból származnak
 * (`src/lib/analytics/events.ts`), tehát elgépelt név vagy nem létező
 * tulajdonság fordítási hiba.
 *
 * ```ts
 * track("cta.click", { cta_id: "hero_primary", surface: "landing" });
 * ```
 */
export function track<N extends AnalyticsEventName>(
  name: N,
  props?: AnalyticsEventProps<N>,
): void {
  try {
    if (typeof window === "undefined") return;
    if (isTrackingRefused()) return;

    bindLifecycleListeners();

    // A hivatkozó csak az első eseménnyel megy ki: a szerver úgyis hostra
    // redukálja, és felesleges minden kötegben ismételni.
    const ref = queue.length === 0 && document.referrer ? document.referrer : undefined;

    queue.push({
      name,
      props: props as Record<string, unknown> | undefined,
      path: window.location.pathname,
      ...(ref ? { ref } : {}),
      ts: Date.now(),
    });

    if (queue.length >= FLUSH_THRESHOLD) {
      flushAnalytics();
      return;
    }
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushAnalytics, FLUSH_DEBOUNCE_MS);
  } catch {
    /* a mérés soha nem törhet el felhasználói folyamatot */
  }
}
