import { resend, EMAIL_FROM } from "./resend";

type Locale = "hu" | "en" | "de";

// Single module-level constant — avoids the Turbopack inlining bug where
// local `const appUrl` declarations inside functions are dropped.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trita.hu";

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
      team: "a trita csapat",
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
      team: "the trita team",
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
      team: "das trita-Team",
    },
  },
  observerInvite: {
    hu: {
      subject: "Meghívó személyiségteszt kitöltésére – Trita",
      greeting: (name: string) => `Kedves ${name},`,
      body: (inviter: string) =>
        `${inviter} arra kér, hogy tölts ki egy rövid személyiségtesztet róla. A válaszaid anonimak maradnak, és kizárólag kutatási célokra kerülnek felhasználásra.`,
      cta: "Megfigyelői teszt megnyitása",
      footer:
        "Ha nem ismered a meghívót, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapat",
    },
    en: {
      subject: "Invitation to a personality assessment – Trita",
      greeting: (name: string) => `Hello ${name},`,
      body: (inviter: string) =>
        `${inviter} invited you to complete a short personality assessment about them. Your answers remain anonymous and are used for research only.`,
      cta: "Open observer assessment",
      footer:
        "If you don't recognize this invitation, you can ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
    de: {
      subject: "Einladung zum Persönlichkeitstest – Trita",
      greeting: (name: string) => `Hallo ${name},`,
      body: (inviter: string) =>
        `${inviter} hat dich eingeladen, einen kurzen Persönlichkeitstest über sie/ihn auszufüllen. Deine Antworten bleiben anonym und werden nur zu Forschungszwecken verwendet.`,
      cta: "Beobachter-Test öffnen",
      footer:
        "Wenn du diese Einladung nicht kennst, kannst du diese E-Mail ignorieren.",
      thanks: "Viele Grüße,",
      team: "das trita-Team",
    },
  },
  observerCompletion: {
    hu: {
      subject: "Egy megfigyelőd elvégezte a tesztet – trita",
      greeting: (name: string) => `Szia, ${name}!`,
      body: "Jó hír: az egyik meghívott megfigyelőd elvégezte a személyiségtesztet. Nézd meg, hogyan látnak téged mások!",
      cta: "Megnézem az eredményeket",
      thanks: "Köszönjük, hogy részt veszel a kutatásban!",
      team: "a trita csapat",
    },
    en: {
      subject: "One of your observers completed the test – trita",
      greeting: (name: string) => `Hi ${name}!`,
      body: "Great news: one of the observers you invited has completed the personality test. See how others perceive you!",
      cta: "View my results",
      thanks: "Thank you for participating in the research!",
      team: "the trita team",
    },
    de: {
      subject: "Eine deiner Beobachtungspersonen hat den Test abgeschlossen – trita",
      greeting: (name: string) => `Hallo, ${name}!`,
      body: "Gute Neuigkeiten: Eine der von dir eingeladenen Beobachtungspersonen hat den Persönlichkeitstest abgeschlossen. Schau, wie andere dich wahrnehmen!",
      cta: "Ergebnisse ansehen",
      thanks: "Danke, dass du an der Forschung teilnimmst!",
      team: "das trita-Team",
    },
  },
  verificationCode: {
    hu: {
      subject: "A regisztrációs kódod – trita",
      codeLabel: "A kódod:",
      ttl: (minutes?: number) =>
        minutes ? `A kód ${minutes} percig érvényes.` : "A kód rövid ideig érvényes.",
      footer:
        "Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapat",
    },
    en: {
      subject: "Your verification code – trita",
      codeLabel: "Your code:",
      ttl: (minutes?: number) =>
        minutes ? `This code is valid for ${minutes} minutes.` : "This code is valid for a short time.",
      footer:
        "If you didn't request this code, you can safely ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
    de: {
      subject: "Dein Bestätigungscode – trita",
      codeLabel: "Dein Code:",
      ttl: (minutes?: number) =>
        minutes ? `Der Code ist ${minutes} Minuten gültig.` : "Der Code ist nur kurze Zeit gültig.",
      footer:
        "Wenn du diesen Code nicht angefordert hast, kannst du diese E-Mail ignorieren.",
      thanks: "Viele Grüße,",
      team: "das trita-Team",
    },
  },
  signInCode: {
    hu: {
      subject: "A bejelentkezési kódod – trita",
      codeLabel: "A kódod:",
      ttl: (minutes?: number) =>
        minutes ? `A kód ${minutes} percig érvényes.` : "A kód rövid ideig érvényes.",
      footer:
        "Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapat",
    },
    en: {
      subject: "Your sign-in code – trita",
      codeLabel: "Your code:",
      ttl: (minutes?: number) =>
        minutes ? `This code is valid for ${minutes} minutes.` : "This code is valid for a short time.",
      footer:
        "If you didn't request this code, you can safely ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
    de: {
      subject: "Dein Anmeldecode – trita",
      codeLabel: "Dein Code:",
      ttl: (minutes?: number) =>
        minutes ? `Der Code ist ${minutes} Minuten gültig.` : "Der Code ist nur kurze Zeit gültig.",
      footer:
        "Wenn du diesen Code nicht angefordert hast, kannst du diese E-Mail ignorieren.",
      thanks: "Viele Grüße,",
      team: "das trita-Team",
    },
  },
  magicLink: {
    hu: {
      subject: "Bejelentkezési link – Trita",
      heading: "Bejelentkezési link",
      body: "Kattints az alábbi gombra a bejelentkezéshez. A link 10 percig érvényes.",
      cta: "Bejelentkezés",
      footer:
        "Ha nem te kérted ezt a linket, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapat",
    },
    en: {
      subject: "Your sign-in link – Trita",
      heading: "Sign in to Trita",
      body: "Click the button below to sign in to your account. This link expires in 10 minutes.",
      cta: "Sign in",
      footer:
        "If you didn't request this link, you can safely ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
    de: {
      subject: "Dein Anmelde-Link – Trita",
      heading: "Bei Trita anmelden",
      body: "Klicke auf den Button unten, um dich bei deinem Konto anzumelden. Dieser Link läuft in 10 Minuten ab.",
      cta: "Anmelden",
      footer:
        "Wenn du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.",
      thanks: "Viele Grüße,",
      team: "das trita-Team",
    },
  },
} as const;

function getLocale(email: string): Locale {
  const lower = email.toLowerCase();
  if (lower.endsWith(".hu")) return "hu";
  if (lower.endsWith(".de") || lower.endsWith(".at") || lower.endsWith(".ch"))
    return "de";
  return "en";
}

const HEADER_GRADIENT = "linear-gradient(135deg,#c7d2fe 0%,#ddd6fe 50%,#fbcfe8 100%)";
const FOOTER_GRADIENT = "linear-gradient(135deg,#eef2ff 0%,#f5f3ff 60%,#fdf4ff 100%)";
const CTA_GRADIENT = "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)";

// Default logo size matches the sign-in code email (140px).
const DEFAULT_LOGO_SIZE = 140;

function buildEmailLayout(params: {
  locale: Locale;
  heading?: string;
  logoSize?: number;
  bodyContent: string;
  footerDisclaimer?: string;
  thanks: string;
  team: string;
}): string {
  const logoSize = params.logoSize ?? DEFAULT_LOGO_SIZE;
  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px 24px">

    <!-- Gradient header with logo and wave bottom -->
    <div style="background:${HEADER_GRADIENT};border-radius:16px 16px 0 0;overflow:hidden">
      <div style="padding:24px 32px 10px;text-align:center">
        <img src="${APP_URL}/icon.svg" alt="trita" width="${logoSize}" height="${logoSize}"
             style="display:inline-block;border-radius:24px;margin-bottom:10px">
        ${params.heading ? `<h1 style="font-size:20px;font-weight:700;color:#1e1b4b;margin:0;line-height:1.3">${params.heading}</h1>` : ""}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 28" width="100%" preserveAspectRatio="none"
           style="display:block;width:100%;height:28px">
        <path d="M0,28 L0,18 C100,5 200,24 300,14 C400,4 500,22 600,12 L600,28 Z" fill="#ffffff"/>
      </svg>
    </div>

    <!-- White content area -->
    <div style="background:#ffffff;padding:16px 32px 32px">
      ${params.bodyContent}
    </div>

    <!-- Footer with wave top and light gradient -->
    <div style="background:${FOOTER_GRADIENT};border-radius:0 0 16px 16px;overflow:hidden">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 28" width="100%" preserveAspectRatio="none"
           style="display:block;width:100%;height:28px">
        <path d="M0,0 L0,14 C100,24 200,6 300,18 C400,28 500,10 600,20 L600,0 Z" fill="#ffffff"/>
      </svg>
      <div style="padding:4px 32px 24px;text-align:center">
        ${params.footerDisclaimer ? `<p style="font-size:11px;color:#6b7280;line-height:1.6;margin:0 0 10px">${params.footerDisclaimer}</p>` : ""}
        <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">
          ${params.thanks}<br>${params.team}
        </p>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#d1d5db;margin:16px 0 0">
      &copy; trita 2026
    </p>
  </div>
</body>
</html>`.trim();
}

function buildOrderConfirmationHtml(locale: Locale, name: string): string {
  const t = translations.orderConfirmation[locale];
  const features = t.featureList
    .map((f) => `<li style="padding:4px 0;color:#374151">${f}</li>`)
    .join("");

  const bodyContent = `
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 4px">
      ${t.greeting(name)}
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
      ${t.body}
    </p>
    <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 8px">
      ${t.features}
    </p>
    <ul style="font-size:13px;line-height:1.7;margin:0 0 28px;padding-left:20px">
      ${features}
    </ul>
    <div style="text-align:center">
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:${CTA_GRADIENT};color:#fff;font-size:14px;font-weight:600;padding:13px 32px;border-radius:10px;text-decoration:none">
        ${t.cta}
      </a>
    </div>`;

  return buildEmailLayout({
    locale,
    heading: t.heading,
    bodyContent,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  name: string;
  locale?: Locale;
}) {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.orderConfirmation[locale];
  const html = buildOrderConfirmationHtml(locale, params.name);

  const text = [
    t.greeting(params.name),
    "",
    t.body,
    "",
    t.features,
    t.featureList.map((f) => `- ${f}`).join("\n"),
    "",
    `${t.cta}: ${APP_URL}/dashboard`,
    "",
    t.footer,
    "",
    t.thanks,
    t.team,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text,
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
  token: string;
  recipientName: string;
}): string {
  const t = translations.observerInvite[params.locale];
  const link = `${APP_URL}/observe/${params.token}`;

  const bodyContent = `
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 4px">
      ${t.greeting(params.recipientName)}
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 28px">
      ${t.body(params.inviterName)}
    </p>
    <div style="text-align:center">
      <a href="${link}"
         style="display:inline-block;background:${CTA_GRADIENT};color:#fff;font-size:14px;font-weight:600;padding:13px 32px;border-radius:10px;text-decoration:none">
        ${t.cta}
      </a>
    </div>`;

  return buildEmailLayout({
    locale: params.locale,
    bodyContent,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendObserverInviteEmail(params: {
  to: string;
  inviterName: string;
  token: string;
  recipientName?: string;
  locale?: Locale;
}) {
  const locale = params.locale ?? getLocale(params.to);
  const fallbackNames: Record<Locale, string> = { hu: "Barátom", en: "Friend", de: "Freund/in" };
  const recipientName = params.recipientName ?? fallbackNames[locale];

  const html = buildObserverInviteHtml({
    locale,
    inviterName: params.inviterName,
    token: params.token,
    recipientName,
  });
  const link = `${APP_URL}/observe/${params.token}`;
  const t = translations.observerInvite[locale];
  const text = [
    t.greeting(recipientName),
    "",
    t.body(params.inviterName),
    "",
    `${t.cta}: ${link}`,
    "",
    t.footer,
    "",
    t.thanks,
    t.team,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text,
  });

  if (error) {
    console.error("[Email] Failed to send observer invite:", error);
  } else {
    console.log("[Email] Observer invite sent to:", params.to);
  }
}

function buildObserverCompletionHtml(params: {
  locale: Locale;
  inviterName: string;
}): string {
  const t = translations.observerCompletion[params.locale];

  const bodyContent = `
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
      ${t.greeting(params.inviterName)}
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 28px">
      ${t.body}
    </p>
    <div style="text-align:center">
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:${CTA_GRADIENT};color:#fff;font-size:14px;font-weight:600;padding:13px 32px;border-radius:10px;text-decoration:none">
        ${t.cta}
      </a>
    </div>`;

  return buildEmailLayout({
    locale: params.locale,
    bodyContent,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendObserverCompletionEmail(params: {
  to: string;
  inviterName: string;
  locale?: Locale;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.observerCompletion[locale];

  const html = buildObserverCompletionHtml({
    locale,
    inviterName: params.inviterName,
  });

  const text = [
    t.greeting(params.inviterName),
    "",
    t.body,
    "",
    `${t.cta}: ${APP_URL}/dashboard`,
    "",
    t.thanks,
    t.team,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text,
  });

  if (error) {
    console.error("[Email] Observer completion email failed:", error);
  } else {
    console.log("[Email] Observer completion email sent to:", params.to);
  }
}

function buildVerificationCodeHtml(params: {
  locale: Locale;
  code: string;
  ttlMinutes?: number;
  context?: "signUp" | "signIn";
}): string {
  const t = params.context === "signIn"
    ? translations.signInCode[params.locale]
    : translations.verificationCode[params.locale];

  const bodyContent = `
    <div style="background:#f3f4f6;border-radius:12px;padding:20px;text-align:center;margin:0 0 16px">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#6b7280;margin:0 0 8px">
        ${t.codeLabel}
      </p>
      <div style="font-size:32px;font-weight:700;letter-spacing:.25em;color:#1e1b4b">
        ${params.code}
      </div>
    </div>
    <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:0 0 16px">
      ${t.ttl(params.ttlMinutes)}
    </p>
    <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:0">
      ${t.footer}
    </p>`;

  return buildEmailLayout({
    locale: params.locale,
    bodyContent,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendVerificationCodeEmail(params: {
  to: string;
  code: string;
  locale?: Locale;
  ttlSeconds?: number | null;
  context?: "signUp" | "signIn";
}) {
  const locale = params.locale ?? "en";
  const context = params.context ?? "signUp";
  const ttlMinutes =
    params.ttlSeconds != null ? Math.max(1, Math.round(params.ttlSeconds / 60)) : undefined;
  const html = buildVerificationCodeHtml({
    locale,
    code: params.code,
    ttlMinutes,
    context,
  });

  const translationBlock = context === "signIn"
    ? translations.signInCode[locale]
    : translations.verificationCode[locale];

  const text = [
    `${translationBlock.codeLabel} ${params.code}`,
    "",
    translationBlock.ttl(ttlMinutes),
    "",
    translationBlock.footer,
    "",
    translationBlock.thanks,
    translationBlock.team,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: translationBlock.subject,
    html,
    text,
  });

  if (error) {
    console.error("[Email] Failed to send verification code:", error);
  } else {
    console.log("[Email] Verification code sent to:", params.to);
  }
}

function buildMagicLinkHtml(params: {
  locale: Locale;
  magicLinkUrl: string;
}): string {
  const t = translations.magicLink[params.locale];

  const bodyContent = `
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 28px">
      ${t.body}
    </p>
    <div style="text-align:center">
      <a href="${params.magicLinkUrl}"
         style="display:inline-block;background:${CTA_GRADIENT};color:#fff;font-size:14px;font-weight:600;padding:13px 32px;border-radius:10px;text-decoration:none">
        ${t.cta}
      </a>
    </div>`;

  return buildEmailLayout({
    locale: params.locale,
    heading: t.heading,
    bodyContent,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendMagicLinkEmail(params: {
  to: string;
  magicLinkUrl: string;
  locale?: Locale;
}) {
  const locale = params.locale ?? "en";
  const t = translations.magicLink[locale];
  const html = buildMagicLinkHtml({ locale, magicLinkUrl: params.magicLinkUrl });

  const text = [
    t.body,
    "",
    `${t.cta}: ${params.magicLinkUrl}`,
    "",
    t.footer,
    "",
    t.thanks,
    t.team,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text,
  });

  if (error) {
    console.error("[Email] Failed to send magic link:", error);
  } else {
    console.log("[Email] Magic link sent to:", params.to);
  }
}
