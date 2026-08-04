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
export const CAREER_MODULE_READY = false;
