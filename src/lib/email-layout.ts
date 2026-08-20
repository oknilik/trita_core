/**
 * Trita email-layout — közös vizuális keret MINDEN kimenő emailhez.
 *
 * 2026-08-19 arculati átállás. A keret 2026-07-23-án készült el, és azóta
 * érintetlen maradt, miközben a felület megkapta a jelentés-alapú szín-
 * rendszert (08-05), a háromszintű formanyelvet (08-09), a lezárt tipográfiai
 * skálát és a webbel egységes PDF-riportot (08-18). Ez a kör hozza be a
 * levelet ugyanoda:
 *
 *   · KRÉM vászon + FEHÉR kártya — az app `surface-canvas` / `surface-card`
 *     viszonya. A levél eddig kártya nélkül, tiszta fehérre írt.
 *   · KANONIKUS szójel — egyszínű `trıta` egyetlen bronz i-ponttal
 *     (TritaLogo.tsx / PdfWordmark.tsx paritás). A háromszínű `t·rit·a`
 *     plakett kivezetve.
 *   · ZSÁLYA elsődleges gomb fehér felirattal (6,06:1). A bronz + fehér
 *     3,28:1 volt — AA-bukó minden levélben.
 *   · EYEBROW + CÍMSOR kötelező minden sablonon (a típus a szerződésben van,
 *     nem konvencióban): a 21 layout-hívásból eddig 8 adott címsort.
 *   · SARKOK a rendszer létráján: kártya 20 (`radius-2xl`), gomb 12
 *     (`radius-lg`). Eddig fordítva volt.
 *   · FORMANYELV 3. szintje (csillag + nap + ellensúly) a láblécben, az
 *     ügyfél-családon. Dekoráció, nem állít mérési tartalmat — pontosan ezért
 *     vihető levélbe is.
 *
 * Szabály: új email-sablon SOHA nem ír saját <html> vázat — buildEmailLayout-ot
 * használ, a bekezdésekhez az itt exportált stílus-konstansokat.
 */

import { EMAIL_COLORS } from "./design-tokens";
import { EMAIL_ART, type EmailArtAsset } from "./email-art";

/**
 * Az abszolút URL-ek bázisa (CTA-linkek és a lábléc-eszközök).
 *
 * Modul-szintű konstans: a Turbopack egy ismert hibája eldobja a függvényen
 * BELÜL deklarált `const appUrl`-t, ezért a levél-réteg sosem olvassa a
 * process.env-et hívási helyen.
 */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL
  ?? process.env.APP_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://trita.io")
).replace(/\/+$/, "");

/**
 * Betűkép. A `<link>`-elt webfontot csak a WebKit-alapú kliensek töltik be
 * (Apple Mail, iOS Mail); a Gmail és az Outlook a tartalék-stackre esik,
 * ezért a tartalék NEM generikus, hanem illesztett: a Fraunces mellé Georgia,
 * a DM Sans mellé a rendszer-humanista sor.
 *
 * Az Outlook (Word-renderelő) külön eset: ismeretlen betűcsalád mellett NEM a
 * következő stack-elemre lép, hanem Times New Roman-ra esik. Ezért megy a
 * webfont-link mso-feltételes blokkba, és ezért kap az Outlook saját
 * `mso-font-alt` kijelölést.
 */
const SANS_STACK =
  "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const DISPLAY_STACK = "Fraunces,Georgia,'Times New Roman',serif";
const MONO_STACK = "'DM Mono','SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

const WEBFONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700"
  + "&family=Fraunces:opsz,wght@9..144,600&display=swap";

// ─── Bekezdés-stílusok sablonokhoz (inline, kliens-biztos) ──────────────────
/**
 * Törzs-bekezdés: 16px/26px.
 *
 * Ez a skála egyetlen dokumentált levél-kivétele. A webes `text-body` 15px, de
 * a levél mobil-inboxban, gyakran rossz fényviszonyok között olvasódik, és
 * nincs zoom-kontextus körülötte. Ugyanaz az elv, ahogy a PDF pt-ben méretez:
 * a médium diktálja a fokot, a SZEREP marad közös.
 */
export const EMAIL_P = `font-size:16px;line-height:26px;color:${EMAIL_COLORS.body};margin:0 0 16px`;
/** Halkabb kísérőszöveg a törzsben. */
export const EMAIL_P_MUTED = `font-size:14px;line-height:22px;color:${EMAIL_COLORS.muted};margin:0 0 12px`;
export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * A levél-eszközök `cid:` INLINE csatolmányként utaznak, nem hosztolt URL-en.
 *
 * A hosztolt változat (2026-08-19 első kör) élesben NEM töltődött be: a
 * küldéskor kiszámolt `NEXT_PUBLIC_APP_URL` nem feltétlenül az a hoszt, ahová
 * az eszköz kikerült, a preview-deployt pedig a Vercel deployment protection
 * amúgy sem engedi kép-kérésre. A `data:` URI-t a Gmail eltávolítja. A `cid:`
 * az egyetlen forma, amit a levél MAGÁVAL VISZ — nincs hoszt-, deploy- vagy
 * env-függése.
 *
 * A csatolmányokat a küldő rakja a levélre (`emailArtAttachments`); a
 * guardrail-teszt őrzi, hogy minden `cid:` hivatkozáshoz tartozzon csatolmány.
 */
function cidRef(asset: EmailArtAsset): string {
  return `cid:${asset.cid}`;
}

/**
 * Resend-csatolmányok a levél eszközeihez.
 *
 * MINDEN levél mindkét eszközt viszi. A korábbi „két család" szabály (a
 * kód- és magic-link-levél jel nélkül ment) 2026-08-20-án kivezetve: a
 * felületen látható egyenetlenséget okozott, cserébe egyetlen valódi
 * különbséget hordozott. Ha nincs feltétel, nincs mit elrontani.
 */
export function emailArtAttachments(): Array<{
  filename: string;
  content: string;
  contentType: string;
  contentId: string;
}> {
  const assets: EmailArtAsset[] = [EMAIL_ART.wordmark, EMAIL_ART.mark];
  return assets.map((a) => ({
    filename: a.filename,
    content: a.base64,
    contentType: "image/png",
    contentId: a.cid,
  }));
}

/**
 * Bulletproof elsődleges CTA: table + td bgcolor Outlookra.
 *
 * Zsálya felület, fehér felirat — az app `action-primary` párja. A 15px-es
 * függőleges padding + 16/1.3 sor együtt 49px magas célt ad, tehát a 44px-es
 * érintő-minimum fölött van.
 */
export function renderCtaButton(params: { href: string; label: string }): string {
  return renderButton({ ...params, tone: "primary" });
}

/**
 * MÁSODLAGOS AKCIÓ (ma nincs hívója): bronz felület TINTA felirattal
 * (5,20:1) — az `actionSecondary*` tokenek. A fehér felirat ott 3,28:1
 * lenne; ugyanezért tartja a web is sötéten a `--palette-text-on-accent`-et.
 * A szabályt a kontraszt-teszt őrzi, a gomb maga ehhez a két tokenhez
 * három sor.
 */
function renderButton(params: {
  href: string;
  label: string;
  tone: "primary";
}): string {
  const bg = EMAIL_COLORS.actionPrimaryBg;
  const fg = EMAIL_COLORS.actionPrimaryFg;
  const cls = "em-cta";
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 0">
      <tr>
        <td bgcolor="${bg}" style="background-color:${bg};border-radius:12px;text-align:center">
          <a href="${params.href}" class="${cls}"
             style="display:inline-block;color:${fg};font-size:16px;font-weight:600;padding:15px 30px;text-decoration:none;border-radius:12px;line-height:1.3;font-family:${SANS_STACK}">
            ${params.label}
          </a>
        </td>
      </tr>
    </table>`.trim();
}

/**
 * Eyebrow — a `SectionEyebrow` primitív levél-párja: tónus-színű pötty +
 * 11px/0,14em/600 verzál felirat.
 *
 * Két cellás táblázat, nem `inline-block` span: az Outlook Word-renderelője
 * nem sorolja be megbízhatóan az inline-block elemeket. A pötty egy 5×5-ös
 * színezett cella — a `border-radius`-t nem támogató kliensben apró négyzet
 * lesz belőle, ami ezen a méreten nem megkülönböztethető.
 */
function renderEyebrow(params: { label: string }): string {
  const dot = EMAIL_COLORS.accent;
  const fg = EMAIL_COLORS.accentText;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px">
      <tr>
        <td valign="middle" style="padding:0 8px 0 0;line-height:1">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="em-dot" width="5" height="5" bgcolor="${dot}"
                  style="width:5px;height:5px;line-height:5px;font-size:5px;border-radius:5px;background-color:${dot}">&nbsp;</td>
            </tr>
          </table>
        </td>
        <td valign="middle" class="em-eyebrow"
            style="font-family:${SANS_STACK};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${fg};line-height:1.3">${escapeHtml(params.label)}</td>
      </tr>
    </table>`.trim();
}

/** Kiemelt kód-doboz (verifikációs/bejelentkezési kód). */
export function renderCodeBox(params: { label: string; code: string }): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px">
      <tr>
        <td class="em-code-box" align="center" bgcolor="${EMAIL_COLORS.surface}"
            style="background-color:${EMAIL_COLORS.surface};border:1px solid ${EMAIL_COLORS.border};border-radius:16px;padding:26px 20px">
          <p class="em-code-lbl" style="font-family:${SANS_STACK};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLORS.muted};margin:0 0 12px">${escapeHtml(params.label)}</p>
          <div class="em-code-val" style="font-size:34px;font-weight:500;letter-spacing:0.2em;color:${EMAIL_COLORS.heading};font-family:${MONO_STACK}">${escapeHtml(params.code)}</div>
        </td>
      </tr>
    </table>`.trim();
}

export interface EmailLayoutParams {
  locale: string;
  /** A fejléc jobb oldalán álló típus-felirat (1–2 szó). */
  kind: string;
  /** Eyebrow a kártya tetején. Kötelező: ez mondja meg, MILYEN levél. */
  eyebrow: string;
  /** Fraunces címsor a kártya tetején. Kötelező. */
  heading: string;
  /** Rejtett inbox-előnézet a tárgy után. Kötelező. */
  preheader: string;
  bodyContent: string;
  /** Halk zárás a kártya alján: feltétel, időkorlát, „nem te voltál". */
  quietNote?: string;
  /** Életciklus-levél leiratkozó-linkje — a láblécbe kerül, nem a törzsbe. */
  optOut?: { href: string; label: string };
  signOff: { thanks: string; team: string };
}

export function buildEmailLayout(params: EmailLayoutParams): string {
  const preheader = `<div style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(params.preheader)}${"&nbsp;&zwnj;".repeat(90)}</div>`;

  // A formanyelv 3. szintje: csillag + bronz nap + zsálya ellensúly. MINDEN
  // levél láblécében, kivétel nélkül — az aláírás fölött.
  //
  // `cid:` inline csatolmány, NEM data: URI — a Gmail eltávolítja a data-URI
  // képforrásokat, és az inline SVG-t sem rendereli. `alt=""` +
  // `role="presentation"`: kikapcsolt képeknél nyomtalanul eltűnik.
  const artMark = `<img src="${cidRef(EMAIL_ART.mark)}" width="${EMAIL_ART.mark.width}" height="${EMAIL_ART.mark.height}" alt="" role="presentation" style="display:block;margin:0 auto 16px;border:0;width:${EMAIL_ART.mark.width}px;height:${EMAIL_ART.mark.height}px">`;

  const optOut = params.optOut
    ? `<span class="em-sep" style="color:${EMAIL_COLORS.border}">&nbsp;·&nbsp;</span><a href="${params.optOut.href}" class="em-foot-link" style="color:${EMAIL_COLORS.muted};text-decoration:underline">${escapeHtml(params.optOut.label)}</a>`
    : "";

  const quietNote = params.quietNote
    ? `<p class="em-quiet" style="font-size:14px;line-height:22px;color:${EMAIL_COLORS.muted};margin:22px 0 0;padding-top:18px;border-top:1px solid ${EMAIL_COLORS.border}">${params.quietNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${params.locale}" style="color-scheme:light only">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <!--[if !mso]><!-->
  <link rel="stylesheet" href="${WEBFONT_HREF}">
  <!--<![endif]-->
  <!--[if mso]>
  <style>
    /* Az Outlook Word-renderelője ismeretlen családnál Times New Roman-ra
       esik, nem a stack következő elemére — ezért kap explicit kijelölést. */
    body, table, td, p, a, li, div { font-family: Arial, sans-serif !important; }
    .em-display { font-family: Georgia, serif !important; }
  </style>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; height: auto; line-height: 100%; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    :root { color-scheme: light only; }
    html, body { color-scheme: light only !important; }
    @media only screen and (max-width: 660px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .padding-mobile { padding-left: 16px !important; padding-right: 16px !important; }
      .em-card-pad { padding: 28px 22px 26px !important; }
    }
    /* Több kliens (Apple Mail, Outlook.com) sötét módban SAJÁT inverziót futtat
       a levélen. A color-scheme:light only ezt nem mindenhol állítja meg,
       ezért a világos értékeket itt újra kimondjuk — így a levél nem esik
       félig invertált, olvashatatlan köztes állapotba. Ez tehát nem duplázás:
       ez az egyetlen hely, ahol a sötét kliens felülírható. */
    @media (prefers-color-scheme: dark) {
      html, body     { background-color: ${EMAIL_COLORS.canvas} !important; }
      .em-canvas     { background-color: ${EMAIL_COLORS.canvas} !important; }
      .em-card       { background-color: ${EMAIL_COLORS.card} !important; }
      .em-heading    { color: ${EMAIL_COLORS.heading} !important; }
      .em-body, .em-body p, .em-body li, .em-body strong { color: ${EMAIL_COLORS.body} !important; }
      .em-muted, .em-quiet, .em-foot-link, .em-kind, .em-code-lbl { color: ${EMAIL_COLORS.muted} !important; }
      .em-eyebrow    { color: ${EMAIL_COLORS.accentText} !important; }
      .em-dot        { background-color: ${EMAIL_COLORS.accent} !important; }
      .em-code-box   { background-color: ${EMAIL_COLORS.surface} !important; }
      .em-code-val   { color: ${EMAIL_COLORS.heading} !important; }
      .em-cta        { background-color: ${EMAIL_COLORS.actionPrimaryBg} !important; color: ${EMAIL_COLORS.actionPrimaryFg} !important; }
    }
  </style>
</head>
<body bgcolor="${EMAIL_COLORS.canvas}" style="margin:0;padding:0;font-family:${SANS_STACK};background-color:${EMAIL_COLORS.canvas};color-scheme:light only">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_COLORS.canvas}" class="em-canvas" style="background-color:${EMAIL_COLORS.canvas}">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"
               class="email-container" style="width:640px;max-width:640px">

          <tr>
            <td class="padding-mobile" style="padding:28px 24px 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${APP_URL}" style="text-decoration:none">
                      <img src="${cidRef(EMAIL_ART.wordmark)}" width="${EMAIL_ART.wordmark.width}" height="${EMAIL_ART.wordmark.height}" alt="trita"
                           style="display:block;border:0;width:${EMAIL_ART.wordmark.width}px;height:${EMAIL_ART.wordmark.height}px;font-family:${DISPLAY_STACK};font-size:26px;font-weight:700;color:${EMAIL_COLORS.wordmark};text-decoration:none">
                    </a>
                  </td>
                  <td align="right" valign="middle" class="em-kind"
                      style="font-family:${SANS_STACK};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLORS.muted}">${escapeHtml(params.kind)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="padding-mobile" style="padding:0 24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     bgcolor="${EMAIL_COLORS.card}" class="em-card"
                     style="background-color:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};border-radius:20px">
                <tr>
                  <td class="em-card-pad em-body" style="padding:34px 36px 32px;font-family:${SANS_STACK};font-size:16px;line-height:26px;color:${EMAIL_COLORS.body}">
                    ${renderEyebrow({ label: params.eyebrow })}
                    <h1 class="em-heading em-display" style="font-family:${DISPLAY_STACK};font-size:26px;line-height:32px;font-weight:600;letter-spacing:-0.012em;color:${EMAIL_COLORS.heading};margin:0 0 16px">${params.heading}</h1>
                    ${params.bodyContent}
                    ${quietNote}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="padding-mobile" align="center" style="padding:26px 24px 40px">
              ${artMark}
              <p class="em-muted" style="font-family:${SANS_STACK};font-size:13px;line-height:20px;color:${EMAIL_COLORS.muted};margin:0 0 14px">
                ${escapeHtml(params.signOff.thanks)}<br><strong style="color:${EMAIL_COLORS.body}">${escapeHtml(params.signOff.team)}</strong>
              </p>
              <p class="em-muted" style="font-family:${SANS_STACK};font-size:12px;line-height:20px;color:${EMAIL_COLORS.muted};margin:0">
                <a href="${APP_URL}" class="em-foot-link" style="color:${EMAIL_COLORS.muted};text-decoration:underline">trita.io</a><span class="em-sep" style="color:${EMAIL_COLORS.border}">&nbsp;·&nbsp;</span>&copy; 2026${optOut}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
