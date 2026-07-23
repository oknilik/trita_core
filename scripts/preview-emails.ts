/**
 * Email-sablon előnézet-generátor (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-emails.ts [kimeneti-mappa]
 * A közös email-layout.ts-ből rendereli a fő sablon-típusokat statikus
 * HTML-fájlokba, hogy böngészőben ellenőrizhető legyen a design.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildEmailLayout,
  renderCtaButton,
  renderCodeBox,
  renderInfoTable,
  escapeHtml,
  EMAIL_P,
  EMAIL_P_MUTED,
  EMAIL_EYEBROW,
  EMAIL_UL,
  EMAIL_LI,
} from "../src/lib/email-layout";

const outDir = process.argv[2] ?? join(process.cwd(), ".email-previews");
mkdirSync(outDir, { recursive: true });

const samples: Record<string, string> = {
  "observer-invite": buildEmailLayout({
    locale: "hu",
    preheader: "Kata arra kér, hogy tölts ki róla egy rövid személyiségtesztet.",
    bodyContent: `
      <p style="${EMAIL_P}">Szia,</p>
      <p style="${EMAIL_P};margin-bottom:24px">
        <span style="font-weight:700;font-style:italic">Nagy Kata</span> arra kér, hogy tölts ki róla egy rövid személyiségtesztet, hogy képet kapjon arról, hogyan látják őt mások.<br><br>
        A te nézőpontod nagyon fontos. A válaszaid anonimak maradnak, és az eredmények csak összesítve (több értékelés átlaga alapján) jelennek meg.
      </p>
      ${renderCtaButton({ href: "https://trita.io/observe/token", label: "Visszajelzés kitöltése" })}`,
    footerDisclaimer: "Ha nem ismered a meghívót, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a trita csapata",
  }),

  "verification-code": buildEmailLayout({
    locale: "hu",
    bodyContent: `
      ${renderCodeBox({ label: "A kódod:", code: "482913" })}
      <p style="${EMAIL_P_MUTED}">A kód 10 percig érvényes.</p>
      <p style="${EMAIL_P_MUTED};margin-bottom:0">Ha nem te kérted a kódot, nyugodtan hagyd figyelmen kívül ezt az emailt.</p>`,
    thanks: "Üdvözlettel,",
    team: "a trita csapata",
  }),

  "team-invite": buildEmailLayout({
    locale: "hu",
    heading: "Meghívtak a(z) Termék csapat csapatba",
    preheader: "Személyiséges profilod megosztásával csatlakozhatsz a csapathoz.",
    bodyContent: `
      <p style="${EMAIL_P};margin-bottom:24px">Személyiséges profilod megosztásával csatlakozhatsz a csapathoz. Regisztrálj a Tritára, és automatikusan hozzáadjuk!</p>
      ${renderCtaButton({ href: "https://trita.io/join/token", label: "Regisztráció és csatlakozás" })}`,
    footerDisclaimer: "Ha nem szeretnél csatlakozni, egyszerűen hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  }),

  "order-confirmation": buildEmailLayout({
    locale: "hu",
    heading: "Köszönjük a vásárlást!",
    bodyContent: `
      <p style="${EMAIL_P}">Kedves Anna,</p>
      <p style="${EMAIL_P}">A fizetésedet feldolgoztuk. A Pro funkcióid azonnal elérhetők.</p>
      <p style="${EMAIL_EYEBROW}">Amit most elérsz:</p>
      <ul style="${EMAIL_UL};margin-bottom:24px">
        <li style="${EMAIL_LI}">Részletes, személyre szabott kiértékelés</li>
        <li style="${EMAIL_LI}">Személyiségtípus meghatározás</li>
        <li style="${EMAIL_LI}">Fejlődés követés</li>
        <li style="${EMAIL_LI}">PDF export</li>
      </ul>
      ${renderCtaButton({ href: "https://trita.io/dashboard", label: "Ugrás a vezérlőre" })}`,
    footerDisclaimer: "Ha kérdésed van, válaszolj erre az emailre. Szívesen segítünk!",
    thanks: "Üdvözlettel,",
    team: "a trita csapata",
  }),

  "admin-pilot": buildEmailLayout({
    locale: "hu",
    heading: "Új pilotprogram jelentkezés",
    bodyContent: `
      ${renderInfoTable([
        ["Név", escapeHtml("Kovács Péter")],
        ["Email", `<a href="mailto:peter@ceg.hu" style="color:#c17f4a">peter@ceg.hu</a>`],
        ["Cég", escapeHtml("Példa Kft.")],
        ["Csapatméret", "12–25 fő"],
        ["Kérdés", escapeHtml("Mennyi idő a bevezetés egy 15 fős csapatnál?")],
      ])}
      <p style="${EMAIL_P_MUTED};margin-bottom:0">Válaszolj 24 órán belül · trita.io/pilot</p>`,
  }),
};

const index = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Trita email előnézetek</title></head>
<body style="font-family:sans-serif;padding:24px">
<h1>Trita email előnézetek</h1>
<ul>${Object.keys(samples).map((k) => `<li><a href="./${k}.html">${k}</a></li>`).join("")}</ul>
</body></html>`;

for (const [name, html] of Object.entries(samples)) {
  writeFileSync(join(outDir, `${name}.html`), html);
}
writeFileSync(join(outDir, "index.html"), index);
console.log(`Előnézetek: ${outDir} (${Object.keys(samples).length} sablon + index)`);
