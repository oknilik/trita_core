// Karrier-modul állapot-kapcsolója — SZÁNDÉKOSAN külön fájlban.
//
// A `module-visibility.ts` prisma-t importál (org-szintű lekérdezés). Ez a
// konstans viszont a kliens-oldali navigáció-építőbe is bekerül, és ha onnan
// a prisma is a böngésző-bundle-be kerülne, az oldal futásidőben elszáll
// („Extensions.defineExtension is unable to run in this browser environment").
// Ezért a flag adat-hozzáférés nélküli modulban él.
//
// false = a `/career` a kereslet-mérő fake doort mutatja a működő iránytű
// helyett, a menüpont eltűnik, és a PDF karrier-blokkja sem számolódik. A
// modul kódja érintetlenül a helyén marad.
//
// ÉLESÍTÉS: állítsd true-ra. A kereslet-mérés magától elhallgat (a felvett
// adat megmarad), és a `/career` visszakapja a CareerCompass-t.
//
// 2026-08-11 — VISSZAKÖTVE (true). A motor-körök után megmértük, hogy a v2
// motor mit tud: a v1 fődiagnózisa („nem differenciál") megszűnt — a rangsor
// szórása 5,3 → 10,9, az elevation-hatás r = 0,70 → 0,04, a legerősebb
// egydimenziós függés r = 0,82 → 0,26. A mérés reprodukálható:
// `npx tsx scripts/career-validation/simulate.ts`; jegyzőkönyv:
// `docs/audits/career-engine-benchmark-2026-08-11.md`.
//
// EGY FELTÉTEL a széles élesítéshez (ld. az audit 4. pontját): a rangsort a
// wizard preferencia-lépése tartja. Ha a felhasználó minden tengelyt
// semlegesen hagy, a listavezető klasztere ~80 szerep, és két mérés top-10-e
// alig fedi egymást (0,23). A preferencia-lépés kitöltése ezért nem
// opcionális kényelmi kérdés — enélkül a lista feje zaj.
export const CAREER_MODULE_READY = true;
