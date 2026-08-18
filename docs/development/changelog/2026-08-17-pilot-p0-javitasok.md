# 2026-08-17 — Pilot P0-javítások (termék-audit nyomán)

> Forrás: a main ágon futtatott termék-audit hat kritikus lelete. Közös
> mintázat: a mérési mag stabil, de a „körítés" néma vagy lyukas — emlékeztető,
> amely nem küld; lead-út, amely nem perzisztál; org-állapot, amelyből nincs
> visszaút. Branch: `claude/pilot-p0-fixes`.

## P0.1 — A kampány-emlékeztető mostantól tényleg küld

**Lelet:** a `campaigns/[campaignId]/remind` route csak SZÁMOLT („For now we
just count and return"), miközben a UI azt írta: „{count} személynek küldtünk
emlékeztetőt". Lépés-nyitásról kizárólag in-app értesítés ment — aki nem lépett
be magától, soha nem tudta meg, hogy dolga van. A playbook T+3/T+10
emlékeztető-ritmusának nem volt kódja.

- Új email-sablon: `sendMeasurementStepEmail` (`emails.ts`) — két variáns:
  `opened` (lépés-nyitás) és `reminder` (tanácsadói emlékeztető), HU/EN.
  MŰKÖDÉSI email: a lifecycle-kapcsoló nem érinti (összhangban az
  email-preferences ígéretével).
- `handleMeasurementStepOpened` opcionális `sendEmail` paramétert kapott; a
  `releaseDueCampaignSteps` `emailNotify` opcióval adja tovább. **Csak a
  user-jelenlét nélküli utak emaileznek**: a napi cron-release és a „Küldés
  most" (force). Az oldalbetöltéses user-szintű release és az azonnali advance
  nem — ott a user épp a felületen van.
- A remind route ténylegesen küld a kampány saját lépéseiből semmit sem
  teljesítőknek (lépés-tudatos számítás változatlan), CTA a `/tasks`
  feladatlistára. A `remindedCount` mostantól a ténylegesen elküldött emailek
  száma — a UI-szöveg ettől igaz. Rate limit (`contact` tier, kampány-kulcs).
- A halott `/api/org/[id]/remind` stub (TODO, nulla UI-hívó) TÖRÖLVE — ne
  keverje a képet a valódi remind route mellett.

## P0.2 — Welcome + „riport kész" email

**Lelet:** regisztráció után és riport-publikáláskor a platform néma volt —
a két legfontosabb ügyfél-pillanatban.

- `sendWelcomeEmail` (`emails.ts`): a Clerk webhook `user.created` ágából megy,
  best effort (a hibája nem buktathatja a webhookot). Locale a sign-up
  `unsafeMetadata.locale`-jából. ÉLETCIKLUS-email, leiratkozó-linkkel.
- `sendTeamReportPublishedEmail` (`emails.ts`): a `handleTeamReportPublished`
  a meglévő címzett-körnek (csapattagok + org vezetők, tanácsadó nem) az
  in-app értesítés mellé emailt is küld, best effort. Eredmény-értesítő =
  MŰKÖDÉSI email az email-preferences ígérete szerint — a lifecycle-kapcsoló
  nem szűri.

## P0.3 — A /pilot jelentkezés perzisztál

**Lelet:** a `pilot-apply` route csak két Resend-emailt küldött — DB-rekord és
CRM nélkül. Resend-hiba esetén 500 + a pilot-lead nyomtalanul elveszett.

- A route a `submitInquiry()`-ra kötve (minta: `/api/contact`): Inquiry-rekord
  (topic: `pilot`, source: `pilot_form`), CRM auto-attach, admin-notif +
  best-effort admin-email. A visszaigazoló email (`sendPilotApplyConfirmationEmail`,
  HU/EN) best effort — a lead már perzisztált.
- Zod-séma (`.strict()`), a kliens (`PilotContent`) a locale-t is küldi — a
  korábbi hardcoded `locale:"hu"` megszűnt.
- Analitika: `inquiry.submit` (topic `pilot`) — a pilot-tölcsér első
  szerver-oldali eseménye.

## P0.4 — Advisory címzett-bug + perzisztencia

**Lelet:** `advisory/request` a `RESEND_FROM_EMAIL`-t használta CÍMZETTKÉNT
(`to:`), és semmit sem perzisztált — a konzultáció-igény 500-zal veszett el.

- A route szintén `submitInquiry()`-ra kötve (topic: `advisory`, source:
  `advisory_request`, session-ből linkelt user + aktív org — a tanácsadók így
  in-app notifot is kapnak). Csapat-összefoglaló a message-ben.
- Visszaigazoló: `sendAdvisoryConfirmationEmail` (HU/EN), best effort.
- Rate limit + analitika itt is.

## P0.5 — A „csapat érdekel" lead-gomb nem 404-ezik

**Lelet:** a `/api/features/interest` (és a 308-as `/api/feature-interest`
örökség-út) tévedésből a fakedoor parkolt prefix-listán volt — miközben az
ÉLES eredmény-oldali `TeamInterestBanner` erre POST-ol. A zászlóshajó felületen
látható hiba + elveszett meleg-lead.

- A két prefix kikerült a fakedoor-szabályból (a lead/kívánságlista végpont nem
  fake door); a valódi fakedoor-utak (`/admin/fakedoor`, `/api/admin/fakedoor`,
  `/api/career/fakedoor`) parkolva maradnak.
- A parking-teszt bővítve: a két végpont nyitottságát regresszió őrzi.

## P0.6 — Az org-deaktiválás visszafordítható

**Lelet:** az org-admin danger zone-ból indított INACTIVE állapot után MINDEN
tag (a tanácsadót is beleértve) a `/org/suspended`-re került, és sem a
felületről, sem az adminból nem volt visszaút — csak SQL-lel. Ráadásul a
suspended oldal „Szervezetek" gombja a `/org`-ra vitt, ami visszairányított
ugyanide (hurok), és az oldal hardcoded magyar volt.

- Új admin-action: `set_org_status` (`/api/admin/org-access`) — ACTIVE ⇄
  INACTIVE. Az admin Szervezetek-fülön „felfüggesztve" badge + visszakapcsoló
  gomb (felfüggesztéshez confirm).
- `/org/suspended`: i18n-re kötve (`org.suspended.*`, HU/EN), a hurkos link
  helyett `/profile/results` + `/contact`.

## Tesztek / ellenőrzés

- `portfolio-parking` (3), `campaign-steps` (22), `org-dictionary-guard` +
  `public-dictionary` (7) — zöld; `check-colors` zöld; ESLint a módosított
  fájlokon tiszta.
- A sandboxban a Prisma-engine nem generálható (registry-korlát), ezért a
  teljes type-check/integration kör CI-ben igazolandó.

## Tudatos döntések (vitatható, vétózható)

1. Lépés-nyitási email csak user-jelenlét nélküli release-nél (cron, force) —
   az interaktív utak nem emaileznek.
2. Kampány-emailek és riport-email = működési (nem lifecycle-szűrt); welcome =
   lifecycle, leiratkozó-linkkel.
3. A remind CTA a `/tasks`-ra visz (nem lépés-specifikus linkre) — a „nem
   kezdte el" kör bármely nyitott lépésénél helyes célpont.
4. Emlékeztető-cooldown nincs (a tanácsadó ítélete + rate limit véd) — ha
   kell, külön kör.
