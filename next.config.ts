import type { NextConfig } from "next";

// Content-Security-Policy — REPORT-ONLY módban vezetjük be. A böngésző jelenti
// a sértéseket (console + report-to), de NEM blokkol, így élesben figyelhető,
// mielőtt enforce-ra váltunk. Élesítés: a Content-Security-Policy-Report-Only
// kulcsot Content-Security-Policy-ra átnevezni (a reportok kitisztulása után).
//
// Clerk igényei: script/connect/frame a *.clerk.accounts.dev + *.clerk.com
// felé, worker: blob (web worker), img: img.clerk.com + data:. A Turnstile
// bot-védelem a challenges.cloudflare.com-ot használja. A Next.js + Tailwind
// inline stílust/scriptet igényel ('unsafe-inline') — nonce-alapúra szűkítés
// későbbi kör.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com https://doodleipsum.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

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
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "doodleipsum.com" },
    ],
  },

  // HTTP headers: resource hints + biztonsági alapkészlet + CSP (report-only).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: [
              // Preconnect to Clerk for faster auth script loading
              '<https://perfect-elf-67.clerk.accounts.dev>; rel=preconnect; crossorigin',
              '<https://perfect-elf-67.clerk.accounts.dev>; rel=dns-prefetch',
            ].join(", "),
          },
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
