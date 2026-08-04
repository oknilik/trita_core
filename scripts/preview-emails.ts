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
    preheader: "Személyiségprofilod megosztásával csatlakozhatsz a csapathoz.",
    bodyContent: `
      <p style="${EMAIL_P};margin-bottom:24px">Személyiségprofilod megosztásával csatlakozhatsz a csapathoz. Regisztrálj a Tritára, és automatikusan hozzáadunk!</p>
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

  "observer-completion": buildEmailLayout({
    locale: "hu",
    bodyContent: `
      <p style="${EMAIL_P}">Szia, Anna!</p>
      <p style="${EMAIL_P};margin-bottom:24px">Jó hír: az egyik meghívottad kitöltötte a kérdőívet. Nézd meg, hogyan látnak téged mások!</p>
      ${renderCtaButton({ href: "https://trita.io/dashboard", label: "Megnézem az eredményeket" })}`,
    thanks: "Üdvözlettel,",
    team: "a trita csapata",
  }),

  "draft-reminder": buildEmailLayout({
    locale: "hu",
    preheader: "Már majdnem kész vagy a teszttel — folytasd ott, ahol abbahagytad.",
    bodyContent: `
      <p style="${EMAIL_P}">Szia, Bence!</p>
      <p style="${EMAIL_P};margin-bottom:24px">Láttuk, hogy elkezdted a személyiségtesztet a Tritán, de még nem fejezted be. Már 42 kérdésen túl vagy a 60-ból, szóval tényleg csak egy kis lépés választ el az eredményektől.<br><br>Ha befejezed, egy rövid visszajelzést kapsz arról, hogyan látod magad a fő személyiségdimenziók mentén. Ha szeretnéd, később másoktól is kérhetsz visszajelzést, így azt is láthatod, mennyire egyezik a saját képed azzal, ahogyan a környezeted lát.</p>
      ${renderCtaButton({ href: "https://trita.io/assessment", label: "Folytatom a tesztet" })}`,
    footerDisclaimer: "Ha már befejezted a tesztet, nyugodtan hagyd figyelmen kívül ezt az üzenetet.",
    thanks: "Üdvözlettel,",
    team: "a trita csapata",
  }),

  "magic-link": buildEmailLayout({
    locale: "hu",
    heading: "Bejelentkezési link",
    bodyContent: `
      <p style="${EMAIL_P};margin-bottom:24px">Kattints az alábbi gombra a bejelentkezéshez. A link 10 percig érvényes.</p>
      ${renderCtaButton({ href: "https://trita.io/magic", label: "Bejelentkezés" })}`,
    footerDisclaimer: "Ha nem te kérted ezt a linket, nyugodtan hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a trita csapata",
  }),

  "candidate-invite": buildEmailLayout({
    locale: "hu",
    heading: "Személyiségfelmérés – Senior frontend fejlesztő",
    bodyContent: `
      <p style="${EMAIL_P};margin-bottom:24px">${escapeHtml("Szabó Márta meghívott, hogy töltsd ki az alábbi személyiségfelmérést. A teszt körülbelül 10–15 percet vesz igénybe, és regisztráció nélkül elvégezhető.")}</p>
      ${renderCtaButton({ href: "https://trita.io/apply/token", label: "Felmérés megkezdése" })}`,
    footerDisclaimer: "Ha nem számítottál erre az emailre, egyszerűen hagyd figyelmen kívül.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  }),

  "org-invite": buildEmailLayout({
    locale: "hu",
    heading: "Meghívtak a(z) Példa Kft. szervezetbe",
    preheader: "Regisztrálj a Tritára, és automatikusan csatlakozol a szervezethez.",
    bodyContent: `
      <p style="${EMAIL_P};margin-bottom:24px">Regisztrálj a Tritára, és automatikusan csatlakozol a szervezethez. Kitöltheted a személyiségtesztet, és láthatod, hogyan illesz a csapatba.</p>
      ${renderCtaButton({ href: "https://trita.io/join/org/inviteId", label: "Regisztráció és csatlakozás" })}`,
    footerDisclaimer: "Ha nem szeretnél csatlakozni, egyszerűen hagyd figyelmen kívül ezt az emailt.",
    thanks: "Üdvözlettel,",
    team: "a Trita csapat",
  }),

  "pilot-confirmation": buildEmailLayout({
    locale: "hu",
    preheader: "Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!",
    bodyContent: `
      <p style="${EMAIL_P}">Kedves Péter,</p>
      <p style="${EMAIL_P}">Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!</p>
      <p style="${EMAIL_P};margin-bottom:0">24 órán belül személyesen kereslek, hogy megbeszéljük a részleteket és egyeztessünk egy rövid, kötelezettségmentes bevezető beszélgetést.</p>`,
    thanks: "Üdvözlettel,",
    team: "Leinad · Trita",
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
