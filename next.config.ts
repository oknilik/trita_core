import type { NextConfig } from "next";
import { resolveClerkCspOrigins, resolveClerkFrontendApiHost } from "./src/lib/clerk-host";

// A Clerk Frontend API hostja a publishable key-ből oldódik fel (dev
// instance-nál `*.clerk.accounts.dev`, élesben a saját domainünk). Bedrótozott
// host mellett a prod build a fejlesztői instance-ra mutatna — ld.
// src/lib/clerk-host.ts.
const CLERK_ORIGINS = resolveClerkCspOrigins().join(" ");
const CLERK_FRONTEND_API_HOST = resolveClerkFrontendApiHost();

// Content-Security-Policy — REPORT-ONLY módban vezetjük be. A böngésző jelenti
// a sértéseket a `report-uri`-n (`/api/csp-report`), de NEM blokkol, így
// élesben figyelhető, mielőtt enforce-ra váltunk. Élesítés: a
// Content-Security-Policy-Report-Only kulcsot Content-Security-Policy-ra
// átnevezni (a reportok kitisztulása után).
//
// Clerk igényei: script/connect/frame a feloldott instance-host + a
// *.clerk.accounts.dev / *.clerk.com wildcardok felé, worker: blob (web
// worker), img: img.clerk.com + data:. A Turnstile bot-védelem a
// challenges.cloudflare.com-ot használja. A Next.js + Tailwind inline
// stílust/scriptet igényel ('unsafe-inline') — nonce-alapúra szűkítés
// későbbi kör.
// A Vercel Analytics és a Speed Insights innen tölti a mérő-szkriptjét
// (`@vercel/analytics`, `@vercel/speed-insights`). A mért adat ezután
// AZONOS ORIGINRE megy (`/_vercel/insights/*`), tehát a `connect-src 'self'`
// fedi — csak a szkript-forrást kell engedni.
//
// 2026-08-23: ezt a rést az ÚJ `report-uri` végpont találta meg, első
// futásra. A CSP eddig report-only volt riport-cél nélkül, tehát a sértés
// csak a látogató konzoljára ment: enforce-ra váltáskor a Vercel Analytics és
// a Speed Insights némán elhalt volna élesben.
const VERCEL_INSIGHTS_ORIGIN = "https://va.vercel-scripts.com";

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${CLERK_ORIGINS} ${VERCEL_INSIGHTS_ORIGIN} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com https://doodleipsum.com",
  "font-src 'self' data:",
  `connect-src 'self' ${CLERK_ORIGINS}`,
  `frame-src 'self' ${CLERK_ORIGINS} https://challenges.cloudflare.com`,
  "worker-src 'self' blob:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  // A report-uri nélkül a report-only mód GYAKORLATILAG HATÁSTALAN: a
  // sértés csak a látogató konzoljára kerül, tehát az „élesben figyeljük,
  // aztán enforce-ra váltunk" terv nem hajtható végre. A végpont a szerver-
  // loggerbe ír (src/app/api/csp-report).
  "report-uri /api/csp-report",
].join("; ");

// ---------------------------------------------------------------------------
// BUILD-CÉL (browserslist) — SZÁNDÉKOSAN NINCS BEÁLLÍTVA. Ne vezess be
// `.browserslistrc`-t és `browserslist` mezőt a package.json-be sem, amíg ezt
// az érvelést nem cáfolod méréssel.
//
// Next 16 alapértelmezett kliens-célja (`MODERN_BROWSERSLIST_TARGET`,
// `next/dist/shared/lib/modern-browserslist-target.js`):
//     chrome 111 · edge 111 · firefox 111 · safari 16.4
// azaz a „baseline widely available" pillanatkép. Ez modernebb, mint amit egy
// kézzel írt, piaci részesedés alapú lekérdezés adna: a `> 0.5%, last 2 years,
// not dead` a mi caniuse-lite adatunkon `chrome 109`-et ÉS `op_mob 80`-at
// (= Chromium 80, 2020) hoz be — utóbbi visszakényszerítené az SWC-t az egész
// ES2021+ downlevelre, tehát NÖVELNÉ a bundle-t.
//
// Mérés a legutóbbi prod buildből (.next/static/chunks): egyetlen SWC
// downlevel-helper sincs a kliens-bundle-ben (`_async_to_generator`,
// `_ts_generator`, `_object_spread`, `_sliced_to_array`, `_create_class`,
// `regeneratorRuntime` → 0 találat), a modern szintaxis (`?.`, `??`, `async`,
// spread) natívan marad. Nincs mit lefaragni: a build-cél már maximálisan
// modern, egy saját browserslist legfeljebb 0 bájtot nyerne, rontani viszont
// tudna (a browserslist a CSS-transzformok célját is megszabná).
//
// A Lighthouse `legacy-javascript` audit által jelzett polyfillek
// (Array.prototype.at/flat/flatMap, Object.fromEntries, Object.hasOwn,
// String.prototype.trimEnd) NEM a mi kódunk transzpilálásából jönnek, hanem a
// Next saját `@next/polyfill-module` fájljából, amit a framework fixen
// beköt (`require("../build/polyfills/polyfill-module")` a
// `next/dist/client/app-globals.js` 6. sorában). Ez browserslist-től
// FÜGGETLEN, config-ból nem kapcsolható ki; nyers mérete 1 380 bájt (a
// Lighthouse 13,4 kB-os „wasted bytes" száma becslés). Kivezetése csak
// upstream Next-változással vagy egy Next-belső útvonalra tett
// resolve-alias-szal lenne lehetséges — utóbbi nem támogatott, törékeny,
// ezért nem csináljuk.
// ---------------------------------------------------------------------------
const nextConfig: NextConfig = {
  // 127.0.0.1: az e2e (Playwright) böngészője IP-n éri el a dev-szervert
  // (a CI-runneren a "localhost" névfeloldás megbízhatatlan volt). Enélkül
  // a Next dev-guard 403-mal blokkolja az Origin-fejléces /_next/* kéréseket
  // (pl. a HMR/devtools websocketet) — ld. a 2026-08-05-i e2e CI-futás
  // „Blocked cross-origin request from 127.0.0.1" figyelmeztetését.
  allowedDevOrigins: [
    "iridaceous-rickie-overloath.ngrok-free.dev",
    "192.168.173.183",
    "127.0.0.1",
  ],

  experimental: {
    // `optimizePackageImports` — SZÁNDÉKOSAN nem bővítjük. Next 16 magától
    // alkalmaz egy ~80 elemű alaplistát (lucide-react, date-fns, recharts,
    // @mui/*, react-icons/*, …, ld. `next/dist/server/config.js`); a mi
    // függőségeink közül egyik sincs benne, és a két kézenfekvő jelölt sem
    // hozna nyereséget:
    //
    // • framer-motion — a belépője (`dist/es/index.mjs`, 78 sor) tiszta
    //   re-export barrel ÉS `"sideEffects": false`, tehát a Turbopack
    //   tree-shakingje már most kidobja a nem használt exportokat. A kódbázis
    //   19 helyen kizárólag `motion`-t és `AnimatePresence`-t importál — a
    //   ~42 kB-os chunk maga a `motion` animációs runtime, amit a barrel-
    //   optimalizálás nem tud kisebbre vágni. (Az itteni valódi lever a
    //   `framer-motion/m` + `LazyMotion` átállás, az viszont forráskód-
    //   változás, nem build-config.)
    // • @clerk/nextjs — a belépője (`dist/esm/index.js`) egy csupasz
    //   side-effect importtal kezdődik (`import "./chunk-BUSYA2B4.js"`),
    //   ezért nem tiszta barrel: a transzformáció vagy elhasal, vagy —
    //   rosszabb esetben — leejtené ezt az importot és eltörné a Clerket.
    //
    // Kliens-oldali Router Cache élettartam.
    //
    // Miért: az (app) layout `force-dynamic`, ezért MINDEN kliens-oldali
    // navigáció újrarenderelte a teljes nav-kontextust — mérve ugyanannyi
    // (~30 query), mint egy hidegindítás. A `dynamic` alapértéke 0, tehát a
    // router semmit nem használt újra. 30 s-mal az oda-vissza navigáció és a
    // vissza-gomb gyakorlatilag ingyenes lesz, vizuális változás nélkül
    // (ellentétben a fejléc Suspense-re bontásával, ami minden kattintásnál
    // csontváz-villanást okozna az állandó kroomon).
    //
    // Elavulás-kockázat és mi fedi le: minden mutáció után `router.refresh()`
    // fut (36 hívóhely, projekt-konvenció), az pedig teljesen érvényteleníti
    // a Router Cache-t. Marad a „valaki MÁS írt közben" eset — ott legfeljebb
    // 30 s csúszás, ami ennél a terméknél (napokban érkező observer-beadás,
    // kampány-lépés) nem jelent gondot; az értesítés-harang külön pollozik.
    //
    // Ha valahol mégis zavaró a csúszás: vidd lejjebb (pl. 10), vagy az adott
    // oldalon hívj `router.refresh()`-t. 0 = a korábbi viselkedés.
    staleTimes: {
      dynamic: 30,
    },
  },

  // Az admin Blog fül és az /api/admin/blog futásidőben olvassa a
  // content/blog .mdx fájlokat — a file-tracing ezekre nem következtet
  // automatikusan, ezért explicit becsomagoljuk őket.
  outputFileTracingIncludes: {
    "/admin": ["./content/blog/**/*"],
    "/api/admin/blog": ["./content/blog/**/*"],
    // A hírlevél-borító futásidőben rendereli a cikk vásznát: kell hozzá a
    // frontmatter és — feltöltött borítónál — maga a képfájl is.
    "/api/newsletter/cover/[slug]": ["./content/blog/**/*", "./public/blog-covers/**/*"],
    "/blog/[slug]/opengraph-image": ["./public/blog-covers/**/*"],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "doodleipsum.com" },
    ],
  },

  async redirects() {
    // Blog-slug visszanevezések (2026-08-26): a `tritan-vs-mbti` pár a
    // kivezetett brandet vitte publikus URL-ben (2026-08-23-i audit-lelet),
    // a `miert-hazudik…`/`…-lies` pedig a régi, bulvárosabb címhez tartozott.
    // A régi URL-ek kiküldött hírlevelekben és külső linkekben élnek, ezért
    // a cikkoldal MELLETT a hírlevél-borító route is átirányít: a levélbe
    // ágyazott <img> a régi slugos borító-URL-t hordozza örökre.
    const blogSlugRenames: Record<string, string> = {
      "tritan-vs-mbti": "hexaco-vs-mbti",
      "tritan-vs-mbti-why-it-matters": "hexaco-vs-mbti-why-it-matters",
      "miert-hazudik-az-onertekeles": "miert-nem-eleg-az-onertekeles",
      "why-self-assessment-lies": "why-self-assessment-is-not-enough",
      // 2026-08-31: a cikkpár felütése a hatfaktoros modellre került át,
      // a címek és a slugok ehhez igazodtak.
      "mi-az-a-hexaco": "hatfaktoros-szemelyisegmodell",
      "what-is-hexaco": "six-factor-personality-model",
    };

    return [
      {
        source: "/pricing",
        destination: "/how-we-work",
        permanent: true,
      },
      ...Object.entries(blogSlugRenames).flatMap(([from, to]) => [
        { source: `/blog/${from}`, destination: `/blog/${to}`, permanent: true },
        {
          source: `/api/newsletter/cover/${from}`,
          destination: `/api/newsletter/cover/${to}`,
          permanent: true,
        },
      ]),
    ];
  },

  // HTTP headers: resource hints + biztonsági alapkészlet + CSP (report-only).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Preconnect a Clerk Frontend API-ra — a kulcsból feloldott hostra.
          // Ismeretlen host (hiányzó/rossz kulcs) esetén a fejléc KIMARAD:
          // egy rossz hostra nyitott TLS-kapcsolat lassít, nem gyorsít.
          ...(CLERK_FRONTEND_API_HOST
            ? [
                {
                  key: "Link",
                  value: [
                    `<https://${CLERK_FRONTEND_API_HOST}>; rel=preconnect; crossorigin`,
                    `<https://${CLERK_FRONTEND_API_HOST}>; rel=dns-prefetch`,
                  ].join(", "),
                },
              ]
            : []),
          // CSP — report-only: figyel, nem blokkol (ld. fenti megjegyzés)
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
          // Clickjacking-védelem — a felület nem ágyazódik be sehova
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS — http-n a böngésző ignorálja, prod https-en él
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
