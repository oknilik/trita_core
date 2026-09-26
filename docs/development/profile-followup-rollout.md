# Profilok utánkövetése — bevezetés

## Elkészült működés

- `START_SELF`: az onboarding után legalább 2 nap; második levél legkorábban a 7. napon.
- `RESUME_SELF`: a személyes draft változatlansága után legalább 1 nap; második levél legkorábban a 4. napon.
- `INVITE_FIRST_OBSERVERS`: a személyes eredmény és onboarding közül a későbbi után legalább 3 nap; második levél legkorábban a 10. napon.
- Felhasználónként/címenként legalább 72 óra és legfeljebb 3 személyes utánkövető levél gördülő 30 nap alatt. Célonként legfeljebb két kísérlet; a bizonytalan kimenetel is foglalja a keretet.
- Alapesetben 14 napos célablak. Az explicit egyhetes halasztás az ablakot is meghosszabbítja, hogy legyen idő a választott napon emlékeztetni.
- A tanácsadói/admin fiók, a tudatos kihagyás, a szervezeti tagság és az aktív kampány kizárja az új személyes ajánlatokat. A következő lépés jogosultságát a Journey Engine adja.
- Admin / Emlékeztetők: keresés, lapozható előnézet, HU/EN szöveg, kizárási ok, kézi küldés, halasztás, kihagyás, kézbesítési napló, lezárt célok.
- A napi `/api/cron/lifecycle` 08:00 UTC körül fut. A napi futás legfeljebb 100 profilt és 50 esedékes célt vizsgál, időkerettel és folytatási kurzorral. A következő nap a kimaradt munkát folytatja.

A korábbi kézi draftküldő, a kézi/automatikus külsőértékelő-emlékeztető és a reflexiós levél közös kézbesítési naplót használ. A külső értékelők korlátja külön érvényesül: meghívónként legfeljebb két emlékeztető, címzettenként legalább 5 nap szünet és legfeljebb 3 emlékeztető 30 nap alatt. Az első emlékeztetőhöz a meghívó legalább 4 napos legyen. A meghívók eredeti, felhasználó által kért kiküldése változatlan.

## Konfiguráció

| Változó | Jelentés |
|---|---|
| `LIFECYCLE_MODE=off` | Alapérték. Az új személyes szabályok nem küldenek. Az admin előnézet használható. |
| `LIFECYCLE_MODE=preview` | A napi kör is előállítja a célokat, küldés és új in-app értesítés nélkül. |
| `LIFECYCLE_MODE=manual` | Adminos személyes küldés engedélyezett, automatikus küldés nincs. |
| `LIFECYCLE_MODE=automatic` | Az új személyes levelek és in-app értesítések automatikusan indulhatnak. |
| `LIFECYCLE_COHORT_FROM` | Kötelező az automatikához, például `2026-10-01T00:00:00Z`. Csak az ettől regisztrálók kerülhetnek automatikus körbe. |
| `LIFECYCLE_EMAIL_ALLOWLIST` | Opcionális, vesszővel elválasztott próbacímek. A kézi és automatikus új személyes küldést korlátozza. |
| `CRON_SECRET` | Kötelező bearer titok a napi végponthoz. |
| `RESEND_WEBHOOK_SECRET` | Kötelező a Resend kézbesítési webhook hitelesítéséhez. |

A `LIFECYCLE_MODE` az **új személyes szabályokat** vezérli. A már meglévő observer/reflexiós kör a régi napi értesítési cronban marad, a közös naplóval és korlátokkal. A napló takarítása és a félbeszakadt küldések jelölése `off` mellett is fut. A preview deployment meglévő védelme továbbra is csak `example.com` és `test.trita.app` címzetteket enged.

## Bevezetési lépések

1. Célkörnyezeten a `20260926120000_profile_followup_engine` migráció futtatása, majd az alkalmazás kiadása. A migráció a régi emlékeztetőszámlálókból és reflexiós értesítésekből konzervatív `LEGACY` naplóbejegyzéseket képez; ezek nem állítanak bizonyított kézbesítést.
2. `preview` mód, ismert felhasználók keresése az adminban. Ellenőrizni: ajánlott cél, nyelv, kizárási ok, lejárt ablak, migrált küldési keret.
3. Hitelesített címek szinkronja. Az új Clerk események már rögzítik a hitelesítést, a korábbi profilokhoz egyszeri backfill szükséges. Hiányzó vagy az aktuális címtől eltérő `verifiedEmail` mellett személyes/reflexiós levél nem megy ki.
4. Resend webhook események beállítása: `email.delivered`, `email.failed`, `email.suppressed`, `email.bounced`, `email.complained`. A meglévő `/api/webhooks/resend` fogadja őket; csak a végleges visszapattanás zárja ki a címet.
5. `manual` mód, szűk címlista. Saját címre a tényleges email, belépés utáni cél, halasztás és leiratkozás ellenőrzése. A címek listáját csak a sikeres próba után bővítsük.
6. Az utánkövető levelek leírásának és adatkezelési tájékoztatásának áttekintése után explicit újfelhasználói kezdődátum, majd `automatic` mód. Korábbi felhasználók manuálisan kereshetők; automatikus visszamenőleges tömeges küldés nincs.

### Korábbi címek ellenőrzése

Az alábbi parancs alapból csak lekéri a Clerk állapotát és összesítést ad. A választott env-fájl határozza meg az adatbázist és a Clerk környezetet.

```sh
npx tsx --env-file=<target-env> scripts/sync-lifecycle-email-verification.ts --from=2026-09-26T00:00:00Z --limit=100
```

Az `--apply` kapcsoló menti az egyező, hitelesített elsődleges címet. A kimeneti `nextCursor` a következő hívás `--after=<id>` paramétere. A `failed` profilokat külön újra kell ellenőrizni. A script nem küld levelet és nem írja felül a felhasználó emailcímét vagy leiratkozását.

## Hibák és visszaállítás

- `ACCEPTED`: a szolgáltató átvette; `DELIVERED`: webhook igazolja a kézbesítést. A két fogalom külön marad.
- `UNKNOWN`: a levél esetleg kiment. Ugyanazt a naplóbejegyzést későbbi worker nem küldi újra. A Resendben ellenőrizendő; a naplósor törlése vagy új kulcs létrehozása ismételt levelet okozhat.
- A szolgáltatói hívásnak 10 másodperces helyi várakozási korlátja van. Az azonnali retry ugyanazt a kulcsot és tartalmat használja, legfeljebb három próbálkozással. Nincs másnapi, 24 órán túli vak retry.
- A félbeszakadt, 15 percnél régebbi foglalások `UNKNOWN` állapotot kapnak a napi karbantartáskor. A gyors webhookot eseménynapló őrzi, amíg az átvételi válasszal összeköthető.
- A napi végpont részleges hibánál is 500-at ad; az összesítés a `LifecycleRun` rekordban és az adminban látszik. Az éles üzemeltetési monitor figyelje a hiányzó/elavult `finishedAt` értéket is: a Vercel hibás vagy kimaradt cronra nem garantál újrapróbálást.
- Új személyes kiküldés leállítása: `LIFECYCLE_MODE=off`. A naplóbejegyzéseket hagyjuk meg, mert ezek akadályozzák meg az ismétlést. Adatbázis-visszaállítás helyett először a funkciót kapcsoljuk ki.
- A levéltartalom, a leiratkozási bearer token és a webhook eseménynapló 90 nap után törlődik. A minimális küldési/céladat a fiók életéig megmarad a limitekhez; fióktörléskor a kapcsolódó célok és küldések törlődnek. A hibás címet kizáró nyilvántartás külön marad.

## Tudatos határok

Az első változat személyes körben kezeli a kezdést, folytatást és az első külső meghívást. A vendégként félbehagyott kérdőív, onboarding-emlékeztető, újabb értékelők ajánlása, kampányonként állítható szabályok és kontrollcsoportos hatásmérés további bővítések. Az admin a szerveren észlelt céllezárást mutatja; ebből önmagában nem következik, hogy a levél okozta az előrelépést.

A draft `updatedAt` értéke konzervatív aktivitási jel: azonos tartalom újbóli mentése halasztja az emlékeztetőt. A küldési számláló frissítése ezt az időt nem módosítja.
