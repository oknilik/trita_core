import { resend, EMAIL_FROM } from "./resend";
import {
  buildEmailLayout,
  escapeHtml,
  renderCtaButton,
  renderCodeBox,
  renderInfoTable,
  EMAIL_P,
  EMAIL_P_MUTED,
  EMAIL_EYEBROW,
  EMAIL_UL,
  EMAIL_LI,
} from "./email-layout";

type Locale = "hu" | "en";

// Single module-level constant — avoids the Turbopack inlining bug where
// local `const appUrl` declarations inside functions are dropped.
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const APP_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://trita.io"),
);


const translations = {
  orderConfirmation: {
    hu: {
      subject: "Köszönjük a vásárlást! – Trita",
      heading: "Köszönjük a vásárlást!",
      greeting: (name: string) =>
        `Kedves ${name},`,
      body: "A fizetésedet feldolgoztuk. A Pro funkcióid azonnal elérhetők.",
      features: "Amit most elérsz:",
      featureList: [
        "Részletes, személyre szabott kiértékelés",
        "Személyiségtípus meghatározás",
        "Fejlődés követés",
        "PDF export",
      ],
      cta: "Ugrás a vezérlőre",
      footer:
        "Ha kérdésed van, válaszolj erre az emailre. Szívesen segítünk!",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
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
  },
  observerInvite: {
    hu: {
      subject: "Meghívó személyiségteszt kitöltésére – Trita",
      greeting: (_name: string) => "Szia,",
      body: (inviter: string) =>
        `${inviter} arra kér, hogy tölts ki róla egy rövid személyiségtesztet, hogy képet kapjon arról, hogyan látják őt mások.\n\nA te nézőpontod nagyon fontos. A válaszaid anonimak maradnak, és az eredmények csak összesítve (több értékelés átlaga alapján) jelennek meg.`,
      cta: "Visszajelzés kitöltése",
      footer:
        "Ha nem ismered a meghívót, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "Invitation to a personality assessment – Trita",
      greeting: (_name: string) => "Hi,",
      body: (inviter: string) =>
        `${inviter} is asking you to complete a short personality questionnaire about them, to understand how others see them.\n\nYour perspective matters. Your answers stay anonymous, and results are shown only in aggregate (as an average across multiple responses).`,
      cta: "Open the feedback form",
      footer:
        "If you don't recognize this invitation, you can ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
  },
  observerCompletion: {
    hu: {
      subject: "Megérkezett egy visszajelzés – trita",
      greeting: (name: string) => `Szia, ${name}!`,
      body: "Jó hír: az egyik meghívottad kitöltötte a kérdőívet. Nézd meg, hogyan látnak téged mások!",
      cta: "Megnézem az eredményeket",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "New feedback received – trita",
      greeting: (name: string) => `Hi ${name}!`,
      body: "Great news: one of the people you invited completed the questionnaire. See how others perceive you!",
      cta: "View my results",
      thanks: "Thank you for participating in the research!",
      team: "the trita team",
    },
  },
  candidateCompleted: {
    hu: {
      subject: "Jelölt-felmérés elkészült – trita",
      greeting: "Szia,",
      body: (name: string, position: string | null) =>
        `${name}${position ? ` (${position})` : ""} kitöltötte a jelölt-felmérést. Az eredmény és a csapat-illesztés megnyitható a jelölt-részletezőn.`,
      cta: "Eredmény megnyitása",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "Candidate assessment completed – trita",
      greeting: "Hi,",
      body: (name: string, position: string | null) =>
        `${name}${position ? ` (${position})` : ""} completed the candidate assessment. The result and team fit are ready to review.`,
      cta: "Open the result",
      thanks: "Best regards,",
      team: "the trita team",
    },
  },
  profileShare: {
    hu: {
      subject: "Megosztott személyiségprofil – trita",
      greeting: "Szia,",
      body: (sender: string) =>
        `${sender} megosztotta veled a személyiségprofilját a tritán. A profil bemutatja a fő dimenzióit, a munkastílusát és a valószínű csapatszerepeit.`,
      cta: "Profil megnyitása",
      footer:
        "A linket a küldő bármikor visszavonhatja. Ha nem ismered a küldőt, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "A personality profile was shared with you – trita",
      greeting: "Hi,",
      body: (sender: string) =>
        `${sender} shared their personality profile with you on trita. The profile shows their main dimensions, work style, and likely team roles.`,
      cta: "Open the profile",
      footer:
        "The sender can revoke this link at any time. If you don't recognize the sender, you can ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
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
      team: "a trita csapata",
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
      team: "a trita csapata",
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
      team: "a trita csapata",
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
  },
  assessmentDraftReminder: {
    hu: {
      subject: "Már majdnem kész vagy a teszttel – folytasd itt",
      greeting: (name: string) => `Szia, ${name}!`,
      body: (testName: string, answeredCount: number, totalCount: number) =>
        `Láttuk, hogy elkezdted a személyiségtesztet a Tritán, de még nem fejezted be. Már ${answeredCount} kérdésen túl vagy a ${totalCount}-ból, szóval tényleg csak egy kis lépés választ el az eredményektől.\n\nHa befejezed, egy rövid visszajelzést kapsz arról, hogyan látod magad a fő személyiségdimenziók mentén. Ha szeretnéd, később másoktól is kérhetsz visszajelzést, így azt is láthatod, mennyire egyezik a saját képed azzal, ahogyan a környezeted lát.`,
      cta: "Folytatom a tesztet",
      footer: "Ha már befejezted a tesztet, nyugodtan hagyd figyelmen kívül ezt az üzenetet.",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "Continue your assessment – you're almost there! – trita",
      greeting: (name: string) => `Hi ${name}!`,
      body: (testName: string, answeredCount: number, totalCount: number) =>
        `We noticed you started the ${testName} personality assessment but haven't finished yet. You're already ${answeredCount} questions in out of ${totalCount} — you're almost there!\n\nYour results will show how you see yourself across the ${testName} dimensions, and you'll also get the chance to invite observers to compare their view with yours. Click below to pick up where you left off.`,
      cta: "Continue my assessment",
      footer: "If you've already completed the test, feel free to ignore this email.",
      thanks: "Thank you for participating in the research!",
      team: "the trita team",
    },
  },
} as const;

function getLocale(email: string): Locale {
  const lower = email.toLowerCase();
  if (lower.endsWith(".hu")) return "hu";
  return "en";
}

// A vizuális keret és a bekezdés-stílusok a közös email-layout modulból
// jönnek (2026-07-23 egységesítés) — palettacsere a design-tokens.ts-ben.

function buildOrderConfirmationHtml(locale: Locale, name: string): string {
  const t = translations.orderConfirmation[locale];
  const features = t.featureList
    .map((f) => `<li style="${EMAIL_LI}">${f}</li>`)
    .join("");
  const cta = renderCtaButton({ href: `${APP_URL}/dashboard`, label: t.cta });

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting(name)}
    </p>
    <p style="${EMAIL_P}">
      ${t.body}
    </p>
    <p style="${EMAIL_EYEBROW}">
      ${t.features}
    </p>
    <ul style="${EMAIL_UL};margin-bottom:24px">
      ${features}
    </ul>
    ${cta}`;

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
  // Inline styles are the most reliable across Outlook versions.
  const inviterStyled = `<span style="font-weight:700;font-style:italic">${escapeHtml(params.inviterName)}</span>`;
  const link = `${APP_URL}/observe/${params.token}`;
  const cta = renderCtaButton({ href: link, label: t.cta });
  const bodyHtml = t
    .body(inviterStyled)
    .replaceAll("\n\n", "<br><br>")
    .replaceAll("\n", "<br>");

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting(escapeHtml(params.recipientName))}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${bodyHtml}
    </p>
    ${cta}`;

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
  isReminder?: boolean;
}) {
  const locale = params.locale ?? getLocale(params.to);
  const fallbackNames: Record<Locale, string> = { hu: "Barátom", en: "Friend" };
  const recipientName = params.recipientName ?? fallbackNames[locale];

  const html = buildObserverInviteHtml({
    locale,
    inviterName: params.inviterName,
    token: params.token,
    recipientName,
  });
  const link = `${APP_URL}/observe/${params.token}`;
  const t = translations.observerInvite[locale];
  const reminderPrefix: Record<Locale, string> = { hu: "Emlékeztető: ", en: "Reminder: " };
  const subject = params.isReminder ? `${reminderPrefix[locale]}${t.subject}` : t.subject;
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
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[Email] Failed to send observer invite:", error);
  } else {
    console.log("[Email] Observer invite sent to:", params.to);
  }
}

export async function sendCandidateCompletedEmail(params: {
  to: string;
  candidateName: string;
  position?: string | null;
  resultUrl: string;
  locale?: Locale;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.candidateCompleted[locale];

  const cta = renderCtaButton({ href: params.resultUrl, label: t.cta });
  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${escapeHtml(t.body(params.candidateName, params.position ?? null))}
    </p>
    ${cta}`;

  const html = buildEmailLayout({
    locale,
    bodyContent,
    thanks: t.thanks,
    team: t.team,
  });
  const text = [
    t.greeting,
    "",
    t.body(params.candidateName, params.position ?? null),
    "",
    `${t.cta}: ${params.resultUrl}`,
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
    console.error("[Email] Failed to send candidate completed:", error);
  }
}

function buildProfileShareHtml(params: {
  locale: Locale;
  senderName: string;
  token: string;
}): string {
  const t = translations.profileShare[params.locale];
  const cta = renderCtaButton({
    href: `${APP_URL}/share/${params.token}`,
    label: t.cta,
  });

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${t.body(params.senderName)}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    bodyContent,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendProfileShareEmail(params: {
  to: string;
  senderName: string;
  token: string;
  locale?: Locale;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.profileShare[locale];
  const link = `${APP_URL}/share/${params.token}`;

  const text = [
    t.greeting,
    "",
    t.body(params.senderName),
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
    html: buildProfileShareHtml({ locale, senderName: params.senderName, token: params.token }),
    text,
  });

  if (error) {
    console.error("[Email] Failed to send profile share:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
  console.log("[Email] Profile share sent to:", params.to);
}

function buildObserverCompletionHtml(params: {
  locale: Locale;
  inviterName: string;
}): string {
  const t = translations.observerCompletion[params.locale];
  const cta = renderCtaButton({ href: `${APP_URL}/dashboard`, label: t.cta });

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting(params.inviterName)}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${t.body}
    </p>
    ${cta}`;

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
    ${renderCodeBox({ label: t.codeLabel, code: params.code })}
    <p style="${EMAIL_P_MUTED}">
      ${t.ttl(params.ttlMinutes)}
    </p>
    <p style="${EMAIL_P_MUTED};margin-bottom:0">
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

function buildAssessmentDraftReminderHtml(params: {
  locale: Locale;
  name: string;
  testName: string;
  answeredCount: number;
  totalCount: number;
}): string {
  const t = translations.assessmentDraftReminder[params.locale];
  const cta = renderCtaButton({ href: `${APP_URL}/assessment`, label: t.cta });
  const bodyHtml = t
    .body(escapeHtml(params.testName), params.answeredCount, params.totalCount)
    .replaceAll("\n\n", "<br><br>")
    .replaceAll("\n", "<br>");

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting(escapeHtml(params.name))}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${bodyHtml}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    bodyContent,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendAssessmentDraftReminderEmail(params: {
  to: string;
  name: string;
  testName: string;
  answeredCount: number;
  totalCount: number;
  locale?: Locale;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.assessmentDraftReminder[locale];
  const html = buildAssessmentDraftReminderHtml({
    locale,
    name: params.name,
    testName: params.testName,
    answeredCount: params.answeredCount,
    totalCount: params.totalCount,
  });

  const text = [
    t.greeting(params.name),
    "",
    t.body(params.testName, params.answeredCount, params.totalCount),
    "",
    `${t.cta}: ${APP_URL}/assessment`,
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
    console.error("[Email] Failed to send draft reminder:", error);
  } else {
    console.log("[Email] Draft reminder sent to:", params.to);
  }
}

function buildMagicLinkHtml(params: {
  locale: Locale;
  magicLinkUrl: string;
}): string {
  const t = translations.magicLink[params.locale];
  const cta = renderCtaButton({ href: params.magicLinkUrl, label: t.cta });

  const bodyContent = `
    <p style="${EMAIL_P};margin-bottom:24px">
      ${t.body}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    heading: t.heading,
    bodyContent,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });
}

export async function sendCoachApplicationNotification(params: {
  applicantName: string;
  applicantEmail: string;
  background: string;
  motivation: string;
  specializations?: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("[Email] ADMIN_EMAIL not configured, skipping coach application notification");
    return;
  }

  const bodyContent = `
    ${renderInfoTable([
      ["Név", escapeHtml(params.applicantName)],
      ["Email", escapeHtml(params.applicantEmail)],
      ["Szakterületek", escapeHtml(params.specializations ?? "–")],
    ])}
    <p style="${EMAIL_EYEBROW}">Szakmai háttér</p>
    <p style="${EMAIL_P};white-space:pre-line">${escapeHtml(params.background)}</p>
    <p style="${EMAIL_EYEBROW}">Motiváció</p>
    <p style="${EMAIL_P};margin-bottom:24px;white-space:pre-line">${escapeHtml(params.motivation)}</p>
    ${renderCtaButton({ href: `${APP_URL}/admin`, label: "Admin felület megnyitása" })}`;

  const html = buildEmailLayout({
    locale: "hu",
    heading: "Új coach jelentkezés érkezett",
    bodyContent,
    thanks: "Üdvözlettel,",
    team: "a trita rendszer",
  });

  const text = [
    "Új coach jelentkezés érkezett",
    "",
    `Név: ${params.applicantName}`,
    `Email: ${params.applicantEmail}`,
    `Szakterületek: ${params.specializations ?? "–"}`,
    "",
    "Szakmai háttér:",
    params.background,
    "",
    "Motiváció:",
    params.motivation,
    "",
    `Admin: ${APP_URL}/admin`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: adminEmail,
    subject: `Új coach jelentkezés – ${params.applicantName}`,
    html,
    text,
  });

  if (error) {
    console.error("[Email] Coach application notification failed:", error);
  } else {
    console.log("[Email] Coach application notification sent to:", adminEmail);
  }
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

// ─── Team invite email (for users without an account) ────────────────────────

const teamInviteTranslations = {
  hu: {
    subject: (teamName: string) => `Meghívtak a(z) ${teamName} csapatba – Trita`,
    heading: (teamName: string) => `Meghívtak a(z) ${teamName} csapatba`,
    body: "Személyiségprofilod megosztásával csatlakozhatsz a csapathoz. Regisztrálj a Tritára, és automatikusan hozzáadunk!",
    cta: "Regisztráció és csatlakozás",
    footer: "Ha nem szeretnél csatlakozni, egyszerűen hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    subject: (teamName: string) => `You've been invited to join ${teamName} – Trita`,
    heading: (teamName: string) => `You've been invited to join ${teamName}`,
    body: "Share your personality profile with your team by joining Trita. Register and you'll be added automatically!",
    cta: "Register and join",
    footer: "If you don't want to join, simply ignore this email.",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

// ─── Candidate invite email (for job applicants, no account needed) ──────────

const candidateInviteTranslations = {
  hu: {
    subject: (position?: string) =>
      position
        ? `Meghívó személyiségfelmérésre – ${position} pozíció`
        : "Meghívó személyiségfelmérésre",
    heading: (position?: string) =>
      position ? `Személyiségfelmérés – ${position}` : "Személyiségfelmérés",
    body: (managerName: string) =>
      `${managerName} meghívott, hogy töltsd ki az alábbi személyiségfelmérést. A teszt körülbelül 10–15 percet vesz igénybe, és regisztráció nélkül elvégezhető.`,
    cta: "Felmérés megkezdése",
    footer:
      "Ha nem számítottál erre az emailre, egyszerűen hagyd figyelmen kívül.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    subject: (position?: string) =>
      position
        ? `Invitation to personality assessment – ${position}`
        : "Invitation to complete a personality assessment",
    heading: (position?: string) =>
      position ? `Personality Assessment – ${position}` : "Personality Assessment",
    body: (managerName: string) =>
      `${managerName} has invited you to complete a personality assessment. The questionnaire takes about 10–15 minutes and requires no registration.`,
    cta: "Start assessment",
    footer:
      "If you did not expect this email, you can safely ignore it.",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

export async function sendCandidateInviteEmail(params: {
  to: string;
  managerName: string;
  token: string;
  position?: string;
  applyUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? getLocale(params.to);
  const tr = candidateInviteTranslations[locale];

  const html = buildEmailLayout({
    locale,
    heading: tr.heading(params.position),
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:24px">
      ${escapeHtml(tr.body(params.managerName))}
    </p>
    ${renderCtaButton({ href: params.applyUrl, label: tr.cta })}`,
    footerDisclaimer: tr.footer,
    thanks: tr.thanks,
    team: tr.team,
  });

  const text = [
    tr.heading(params.position),
    "",
    tr.body(params.managerName),
    "",
    `${tr.cta}: ${params.applyUrl}`,
    "",
    tr.footer,
    "",
    tr.thanks,
    tr.team,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: tr.subject(params.position),
    html,
    text,
  });

  if (error) {
    console.error("[Email] Failed to send candidate invite:", error);
    return false;
  }
  console.log("[Email] Candidate invite sent to:", params.to);
  return true;
}

// ─── Team invite email (for users without an account) ────────────────────────

export async function sendTeamInviteEmail(params: {
  to: string;
  teamName: string;
  signUpUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "en";
  const t = teamInviteTranslations[locale];

  const html = buildEmailLayout({
    locale,
    heading: t.heading(escapeHtml(params.teamName)),
    preheader: t.body,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:24px">${t.body}</p>
    ${renderCtaButton({ href: params.signUpUrl, label: t.cta })}`,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject(params.teamName),
    html,
    text: `${t.heading(params.teamName)}\n\n${t.body}\n\n${t.cta}: ${params.signUpUrl}\n\n${t.footer}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    console.error("[Email] Failed to send team invite:", error);
    return false;
  }
  console.log("[Email] Team invite sent to:", params.to);
  return true;
}

// ─── Org invite email ─────────────────────────────────────────────────────────

const orgInviteTranslations = {
  hu: {
    subject: (orgName: string) => `Meghívtak a(z) ${orgName} szervezetbe – Trita`,
    heading: (orgName: string) => `Meghívtak a(z) ${orgName} szervezetbe`,
    body: "Regisztrálj a Tritára, és automatikusan csatlakozol a szervezethez. Kitöltheted a személyiségtesztet, és láthatod, hogyan illesz a csapatba.",
    cta: "Regisztráció és csatlakozás",
    footer: "Ha nem szeretnél csatlakozni, egyszerűen hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    subject: (orgName: string) => `You've been invited to join ${orgName} – Trita`,
    heading: (orgName: string) => `You've been invited to join ${orgName}`,
    body: "Register on Trita and you'll automatically join the organization. Complete the personality assessment to see how you fit with your team.",
    cta: "Register and join",
    footer: "If you don't want to join, simply ignore this email.",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

export async function sendOrgInviteEmail(params: {
  to: string;
  orgName: string;
  role: string;
  signUpUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "en";
  const t = orgInviteTranslations[locale];

  const html = buildEmailLayout({
    locale,
    heading: t.heading(escapeHtml(params.orgName)),
    preheader: t.body,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:24px">${t.body}</p>
    ${renderCtaButton({ href: params.signUpUrl, label: t.cta })}`,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject(params.orgName),
    html,
    text: `${t.heading(params.orgName)}\n\n${t.body}\n\n${t.cta}: ${params.signUpUrl}\n\n${t.footer}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    console.error("[Email] Failed to send org invite:", error);
    return false;
  }
  console.log("[Email] Org invite sent to:", params.to);
  return true;
}
