import { getAllPosts } from "@/lib/blog";
import { getSiteUrl } from "@/lib/seo";
import { CONTACT_EMAIL, ORGANIZATION_NAME } from "@/lib/structured-data";

/**
 * `/llms.txt` — a site géppel olvasható „tartalomjegyzéke" nyelvi modelleknek.
 *
 * MI EZ: kialakulóban lévő konvenció (llmstxt.org), amit a válaszmotorok és
 * agent-böngészők egyre több helyen keresnek. A logikája a robots.txt-é:
 * fix helyen lévő, kis fájl a gyökérben — csak nem TILTÁST, hanem
 * ORIENTÁCIÓT ad. Egy modellnek a rendered HTML-ből ki kell hámoznia, mi ez a
 * site és melyik lapja mit tud; itt ezt kimondjuk, tömören, prioritás szerint.
 *
 * MIÉRT ROUTE ÉS NEM STATIKUS FÁJL: a cikklista így nem tud elavulni — a
 * `content/blog` mappából épül, ugyanabból a forrásból, mint a sitemap.
 * (Statikusan generálódik build-time, nincs futásidejű költsége.)
 *
 * NYELV: elsődlegesen magyar, mert a célpiac magyar — a modell a fájl
 * nyelvéből is következtet a tartalom nyelvére. Az angol tartalom külön
 * szekcióban, hogy az angol nyelvű lekérdezéseknél is legyen fogódzó.
 *
 * SZABÁLY: ide CSAK publikus, indexelhető útvonal kerülhet — a fájlnak együtt
 * kell mozognia a `robots.ts` PUBLIC_PATHS listájával.
 */

/**
 * Build-time generálás (mint a sitemap): a route a `content/blog` mappát
 * olvassa, ami a fájlrendszeren él — futásidejű route esetén a Vercel
 * file-tracingjének külön be kellene csomagolnia a .mdx fájlokat. Statikusan
 * a tartalom a buildbe sül, futásidejű fájlolvasás nélkül.
 */
export const dynamic = "force-static";

function line(path: string, title: string, description: string, baseUrl: string): string {
  return `- [${title}](${baseUrl}${path}): ${description}`;
}

export function GET(): Response {
  const baseUrl = getSiteUrl();
  const huPosts = getAllPosts("hu");
  const enPosts = getAllPosts("en");

  const body = `# ${ORGANIZATION_NAME}

> Személyiség- és csapatintelligencia platform magyar csapatoknak. Önértékelő
> személyiségfelmérés hat dimenzió mentén (TSFI kérdőív), 360°-os ismerősi/
> kollégai visszajelzés és csapatszintű diagnosztika — tanácsadói
> értelmezéssel. Az egyéni felmérés ingyenes; a csapat- és szervezeti
> programok tanácsadói együttműködés keretében futnak, egyedi ajánlattal.

> English: Trita is a personality and team intelligence platform for Hungarian
> teams — a six-dimension personality self-assessment, 360° observer feedback
> and team diagnostics, delivered consulting-led.

## Amit érdemes tudni rólunk

- Mérőeszköz: TSFI kérdőív (60 item rövid forma, kb. 9-10 perc), hat
  személyiségdimenzió mentén: Becsületesség-Alázat (H), Emocionalitás (E),
  Extraverzió (X), Barátságosság (A), Lelkiismeretesség (C), Nyitottság (O).
- Módszertan (a felületen NEM így kommunikáljuk, itt a pontosság kedvéért):
  a hat dimenzió a szakirodalomban HEXACO néven ismert hatfaktoros modellt
  követi (Ashton & Lee, 2007); az itemek az IPIP (International Personality
  Item Pool) közkincs készletéből származnak — kereskedelmi használatra is
  szabadon, engedélydíj nélkül.
- Minden becsült (nem mért) adat forrás- és megbízhatóság-jelöléssel jelenik
  meg a felületen; ez a termék hitelességi alapelve.
- Nyelvek: magyar és angol. Kiszolgált piac: Magyarország.
- Kapcsolat: ${CONTACT_EMAIL}

## Fő oldalak

${line("/", "Főoldal", "Mit mér a Trita, kinek szól, hogyan épül fel az egyéni és a csapatszintű kép.", baseUrl)}
${line("/try", "Ingyenes személyiségteszt", "60 kérdéses személyiségteszt regisztráció nélkül, kb. 10 perc, azonnali visszajelzés hat dimenzió mentén.", baseUrl)}
${line("/about", "Mi az a Trita", "A gondolat és a felépítés: a négy mérési réteg (személyiség, külső visszajelzés, csapatszerepek, pszichológiai biztonság), a tanácsadói validálás és a cél.", baseUrl)}
${line("/pricing", "Együttműködés és árazás", "Hogyan indul egy csapat- vagy szervezeti program, mi ingyenes, és mitől függ az ár. Gyakori kérdések.", baseUrl)}
${line("/patterns", "16 csapatműködési mintázat", "Négy tengely (hajtóerő, kohézió, fegyelem, nyitottság) mentén leírt 16 csapatminta erősségekkel és kockázatokkal.", baseUrl)}
${line("/pilot", "Pilotprogram", "Az első partnercsapatoknak szóló bevezető program feltételei.", baseUrl)}
${line("/blog", "Blog", "Cikkek csapatdinamikáról, személyiségpszichológiáról és tudatos HR-ről.", baseUrl)}
${line("/contact", "Kapcsolat", "Kapcsolatfelvétel; egy munkanapon belüli válasz.", baseUrl)}
${line("/privacy", "Adatvédelem", "Milyen adatot kezelünk, meddig, és ki láthatja.", baseUrl)}

## Blogcikkek (magyar)

${huPosts
  .map((post) => line(`/blog/${post.slug}`, post.title, post.description, baseUrl))
  .join("\n")}

## Blog posts (English)

${enPosts
  .map((post) => line(`/blog/${post.slug}`, post.title, post.description, baseUrl))
  .join("\n")}

## Amit NE indexelj / ne idézz

- \`/profile\`, \`/dashboard\`, \`/org\`, \`/team\`, \`/manager\`, \`/admin\` — bejelentkezés
  mögötti felületek, személyes és szervezeti adatokkal.
- \`/observe/*\`, \`/join/*\`, \`/share/*\` — token-alapú, egyszemélyes linkek.
- \`/api/*\` — nem tartalom.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Egy napos CDN-cache: a tartalom build-time forrásból jön, ritkán változik.
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
