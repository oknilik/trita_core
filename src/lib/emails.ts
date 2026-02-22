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
      heading: "Meghívó személyiségteszt kitöltésére",
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
      heading: "Invitation to a personality assessment",
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
      heading: "Einladung zum Persönlichkeitstest",
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
  verificationCode: {
    hu: {
      subject: "A regisztrációs kódod – Trita",
      heading: "Regisztrációs kód",
      body: "Írd be ezt a kódot a regisztráció befejezéséhez.",
      codeLabel: "A kódod:",
      ttl: (minutes?: number) =>
        minutes ? `A kód ${minutes} percig érvényes.` : "A kód rövid ideig érvényes.",
      footer:
        "Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapat",
    },
    en: {
      subject: "Your verification code – Trita",
      heading: "Verification code",
      body: "Enter this code to complete your sign-up.",
      codeLabel: "Your code:",
      ttl: (minutes?: number) =>
        minutes ? `This code is valid for ${minutes} minutes.` : "This code is valid for a short time.",
      footer:
        "If you didn't request this code, you can safely ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
    de: {
      subject: "Dein Bestätigungscode – Trita",
      heading: "Bestätigungscode",
      body: "Gib diesen Code ein, um deine Registrierung abzuschließen.",
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
      subject: "A bejelentkezési kódod – Trita",
      heading: "Bejelentkezési kód",
      body: "Írd be ezt a kódot a bejelentkezéshez.",
      codeLabel: "A kódod:",
      ttl: (minutes?: number) =>
        minutes ? `A kód ${minutes} percig érvényes.` : "A kód rövid ideig érvényes.",
      footer:
        "Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapat",
    },
    en: {
      subject: "Your sign-in code – Trita",
      heading: "Sign-in code",
      body: "Enter this code to sign in to your account.",
      codeLabel: "Your code:",
      ttl: (minutes?: number) =>
        minutes ? `This code is valid for ${minutes} minutes.` : "This code is valid for a short time.",
      footer:
        "If you didn't request this code, you can safely ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
    de: {
      subject: "Dein Anmeldecode – Trita",
      heading: "Anmeldecode",
      body: "Gib diesen Code ein, um dich in deinem Konto anzumelden.",
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

function logoBlock(appUrl: string): string {
  return `
      <div style="text-align:center;margin-bottom:24px">
        <img src="${appUrl}/icon" alt="trita" width="48" height="48"
             style="display:inline-block;border-radius:12px">
      </div>`;
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
      ${logoBlock(appUrl)}

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
  const appUrl = params.appUrl ?? "https://trita.hu";
  const link = `${appUrl}/observe/${params.token}`;

  return `
<!DOCTYPE html>
<html lang="${params.locale}">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px">
      ${logoBlock(appUrl)}

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
  locale?: Locale;
}) {
  const locale = params.locale ?? getLocale(params.to);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.hu";
  const fallbackNames: Record<Locale, string> = { hu: "Barátom", en: "Friend", de: "Freund/in" };
  const recipientName = params.recipientName ?? fallbackNames[locale];

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

function buildVerificationCodeHtml(params: {
  locale: Locale;
  code: string;
  ttlMinutes?: number;
  appUrl: string;
  context?: "signUp" | "signIn";
}): string {
  const t = params.context === "signIn"
    ? translations.signInCode[params.locale]
    : translations.verificationCode[params.locale];

  return `
<!DOCTYPE html>
<html lang="${params.locale}">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px">
      ${logoBlock(params.appUrl)}

      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px">
        ${t.heading}
      </h1>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
        ${t.body}
      </p>

      <div style="background:#f3f4f6;border-radius:10px;padding:16px;text-align:center">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:#6b7280;margin:0 0 6px">
          ${t.codeLabel}
        </p>
        <div style="font-size:28px;font-weight:700;letter-spacing:.2em;color:#111827">
          ${params.code}
        </div>
      </div>

      <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:16px 0 0">
        ${t.ttl(params.ttlMinutes)}
      </p>

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

export async function sendVerificationCodeEmail(params: {
  to: string;
  code: string;
  locale?: Locale;
  ttlSeconds?: number | null;
  context?: "signUp" | "signIn";
}) {
  const locale = params.locale ?? "en";
  const context = params.context ?? "signUp";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.hu";
  const ttlMinutes =
    params.ttlSeconds != null ? Math.max(1, Math.round(params.ttlSeconds / 60)) : undefined;
  const html = buildVerificationCodeHtml({
    locale,
    code: params.code,
    ttlMinutes,
    appUrl,
    context,
  });

  const translationBlock = context === "signIn"
    ? translations.signInCode[locale]
    : translations.verificationCode[locale];

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: translationBlock.subject,
    html,
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
  appUrl: string;
}): string {
  const t = translations.magicLink[params.locale];

  return `
<!DOCTYPE html>
<html lang="${params.locale}">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px">
      ${logoBlock(params.appUrl)}

      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px">
        ${t.heading}
      </h1>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px">
        ${t.body}
      </p>

      <div style="text-align:center;margin:24px 0">
        <a href="${params.magicLinkUrl}"
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

export async function sendMagicLinkEmail(params: {
  to: string;
  magicLinkUrl: string;
  locale?: Locale;
}) {
  const locale = params.locale ?? "en";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.hu";
  const t = translations.magicLink[locale];
  const html = buildMagicLinkHtml({ locale, magicLinkUrl: params.magicLinkUrl, appUrl });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send magic link:", error);
  } else {
    console.log("[Email] Magic link sent to:", params.to);
  }
}
