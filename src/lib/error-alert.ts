// ─────────────────────────────────────────────────────────────────────
// Hiba-riasztás — a naplóból kifelé.
//
// A PROBLÉMA, amit megold: a szerver-oldali hiba-seam megvolt
// (`instrumentation.ts` → `onRequestError`), a kliens-oldali is
// (`ErrorScreen` → client-logger), de MINDKETTŐ csak logot írt: a szerver a
// Vercel stdout-jára, a kliens a látogató böngésző-konzoljára. Oda senki nem
// néz. A pilot-playbook viszont „munkanapon 24 órán belüli reakciót" ígér a
// partnernek — ehhez tudni kell, hogy egyáltalán történt hiba.
//
// MIÉRT NEM SENTRY: az egy külső függőség + fiók + DSN. Ez a modul ugyanazt a
// szerepet tölti be függőség nélkül, és bármikor lecserélhető: egyetlen
// hívási pont van (`sendErrorAlert`), a Sentry `captureException` pontosan
// ide kerülne be.
//
// A csatorna egy általános webhook (`ERROR_ALERT_WEBHOOK_URL`): a `text`
// mezővel a Slack incoming webhook közvetlenül működik, a `content` mezővel a
// Discord, a strukturált mezőket pedig bármi más fel tudja dolgozni.
//
// HÁROM SZABÁLY, amit betart:
//  1. SOSEM dob és sosem várakoztat — a riasztás hibája nem ronthatja el a
//     kérés kiszolgálását (a hívó `void`-dal indítja).
//  2. FOJTOTT — egy forró hibahurok nem lőheti szét sem a webhookot, sem a
//     költségkeretet: ablakonként korlátos darabszám + ujjlenyomat-alapú
//     ismétlés-szűrés.
//  3. NEM VISZ TARTALMAT — csak hibatípus, útvonal és üzenet-fej. Felhasználói
//     szöveg, e-mail, token nem kerülhet a riasztásba.
// ─────────────────────────────────────────────────────────────────────

import { createLogger } from "@/lib/logger";

const log = createLogger("error-alert");

/** Fojtási ablak és keret — processzenként. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ALERTS_PER_WINDOW = 10;

/** Az üzenetből ennyi karakter megy ki (a stack sosem). */
const MAX_MESSAGE_LEN = 200;

/** A webhook-hívás felső ideje; utána elengedjük. */
const REQUEST_TIMEOUT_MS = 3000;

export interface ErrorAlert {
  /** Rövid esemény-kulcs, pl. "server.unhandled_error". */
  event: string;
  /** Honnan jött: "server" | "client". */
  origin: "server" | "client";
  /** Útvonal, ahol történt (query nélkül). */
  path?: string | null;
  /** A hiba neve/típusa, pl. "TypeError". */
  name?: string | null;
  /** Üzenet-fej — csonkolva, tartalom nélkül. */
  message?: string | null;
  /** Next szerver-hiba hash, ha van (a support-beszélgetés horgonya). */
  digest?: string | null;
  /** Kérés-korreláció. */
  requestId?: string | null;
}

interface ThrottleState {
  windowStartedAt: number;
  sent: number;
  suppressed: number;
  fingerprints: Set<string>;
}

const throttle: ThrottleState = {
  windowStartedAt: 0,
  sent: 0,
  suppressed: 0,
  fingerprints: new Set(),
};

export function sanitizeDiagnosticText(value: unknown, max = MAX_MESSAGE_LEN): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const redacted = trimmed
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[email]")
    .replace(/\bBearer\s+[^\s]+/giu, "Bearer [redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu, "[token]")
    .replace(/\b(token|secret|password|api[_-]?key)=([^\s&]+)/giu, "$1=[redacted]")
    .replace(/([?&][^=\s]+)=([^&#\s]+)/gu, "$1=[redacted]");
  return redacted.length > max ? `${redacted.slice(0, max)}…` : redacted;
}

export function sanitizeDiagnosticPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim().split(/[?#]/u, 1)[0];
  if (!path.startsWith("/")) return null;
  return path.slice(0, 200);
}

function fingerprint(alert: ErrorAlert): string {
  return [alert.origin, alert.event, sanitizeDiagnosticPath(alert.path) ?? "-", alert.name ?? "-", sanitizeDiagnosticText(alert.message, 80) ?? "-"].join("|");
}

/**
 * Átengedjük-e ezt a riasztást? Ablakonként legfeljebb `MAX_ALERTS_PER_WINDOW`
 * megy ki, és egy ujjlenyomat ablakonként csak egyszer – így egy ismétlődő
 * hiba egy sort ad, nem ezret.
 */
function shouldSend(alert: ErrorAlert, now: number): boolean {
  if (now - throttle.windowStartedAt > WINDOW_MS) {
    if (throttle.suppressed > 0) {
      log.warn(
        { event: "error_alert.window_summary", suppressed: throttle.suppressed, sent: throttle.sent },
        "Error alerts suppressed in the previous window",
      );
    }
    throttle.windowStartedAt = now;
    throttle.sent = 0;
    throttle.suppressed = 0;
    throttle.fingerprints.clear();
  }

  const fp = fingerprint(alert);
  if (throttle.fingerprints.has(fp) || throttle.sent >= MAX_ALERTS_PER_WINDOW) {
    throttle.suppressed += 1;
    return false;
  }

  throttle.fingerprints.add(fp);
  throttle.sent += 1;
  return true;
}

/** Csak teszthez: a fojtás-állapot visszaállítása. */
export function __resetErrorAlertThrottle(): void {
  throttle.windowStartedAt = 0;
  throttle.sent = 0;
  throttle.suppressed = 0;
  throttle.fingerprints.clear();
}

/** Csak teszthez: a döntés kiolvasása webhook-hívás nélkül. */
export function __shouldSendErrorAlert(alert: ErrorAlert, now: number = Date.now()): boolean {
  return shouldSend(alert, now);
}

function buildBody(alert: ErrorAlert, appUrl: string | undefined) {
  const safePath = sanitizeDiagnosticPath(alert.path);
  const safeMessage = sanitizeDiagnosticText(alert.message);
  const where = safePath ? ` @ ${safePath}` : "";
  const summary = `🔴 trita ${alert.origin} hiba${where}: ${alert.name ?? "Error"} – ${
    safeMessage ?? "(nincs üzenet)"
  }`;

  return {
    // Slack incoming webhook
    text: summary,
    // Discord webhook
    content: summary,
    // Bármi más
    event: alert.event,
    origin: alert.origin,
    path: safePath,
    name: alert.name ?? null,
    message: safeMessage,
    digest: alert.digest ?? null,
    requestId: alert.requestId ?? null,
    app: appUrl ?? null,
  };
}

/**
 * Riasztás küldése – fire-and-forget. A hívó `void sendErrorAlert(...)`-tal
 * indítja; a visszatérő Promise sosem utasít el.
 */
export async function sendErrorAlert(alert: ErrorAlert): Promise<void> {
  const webhookUrl = process.env.ERROR_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  if (!shouldSend(alert, Date.now())) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(alert, process.env.NEXT_PUBLIC_APP_URL)),
        signal: controller.signal,
      });
      if (!res.ok) {
        log.warn(
          { event: "error_alert.delivery_failed", status: res.status },
          "Error alert webhook returned a non-2xx status",
        );
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    // A riasztás hibája SOSEM buborékolhat fel: az eredeti hibát fedné el.
    log.warn({ event: "error_alert.delivery_error", err }, "Error alert webhook call failed");
  }
}
