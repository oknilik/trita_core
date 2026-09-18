# Működés-összevetés típusnév nélkül

A harmadik riportfejezet tévesen adathiányt jelzett akkor is, ha minden tengelyen elegendő adat volt, de együtt gyakori vagy ritka pólusok miatt nem volt besorolható a működési mintázat.

A közös web/PDF prezentáció ilyenkor a négy dimenzió alapján ad értelmezési kérdéseket. Nem képez kitalált típuskódot. Megmarad a minimumlétszám, lefedettség és eltérő tengelyenkénti válaszadói kör védelme. Hiányzó rétegnél konkrét üzenetet ad. Régi snapshot null összevetése is feloldható a benne tárolt aggregátumokból, élő mérés betöltése vagy a publikált adat módosítása nélkül.

Hat célzott teszt sikeres (köztük 256 típuspár HU/EN, új együttgyakori-pólus regresszió, lefedettségi és kohorszkapu). A node:test eseteket ideiglenes, azonos tartalmú Vitest adapterrel futtattuk, mert tsx loader nem állt rendelkezésre. TypeScript és célzott lint sikeres. A felhasználó konkrét riportjának adatbázisállapota és a bejelentkezett felület nem volt ellenőrizhető.
