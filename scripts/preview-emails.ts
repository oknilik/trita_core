/**
 * Email-sablon előnézet-generátor (fejlesztői eszköz).
 *
 * Futtatás: pnpm preview:emails [kimeneti-mappa]
 *
 * MINDEN kimenő sablont legenerál, mindkét nyelven, a VALÓDI küldő-úton
 * (`scripts/email-samples.ts`) — a korábbi változat 12 kézzel másolt, csak
 * magyar mintát ismert, és a törzsszövegei már nem egyeztek az élessel.
 *
 * A levél `cid:` inline csatolmányokkal viszi a szójelet és a formanyelvi
 * jelet — ezt egy böngésző nem tudja feloldani, ezért az előnézetben a
 * csatolmány bájtjait `data:` URI-ba írjuk. A kimenő HTML tehát EGY ponton
 * tér el az élestől, és pont ott, ahol a böngésző amúgy sem tudná megmutatni.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const outDir = process.argv[2] ?? join(process.cwd(), ".email-previews");
  mkdirSync(outDir, { recursive: true });

  const { renderEmailSamples } = await import("./email-samples");

  const samples = await renderEmailSamples();

  for (const sample of samples) {
    let html = sample.html;
    for (const a of sample.attachments) {
      if (!a.content_id || !a.content) continue;
      html = html.replaceAll(
        `cid:${a.content_id}`,
        `data:${a.content_type ?? "image/png"};base64,${a.content}`,
      );
    }
    writeFileSync(join(outDir, `${sample.id}.${sample.locale}.html`), html, "utf8");
  }

  const rows = samples
    .map(
      (s) => `
        <tr>
          <td><a href="${s.id}.${s.locale}.html">${s.id}</a></td>
          <td><span class="loc">${s.locale}</span></td>
          <td><span class="fam fam-${s.family}">${s.family === "client" ? "ügyfél" : "rendszer"}</span></td>
          <td class="subj">${s.subject.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</td>
        </tr>`,
    )
    .join("");

  const index = `<!DOCTYPE html>
  <html lang="hu">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Trita — email-előnézetek</title>
    <style>
      body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; background: #f7f4ef; color: #4a4a5e; margin: 0; padding: 40px 24px; }
      main { max-width: 900px; margin: 0 auto; }
      h1 { font-family: Georgia, serif; font-size: 26px; color: #1a1a2e; margin: 0 0 6px; }
      p.lede { margin: 0 0 28px; font-size: 15px; }
      table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e8e0d3; border-radius: 12px; overflow: hidden; }
      th, td { text-align: left; padding: 9px 14px; border-top: 1px solid #f0ebe1; font-size: 14px; vertical-align: top; }
      th { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #6a6a7b; border-top: 0; }
      a { color: #3d6b5e; }
      .loc { font-family: monospace; font-size: 12px; color: #6a6a7b; }
      .fam { font-size: 11px; padding: 2px 7px; border-radius: 4px; }
      .fam-client { background: #e8f2f0; color: #2d5a4e; }
      .fam-system { background: #f0ede6; color: #6a6a7b; }
      .subj { color: #6a6a7b; }
    </style>
  </head>
  <body>
    <main>
      <h1>Email-előnézetek</h1>
      <p class="lede">${samples.length} renderelés a valódi küldő-útról. A képek a levél inline csatolmányai — az előnézetben <code>data:</code> URI-ként.</p>
      <table>
        <thead><tr><th>Sablon</th><th>Nyelv</th><th>Család</th><th>Tárgy</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </main>
  </body>
  </html>`;

  writeFileSync(join(outDir, "index.html"), index, "utf8");

  console.log(`✓ ${samples.length} előnézet: ${outDir}`);
  console.log(`  nyisd meg: ${join(outDir, "index.html")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
