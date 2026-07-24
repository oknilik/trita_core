# Google Search Console — beállítás és beküldés (SEO 2. kör)

> Készült: 2026-07-24. Ez a projekten kívüli ops-lépés; kb. 10 perc.

## 1. Property felvétele

1. https://search.google.com/search-console → *Add property*.
2. **Domain property**-t válassz (`trita.io`) — ez minden aldomaint és
   protokollt lefed (a www + http/https URL-prefix külön felvétele
   szükségtelen lesz).
3. Hitelesítés: DNS TXT rekord — a Search Console ad egy
   `google-site-verification=...` értéket; Cloudflare DNS-be TXT rekordként
   a gyökérre (`trita.io`). Propagáció után *Verify*.

## 2. Sitemap beküldése

- Search Console → Sitemaps → `https://trita.io/sitemap.xml` beküldése.
- Elvárt: ~20+ URL (statikus marketing-oldalak + 14 blogposzt + /try).
- Figyelem: a sitemap csak prod buildből érvényes (a robots.ts nem-prod
  környezetben mindent tilt — `VERCEL_ENV=production` a feltétel).

## 3. Ellenőrzések az első indexelés után (1–2 hét)

- *Pages* riport: a marketing-oldalak „Indexed" státuszban vannak-e;
  a „Duplicate, Google chose different canonical" hibának a canonical-fix
  (2026-07-23) után el kell tűnnie.
- *Enhancements / Rich results*: az Article JSON-LD (blogposztok,
  2026-07-24) felismerése — teszt előre: https://search.google.com/test/rich-results
  egy cikk-URL-lel.
- `site:trita.io` keresés gyors szúrópróbának.

## 4. Kapcsolódó, még nyitott SEO-szál

- i18n URL-struktúra döntés (hu/en külön URL-ek vs. mostani kliens-oldali
  nyelvváltás) — amíg nincs külön URL nyelvenként, hreflang nem adható ki
  (a 07-23-i takarítás pont az érvénytelen hreflangot távolította el).
