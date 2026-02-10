import { resend, EMAIL_FROM } from "./resend";

type Locale = "hu" | "en" | "de";

const translations = {
  orderConfirmation: {
    hu: {
      subject: "Köszönjük a vásárlást! – Trita",
      heading: "Köszönjük a vásárlást!",
      greeting: (name: string) =>
        `Kedves ${name},`,
      body: "A fizetésed sikeresen feldolgozásra került. A Pro funkcióid azonnal elérhetők.",
      features: "Amit most elérsz:",
      featureList: [
        "Részletes, személyre szabott kiértékelés",
        "Személyiségtípus meghatározás",
        "Fejlődés követés",
        "PDF export",
      ],
      cta: "Ugrás a Dashboardra",
      footer:
        "Ha kérdésed van, válaszolj erre az emailre. Szívesen segítünk!",
      thanks: "Üdvözlettel,",
      team: "A Trita csapat",
    },
    en: {
      subject: "Thank you for your purchase! – Trita",
      heading: "Thank you for your purchase!",
      greeting: (name: string) =>
        `Dear ${name},`,
      body: "Your payment has been successfully processed. Your Pro features are now available.",
      features: "What you can access now:",
      featureList: [
        "Detailed, personalized assessment",
        "Personality type identification",
        "Progress tracking",
        "PDF export",
      ],
      cta: "Go to Dashboard",
      footer:
        "If you have any questions, reply to this email. We're happy to help!",
      thanks: "Best regards,",
      team: "The Trita Team",
    },
    de: {
      subject: "Vielen Dank für Ihren Kauf! – Trita",
      heading: "Vielen Dank für Ihren Kauf!",
      greeting: (name: string) =>
        `Liebe/r ${name},`,
      body: "Ihre Zahlung wurde erfolgreich verarbeitet. Ihre Pro-Funktionen sind ab sofort verfügbar.",
      features: "Was Sie jetzt nutzen können:",
      featureList: [
        "Detaillierte, personalisierte Auswertung",
        "Bestimmung des Persönlichkeitstyps",
        "Fortschrittsverfolgung",
        "PDF-Export",
      ],
      cta: "Zum Dashboard",
      footer:
        "Bei Fragen antworten Sie einfach auf diese E-Mail. Wir helfen Ihnen gerne!",
      thanks: "Mit freundlichen Grüßen,",
      team: "Das Trita-Team",
    },
  },
  observerInvite: {
    hu: {
      subject: "Meghívó személyiségteszt kitöltésére – Trita",
      heading: "Meghívó személyiségteszt kitöltésére",
      greeting: (name: string) => `Kedves ${name},`,
      body: (inviter: string) =>
        `${inviter} arra kér, hogy tölts ki egy rövid személyiségtesztet róla. A válaszaid anonimak maradnak, és kizárólag kutatási célokra kerülnek felhasználásra.`,
      cta: "Megfigyelői teszt megnyitása",
      footer:
        "Ha nem ismered a meghívót, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "A Trita csapat",
    },
    en: {
      subject: "Invitation to a personality assessment – Trita",
      heading: "Invitation to a personality assessment",
      greeting: (name: string) => `Hello ${name},`,
      body: (inviter: string) =>
        `${inviter} invited you to complete a short personality assessment about them. Your answers remain anonymous and are used for research only.`,
      cta: "Open observer assessment",
      footer:
        "If you don't recognize this invitation, you can ignore this email.",
      thanks: "Best regards,",
      team: "The Trita team",
    },
    de: {
      subject: "Einladung zum Persönlichkeitstest – Trita",
      heading: "Einladung zum Persönlichkeitstest",
      greeting: (name: string) => `Hallo ${name},`,
      body: (inviter: string) =>
        `${inviter} hat dich eingeladen, einen kurzen Persönlichkeitstest über sie/ihn auszufüllen. Deine Antworten bleiben anonym und werden nur zu Forschungszwecken verwendet.`,
      cta: "Beobachter-Test öffnen",
      footer:
        "Wenn du diese Einladung nicht kennst, kannst du diese E-Mail ignorieren.",
      thanks: "Viele Grüße,",
      team: "Das Trita-Team",
    },
  },
} as const;

function getLocale(email: string): Locale {
  const lower = email.toLowerCase();
  if (lower.endsWith(".hu")) return "hu";
  if (lower.endsWith(".de") || lower.endsWith(".at") || lower.endsWith(".ch"))
    return "de";
  return "hu"; // Default to Hungarian
}

function buildOrderConfirmationHtml(
  locale: Locale,
  name: string,
  appUrl: string
): string {
  const t = translations.orderConfirmation[locale];
  const features = t.featureList
    .map((f) => `<li style="padding:4px 0">${f}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px">

      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:#ecfdf5;border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center">
          <span style="font-size:28px">&#10003;</span>
        </div>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#111827;text-align:center;margin:0 0 20px">
        ${t.heading}
      </h1>

      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px">
        ${t.greeting(name)}
      </p>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
        ${t.body}
      </p>

      <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 8px">
        ${t.features}
      </p>
      <ul style="font-size:13px;color:#4b5563;line-height:1.6;margin:0 0 24px;padding-left:20px">
        ${features}
      </ul>

      <div style="text-align:center;margin:24px 0">
        <a href="${appUrl}/dashboard"
           style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
          ${t.cta}
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">

      <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:0 0 4px">
        ${t.footer}
      </p>
      <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:0">
        ${t.thanks}<br>${t.team}
      </p>
    </div>

    <p style="text-align:center;font-size:11px;color:#d1d5db;margin-top:16px">
      &copy; Trita 2026
    </p>
  </div>
</body>
</html>`.trim();
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  name: string;
  locale?: Locale;
}) {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.orderConfirmation[locale];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.hu";

  const html = buildOrderConfirmationHtml(locale, params.name, appUrl);

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send order confirmation:", error);
  } else {
    console.log("[Email] Order confirmation sent to:", params.to);
  }
}

function buildObserverInviteHtml(params: {
  locale: Locale;
  inviterName: string;
  appUrl: string;
  token: string;
  recipientName: string;
}): string {
  const t = translations.observerInvite[params.locale];
  const link = `${params.appUrl}/observe/${params.token}`;

  return `
<!DOCTYPE html>
<html lang="${params.locale}">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px">
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px">
        ${t.heading}
      </h1>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px">
        ${t.greeting(params.recipientName)}
      </p>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
        ${t.body(params.inviterName)}
      </p>

      <div style="text-align:center;margin:24px 0">
        <a href="${link}"
           style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
          ${t.cta}
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">

      <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:0 0 4px">
        ${t.footer}
      </p>
      <p style="font-size:12px;color:#9ca3af;line-height:1.5;margin:0">
        ${t.thanks}<br>${t.team}
      </p>
    </div>

    <p style="text-align:center;font-size:11px;color:#d1d5db;margin-top:16px">
      &copy; Trita 2026
    </p>
  </div>
</body>
</html>`.trim();
}

export async function sendObserverInviteEmail(params: {
  to: string;
  inviterName: string;
  token: string;
  recipientName?: string;
}) {
  const locale = getLocale(params.to);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.hu";
  const recipientName = params.recipientName ?? "Barátom";

  const html = buildObserverInviteHtml({
    locale,
    inviterName: params.inviterName,
    appUrl,
    token: params.token,
    recipientName,
  });
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: translations.observerInvite[locale].subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send observer invite:", error);
  } else {
    console.log("[Email] Observer invite sent to:", params.to);
  }
}
