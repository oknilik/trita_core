# 2026-08-17 — Több körös visszamérés seedelése (demo-adat)

> A PR #30 visszamérés-összehasonlítója (P0.1–P1.2) eddig csak unit-teszt
> fixture-ökön volt látható. Ahhoz, hogy a tanácsadói és a tag-nézet valódi
> adaton legyen bemutatható, a bemutató-szervezet EGY csapata több, egymást
> követő lezárt mérési kört kap.

## `scripts/seed-remeasurement-rounds.ts`

Előfeltétel a `seed-showcase-org.ts` (Aurora Dinamika Kft.). A script
alapértelmezetten **3 lezárt kört** hoz létre egy csapatra, körönként saját
publikált riporttal. Minden kör `requireFreshResults: true`, és a self-eredmény
a körhöz **címkézett** (`AssessmentResult.campaignId`) — ez adja a riport
`comparisonBasis` pszeudonim hozzájáruló-halmazát, amiből a stabil mag
újraszámolható.

```
npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview
npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --team "Értékesítés"
npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --rounds 2
npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --preset SCAN_V1
npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --teardown
```

A riportot nem kézzel gyártott JSON adja: a script az app saját
`buildTeamReportAggregates(teamId, { assessmentCampaignId })` +
`buildDraftNarrativePrefill` függvényeit hívja, tehát a seedelt kör pontosan
olyan, mintha a tanácsadó a felületen generálta volna.

A `--teardown` KIZÁRÓLAG a `Team Scan visszamérés` előtagú körökre és a
hozzájuk címkézett adatra nyúl. A címkézett rekordokat (self-eredmény,
szerep-kitöltés, observer-meghívó) a kampány törlése ELŐTT szedi ki: a
`SetNull`-os kapcsolatoknál utána már nem lenne mivel azonosítani őket.

## Miért így állnak a körök

A demo-adat szándékosan úgy van beállítva, hogy az összehasonlító minden ága
éljen, és egyik állítás se legyen zajra építve:

- **Pszichológiai biztonság** — a workshopon vállalt két akció célpontja
  (`PS1` kényes témák, `PS5` ötlet-kockázat) a 3. körre +1,0 / +0,75 pontot
  javul, ami a mérési kapun TÚL van. A többi item ±0,25-ön belül marad, tehát
  nem kap „változás" címkét. `PS8` a 2. körben szándékosan beesik, hogy az
  „új gyenge terület" ág is látszódjon.
- **Az index viszont `mérési hibán belül` marad** (+7 pont, a konzervatív
  prior kapu ~7,7). Ez nem hiba, hanem pont a P1.1 tétel: az item-szintű
  mozgás beszédesebb, mint a kompozit index.
- **Bizalmi háló** — a korai körökben csak részleges a háló, az utolsóban
  mindenki mindenkit értékel: a lefedettség 40% → 60%.
- **Összetétel** — körönként más tag marad ki, így `common: 3 · új: 1 ·
  kimaradt: 1` és 75%-os átfedés: a 70%-os kapu FELETT, tehát a stabil mag
  számolható, de a számok nem triviálisak.
- **Személyiség-átlagok** — a kör-drift ±3 pont, ami a stabil magon mérési
  hibán belül marad. A felület ezt kontrollként írja ki („Stabil: nincs
  mérési hibán túli profil-eltérés"), nem fejlődésként.

## Amit a seedelés közben javítani kellett

A `seed-campaign-cycle.ts`-ből örökölt FNV-1a hash **utolsó karakterre
gyakorlatilag érzéketlen** a felső biteken: a `…:${roundIndex}` alakú kulcsok
mind a három körben ugyanazt a kis egészet adták, így a self-drift körönként
azonos lett (a stabil mag deltái pontosan 0-k voltak). Az új scriptben a hash
murmur3 lezáró keverést kapott. **A `seed-campaign-cycle.ts` változatlan** — ott
a kulcsok változó része nem a végén van, ezért nem érinti; ha valaki oda is
kulcsvégi indexet vezet be, ugyanezt a finalizert kell átvinni.

Két realizmus-hiba is javult: a self szerep-kérdőív körönként STABIL (egy
ember szerep-preferenciája nem pörög körről körre), a peer-szerepkép pedig a
tag saját képéből indul és csak a kiemelt hármas ablakát tolja el —
korábban független véletlen volt, ami 100%-os önkép–peer eltérést mutatott.

## Ellenőrzés

Helyi Postgres 16 + `prisma migrate deploy` + a felület E2E auth-bypasson át
(`TRITA_E2E_AUTH_BYPASS=1`):

- tanácsadó (`ORG_CONSULTANT`): a riport-fülön mind a 3 kör látszik, a
  „Mi változott az előző kör óta?" blokk mind a négy panelt, az
  akció → mért kimenet táblát és a mérési kontrollokat kirendereli;
- csapattag (`ORG_MEMBER`): a saját szemszög-nézetét kapja, a
  kör-összehasonlító blokk NEM jelenik meg nála;
- a `comparisonBasis` a tanácsadói szerializációban ott van, a tag-nézetben
  redaktálva — a `serializeTeamReport` kapuja tehát él.
