import { resend, EMAIL_FROM } from "./resend";
import { createLogger } from "@/lib/logger";
import { withHuArticle } from "@/lib/hu-grammar";
import { EMAIL_COLORS } from "./design-tokens";
import {
  APP_URL,
  buildEmailLayout,
  emailArtAttachments,
  escapeHtml,
  renderCtaButton,
  renderCodeBox,
  EMAIL_P,
  EMAIL_P_MUTED,
} from "./email-layout";
// A `core`-ból, nem az i18n indexéből: az a TELJES szótárat behúzná (436 kB
// forrás) egy kétértékű enum és egy alapértelmezés kedvéért.
import { normalizeLocale, type Locale } from "./i18n/core";

const log = createLogger("email");

/**
 * NYELV-FELOLDÁS — egyetlen szabály, egyetlen alapértelmezés (2026-08-19).
 *
 * Élesben angolul mentek ki a levelek magyar felhasználóknak. Három ok
 * versengett egymással:
 *
 *   1. `getLocale(email)` a címzett e-mail-TLD-jéből tippelt: `.hu` → magyar,
 *      MINDEN MÁS → angol. Egy gmail.com-os magyar felhasználó tehát angolul
 *      kapta. Ez a heurisztika elvben rossz — a levélcím nem nyelvi jelzés —,
 *      ezért kivezetve, nem javítva.
 *   2. Hat küldő `?? "en"`-re esett vissza, hat másik `?? "hu"`-ra.
 *   3. A hívási helyek saját ternáriusai közül több `: "en"`-nel zárt.
 *
 * Mostantól MINDEN küldő a `normalizeLocale()`-t hívja, aminek az
 * alapértelmezése a `DEFAULT_LOCALE` — ugyanaz a „hu", amit az app minden más
 * felülete használ. A hívó felelőssége a felhasználó TÁROLT beállítását
 * (`UserProfile.locale`) átadni; ahol nincs fiók (külső meghívott), ott a
 * magyar az alapértelmezés.
 */

type ResendAttachment = {
  filename: string;
  content: string;
  contentType: string;
  contentId?: string;
};

/**
 * MINDEN kimenő levél ezen a kapun megy át.
 *
 * A `family` kötelező, mert a levél-eszközök (szójel, formanyelvi jel) `cid:`
 * INLINE csatolmányként utaznak, és a család dönti el, melyik kell. Ez a kapu
 * teszi szerkezetileg lehetetlenné, hogy egy sablon csatolmány nélkül menjen
 * ki — abból ugyanis törött kép lesz minden fogadónál, némán.
 *
 * (Az első kör hosztolt URL-eket használt; élesben nem töltődtek be. Ld.
 * `email-layout.ts` → `emailArtAttachments`.)
 */
async function sendEmail(params: {
  template: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Sablon-specifikus extra (ma: a megosztó-levél QR-kódja). */
  attachments?: ResendAttachment[];
  /**
   * Extra SMTP-fejlécek. Ma egyetlen fogyasztója van: a hírlevél-levelek
   * `List-Unsubscribe` + `List-Unsubscribe-Post` párosa. A Gmail és a Yahoo
   * tömeges-küldő szabályai megkövetelik az egykattintásos leiratkozást; e
   * nélkül a levél a spam felé csúszik, akkor is, ha a tartalom rendben van.
   */
  headers?: Record<string, string>;
  /** Extra log-mezők (variant, qrAttached…). */
  logFields?: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    ...(params.headers ? { headers: params.headers } : {}),
    attachments: [...emailArtAttachments(), ...(params.attachments ?? [])],
  });

  if (error) {
    log.error(
      { event: "email.send_failed", template: params.template, to: params.to, ...params.logFields, err: error },
      `Failed to send ${params.template}`,
    );
    return false;
  }
  log.info(
    { event: "email.sent", template: params.template, to: params.to, ...params.logFields },
    `${params.template} sent`,
  );
  return true;
}

/**
 * Kanonikus aláírás (2026-08-19).
 *
 * Négy variáns élt párhuzamosan — „a trita csapata" · „a Trita csapat" ·
 * „a Trita csapata" · „a trita rendszer" —, ami sablononként más hangot adott
 * ugyanannak a feladónak. A szójel kisbetűs, az aláírás ezt követi.
 *
 * Egyetlen dokumentált kivétel a `Leinad · Trita` a pilot- és advisory-
 * visszaigazoláson: azok SZEMÉLYES követő levelek („24 órán belül személyesen
 * kereslek"), ott a csapat-aláírás rendszerüzenetté hűtené a hangot.
 */
const SIGN_OFF: Record<Locale, { thanks: string; team: string }> = {
  hu: { thanks: "Üdvözlettel,", team: "a trita csapata" },
  en: { thanks: "Best regards,", team: "the trita team" },
};

/**
 * A dokumentált kivétel: SZEMÉLYES követő levél aláírása. Ld. a `SIGN_OFF`
 * megjegyzését — a pilot- és advisory-visszaigazolás nem rendszerüzenet.
 */
const PERSONAL_SIGN_OFF: Record<Locale, { thanks: string; team: string }> = {
  hu: { thanks: "Üdvözlettel,", team: "Leinad · Trita" },
  en: { thanks: "Best regards,", team: "Leinad · Trita" },
};

/** Életciklus-levelek leiratkozó-linkje — a láblécbe kerül, nem a törzsbe. */
const OPT_OUT: Record<Locale, { href: string; label: string }> = {
  hu: { href: `${APP_URL}/email-preferences`, label: "Levélbeállítások" },
  en: { href: `${APP_URL}/email-preferences`, label: "Email preferences" },
};

const translations = {
  observerInvite: {
    hu: {
      subject: "Meghívó személyiségteszt kitöltésére – Trita",
      kind: "Meghívó",
      eyebrow: "Külső nézőpont",
      heading: (inviter: string) => `${inviter} a te nézőpontodra kíváncsi`,
      preheader: "Néhány perc, és a válaszaid anonimak maradnak.",
      greeting: (_name: string) => "Szia,",
      body: (inviter: string) =>
        `${inviter} arra kér, hogy tölts ki róla egy rövid személyiségtesztet, hogy képet kapjon arról, hogyan látják őt mások.\n\nA te nézőpontod nagyon fontos. A válaszaid anonimak maradnak, és az eredmények csak összesítve (több értékelés átlaga alapján) jelennek meg.`,
      cta: "Visszajelzés kitöltése",
      footer:
        "Ha nem ismered a meghívót, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    },
    en: {
      subject: "Invitation to a personality assessment – Trita",
      kind: "Invitation",
      eyebrow: "Outside view",
      heading: (inviter: string) => `${inviter} would like your perspective`,
      preheader: "A few minutes, and your answers stay anonymous.",
      greeting: (_name: string) => "Hi,",
      body: (inviter: string) =>
        `${inviter} is asking you to complete a short personality questionnaire about them, to understand how others see them.\n\nYour perspective matters. Your answers stay anonymous, and results are shown only in aggregate (as an average across multiple responses).`,
      cta: "Open the feedback form",
      footer:
        "If you don't recognize this invitation, you can ignore this email.",
    },
  },
  observerCompletion: {
    hu: {
      subject: "Megérkezett egy visszajelzés – trita",
      kind: "Eredmény",
      eyebrow: "Visszajelzés érkezett",
      heading: "Megérkezett egy visszajelzés rólad",
      preheader: "Az egyik meghívottad kitöltötte a kérdőívet.",
      greeting: (name: string) => `Szia, ${name}!`,
      body: "Jó hír: az egyik meghívottad kitöltötte a kérdőívet. Nézd meg, hogyan látnak téged mások!",
      cta: "Megnézem az eredményeket",
    },
    en: {
      subject: "New feedback received – trita",
      kind: "Results",
      eyebrow: "Feedback received",
      heading: "New feedback about you has arrived",
      preheader: "One of the people you invited completed the questionnaire.",
      greeting: (name: string) => `Hi ${name}!`,
      body: "Great news: one of the people you invited completed the questionnaire. See how others perceive you!",
      cta: "View my results",
    },
  },
  candidateCompleted: {
    hu: {
      subject: "Jelölt-felmérés elkészült – trita",
      kind: "Jelölt",
      eyebrow: "Jelölt-felmérés",
      heading: "Elkészült egy jelölt-felmérés",
      preheader: "Az eredmény és a csapat-illesztés megnyitható.",
      greeting: "Szia,",
      body: (name: string, position: string | null) =>
        `${name}${position ? ` (${position})` : ""} kitöltötte a jelölt-felmérést. Az eredmény és a csapat-illesztés megnyitható a jelölt-részletezőn.`,
      cta: "Eredmény megnyitása",
    },
    en: {
      subject: "Candidate assessment completed – trita",
      kind: "Candidate",
      eyebrow: "Candidate assessment",
      heading: "A candidate assessment is complete",
      preheader: "The result and team fit are ready to review.",
      greeting: "Hi,",
      body: (name: string, position: string | null) =>
        `${name}${position ? ` (${position})` : ""} completed the candidate assessment. The result and team fit are ready to review.`,
      cta: "Open the result",
    },
  },
  profileShare: {
    hu: {
      subject: "Megosztott személyiségprofil – trita",
      kind: "Megosztás",
      eyebrow: "Megosztott profil",
      heading: (sender: string) => `${sender} megosztotta veled a profilját`,
      preheader: "Fő dimenziók, munkastílus és valószínű csapatszerepek.",
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
    },
    en: {
      subject: "A personality profile was shared with you – trita",
      kind: "Shared",
      eyebrow: "Shared profile",
      heading: (sender: string) => `${sender} shared their profile with you`,
      preheader: "Main dimensions, work style, and likely team roles.",
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
    },
  },
  reflectionPrompt: {
    hu: {
      subject: "Egy hét telt el — mit láttál magadból?",
      kind: "Emlékeztető",
      eyebrow: "Egy hét telt el",
      heading: "Mit láttál magadból ezen a héten?",
      preheader: "Figyeld meg a legerősebb dimenziódat egy konkrét helyzetben.",
      greeting: "Szia,",
      body: (dimLabel: string) =>
        `Egy hete készült el a személyiségprofilod. A legerősebb dimenziód ${withHuArticle(dimLabel)} volt — figyeld meg tudatosan egy konkrét helyzetben ezen a héten: mikor segített, és mikor pörgött túl?`,
      body2:
        "Ha kíváncsi vagy, hogyan működnétek együtt valakivel, a páros összehasonlítással meg is nézhetitek.",
      cta: "Páros összehasonlítás megnyitása",
      optOut: "Nem kérsz több ilyen emailt? Leiratkozás itt:",
    },
    en: {
      subject: "A week has passed — what did you notice?",
      kind: "Reminder",
      eyebrow: "One week on",
      heading: "What did you notice about yourself?",
      preheader: "Watch your strongest dimension in one concrete situation.",
      greeting: "Hi,",
      body: (dimLabel: string) =>
        `Your personality profile was completed a week ago. Your strongest dimension was ${dimLabel} — observe it deliberately in one concrete situation this week: when did it help, and when did it over-rev?`,
      body2:
        "If you're curious how you'd work with someone, the pair comparison will show you.",
      cta: "Open the pair comparison",
      optOut: "Don't want emails like this? Unsubscribe here:",
    },
  },
  compareInvite: {
    hu: {
      subject: "Hogyan működnétek együtt? – meghívó a tritán",
      kind: "Meghívó",
      eyebrow: "Páros összehasonlítás",
      heading: "Hogyan működnétek együtt?",
      preheader: "A számszerű pontszámaid nem jelennek meg a másik félnek.",
      greeting: "Szia,",
      body: (sender: string) =>
        `${sender} meghívott egy páros összehasonlításra a tritán: a saját kitöltésed után mindketten látjátok, mi menne köztetek magától, hol várható súrlódás, és mit érdemes előre megbeszélni. A számszerű pontszámaid nem jelennek meg neki.`,
      cta: "Meghívó megnyitása",
      footer:
        "A meghívó 30 napig él, és bármelyik fél bármikor visszavonhatja. Ha nem ismered a küldőt, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    },
    en: {
      subject: "How would you work together? – an invite on trita",
      kind: "Invitation",
      eyebrow: "Pair comparison",
      heading: "How would you work together?",
      preheader: "Your numeric scores are not shown to the other person.",
      greeting: "Hi,",
      body: (sender: string) =>
        `${sender} invited you to a pair comparison on trita: after completing your own assessment, you both see what would come easily between you, where friction is likely, and what to agree on up front. Your numeric scores are not shown to them.`,
      cta: "Open the invite",
      footer:
        "The invite lives for 30 days, and either side can revoke it at any time. If you don't recognize the sender, you can ignore this email.",
    },
  },
  verificationCode: {
    hu: {
      subject: "A regisztrációs kódod – trita",
      kind: "Biztonság",
      eyebrow: "Regisztrációs kód",
      heading: "Írd be ezt a kódot a folytatáshoz",
      preheader: "A kód rövid ideig érvényes, és csak egyszer használható fel.",
      codeLabel: "A kódod",
      ttl: (minutes?: number) =>
        minutes ? `A kód ${minutes} percig érvényes.` : "A kód rövid ideig érvényes.",
      footer:
        "Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    },
    en: {
      subject: "Your verification code – trita",
      kind: "Security",
      eyebrow: "Verification code",
      heading: "Enter this code to continue",
      preheader: "The code is valid for a short time and can be used once.",
      codeLabel: "Your code",
      ttl: (minutes?: number) =>
        minutes ? `This code is valid for ${minutes} minutes.` : "This code is valid for a short time.",
      footer:
        "If you didn't request this code, you can safely ignore this email.",
    },
  },
  signInCode: {
    hu: {
      subject: "A bejelentkezési kódod – trita",
      kind: "Biztonság",
      eyebrow: "Belépési kód",
      heading: "Írd be ezt a kódot a belépéshez",
      preheader: "A kód rövid ideig érvényes, és csak egyszer használható fel.",
      codeLabel: "A kódod",
      ttl: (minutes?: number) =>
        minutes ? `A kód ${minutes} percig érvényes.` : "A kód rövid ideig érvényes.",
      footer:
        "Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    },
    en: {
      subject: "Your sign-in code – trita",
      kind: "Security",
      eyebrow: "Sign-in code",
      heading: "Enter this code to sign in",
      preheader: "The code is valid for a short time and can be used once.",
      codeLabel: "Your code",
      ttl: (minutes?: number) =>
        minutes ? `This code is valid for ${minutes} minutes.` : "This code is valid for a short time.",
      footer:
        "If you didn't request this code, you can safely ignore this email.",
    },
  },
  magicLink: {
    hu: {
      subject: "Bejelentkezési link – Trita",
      kind: "Biztonság",
      eyebrow: "Bejelentkezési link",
      heading: "Lépj be egy kattintással",
      preheader: "A link 10 percig érvényes.",
      body: "Kattints az alábbi gombra a bejelentkezéshez. A link 10 percig érvényes.",
      cta: "Bejelentkezés",
      footer:
        "Ha nem te kérted ezt a linket, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    },
    en: {
      subject: "Your sign-in link – Trita",
      kind: "Security",
      eyebrow: "Sign-in link",
      heading: "Sign in with one click",
      preheader: "This link expires in 10 minutes.",
      body: "Click the button below to sign in to your account. This link expires in 10 minutes.",
      cta: "Sign in",
      footer:
        "If you didn't request this link, you can safely ignore this email.",
    },
  },
  assessmentDraftReminder: {
    hu: {
      subject: "Már majdnem kész vagy a teszttel – folytasd itt",
      kind: "Emlékeztető",
      eyebrow: "Félbehagyott kitöltés",
      heading: "Már majdnem kész vagy",
      preheader: "Néhány kérdés, és látod a részletes eredményedet.",
      greeting: (name: string) => `Szia, ${name}!`,
      body: (testName: string, answeredCount: number, totalCount: number) =>
        `Láttuk, hogy elkezdted ${withHuArticle(testName)} kitöltését a Tritán, de még nem fejezted be. Már ${answeredCount} kérdésen túl vagy a ${totalCount}-ból, szóval tényleg csak egy kis lépés választ el az eredményektől.\n\nHa befejezed, egy rövid visszajelzést kapsz arról, hogyan látod magad a fő személyiségdimenziók mentén. Ha szeretnéd, később másoktól is kérhetsz visszajelzést, így azt is láthatod, mennyire egyezik a saját képed azzal, ahogyan a környezeted lát.`,
      cta: "Folytatom a tesztet",
      footer: "Ha már befejezted a tesztet, nyugodtan hagyd figyelmen kívül ezt az üzenetet.",
    },
    en: {
      subject: "Continue your assessment – you're almost there! – trita",
      kind: "Reminder",
      eyebrow: "Unfinished assessment",
      heading: "You're almost there",
      preheader: "A few more questions and your detailed results are ready.",
      greeting: (name: string) => `Hi ${name}!`,
      body: (testName: string, answeredCount: number, totalCount: number) =>
        `We noticed you started the ${testName} personality assessment but haven't finished yet. You're already ${answeredCount} questions in out of ${totalCount} — you're almost there!\n\nYour results will show how you see yourself across the ${testName} dimensions, and you'll also get the chance to invite observers to compare their view with yours. Click below to pick up where you left off.`,
      cta: "Continue my assessment",
      footer: "If you've already completed the test, feel free to ignore this email.",
    },
  },
} as const;

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
    <p style="${EMAIL_P};margin-bottom:26px">
      ${bodyHtml}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading(escapeHtml(params.inviterName)),
    preheader: t.preheader,
    bodyContent,
    quietNote: t.footer,
    signOff: SIGN_OFF[params.locale],
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
  const locale = normalizeLocale(params.locale);
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  await sendEmail({
    template: "observer_invite",
    to: params.to,
    subject,
    html,
    text,
  });
}

export async function sendCandidateCompletedEmail(params: {
  to: string;
  candidateName: string;
  position?: string | null;
  resultUrl: string;
  locale?: Locale;
}): Promise<void> {
  const locale = normalizeLocale(params.locale);
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
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent,
    signOff: SIGN_OFF[locale],
  });
  const text = [
    t.greeting,
    "",
    t.body(params.candidateName, params.position ?? null),
    "",
    `${t.cta}: ${params.resultUrl}`,
    "",
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  await sendEmail({
    template: "candidate_completed",
    to: params.to,
    subject: t.subject,
    html,
    text,
  });
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

  // QR-blokk a CTA alatt: FEHÉR dobozban, hogy sötét módú kliensben is
  // biztosan beolvasható maradjon (a kód kontrasztja a beolvashatóság
  // feltétele — itt a krém felület sem elég). A fehér a `card` tokenből jön,
  // nem beégetett hexből.
  const qrBlock = params.qrCid
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="184" style="margin:24px auto 0;width:184px">
      <tr>
        <td align="center" bgcolor="${EMAIL_COLORS.card}" style="background-color:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};border-radius:16px;padding:12px">
          <img src="cid:${params.qrCid}" width="160" height="160" alt="${escapeHtml(t.qrAlt)}" style="display:block;width:160px;height:160px">
        </td>
      </tr>
    </table>
    <p class="em-muted" style="${EMAIL_P_MUTED};margin:10px 0 0;text-align:center">${t.qrHint}</p>`
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
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading(escapeHtml(params.senderName)),
    preheader: t.preheader,
    bodyContent,
    quietNote: t.footer,
    signOff: SIGN_OFF[params.locale],
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
  const locale = normalizeLocale(params.locale);
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  const ok = await sendEmail({
    template: "profile_share",
    logFields: { qrAttached: Boolean(params.qrPng) },
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

  if (!ok) throw new Error("EMAIL_SEND_FAILED");
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
    <p style="${EMAIL_P};margin-bottom:26px">
      ${t.body(params.senderName)}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent,
    quietNote: t.footer,
    signOff: SIGN_OFF[params.locale],
  });
}

// Reflexiós utókövetés (D1 follow-up) — ÉLETCIKLUS-email: kizárólag
// lifecycleEmailsOptOut=false mellett küldhető, leiratkozó-linkkel.
export async function sendReflectionPromptEmail(params: {
  to: string;
  dimLabel: string;
  locale?: Locale;
}): Promise<void> {
  const locale = normalizeLocale(params.locale);
  const t = translations.reflectionPrompt[locale];
  const ctaLink = `${APP_URL}/interaction`;

  const text = [
    t.greeting,
    "",
    t.body(params.dimLabel),
    "",
    t.body2,
    "",
    `${t.cta}: ${ctaLink}`,
    "",
    `${t.optOut} ${OPT_OUT[locale].href}`,
    "",
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  const cta = renderCtaButton({ href: ctaLink, label: t.cta });
  const bodyContent = `
    <p style="${EMAIL_P}">${t.greeting}</p>
    <p style="${EMAIL_P}">${t.body(params.dimLabel)}</p>
    <p style="${EMAIL_P};margin-bottom:26px">${t.body2}</p>
    ${cta}`;

  const ok = await sendEmail({
    template: "reflection_prompt",
    to: params.to,
    subject: t.subject,
    html: buildEmailLayout({
      locale,
      kind: t.kind,
      eyebrow: t.eyebrow,
      heading: t.heading,
      preheader: t.preheader,
      bodyContent,
      optOut: OPT_OUT[locale],
      signOff: SIGN_OFF[locale],
    }),
    text,
  });

  if (!ok) throw new Error("EMAIL_SEND_FAILED");
}

// Páros összehasonlítás meghívó (B1 follow-up) — a profil-megosztó email
// mintájára; a link a consent-oldalra visz.
export async function sendCompareInviteEmail(params: {
  to: string;
  senderName: string;
  token: string;
  locale?: Locale;
}): Promise<void> {
  const locale = normalizeLocale(params.locale);
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  const ok = await sendEmail({
    template: "compare_invite",
    to: params.to,
    subject: t.subject,
    html: buildCompareInviteHtml({ locale, senderName: params.senderName, token: params.token }),
    text,
  });

  if (!ok) throw new Error("EMAIL_SEND_FAILED");
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
    <p style="${EMAIL_P};margin-bottom:26px">
      ${t.body}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent,
    signOff: SIGN_OFF[params.locale],
  });
}

export async function sendObserverCompletionEmail(params: {
  to: string;
  inviterName: string;
  locale?: Locale;
}): Promise<void> {
  const locale = normalizeLocale(params.locale);
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  await sendEmail({
    template: "observer_completion",
    to: params.to,
    subject: t.subject,
    html,
    text,
  });
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
    <p style="${EMAIL_P};margin-bottom:0">
      ${t.ttl(params.ttlMinutes)}
    </p>`;

  return buildEmailLayout({
    locale: params.locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent,
    quietNote: t.footer,
    signOff: SIGN_OFF[params.locale],
  });
}

export async function sendVerificationCodeEmail(params: {
  to: string;
  code: string;
  locale?: Locale;
  ttlSeconds?: number | null;
  context?: "signUp" | "signIn";
}) {
  const locale = normalizeLocale(params.locale);
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  await sendEmail({
    template: "verification_code",
    to: params.to,
    subject: translationBlock.subject,
    html,
    text,
  });
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
    <p style="${EMAIL_P};margin-bottom:26px">
      ${bodyHtml}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent,
    quietNote: t.footer,
    optOut: OPT_OUT[params.locale],
    signOff: SIGN_OFF[params.locale],
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
  const locale = normalizeLocale(params.locale);
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  await sendEmail({
    template: "draft_reminder",
    to: params.to,
    subject: t.subject,
    html,
    text,
  });
}

function buildMagicLinkHtml(params: {
  locale: Locale;
  magicLinkUrl: string;
}): string {
  const t = translations.magicLink[params.locale];
  const cta = renderCtaButton({ href: params.magicLinkUrl, label: t.cta });

  const bodyContent = `
    <p style="${EMAIL_P};margin-bottom:26px">
      ${t.body}
    </p>
    ${cta}`;

  return buildEmailLayout({
    locale: params.locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent,
    quietNote: t.footer,
    signOff: SIGN_OFF[params.locale],
  });
}

export async function sendMagicLinkEmail(params: {
  to: string;
  magicLinkUrl: string;
  locale?: Locale;
}) {
  const locale = normalizeLocale(params.locale);
  const t = translations.magicLink[locale];
  const html = buildMagicLinkHtml({ locale, magicLinkUrl: params.magicLinkUrl });

  const text = [
    t.body,
    "",
    `${t.cta}: ${params.magicLinkUrl}`,
    "",
    t.footer,
    "",
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  await sendEmail({
    template: "magic_link",
    to: params.to,
    subject: t.subject,
    html,
    text,
  });
}

// ─── Team invite email (for users without an account) ────────────────────────

const teamInviteTranslations = {
  hu: {
    subject: (teamName: string) => `Meghívtak ${withHuArticle(teamName)} csapatba – Trita`,
    kind: "Meghívó",
    eyebrow: "Csapat",
    heading: (teamName: string) => `Meghívtak ${withHuArticle(teamName)} csapatba`,
    body: "Személyiségprofilod megosztásával csatlakozhatsz a csapathoz. Regisztrálj a Tritára, és automatikusan hozzáadunk!",
    cta: "Regisztráció és csatlakozás",
    footer: "Ha nem szeretnél csatlakozni, egyszerűen hagyd figyelmen kívül ezt az emailt.",
  },
  en: {
    subject: (teamName: string) => `You've been invited to join ${teamName} – Trita`,
    kind: "Invitation",
    eyebrow: "Team",
    heading: (teamName: string) => `You've been invited to join ${teamName}`,
    body: "Share your personality profile with your team by joining Trita. Register and you'll be added automatically!",
    cta: "Register and join",
    footer: "If you don't want to join, simply ignore this email.",
  },
};

// ─── Candidate invite email (for job applicants, no account needed) ──────────

const candidateInviteTranslations = {
  hu: {
    subject: (position?: string) =>
      position
        ? `Meghívó személyiségfelmérésre – ${position} pozíció`
        : "Meghívó személyiségfelmérésre",
    kind: "Meghívó",
    eyebrow: "Jelölt-felmérés",
    preheader: "Körülbelül 10–15 perc, regisztráció nélkül elvégezhető.",
    heading: (position?: string) =>
      position ? `Személyiségfelmérés – ${position}` : "Személyiségfelmérés",
    body: (managerName: string) =>
      `${managerName} meghívott, hogy töltsd ki az alábbi személyiségfelmérést. A teszt körülbelül 10–15 percet vesz igénybe, és regisztráció nélkül elvégezhető.`,
    cta: "Felmérés megkezdése",
    footer:
      "Ha nem számítottál erre az emailre, egyszerűen hagyd figyelmen kívül.",
  },
  en: {
    subject: (position?: string) =>
      position
        ? `Invitation to personality assessment – ${position}`
        : "Invitation to complete a personality assessment",
    kind: "Invitation",
    eyebrow: "Candidate assessment",
    preheader: "About 10–15 minutes, no registration needed.",
    heading: (position?: string) =>
      position ? `Personality assessment – ${position}` : "Personality assessment",
    body: (managerName: string) =>
      `${managerName} has invited you to complete a personality assessment. The questionnaire takes about 10–15 minutes and requires no registration.`,
    cta: "Start assessment",
    footer:
      "If you did not expect this email, you can safely ignore it.",
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
  const locale = normalizeLocale(params.locale);
  const tr = candidateInviteTranslations[locale];

  const html = buildEmailLayout({
    locale,
    kind: tr.kind,
    eyebrow: tr.eyebrow,
    heading: escapeHtml(tr.heading(params.position)),
    preheader: tr.preheader,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:26px">
      ${escapeHtml(tr.body(params.managerName))}
    </p>
    ${renderCtaButton({ href: params.applyUrl, label: tr.cta })}`,
    quietNote: tr.footer,
    signOff: SIGN_OFF[locale],
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
    SIGN_OFF[locale].thanks,
    SIGN_OFF[locale].team,
  ].join("\n");

  const ok = await sendEmail({
    template: "candidate_invite",
    to: params.to,
    subject: tr.subject(params.position),
    html,
    text,
  });

  return ok;
}

// ─── Team invite email (for users without an account) ────────────────────────

export async function sendTeamInviteEmail(params: {
  to: string;
  teamName: string;
  signUpUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = teamInviteTranslations[locale];

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading(escapeHtml(params.teamName)),
    preheader: t.body,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:26px">${t.body}</p>
    ${renderCtaButton({ href: params.signUpUrl, label: t.cta })}`,
    quietNote: t.footer,
    signOff: SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "team_invite",
    to: params.to,
    subject: t.subject(params.teamName),
    html,
    text: `${t.heading(params.teamName)}\n\n${t.body}\n\n${t.cta}: ${params.signUpUrl}\n\n${t.footer}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Org invite email ─────────────────────────────────────────────────────────

const orgInviteTranslations = {
  hu: {
    subject: (orgName: string) => `Meghívtak ${withHuArticle(orgName)} szervezetbe – Trita`,
    kind: "Meghívó",
    eyebrow: "Szervezet",
    heading: (orgName: string) => `Meghívtak ${withHuArticle(orgName)} szervezetbe`,
    body: "Regisztrálj a Tritára, és automatikusan csatlakozol a szervezethez. Kitöltheted a személyiségtesztet, és láthatod, hogyan illesz a csapatba.",
    cta: "Regisztráció és csatlakozás",
    footer: "Ha nem szeretnél csatlakozni, egyszerűen hagyd figyelmen kívül ezt az emailt.",
  },
  en: {
    subject: (orgName: string) => `You've been invited to join ${orgName} – Trita`,
    kind: "Invitation",
    eyebrow: "Organization",
    heading: (orgName: string) => `You've been invited to join ${orgName}`,
    body: "Register on Trita and you'll automatically join the organization. Complete the personality assessment to see how you fit with your team.",
    cta: "Register and join",
    footer: "If you don't want to join, simply ignore this email.",
  },
};

export async function sendOrgInviteEmail(params: {
  to: string;
  orgName: string;
  role: string;
  signUpUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = orgInviteTranslations[locale];

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading(escapeHtml(params.orgName)),
    preheader: t.body,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:26px">${t.body}</p>
    ${renderCtaButton({ href: params.signUpUrl, label: t.cta })}`,
    quietNote: t.footer,
    signOff: SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "org_invite",
    to: params.to,
    subject: t.subject(params.orgName),
    html,
    text: `${t.heading(params.orgName)}\n\n${t.body}\n\n${t.cta}: ${params.signUpUrl}\n\n${t.footer}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Consultant invite email ─────────────────────────────────────────────────
// Az admin tanácsadó-meghívójához (ConsultantInvite). Két eset: a profil már
// létezik (a hozzáférés azonnal aktív) vs. még nincs fiók (regisztrációra
// hívunk — a meghívó email-egyezéssel aktiválódik). Korábban SEMMILYEN email
// nem ment ki: az admin csak remélhette, hogy a meghívott magától regisztrál.

const consultantInviteTranslations = {
  hu: {
    subject: "Tanácsadói hozzáférés a Tritán",
    kind: "Meghívó",
    eyebrow: "Tanácsadói hozzáférés",
    headingExisting: "Tanácsadói hozzáférést kaptál",
    headingNew: "Meghívtak a Tritára tanácsadóként",
    bodyExisting:
      "A fiókodhoz tanácsadói hozzáférést kapcsoltunk a Trita platformon. Belépés után eléred a hozzád rendelt szervezetek tanácsadói felületeit.",
    bodyNew:
      "Tanácsadói hozzáférést kaptál a Trita platformon. Regisztrálj ezzel az email-címmel, és a hozzáférés automatikusan aktiválódik az első belépéskor.",
    ctaExisting: "Belépés",
    ctaNew: "Regisztráció",
    footer: "Ha nem számítottál erre a meghívóra, hagyd figyelmen kívül ezt az emailt.",
  },
  en: {
    subject: "Consultant access on Trita",
    kind: "Invitation",
    eyebrow: "Consultant access",
    headingExisting: "You've been granted consultant access",
    headingNew: "You've been invited to Trita as a consultant",
    bodyExisting:
      "Consultant access has been attached to your account on the Trita platform. After signing in, you can access the consultant surfaces of your assigned organizations.",
    bodyNew:
      "You've been granted consultant access on the Trita platform. Register with this email address and the access activates automatically on your first sign-in.",
    ctaExisting: "Sign in",
    ctaNew: "Register",
    footer: "If you weren't expecting this invitation, simply ignore this email.",
  },
};

export async function sendConsultantInviteEmail(params: {
  to: string;
  /** true = a profil már létezik, a hozzáférés azonnal aktív. */
  hasAccount: boolean;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = consultantInviteTranslations[locale];
  const heading = params.hasAccount ? t.headingExisting : t.headingNew;
  const body = params.hasAccount ? t.bodyExisting : t.bodyNew;
  const cta = params.hasAccount ? t.ctaExisting : t.ctaNew;
  const ctaLink = params.hasAccount ? `${APP_URL}/sign-in` : `${APP_URL}/sign-up`;

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading,
    preheader: body,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:26px">${body}</p>
    ${renderCtaButton({ href: ctaLink, label: cta })}`,
    quietNote: t.footer,
    signOff: SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "consultant_invite",
    to: params.to,
    subject: t.subject,
    html,
    text: `${heading}\n\n${body}\n\n${cta}: ${ctaLink}\n\n${t.footer}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Measurement step email (lépés-nyitás / emlékeztető) ─────────────────────
// A MEASUREMENT_STEP_OPENED in-app értesítés email-párja (variant: "opened"),
// illetve a tanácsadói „Emlékeztető küldése" gomb emailje (variant:
// "reminder"). MŰKÖDÉSI email: a lifecycle-kapcsoló nem érinti (a kampányban
// a részvételről a szervezet és a tag állapodik meg, nem a platform).

const measurementStepTranslations = {
  hu: {
    openedSubject: (campaignName: string) => `Új lépés vár rád – ${campaignName}`,
    kind: "Mérés",
    openedEyebrow: "Kampány-lépés",
    reminderEyebrow: "Emlékeztető",
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
  },
  en: {
    openedSubject: (campaignName: string) => `A new step is waiting for you – ${campaignName}`,
    kind: "Measurement",
    openedEyebrow: "Campaign step",
    reminderEyebrow: "Reminder",
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
  const locale = normalizeLocale(params.locale);
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
    kind: t.kind,
    eyebrow: params.variant === "opened" ? t.openedEyebrow : t.reminderEyebrow,
    heading,
    preheader: bodyText,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:26px">${body}</p>
    ${renderCtaButton({ href: ctaLink, label: t.cta })}`,
    quietNote: t.footer,
    signOff: SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "measurement_step",
    logFields: { variant: params.variant },
    to: params.to,
    subject,
    html,
    text: `${heading}\n\n${bodyText}\n\n${t.cta}: ${ctaLink}\n\n${t.footer}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Welcome email (regisztráció után) ───────────────────────────────────────
// ÉLETCIKLUS-email: leiratkozó-linkkel megy; a regisztráció pillanatában
// opt-out még nem létezhet, ezért itt nem kell lifecycleEmailsOptOut-ot nézni.

const welcomeTranslations = {
  hu: {
    subject: "Üdvözlünk a Tritán!",
    kind: "Üdvözlet",
    eyebrow: "Első lépés",
    preheader: "Az első lépés egy ~9 perces kitöltés — utána azonnal látod az eredményed.",
    heading: "Üdvözlünk a Tritán!",
    body1:
      "Örülünk, hogy itt vagy. A Trita hat személyiségdimenzió mentén mutatja meg, hogyan működsz — és ha csapatban dolgozol, azt is, hogyan működtök együtt.",
    body2:
      "Az első lépés egy rövid, ~9 perces kitöltés. A válaszaid alapján azonnal megkapod a részletes eredményedet.",
    cta: "Kezdés",
    optOut: "Ha nem szeretnél ilyen emaileket kapni:",
  },
  en: {
    subject: "Welcome to Trita!",
    kind: "Welcome",
    eyebrow: "First step",
    preheader: "The first step is a ~9-minute assessment — you'll see your results right away.",
    heading: "Welcome to Trita!",
    body1:
      "We're glad you're here. Trita shows how you work along six personality dimensions — and if you work in a team, how you work together.",
    body2:
      "The first step is a short, ~9-minute assessment. You'll get your detailed results immediately based on your answers.",
    cta: "Get started",
    optOut: "If you'd rather not receive emails like this:",
  },
};

export async function sendWelcomeEmail(params: {
  to: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = welcomeTranslations[locale];
  const ctaLink = `${APP_URL}/dashboard`;

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.body1}</p>
    <p style="${EMAIL_P};margin-bottom:26px">${t.body2}</p>
    ${renderCtaButton({ href: ctaLink, label: t.cta })}`,
    optOut: OPT_OUT[locale],
    signOff: SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "welcome",
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.heading}\n\n${t.body1}\n\n${t.body2}\n\n${t.cta}: ${ctaLink}\n\n${t.optOut} ${OPT_OUT[locale].href}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Team report published email ─────────────────────────────────────────────
// A tanácsadó által validált csapatriport publikálásakor megy a riport
// címzettjeinek (csapattagok + org vezetők) — a TEAM_REPORT_PUBLISHED in-app
// értesítés email-párja. MŰKÖDÉSI email (eredmény-értesítő): az
// email-preferences ígérete szerint a lifecycle-kapcsoló nem érinti.

const teamReportPublishedTranslations = {
  hu: {
    subject: (teamName: string) => `Elkészült a csapatriport – ${teamName}`,
    kind: "Eredmény",
    eyebrow: "Csapatriport",
    heading: (teamName: string) => `Elkészült ${withHuArticle(teamName)} csapat riportja`,
    body1:
      "A tanácsadó által validált csapatriport mostantól elérhető a platformon. A riport külön jelöli, mi mért, mi becsült és mi értelmezési nyelv.",
    cta: "Riport megnyitása",
    footer: "Ezt az emailt azért kaptad, mert a csapat riportjának címzettje vagy.",
  },
  en: {
    subject: (teamName: string) => `Your team report is ready – ${teamName}`,
    kind: "Results",
    eyebrow: "Team report",
    heading: (teamName: string) => `The report for ${teamName} is ready`,
    body1:
      "The consultant-validated team report is now available on the platform. The report clearly marks what is measured, what is estimated, and what is interpretive language.",
    cta: "Open the report",
    footer: "You received this email because you are a recipient of this team's report.",
  },
};

export async function sendTeamReportPublishedEmail(params: {
  to: string;
  teamName: string;
  teamId: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = teamReportPublishedTranslations[locale];
  const ctaLink = `${APP_URL}/team/${params.teamId}?tab=report`;

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading(escapeHtml(params.teamName)),
    preheader: t.body1,
    bodyContent: `
    <p style="${EMAIL_P};margin-bottom:26px">${t.body1}</p>
    ${renderCtaButton({ href: ctaLink, label: t.cta })}`,
    quietNote: t.footer,
    signOff: SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "team_report_published",
    to: params.to,
    subject: t.subject(params.teamName),
    html,
    text: `${t.heading(params.teamName)}\n\n${t.body1}\n\n${t.cta}: ${ctaLink}\n\n${t.footer}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Pilot application confirmation email ────────────────────────────────────

const pilotApplyConfirmationTranslations = {
  hu: {
    subject: "Megkaptuk a jelentkezésed – Trita Pilotprogram",
    kind: "Visszaigazolás",
    eyebrow: "Pilotprogram",
    heading: "Megkaptuk a jelentkezésed",
    preheader: "24 órán belül személyesen kereslek a részletekkel.",
    greeting: (name: string) => `Kedves ${name},`,
    body1: "Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!",
    body2:
      "24 órán belül személyesen kereslek, hogy megbeszéljük a részleteket és egyeztessünk egy rövid, kötelezettségmentes bevezető beszélgetést.",
  },
  en: {
    subject: "We received your application – Trita Pilot Program",
    kind: "Confirmation",
    eyebrow: "Pilot program",
    heading: "We received your application",
    preheader: "I will personally reach out within 24 hours.",
    greeting: (name: string) => `Dear ${name},`,
    body1: "Thank you for applying to the Trita Pilot Program!",
    body2:
      "I will personally reach out within 24 hours to discuss the details and set up a short, no-obligation intro conversation.",
  },
};

export async function sendPilotApplyConfirmationEmail(params: {
  to: string;
  name: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = pilotApplyConfirmationTranslations[locale];
  const firstName = params.name.split(" ")[0] ?? params.name;

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting(escapeHtml(firstName))}</p>
    <p style="${EMAIL_P}">${t.body1}</p>
    <p style="${EMAIL_P};margin-bottom:0">${t.body2}</p>`,
    signOff: PERSONAL_SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "pilot_apply_confirmation",
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.greeting(firstName)}\n\n${t.body1}\n\n${t.body2}\n\n${PERSONAL_SIGN_OFF[locale].thanks}\n${PERSONAL_SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Advisory request confirmation email ─────────────────────────────────────

const advisoryConfirmationTranslations = {
  hu: {
    subject: "Megkaptuk a konzultáció-igényed — Trita Advisory",
    kind: "Visszaigazolás",
    eyebrow: "Trita Advisory",
    heading: "Megkaptuk a konzultáció-igényed",
    preheader: "24 órán belül személyesen kereslek az időpont-egyeztetéssel.",
    greeting: (name: string) => `Kedves ${name},`,
    body1:
      "Megkaptuk a jelentkezésedet a tanácsadói konzultációra! 24 órán belül személyesen kereslek az időpont-egyeztetéssel.",
    body2:
      "A konzultáción a csapataid aktuális mintázataiból indulunk ki — nem kell semmit előkészítened.",
  },
  en: {
    subject: "We received your consultation request — Trita Advisory",
    kind: "Confirmation",
    eyebrow: "Trita Advisory",
    heading: "We received your consultation request",
    preheader: "I will personally reach out within 24 hours to schedule a time.",
    greeting: (name: string) => `Dear ${name},`,
    body1:
      "We received your request for an advisory consultation! I will personally reach out within 24 hours to schedule a time.",
    body2:
      "The consultation starts from your teams' current patterns — no preparation needed on your side.",
  },
};

export async function sendAdvisoryConfirmationEmail(params: {
  to: string;
  name: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = advisoryConfirmationTranslations[locale];

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting(escapeHtml(params.name))}</p>
    <p style="${EMAIL_P}">${t.body1}</p>
    <p style="${EMAIL_P};margin-bottom:0">${t.body2}</p>`,
    signOff: PERSONAL_SIGN_OFF[locale],
  });

  const ok = await sendEmail({
    template: "advisory_confirmation",
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.greeting(params.name)}\n\n${t.body1}\n\n${t.body2}\n\n${PERSONAL_SIGN_OFF[locale].thanks}\n${PERSONAL_SIGN_OFF[locale].team}`,
  });

  return ok;
}

// ─── Jelölt-kredit igénylés (org adminnak) ───────────────────────────────────
// Korábban a `/api/hiring/request-credits` route-ban komponálódott inline — ez
// volt az EGYETLEN sablon az email-modulon kívül, saját (rossz domainre mutató)
// APP_URL-fallbackkel. RENDSZER-levél: admin-értesítő, textúra-jel nélkül.

export async function sendHiringCreditsRequestEmail(params: {
  to: string;
  requesterName: string;
  orgName: string;
  orgId: string;
}): Promise<boolean> {
  const ctaLink = `${APP_URL}/hiring/${params.orgId}`;

  const html = buildEmailLayout({
    locale: "hu",
    kind: "Rendszer",
    eyebrow: "Kredit-igénylés",
    heading: "Elfogyott a jelölt-kreditkeret",
    preheader: `${params.requesterName} krediteket kér a(z) ${params.orgName} szervezethez.`,
    bodyContent: `
    <p style="${EMAIL_P}">
      <strong>${escapeHtml(params.requesterName)}</strong> jelölt értékelési krediteket kér
      a(z) <strong>${escapeHtml(params.orgName)}</strong> szervezethez.
    </p>
    <p style="${EMAIL_P};margin-bottom:26px">
      A jelenlegi kreditkeret üres. Tölts fel krediteket, hogy a csapat folytathassa
      a jelöltértékelést.
    </p>
    ${renderCtaButton({ href: ctaLink, label: "Kreditek feltöltése" })}`,
    quietNote: "Ezt a levelet azért kaptad, mert a szervezet adminisztrátora vagy.",
    signOff: SIGN_OFF.hu,
  });

  const ok = await sendEmail({
    template: "hiring_credits_request",
    to: params.to,
    subject: `Jelölt kredit igénylés – ${params.orgName}`,
    html,
    text: `${params.requesterName} jelölt értékelési krediteket kér a(z) ${params.orgName} szervezethez.\n\nKreditek feltöltése: ${ctaLink}\n\n${SIGN_OFF.hu.thanks}\n${SIGN_OFF.hu.team}`,
  });

  return ok;
}

// ─── Hírlevél / blog-feliratkozás ────────────────────────────────────────────
//
// KÉT SABLON, KÉT SZEREP:
//   · a MEGERŐSÍTŐ levél tranzakcionális (a látogató kérte, egy gombja van),
//   · az ÚJ CIKK levél tömeges — ez az egyetlen levélcsaládunk, ami
//     `List-Unsubscribe` fejlécet visz és leiratkozó linket tesz a láblécbe.
//
// A leiratkozó link SOSEM a `/email-preferences`-re megy (az belépést kér, a
// feliratkozók többségének pedig nincs fiókja), hanem a token-alapú,
// auth nélküli `/api/newsletter/unsubscribe`-ra.

/**
 * Egykattintásos leiratkozás fejlécei (RFC 8058).
 *
 * A `List-Unsubscribe-Post` jelenti be, hogy a levelező ELŐZETES megerősítés
 * nélkül POST-olhat a linkre — ezért kell a végpontnak idempotensnek lennie
 * és GET-re is működnie.
 */
function newsletterUnsubHeaders(unsubUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

const newsletterConfirmTranslations = {
  hu: {
    subject: "Erősítsd meg a feliratkozásod – Trita",
    kind: "Megerősítés",
    eyebrow: "Feliratkozás",
    heading: "Már csak egy kattintás",
    preheader: "Erősítsd meg, hogy tényleg te kérted az értesítőt.",
    greeting: "Szia,",
    body: "Valaki (feltehetően te) feliratkozott a Trita értesítőjére ezzel az email címmel. Ha tényleg te voltál, erősítsd meg az alábbi gombbal — enélkül nem küldünk semmit.",
    what: "Ezután új blogbejegyzésnél és időnként egy-egy gyakorlati összefoglalónál keresünk meg. Nem gyakran, és bármikor leiratkozhatsz.",
    cta: "Feliratkozás megerősítése",
    quiet: "Ha nem te kérted, nincs teendőd — a link 7 nap múlva magától lejár, és addig sem küldünk semmit.",
  },
  en: {
    subject: "Confirm your subscription – Trita",
    kind: "Confirmation",
    eyebrow: "Subscription",
    heading: "One click to go",
    preheader: "Confirm that you really asked for our updates.",
    greeting: "Hi,",
    body: "Someone (probably you) subscribed to Trita updates with this email address. If it was you, confirm with the button below — without it we won't send anything.",
    what: "After that we'll write when a new article goes live, plus the occasional practical summary. Not often, and you can unsubscribe any time.",
    cta: "Confirm subscription",
    quiet: "If this wasn't you, there's nothing to do — the link expires on its own in 7 days, and we won't send anything in the meantime.",
  },
};

/**
 * Double opt-in megerősítő levél.
 *
 * Nincs benne leiratkozó link és `List-Unsubscribe` fejléc: még nincs mihez
 * képest leiratkozni — a nem-megerősített feliratkozás magától elévül.
 */
export async function sendNewsletterConfirmEmail(params: {
  to: string;
  confirmUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = newsletterConfirmTranslations[locale];

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: t.heading,
    preheader: t.preheader,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting}</p>
    <p style="${EMAIL_P}">${t.body}</p>
    <p style="${EMAIL_P_MUTED};margin-bottom:26px">${t.what}</p>
    ${renderCtaButton({ href: params.confirmUrl, label: t.cta })}`,
    quietNote: t.quiet,
    signOff: SIGN_OFF[locale],
  });

  return sendEmail({
    template: "newsletter_confirm",
    to: params.to,
    subject: t.subject,
    html,
    text: `${t.greeting}\n\n${t.body}\n\n${t.what}\n\n${t.cta}: ${params.confirmUrl}\n\n${t.quiet}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
  });
}

const newBlogPostTranslations = {
  hu: {
    subject: (title: string) => `Új cikk: ${title}`,
    kind: "Értesítő",
    eyebrow: "Új a blogon",
    greeting: "Szia,",
    intro: "Új cikk jelent meg a Trita blogon:",
    cta: "Cikk elolvasása",
    readingTime: (minutes: number) => `${minutes} perc olvasás`,
    quiet: "Ezt a levelet azért kaptad, mert feliratkoztál a Trita értesítőjére.",
    unsubLabel: "Leiratkozás",
  },
  en: {
    subject: (title: string) => `New article: ${title}`,
    kind: "Update",
    eyebrow: "New on the blog",
    greeting: "Hi,",
    intro: "A new article is up on the Trita blog:",
    cta: "Read the article",
    readingTime: (minutes: number) => `${minutes} min read`,
    quiet: "You're receiving this because you subscribed to Trita updates.",
    unsubLabel: "Unsubscribe",
  },
};

/**
 * Új blogbejegyzés értesítő — az EGYETLEN tömeges levelünk.
 *
 * Amit a tranzakcionális sablonoktól eltérően kötelezően visz:
 *   · `List-Unsubscribe` + `List-Unsubscribe-Post` fejléc,
 *   · látható leiratkozó link a láblécben (token-alapú, belépés nélküli).
 */
export async function sendNewBlogPostEmail(params: {
  to: string;
  postTitle: string;
  postDescription: string;
  postUrl: string;
  readingMinutes: number;
  unsubUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = newBlogPostTranslations[locale];

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: params.postTitle,
    preheader: params.postDescription,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting}</p>
    <p style="${EMAIL_P}">${t.intro}</p>
    <p style="${EMAIL_P}"><strong>${escapeHtml(params.postTitle)}</strong><br>${escapeHtml(params.postDescription)}</p>
    <p style="${EMAIL_P_MUTED};margin-bottom:26px">${t.readingTime(params.readingMinutes)}</p>
    ${renderCtaButton({ href: params.postUrl, label: t.cta })}`,
    quietNote: t.quiet,
    optOut: { href: params.unsubUrl, label: t.unsubLabel },
    signOff: SIGN_OFF[locale],
  });

  return sendEmail({
    template: "newsletter_blog_post",
    to: params.to,
    subject: t.subject(params.postTitle),
    html,
    text: `${t.greeting}\n\n${t.intro}\n\n${params.postTitle}\n${params.postDescription}\n${t.readingTime(params.readingMinutes)}\n\n${t.cta}: ${params.postUrl}\n\n${t.quiet}\n${t.unsubLabel}: ${params.unsubUrl}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
    headers: newsletterUnsubHeaders(params.unsubUrl),
  });
}

// ─── Szerkesztett hírlevél-szám ──────────────────────────────────────────────
//
// A cikk-értesítő gépi (megjelent egy cikk → megy egy levél). Ez a másik
// forma: a szerkesztő ír egy nyitó bekezdést, és beválogat 2-3 cikket. Havi
// 4-5 cikknél ez váltja ki a cikkenkénti levelet.
//
// Ugyanaz a tömeges-levél szabálykészlet vonatkozik rá, mint a cikk-értesítőre:
// `List-Unsubscribe` fejléc + látható leiratkozó link a láblécben.

const newsletterIssueTranslations = {
  hu: {
    kind: "Hírlevél",
    eyebrow: "Trita hírlevél",
    greeting: "Szia,",
    itemsHeading: "Amiről írtunk",
    readingTime: (minutes: number) => `${minutes} perc olvasás`,
    quiet: "Ezt a levelet azért kaptad, mert feliratkoztál a Trita értesítőjére.",
    unsubLabel: "Leiratkozás",
  },
  en: {
    kind: "Newsletter",
    eyebrow: "Trita newsletter",
    greeting: "Hi,",
    itemsHeading: "What we wrote about",
    readingTime: (minutes: number) => `${minutes} min read`,
    quiet: "You're receiving this because you subscribed to Trita updates.",
    unsubLabel: "Unsubscribe",
  },
};

export interface NewsletterIssueItem {
  title: string;
  description: string;
  url: string;
  readingMinutes: number;
}

export async function sendNewsletterIssueEmail(params: {
  to: string;
  subject: string;
  /** A szerkesztő nyitó szövege — SIMA szöveg, üres sorral tagolt bekezdések. */
  intro: string;
  items: NewsletterIssueItem[];
  unsubUrl: string;
  locale?: Locale;
}): Promise<boolean> {
  const locale = normalizeLocale(params.locale);
  const t = newsletterIssueTranslations[locale];

  // A bevezető a szerkesztőtől jön, tehát NEM megbízható HTML: escape-eljük,
  // és csak a bekezdés-tördelést értelmezzük. Ez a sablon egyetlen helye,
  // ahol ember által írt szöveg kerül a levélbe.
  const introHtml = params.intro
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="${EMAIL_P}">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");

  const itemsHtml = params.items
    .map(
      (item) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 18px">
      <tr>
        <td style="padding:14px 16px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px">
          <a href="${item.url}" style="font-size:16px;line-height:24px;font-weight:700;color:${EMAIL_COLORS.heading};text-decoration:none">${escapeHtml(item.title)}</a>
          <p style="${EMAIL_P};margin:6px 0 8px">${escapeHtml(item.description)}</p>
          <p style="${EMAIL_P_MUTED};margin:0">${t.readingTime(item.readingMinutes)}</p>
        </td>
      </tr>
    </table>`,
    )
    .join("");

  const html = buildEmailLayout({
    locale,
    kind: t.kind,
    eyebrow: t.eyebrow,
    heading: params.subject,
    preheader: params.items[0]?.title ?? params.subject,
    bodyContent: `
    <p style="${EMAIL_P}">${t.greeting}</p>
    ${introHtml}
    ${
      params.items.length > 0
        ? `<p style="${EMAIL_P};font-weight:700;margin-top:26px">${t.itemsHeading}</p>${itemsHtml}`
        : ""
    }`,
    quietNote: t.quiet,
    optOut: { href: params.unsubUrl, label: t.unsubLabel },
    signOff: SIGN_OFF[locale],
  });

  const textItems = params.items
    .map((item) => `- ${item.title}\n  ${item.description}\n  ${item.url}`)
    .join("\n\n");

  return sendEmail({
    template: "newsletter_issue",
    to: params.to,
    subject: params.subject,
    html,
    text: `${t.greeting}\n\n${params.intro}\n\n${t.itemsHeading}:\n\n${textItems}\n\n${t.quiet}\n${t.unsubLabel}: ${params.unsubUrl}\n\n${SIGN_OFF[locale].thanks}\n${SIGN_OFF[locale].team}`,
    headers: newsletterUnsubHeaders(params.unsubUrl),
  });
}
