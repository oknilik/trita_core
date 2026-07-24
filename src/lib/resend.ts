import { Resend } from "resend";

let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// For backwards compatibility, export as resend
export const resend = new Proxy({} as Resend, {
  get: (_target, prop) => {
    const instance = getResend();
    return instance[prop as keyof Resend];
  }
});

// Alapértelmezett feladó — csak akkor működik, ha a domain verifikálva van a
// Resendben (resend.com/domains). Verifikálatlan domainről a küldés 403-mal
// elhal, és a lead/inquiry admin-emailek némán elvesznek. Prodban ezért a
// RESEND_FROM_EMAIL explicit beállítása kötelező; hiányát induláskor jelezzük.
// 2026-07-24: a default a trita.hu-ról trita.io-ra váltott — a Resend
// DNS-rekordok (MX/SPF/DKIM a send.trita.io-n) a .io domainen élnek, a
// trita.hu-n nincsenek kint, onnan a küldés eleve elhalna.
const DEFAULT_EMAIL_FROM = "trita <noreply@trita.io>";

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? DEFAULT_EMAIL_FROM;

if (
  process.env.NODE_ENV === "production" &&
  !process.env.RESEND_FROM_EMAIL
) {
  console.warn(
    "[Resend] RESEND_FROM_EMAIL nincs beállítva — a küldés a(z) " +
      `${DEFAULT_EMAIL_FROM} defaultra esik. Ha a domain nincs verifikálva ` +
      "(resend.com/domains), az admin-értesítő emailek némán elhalnak.",
  );
}
