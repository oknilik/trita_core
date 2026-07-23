/**
 * Trita email-layout — közös vizuális keret MINDEN kimenő emailhez.
 *
 * 2026-07-23 egységesítés: fehér canvas, 640px konténer, lebegő sötét-sage
 * fejléc-kártya a wordmarkkal, 16px/26px törzsszöveg (mobilon is olvasható),
 * pill CTA, hairline elválasztó, halk lábléc. Mobil: .padding-mobile media
 * query 40px → 20px oldalpaddingre.
 *
 * Szabály: új email-sablon SOHA nem ír saját <html> vázat — buildEmailLayout-ot
 * használ, a bekezdésekhez az itt exportált stílus-konstansokat.
 */

import { EMAIL_COLORS } from "./design-tokens";

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO_STACK = "'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

// ─── Bekezdés-stílusok sablonokhoz (inline, kliens-biztos) ──────────────────
/** Törzs-bekezdés: 16px/26px — ez az alap, mobilon is kényelmes. */
export const EMAIL_P = `font-size:16px;line-height:26px;color:${EMAIL_COLORS.body};margin:0 0 16px`;
/** Halkabb kísérőszöveg (jogi/disclaimer jellegű, de még a törzsben). */
export const EMAIL_P_MUTED = `font-size:14px;line-height:22px;color:${EMAIL_COLORS.muted};margin:0 0 12px`;
/** Szekció-felirat (eyebrow) a törzsben. */
export const EMAIL_EYEBROW = `font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:${EMAIL_COLORS.muted};margin:0 0 6px`;
/** Lista a törzsben. */
export const EMAIL_UL = `font-size:16px;line-height:26px;color:${EMAIL_COLORS.body};margin:0 0 16px;padding:0 0 0 20px`;
export const EMAIL_LI = `padding:2px 0;color:${EMAIL_COLORS.body}`;

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Bulletproof CTA: table + td bgcolor Outlookra. A főoldali bronz gomb
 * képe: rounded-xl, fehér félkövér felirat. */
export function renderCtaButton(params: { href: string; label: string }): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:8px auto 0">
      <tr>
        <td bgcolor="${EMAIL_COLORS.ctaBg}"
            style="background-color:${EMAIL_COLORS.ctaBg};border-radius:16px;text-align:center">
          <a href="${params.href}" class="em-cta"
             style="display:inline-block;color:#ffffff;font-size:16px;font-weight:600;padding:15px 36px;text-decoration:none;border-radius:16px;line-height:1.3;font-family:${FONT_STACK}">
            ${params.label}
          </a>
        </td>
      </tr>
    </table>`.trim();
}

/** Címke/érték táblázat (admin-értesítők, jelentkezések). Az értéket a hívó escape-eli, ha kell. */
export function renderInfoTable(rows: Array<[label: string, valueHtml: string]>): string {
  const trs = rows
    .map(
      ([label, valueHtml]) =>
        `<tr>
          <td style="padding:9px 16px 9px 0;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:14px;font-weight:600;color:${EMAIL_COLORS.heading};white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:9px 0;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:14px;line-height:22px;color:${EMAIL_COLORS.body}">${valueHtml}</td>
        </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px">
      ${trs}
    </table>`.trim();
}

/** Kiemelt kód-doboz (verifikációs/bejelentkezési kód). */
export function renderCodeBox(params: { label: string; code: string }): string {
  return `
    <div class="em-code-box" style="background-color:${EMAIL_COLORS.surface};border:1px solid ${EMAIL_COLORS.border};border-radius:12px;padding:24px 20px;text-align:center;margin:0 0 20px">
      <p class="em-code-lbl" style="${EMAIL_EYEBROW};margin:0 0 10px">${params.label}</p>
      <div class="em-code-val" style="font-size:36px;font-weight:700;letter-spacing:.22em;color:${EMAIL_COLORS.heading};font-family:${MONO_STACK}">${params.code}</div>
    </div>`.trim();
}

export function buildEmailLayout(params: {
  locale: string;
  /** Cím a törzs tetején (nem a sötét fejlécben) — 22px, ink. */
  heading?: string;
  /** Rejtett előnézeti szöveg a tárgy után (inbox-lista). */
  preheader?: string;
  bodyContent: string;
  footerDisclaimer?: string;
  thanks?: string;
  team?: string;
}): string {
  const preheader = params.preheader
    ? `<div style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(params.preheader)}${"&nbsp;&zwnj;".repeat(90)}</div>`
    : "";

  const signOff =
    params.thanks || params.team
      ? `<p class="em-muted" style="font-size:13px;line-height:20px;color:${EMAIL_COLORS.muted};margin:0">
          ${params.thanks ?? ""}${params.thanks && params.team ? "<br>" : ""}${params.team ? `<strong style="color:${EMAIL_COLORS.body}">${params.team}</strong>` : ""}
        </p>`
      : "";

  return `<!DOCTYPE html>
<html lang="${params.locale}" style="color-scheme:light only">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
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
      .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      html, body    { background-color: ${EMAIL_COLORS.canvas} !important; }
      .em-canvas    { background-color: ${EMAIL_COLORS.canvas} !important; }
      .em-head      { background-color: ${EMAIL_COLORS.headerBg} !important; }
      .em-heading   { color: ${EMAIL_COLORS.heading} !important; }
      .em-body, .em-body p, .em-body li { color: ${EMAIL_COLORS.body} !important; }
      .em-muted     { color: ${EMAIL_COLORS.muted} !important; }
      .em-faint     { color: ${EMAIL_COLORS.faint} !important; }
      .em-code-box  { background-color: ${EMAIL_COLORS.surface} !important; }
      .em-code-lbl  { color: ${EMAIL_COLORS.muted} !important; }
      .em-code-val  { color: ${EMAIL_COLORS.heading} !important; }
      .em-cta       { background-color: ${EMAIL_COLORS.ctaBg} !important; color: #ffffff !important; }
      .em-wm-t      { color: ${EMAIL_COLORS.wordmarkT} !important; }
      .em-wm-body   { color: ${EMAIL_COLORS.wordmarkBody} !important; }
      .em-wm-a      { color: ${EMAIL_COLORS.wordmarkA} !important; }
    }
  </style>
</head>
<body bgcolor="${EMAIL_COLORS.canvas}" style="margin:0;padding:0;font-family:${FONT_STACK};background-color:${EMAIL_COLORS.canvas};color-scheme:light only">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_COLORS.canvas}" class="em-canvas" style="background-color:${EMAIL_COLORS.canvas}">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"
               class="email-container" style="width:640px;max-width:640px">

          <tr>
            <td class="padding-mobile" style="padding:24px 40px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="em-head" align="center" bgcolor="${EMAIL_COLORS.headerBg}"
                      style="background-color:${EMAIL_COLORS.headerBg};border-radius:12px;padding:24px 20px">
                    <span style="font-size:30px;font-weight:900;letter-spacing:-0.03em;font-family:Fraunces,Georgia,'Times New Roman',serif"><span class="em-wm-t" style="color:${EMAIL_COLORS.wordmarkT}">t</span><span class="em-wm-body" style="color:${EMAIL_COLORS.wordmarkBody}">rit</span><span class="em-wm-a" style="color:${EMAIL_COLORS.wordmarkA}">a</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${params.heading ? `
          <tr>
            <td class="padding-mobile" style="padding:32px 40px 0">
              <h1 class="em-heading" style="font-size:22px;line-height:30px;font-weight:700;color:${EMAIL_COLORS.heading};margin:0;font-family:${FONT_STACK}">${params.heading}</h1>
            </td>
          </tr>` : ""}

          <tr>
            <td class="padding-mobile em-body" style="padding:${params.heading ? "20px" : "32px"} 40px 8px;font-size:16px;line-height:26px;color:${EMAIL_COLORS.body};font-family:${FONT_STACK}">
              ${params.bodyContent}
            </td>
          </tr>

          <tr>
            <td class="padding-mobile" style="padding:24px 40px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="border-top:1px solid ${EMAIL_COLORS.border};font-size:1px;line-height:1px">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="padding-mobile" align="center" style="padding:0 40px 8px">
              ${params.footerDisclaimer ? `<p class="em-muted" style="font-size:12px;line-height:19px;color:${EMAIL_COLORS.muted};margin:0 0 12px">${params.footerDisclaimer}</p>` : ""}
              ${signOff}
            </td>
          </tr>

          <tr>
            <td class="padding-mobile" align="center" style="padding:20px 40px 36px">
              <p class="em-faint" style="font-size:12px;line-height:18px;color:${EMAIL_COLORS.faint};margin:0">
                &copy; trita 2026 &middot; trita.io
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
