# 2026-08-24 — Hírlevél-szerkesztő: az előnézet elérhetővé vált

## Hiba

Új szám szerkesztésekor a „Mentés" után a szerkesztő bezárult, így a
HTML-előnézetig el sem lehetett jutni (az előnézet gomb csak mentett,
nem piszkos állapoton aktív).

Ok: az `AdminNewsletterIssueSection` minden mentés/előnézet után
`router.refresh()`-t hívott. A refresh újrarendereli a szerver-oldali
`BlogTab`-ot; a szerkesztő teljes munkamenete viszont kliens-állapotban él
(`open`, `editingId`, `form`, `previewData`), és az újrarenderelés
elvesztette — a `open` visszaesett a kezdőértékére.

## Javítás

`src/app/(app)/admin/_components/AdminNewsletterIssueSection.tsx`:

- a lista saját állapot (`rows`), a prop csak a kiinduló érték;
- mentés/előnézet/küldés a sort **helyben** frissíti, a szerver-refresh
  `pendingRefresh`-be kerül és a szerkesztő bezárásakor fut le;
- törlés és a lezárt (SENT) küldés zárja a szerkesztőt, és ott azonnal
  frissít.

Nincs API- vagy sémaváltozás; a mentés → előnézet → küldés szerződés
(hash-egyezés, immutabilitás) változatlan.

## Teszt

`tests/client/admin/newsletter-issue-editor.test.tsx` — új szám mentése után
a szerkesztő nyitva marad és készíthető előnézet; a halasztott refresh a
bezáráskor fut le.

## Kapcsolódó terv

`docs/architecture/blog-content-pipeline.md` — javaslat a cikk-publikálás
git/deploy-mentesítésére (DB forrásigazság + on-demand ISR), döntésre vár.
