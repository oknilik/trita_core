# Tag-dossié (member dossier) — terv és státusz

## Kontextus és cél

Read-only összesítő nézet egy szervezeti tagról az admin és a tanácsadó
számára: kitöltései, önkép vs. külső kép, kapcsolati beágyazottság, kapott
visszajelzések. **Nem új mérés** — a meglévő libek (team-stats,
trust-network, team-role-peer, observer-aggregátum) személyre szűrt
összeszerelése. Route: `/org/[id]/members/[userId]`.

## Hozzáférési döntés (2026-07-28, kőbe vésve)

A dossziét KIZÁRÓLAG az org admin (`ORG_ADMIN`) és a tanácsadói kör
(`ORG_CONSULTANT`, platform-tanácsadó `isConsultant`, platform-admin
`ADMIN_EMAILS`) láthatja. Az `ORG_MANAGER` NEM, a tag a SAJÁT dossziéját SEM
éri el. Guard: `canViewMemberDossier` (`src/lib/measurement-auth.ts`) —
explicit allowlist, NEM rang-alapú.

## Láthatósági vörös vonalak

| Adat | Dossziéban? |
|---|---|
| Irányított trust-válasz (ki mit mondott kiről) | ❌ SOHA — csak pár-/csomópont-aggregátum |
| Pszichológiai biztonság pulse | ❌ SOHA személyi nézetben |
| Anonim peer feedback szövege/szerzője | ❌ — csak darabszám |
| Observer egyéni (értékelőnkénti) válasz | ❌ — csak aggregátum, min. 2 értékelő |
| Self-eredmények, aggregált külső kép, nevesített kudos/feedforward, részvétel | ✅ forrás-badge + elemszám kötelező |

## F1 — státusz: KÉSZ (2026-07-28)

Lépésenkénti implementáció, branch `consulting_cleanup`, 6 commit:

1. **Guard + tesztek** — `canViewMemberDossier` (measurement-auth.ts) +
   `tests/unit/policy/member-dossier.test.ts` (allowlist-invariánsok).
2. **Tiszta lib** — `src/lib/member-dossier.ts` (Prisma-mentes típusok +
   `computeObserverAverage` [min-2 küszöb], `computeDimComparisons`,
   `topGapDims`); `team-stats.ts` friction-exportok
   (`calculatePairFriction`/`frictionToEdgeType`/`DynamicsEdgeType`).
3. **Szerver-assembler** — `src/lib/member-dossier.server.ts`
   (`buildMemberDossier(orgId, targetUserId)`; kilépett/nem-tag → null).
4. **Page + nézet** — `src/app/(app)/org/[id]/members/[userId]/page.tsx`
   (guard-sorrend, 404) + `src/components/org/MemberDossierView.tsx`
   (4 szekció: fejléc+részvétel, önkép-vs-külső, beágyazottság, visszajelzés).
5. **Belépési pontok** — Dossié gomb az org + team tag-listákon
   (`dossierBaseHref: string | null` prop; a page számol, a kliens sosem
   hívja a guardot).
6. **Záró kör** — tesztek zölden (unit 278, client 59), doksi + changelog.

Verifikáció: tsc 0, unit+client zöld. Belépett vizuál NEM tesztelve élőben
(personák nincsenek seedelve a Clerk dev instance-ban) — kézi QA a seed
helyreállítása után esedékes.

## NEM része az F1-nek (később)

- **F2**: változás-idővonal / kör-összehasonlítás (a pilot 1. köre után).
- **F3**: tanácsadói jegyzet, PDF-export.
- Manager-változat, „fordított transzparencia" nézet — döntés szerint nincs.
- Hozzáférés-napló — nyitott kérdés, külön döntésre vár.
- Pszich. biztonság pulse bármilyen személyi megjelenítése — tilos.
