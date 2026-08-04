# Resend domain-verify — ops checklist

> Készült: 2026-07-24. DNS-állapot ellenőrizve publikus resolverrel.

## Aktuális állapot (2026-07-24)

| Rekord | trita.io | trita.hu |
|---|---|---|
| MX `send.<domain>` | ✅ `feedback-smtp.eu-west-1.amazonses.com` (10) | ❌ nincs |
| TXT `send.<domain>` (SPF) | ✅ `v=spf1 include:amazonses.com ~all` | ❌ nincs |
| TXT `resend._domainkey.<domain>` (DKIM) | ✅ kint van | ❌ nincs |
| TXT `_dmarc.<domain>` | ❌ **hiányzik** | ❌ nincs |

Következtetés: a Resend-küldés a **trita.io**-ról működőképes (a rekordok
kint vannak), a trita.hu-ról nem. A kód default feladója emiatt 2026-07-24-én
`noreply@trita.hu` → `noreply@trita.io`-ra váltott (`src/lib/resend.ts`).

## Teendők (kb. 15 perc + propagáció)

1. **Resend dashboard** (resend.com/domains): a `trita.io` státusza legyen
   **Verified** — ha „Pending", kattints a *Verify DNS records*-ra (a
   rekordok kint vannak, a check-nek át kell mennie). Region: eu-west-1.
2. **Vercel prod env**: `RESEND_FROM_EMAIL="trita <noreply@trita.io>"`
   beállítása (Production + Preview), majd redeploy — e nélkül a kód
   defaultja él, ami mostantól szintén .io, de az explicit env a
   szerződés (a resend.ts induláskor warningol, ha hiányzik).
3. **DMARC rekord felvétele** (Cloudflare DNS, trita.io):
   `TXT _dmarc.trita.io` → `v=DMARC1; p=none; rua=mailto:info@trita.io`
   — monitoring-móddal indulunk (p=none), a kézbesíthetőséget javítja,
   a Gmail/Yahoo bulk-sender követelményeknek is kell.
4. **Teszt-küldés élesben**: pilot-apply űrlap (/pilot) kitöltése valós
   címmel → mindkét email (admin-értesítő + visszaigazolás) megérkezik-e,
   nem spam-be — Gmail + egy céges (Outlook/M365) postafiókkal is.
5. Ellenőrzés: a `pilot-apply` route hardcoded feladói
   (`noreply@trita.io`, `hello@trita.io`) a verifikált domainen vannak — OK;
   más route a közös `EMAIL_FROM`-ot használja.

## Megjegyzés

- A root `trita.io` SPF-je (`include:_spf.mx.cloudflare.net`) a bejövő
  Cloudflare email-routingé — a Resend a `send.` aldomaint használja,
  nem ütköznek.
- Ha később trita.hu-ról is akarunk küldeni (HU-piaci feladó), ugyanez a
  három rekord kell a telconetes DNS-be a `send.trita.hu` aldomainre —
  külön Resend-domain felvétellel.
