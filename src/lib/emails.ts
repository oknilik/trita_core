import { resend, EMAIL_FROM } from "./resend";
import { createLogger } from "@/lib/logger";
import { withHuArticle } from "@/lib/hu-grammar";
import { EMAIL_COLORS } from "./design-tokens";
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

const log = createLogger("email");

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
      thanks: "Best regards,",
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
      qrAlt: "QR-kód a megosztott profilhoz",
      qrHint:
        "A QR-kódot telefonnal beolvasva a profil azonnal megnyílik.",
      qrAttachmentNote:
        "A csatolt QR-kódot (qr-kod.png) telefonnal beolvasva a profil azonnal megnyílik.",
      qrFilename: "qr-kod.png",
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
      qrAlt: "QR code for the shared profile",
      qrHint:
        "Scan the QR code with your phone and the profile opens instantly.",
      qrAttachmentNote:
        "Scan the attached QR code (qr-code.png) with your phone and the profile opens instantly.",
      qrFilename: "qr-code.png",
      footer:
        "The sender can revoke this link at any time. If you don't recognize the sender, you can ignore this email.",
      thanks: "Best regards,",
      team: "the trita team",
    },
  },
  reflectionPrompt: {
    hu: {
      subject: "Egy hét telt el — mit láttál magadból?",
      greeting: "Szia,",
      body: (dimLabel: string) =>
        `Egy hete készült el a személyiségprofilod. A legerősebb dimenziód ${withHuArticle(dimLabel)} volt — figyeld meg tudatosan egy konkrét helyzetben ezen a héten: mikor segített, és mikor pörgött túl?`,
      body2:
        "Ha kíváncsi vagy, hogyan működnétek együtt valakivel, a páros összehasonlítással meg is nézhetitek.",
      cta: "Páros összehasonlítás megnyitása",
      optOut: "Nem kérsz több ilyen emailt? Leiratkozás itt:",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "A week has passed — what did you notice?",
      greeting: "Hi,",
      body: (dimLabel: string) =>
        `Your personality profile was completed a week ago. Your strongest dimension was ${dimLabel} — observe it deliberately in one concrete situation this week: when did it help, and when did it over-rev?`,
      body2:
        "If you're curious how you'd work with someone, the pair comparison will show you.",
      cta: "Open the pair comparison",
      optOut: "Don't want emails like this? Unsubscribe here:",
      thanks: "Best regards,",
      team: "the trita team",
    },
  },
  compareInvite: {
    hu: {
      subject: "Hogyan működnétek együtt? – meghívó a tritán",
      greeting: "Szia,",
      body: (sender: string) =>
        `${sender} meghívott egy páros összehasonlításra a tritán: a saját kitöltésed után mindketten látjátok, mi menne köztetek magától, hol várható súrlódás, és mit érdemes előre megbeszélni. A számszerű pontszámaid nem jelennek meg neki.`,
      cta: "Meghívó megnyitása",
      footer:
        "A meghívó 30 napig él, és bármelyik fél bármikor visszavonhatja. Ha nem ismered a küldőt, nyugodtan hagyd figyelmen kívül ezt az emailt.",
      thanks: "Üdvözlettel,",
      team: "a trita csapata",
    },
    en: {
      subject: "How would you work together? – an invite on trita",
      greeting: "Hi,",
      body: (sender: string) =>
        `${sender} invited you to a pair comparison on trita: after completing your own assessment, you both see what would come easily between you, where friction is likely, and what to agree on up front. Your numeric scores are not shown to them.`,
      cta: "Open the invite",
      footer:
        "The invite lives for 30 days, and either side can revoke it at any time. If you don't recognize the sender, you can ignore this email.",
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
        `Láttuk, hogy elkezdted ${withHuArticle(testName)} kitöltését a Tritán, de még nem fejezted be. Már ${answeredCount} kérdésen túl vagy a ${totalCount}-ból, szóval tényleg csak egy kis lépés választ el az eredményektől.\n\nHa befejezed, egy rövid visszajelzést kapsz arról, hogyan látod magad a fő személyiségdimenziók mentén. Ha szeretnéd, később másoktól is kérhetsz visszajelzést, így azt is láthatod, mennyire egyezik a saját képed azzal, ahogyan a környezeted lát.`,
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
      thanks: "Best regards,",
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
    log.error({ event: "email.send_failed", template: "order_confirmation", to: params.to, err: error }, "Failed to send order confirmation");
  } else {
    log.info({ event: "email.sent", template: "order_confirmation", to: params.to }, "Order confirmation sent");
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
    log.error({ event: "email.send_failed", template: "observer_invite", to: params.to, err: error }, "Failed to send observer invite");
  } else {
    log.info({ event: "email.sent", template: "observer_invite", to: params.to }, "Observer invite sent");
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
    log.error({ event: "email.send_failed", template: "candidate_completed", to: params.to, err: error }, "Failed to send candidate completed");
  }
}

/** A megosztott profil publikus URL-je — a levél CTA-ja és a QR ugyanezt kódolja. */
export function profileShareUrl(token: string): string {
  return `${APP_URL}/share/${token}`;
}

/** A csatolt QR inline content-id-je — a HTML `cid:` hivatkozása erre mutat. */
const PROFILE_SHARE_QR_CID = "share-qr";

/**
 * Exportált a unit-tesztnek (QR-ág): a küldés maga Resend-et igényel, a
 * sablon-tartalom (cid-kép + magyarázat) így hívás nélkül ellenőrizhető.
 */
export function buildProfileShareHtml(params: {
  locale: Locale;
  senderName: string;
  token: string;
  /** Inline QR content-id — csak akkor kerül QR-blokk a levélbe, ha van. */
  qrCid?: string;
}): string {
  const t = translations.profileShare[params.locale];
  const cta = renderCtaButton({
    href: profileShareUrl(params.token),
    label: t.cta,
  });

  // QR-blokk a CTA alatt: fehér dobozban, hogy sötét módú kliensben is
  // biztosan beolvasható maradjon; alatta a rövid használati magyarázat.
  const qrBlock = params.qrCid
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0">
      <tr>
        <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;padding:12px">
          <img src="cid:${params.qrCid}" width="160" height="160" alt="${escapeHtml(t.qrAlt)}" style="display:block;width:160px;height:160px">
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:10px">
          <p class="em-muted" style="${EMAIL_P_MUTED};margin:0;text-align:center">${t.qrHint}</p>
        </td>
      </tr>
    </table>`
    : "";

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${t.body(params.senderName)}
    </p>
    ${cta}${qrBlock}`;

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
  /** Szerver-oldalon generált QR PNG (best-effort) — null/undefined: QR nélkül. */
  qrPng?: Buffer | null;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.profileShare[locale];
  const link = profileShareUrl(params.token);

  const text = [
    t.greeting,
    "",
    t.body(params.senderName),
    "",
    `${t.cta}: ${link}`,
    ...(params.qrPng ? ["", t.qrAttachmentNote] : []),
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
    html: buildProfileShareHtml({
      locale,
      senderName: params.senderName,
      token: params.token,
      qrCid: params.qrPng ? PROFILE_SHARE_QR_CID : undefined,
    }),
    text,
    // Resend 6.x: content base64 stringként, contentId-vel inline (cid:) kép —
    // a kliens csatolmányként is eléri (qrFilename), ha a cid-et nem rendereli.
    ...(params.qrPng
      ? {
          attachments: [
            {
              filename: t.qrFilename,
              content: params.qrPng.toString("base64"),
              contentType: "image/png",
              contentId: PROFILE_SHARE_QR_CID,
            },
          ],
        }
      : {}),
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "profile_share", to: params.to, err: error }, "Failed to send profile share");
    throw new Error("EMAIL_SEND_FAILED");
  }
  log.info({ event: "email.sent", template: "profile_share", to: params.to, qrAttached: Boolean(params.qrPng) }, "Profile share sent");
}

function buildCompareInviteHtml(params: {
  locale: Locale;
  senderName: string;
  token: string;
}): string {
  const t = translations.compareInvite[params.locale];
  const cta = renderCtaButton({
    href: `${APP_URL}/interaction/compare/${params.token}`,
    label: t.cta,
  });

  const bodyContent = `
    <p style="${EMAIL_P}">
      ${t.greeting}
    </p>
    <p style="${EMAIL_P};margin-bottom:24px">
      ${t.body(params.senderName)}
    </p>
    ${cta}
    <p style="${EMAIL_P};margin-top:24px;font-size:13px;color:${EMAIL_COLORS.faint}">
      ${t.footer}
    </p>`;

  return buildEmailLayout({
    locale: params.locale,
    bodyContent,
    thanks: t.thanks,
    team: t.team,
  });
}

// Reflexiós utókövetés (D1 follow-up) — ÉLETCIKLUS-email: kizárólag
// lifecycleEmailsOptOut=false mellett küldhető, leiratkozó-linkkel.
export async function sendReflectionPromptEmail(params: {
  to: string;
  dimLabel: string;
  locale?: Locale;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.reflectionPrompt[locale];
  const ctaLink = `${APP_URL}/interaction`;
  const optOutLink = `${APP_URL}/email-preferences`;

  const text = [
    t.greeting,
    "",
    t.body(params.dimLabel),
    "",
    t.body2,
    "",
    `${t.cta}: ${ctaLink}`,
    "",
    `${t.optOut} ${optOutLink}`,
    "",
    t.thanks,
    t.team,
  ].join("\n");

  const cta = renderCtaButton({ href: ctaLink, label: t.cta });
  const bodyContent = `
    <p style="${EMAIL_P}">${t.greeting}</p>
    <p style="${EMAIL_P}">${t.body(params.dimLabel)}</p>
    <p style="${EMAIL_P};margin-bottom:24px">${t.body2}</p>
    ${cta}
    <p style="${EMAIL_P};margin-top:28px;font-size:12px;color:${EMAIL_COLORS.faint}">
      ${t.optOut} <a href="${optOutLink}" style="color:${EMAIL_COLORS.faint}">${optOutLink}</a>
    </p>`;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html: buildEmailLayout({ locale, bodyContent, thanks: t.thanks, team: t.team }),
    text,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "reflection_prompt", to: params.to, err: error }, "Failed to send reflection prompt");
    throw new Error("EMAIL_SEND_FAILED");
  }
  log.info({ event: "email.sent", template: "reflection_prompt", to: params.to }, "Reflection prompt sent");
}

// Páros összehasonlítás meghívó (B1 follow-up) — a profil-megosztó email
// mintájára; a link a consent-oldalra visz.
export async function sendCompareInviteEmail(params: {
  to: string;
  senderName: string;
  token: string;
  locale?: Locale;
}): Promise<void> {
  const locale = params.locale ?? getLocale(params.to);
  const t = translations.compareInvite[locale];
  const link = `${APP_URL}/interaction/compare/${params.token}`;

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
    html: buildCompareInviteHtml({ locale, senderName: params.senderName, token: params.token }),
    text,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "compare_invite", to: params.to, err: error }, "Failed to send compare invite");
    throw new Error("EMAIL_SEND_FAILED");
  }
  log.info({ event: "email.sent", template: "compare_invite", to: params.to }, "Compare invite sent");
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
    log.error({ event: "email.send_failed", template: "observer_completion", to: params.to, err: error }, "Failed to send observer completion");
  } else {
    log.info({ event: "email.sent", template: "observer_completion", to: params.to }, "Observer completion email sent");
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
    log.error({ event: "email.send_failed", template: "verification_code", to: params.to, err: error }, "Failed to send verification code");
  } else {
    log.info({ event: "email.sent", template: "verification_code", to: params.to }, "Verification code sent");
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
    log.error({ event: "email.send_failed", template: "draft_reminder", to: params.to, err: error }, "Failed to send draft reminder");
  } else {
    log.info({ event: "email.sent", template: "draft_reminder", to: params.to }, "Draft reminder sent");
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
    log.warn({ event: "email.skipped", template: "coach_application", reason: "ADMIN_EMAIL not configured" }, "Coach application notification skipped");
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
    log.error({ event: "email.send_failed", template: "coach_application", to: adminEmail, err: error }, "Failed to send coach application notification");
  } else {
    log.info({ event: "email.sent", template: "coach_application", to: adminEmail }, "Coach application notification sent");
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
    log.error({ event: "email.send_failed", template: "magic_link", to: params.to, err: error }, "Failed to send magic link");
  } else {
    log.info({ event: "email.sent", template: "magic_link", to: params.to }, "Magic link sent");
  }
}

// ─── Team invite email (for users without an account) ────────────────────────

const teamInviteTranslations = {
  hu: {
    subject: (teamName: string) => `Meghívtak ${withHuArticle(teamName)} csapatba – Trita`,
    heading: (teamName: string) => `Meghívtak ${withHuArticle(teamName)} csapatba`,
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
    log.error({ event: "email.send_failed", template: "candidate_invite", to: params.to, err: error }, "Failed to send candidate invite");
    return false;
  }
  log.info({ event: "email.sent", template: "candidate_invite", to: params.to }, "Candidate invite sent");
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
    log.error({ event: "email.send_failed", template: "team_invite", to: params.to, err: error }, "Failed to send team invite");
    return false;
  }
  log.info({ event: "email.sent", template: "team_invite", to: params.to }, "Team invite sent");
  return true;
}

// ─── Org invite email ─────────────────────────────────────────────────────────

const orgInviteTranslations = {
  hu: {
    subject: (orgName: string) => `Meghívtak ${withHuArticle(orgName)} szervezetbe – Trita`,
    heading: (orgName: string) => `Meghívtak ${withHuArticle(orgName)} szervezetbe`,
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
    log.error({ event: "email.send_failed", template: "org_invite", to: params.to, err: error }, "Failed to send org invite");
    return false;
  }
  log.info({ event: "email.sent", template: "org_invite", to: params.to }, "Org invite sent");
  return true;
}

// ─── Consultant invite email ─────────────────────────────────────────────────
// Az admin tanácsadó-meghívójához (ConsultantInvite). Két eset: a profil már
// létezik (a hozzáférés azonnal aktív) vs. még nincs fiók (regisztrációra
// hívunk — a meghívó email-egyezéssel aktiválódik). Korábban SEMMILYEN email
// nem ment ki: az admin csak remélhette, hogy a meghívott magától regisztrál.

const consultantInviteTranslations = {
  hu: {
    subject: "Tanácsadói hozzáférés a Tritán",
    headingExisting: "Tanácsadói hozzáférést kaptál",
    headingNew: "Meghívtak a Tritára tanácsadóként",
    bodyExisting:
      "A fiókodhoz tanácsadói hozzáférést kapcsoltunk a Trita platformon. Belépés után eléred a hozzád rendelt szervezetek tanácsadói felületeit.",
    bodyNew:
      "Tanácsadói hozzáférést kaptál a Trita platformon. Regisztrálj ezzel az email-címmel, és a hozzáférés automatikusan aktiválódik az első belépéskor.",
    ctaExisting: "Belépés",
    ctaNew: "Regisztráció",
    footer: "Ha nem számítottál erre a meghívóra, hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    subject: "Consultant access on Trita",
    headingExisting: "You've been granted consultant access",
    headingNew: "You've been invited to Trita as a consultant",
    bodyExisting:
      "Consultant access has been attached to your account on the Trita platform. After signing in, you can access the consultant surfaces of your assigned organizations.",
    bodyNew:
      "You've been granted consultant access on the Trita platform. Register with this email address and the access activates automatically on your first sign-in.",
    ctaExisting: "Sign in",
    ctaNew: "Register",
    footer: "If you weren't expecting this invitation, simply ignore this email.",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

export async function sendConsultantInviteEmail(params: {
  to: string;
  /** true = a profil már létezik, a hozzáférés azonnal aktív. */
  hasAccount: boolean;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "hu";
  const t = consultantInviteTranslations[locale];
  const heading = params.hasAccount ? t.headingExisting : t.headingNew;
  const body = params.hasAccount ? t.bodyExisting : t.bodyNew;
  const cta = params.hasAccount ? t.ctaExisting : t.ctaNew;
  const ctaLink = params.hasAccount ? `${APP_URL}/sign-in` : `${APP_URL}/sign-up`;

  const html = buildEmailLayout({
    locale,
    heading,
    preheader: body,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:24px">${body}</p>
    ${renderCtaButton({ href: ctaLink, label: cta })}`,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text: `${heading}\n\n${body}\n\n${cta}: ${ctaLink}\n\n${t.footer}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "consultant_invite", to: params.to, err: error }, "Failed to send consultant invite");
    return false;
  }
  log.info({ event: "email.sent", template: "consultant_invite", to: params.to }, "Consultant invite sent");
  return true;
}

// ─── Measurement step email (lépés-nyitás / emlékeztető) ─────────────────────
// A MEASUREMENT_STEP_OPENED in-app értesítés email-párja (variant: "opened"),
// illetve a tanácsadói „Emlékeztető küldése" gomb emailje (variant:
// "reminder"). MŰKÖDÉSI email: a lifecycle-kapcsoló nem érinti (a kampányban
// a részvételről a szervezet és a tag állapodik meg, nem a platform).

const measurementStepTranslations = {
  hu: {
    openedSubject: (campaignName: string) => `Új lépés vár rád – ${campaignName}`,
    openedHeading: "Kinyílt a következő lépésed",
    openedBody: (campaignName: string) =>
      `A(z) „${campaignName}" mérésben kinyílt a következő lépésed. Néhány perc az egész — a többiek eredménye is akkor áll össze, ha mindenki kitölt.`,
    reminderSubject: (campaignName: string) => `Emlékeztető: kitöltés vár rád – ${campaignName}`,
    reminderHeading: "Egy kitöltés még vár rád",
    reminderBody: (campaignName: string) =>
      `A(z) „${campaignName}" mérésben még nyitott lépésed van. Néhány perc az egész — a csapat eredménye csak akkor áll össze, ha mindenki kitölt.`,
    cta: "Kitöltés megnyitása",
    footer:
      "Ezt az emailt azért kaptad, mert a szervezeted mérési körének résztvevője vagy.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    openedSubject: (campaignName: string) => `A new step is waiting for you – ${campaignName}`,
    openedHeading: "Your next step is open",
    openedBody: (campaignName: string) =>
      `Your next step in the "${campaignName}" measurement is now open. It only takes a few minutes — the team's results come together once everyone completes it.`,
    reminderSubject: (campaignName: string) => `Reminder: a step is waiting for you – ${campaignName}`,
    reminderHeading: "One step is still waiting for you",
    reminderBody: (campaignName: string) =>
      `You still have an open step in the "${campaignName}" measurement. It only takes a few minutes — the team's results come together once everyone completes it.`,
    cta: "Open the step",
    footer:
      "You received this email because you are a participant in your organization's measurement round.",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

export async function sendMeasurementStepEmail(params: {
  to: string;
  campaignName: string;
  /** In-app útvonal (pl. /assessment?campaign=…) — az APP_URL elé kerül. */
  link: string;
  variant: "opened" | "reminder";
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "hu";
  const t = measurementStepTranslations[locale];
  const subject =
    params.variant === "opened"
      ? t.openedSubject(params.campaignName)
      : t.reminderSubject(params.campaignName);
  const heading = params.variant === "opened" ? t.openedHeading : t.reminderHeading;
  const body =
    params.variant === "opened"
      ? t.openedBody(escapeHtml(params.campaignName))
      : t.reminderBody(escapeHtml(params.campaignName));
  const bodyText =
    params.variant === "opened"
      ? t.openedBody(params.campaignName)
      : t.reminderBody(params.campaignName);
  const ctaLink = `${APP_URL}${params.link.startsWith("/") ? params.link : `/${params.link}`}`;

  const html = buildEmailLayout({
    locale,
    heading,
    preheader: bodyText,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:24px">${body}</p>
    ${renderCtaButton({ href: ctaLink, label: t.cta })}`,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject,
    html,
    text: `${heading}\n\n${bodyText}\n\n${t.cta}: ${ctaLink}\n\n${t.footer}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "measurement_step", variant: params.variant, to: params.to, err: error }, "Failed to send measurement step email");
    return false;
  }
  log.info({ event: "email.sent", template: "measurement_step", variant: params.variant, to: params.to }, "Measurement step email sent");
  return true;
}

// ─── Welcome email (regisztráció után) ───────────────────────────────────────
// ÉLETCIKLUS-email: leiratkozó-linkkel megy; a regisztráció pillanatában
// opt-out még nem létezhet, ezért itt nem kell lifecycleEmailsOptOut-ot nézni.

const welcomeTranslations = {
  hu: {
    subject: "Üdvözlünk a Tritán!",
    preheader: "Az első lépés egy ~9 perces kitöltés — utána azonnal látod az eredményed.",
    heading: "Üdvözlünk a Tritán!",
    body1:
      "Örülünk, hogy itt vagy. A Trita hat személyiségdimenzió mentén mutatja meg, hogyan működsz — és ha csapatban dolgozol, azt is, hogyan működtök együtt.",
    body2:
      "Az első lépés egy rövid, ~9 perces kitöltés. A válaszaid alapján azonnal megkapod a részletes eredményedet.",
    cta: "Kezdés",
    optOut: "Ha nem szeretnél ilyen emaileket kapni:",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    subject: "Welcome to Trita!",
    preheader: "The first step is a ~9-minute assessment — you'll see your results right away.",
    heading: "Welcome to Trita!",
    body1:
      "We're glad you're here. Trita shows how you work along six personality dimensions — and if you work in a team, how you work together.",
    body2:
      "The first step is a short, ~9-minute assessment. You'll get your detailed results immediately based on your answers.",
    cta: "Get started",
    optOut: "If you'd rather not receive emails like this:",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

export async function sendWelcomeEmail(params: {
  to: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "hu";
  const t = welcomeTranslations[locale];
  const ctaLink = `${APP_URL}/dashboard`;
  const optOutLink = `${APP_URL}/email-preferences`;

  const html = buildEmailLayout({
    locale,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.body1}</p>
    <p style="${EMAIL_P};margin-bottom:24px">${t.body2}</p>
    ${renderCtaButton({ href: ctaLink, label: t.cta })}
    <p style="${EMAIL_P};margin-top:28px;font-size:12px;color:${EMAIL_COLORS.faint}">
      ${t.optOut} <a href="${optOutLink}" style="color:${EMAIL_COLORS.faint}">${optOutLink}</a>
    </p>`,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.heading}\n\n${t.body1}\n\n${t.body2}\n\n${t.cta}: ${ctaLink}\n\n${t.optOut} ${optOutLink}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "welcome", to: params.to, err: error }, "Failed to send welcome email");
    return false;
  }
  log.info({ event: "email.sent", template: "welcome", to: params.to }, "Welcome email sent");
  return true;
}

// ─── Team report published email ─────────────────────────────────────────────
// A tanácsadó által validált csapatriport publikálásakor megy a riport
// címzettjeinek (csapattagok + org vezetők) — a TEAM_REPORT_PUBLISHED in-app
// értesítés email-párja. MŰKÖDÉSI email (eredmény-értesítő): az
// email-preferences ígérete szerint a lifecycle-kapcsoló nem érinti.

const teamReportPublishedTranslations = {
  hu: {
    subject: (teamName: string) => `Elkészült a csapatriport – ${teamName}`,
    heading: (teamName: string) => `Elkészült ${withHuArticle(teamName)} csapat riportja`,
    body1:
      "A tanácsadó által validált csapatriport mostantól elérhető a platformon. A riport külön jelöli, mi mért, mi becsült és mi értelmezési nyelv.",
    cta: "Riport megnyitása",
    footer: "Ezt az emailt azért kaptad, mert a csapat riportjának címzettje vagy.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  },
  en: {
    subject: (teamName: string) => `Your team report is ready – ${teamName}`,
    heading: (teamName: string) => `The report for ${teamName} is ready`,
    body1:
      "The consultant-validated team report is now available on the platform. The report clearly marks what is measured, what is estimated, and what is interpretive language.",
    cta: "Open the report",
    footer: "You received this email because you are a recipient of this team's report.",
    thanks: "Best regards,",
    team: "the Trita team",
  },
};

export async function sendTeamReportPublishedEmail(params: {
  to: string;
  teamName: string;
  teamId: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "hu";
  const t = teamReportPublishedTranslations[locale];
  const ctaLink = `${APP_URL}/team/${params.teamId}?tab=report`;

  const html = buildEmailLayout({
    locale,
    heading: t.heading(escapeHtml(params.teamName)),
    preheader: t.body1,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:24px">${t.body1}</p>
    ${renderCtaButton({ href: ctaLink, label: t.cta })}`,
    footerDisclaimer: t.footer,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject(params.teamName),
    html,
    text: `${t.heading(params.teamName)}\n\n${t.body1}\n\n${t.cta}: ${ctaLink}\n\n${t.footer}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "team_report_published", to: params.to, err: error }, "Failed to send team report published email");
    return false;
  }
  log.info({ event: "email.sent", template: "team_report_published", to: params.to }, "Team report published email sent");
  return true;
}

// ─── Pilot application confirmation email ────────────────────────────────────

const pilotApplyConfirmationTranslations = {
  hu: {
    subject: "Megkaptuk a jelentkezésed – Trita Pilotprogram",
    preheader: "Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!",
    greeting: (name: string) => `Kedves ${name},`,
    body1: "Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!",
    body2:
      "24 órán belül személyesen kereslek, hogy megbeszéljük a részleteket és egyeztessünk egy rövid, kötelezettségmentes bevezető beszélgetést.",
    thanks: "Üdvözlettel,",
    team: "Leinad · Trita",
  },
  en: {
    subject: "We received your application – Trita Pilot Program",
    preheader: "Thank you for applying to the Trita Pilot Program!",
    greeting: (name: string) => `Dear ${name},`,
    body1: "Thank you for applying to the Trita Pilot Program!",
    body2:
      "I will personally reach out within 24 hours to discuss the details and set up a short, no-obligation intro conversation.",
    thanks: "Best regards,",
    team: "Leinad · Trita",
  },
};

export async function sendPilotApplyConfirmationEmail(params: {
  to: string;
  name: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "hu";
  const t = pilotApplyConfirmationTranslations[locale];
  const firstName = params.name.split(" ")[0] ?? params.name;

  const html = buildEmailLayout({
    locale,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting(escapeHtml(firstName))}</p>
    <p style="${EMAIL_P}">${t.body1}</p>
    <p style="${EMAIL_P};margin-bottom:0">${t.body2}</p>`,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.greeting(firstName)}\n\n${t.body1}\n\n${t.body2}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "pilot_apply_confirmation", to: params.to, err: error }, "Failed to send pilot apply confirmation");
    return false;
  }
  log.info({ event: "email.sent", template: "pilot_apply_confirmation", to: params.to }, "Pilot apply confirmation sent");
  return true;
}

// ─── Advisory request confirmation email ─────────────────────────────────────

const advisoryConfirmationTranslations = {
  hu: {
    subject: "Megkaptuk a konzultáció-igényed — Trita Advisory",
    preheader: "24 órán belül személyesen kereslek az időpont-egyeztetéssel.",
    greeting: (name: string) => `Kedves ${name},`,
    body1:
      "Megkaptuk a jelentkezésedet a tanácsadói konzultációra! 24 órán belül személyesen kereslek az időpont-egyeztetéssel.",
    body2:
      "A konzultáción a csapataid aktuális mintázataiból indulunk ki — nem kell semmit előkészítened.",
    thanks: "Üdvözlettel,",
    team: "Leinad · Trita",
  },
  en: {
    subject: "We received your consultation request — Trita Advisory",
    preheader: "I will personally reach out within 24 hours to schedule a time.",
    greeting: (name: string) => `Dear ${name},`,
    body1:
      "We received your request for an advisory consultation! I will personally reach out within 24 hours to schedule a time.",
    body2:
      "The consultation starts from your teams' current patterns — no preparation needed on your side.",
    thanks: "Best regards,",
    team: "Leinad · Trita",
  },
};

export async function sendAdvisoryConfirmationEmail(params: {
  to: string;
  name: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = params.locale ?? "hu";
  const t = advisoryConfirmationTranslations[locale];

  const html = buildEmailLayout({
    locale,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting(escapeHtml(params.name))}</p>
    <p style="${EMAIL_P}">${t.body1}</p>
    <p style="${EMAIL_P};margin-bottom:0">${t.body2}</p>`,
    thanks: t.thanks,
    team: t.team,
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.greeting(params.name)}\n\n${t.body1}\n\n${t.body2}\n\n${t.thanks}\n${t.team}`,
  });

  if (error) {
    log.error({ event: "email.send_failed", template: "advisory_confirmation", to: params.to, err: error }, "Failed to send advisory confirmation");
    return false;
  }
  log.info({ event: "email.sent", template: "advisory_confirmation", to: params.to }, "Advisory confirmation sent");
  return true;
}
