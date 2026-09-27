# Kipróbálható lépés a riport összképében

## Hiba és javítás

Az „Amit érdemes kipróbálnod” kártya külön `growthTip` hiányában a
figyelendő vagy a legerősebb dimenzió általános leírását jelenítette meg.
Így például a Nyitottság meghatározása és alskáláinak felsorolása került
gyakorlati javaslat helyére. A web és a PDF ugyanazt a hibás választást
használta a közös `buildProfileSummaryInsights` függvényből.

A harmadik kártya most kizárólag kipróbálható lépést kap:

1. Ha van külön munkastílus-javaslat, az marad az első választás.
2. Ennek hiányában a meglévő szabály szerint kiválasztott alacsony
   dimenzióhoz tartozó gyakorlat jelenik meg. Ez a rövid riportban is
   elérhető; nincs szükség hozzá Plus-tartalomra.
3. Ha nincs ilyen dimenzió, egy rövid önmegfigyelési feladat segít a
   riport megállapításait saját helyzetekhez kötni. Ez nem állít hiányosságot.

Az üres vagy csak szóközt tartalmazó `growthTip` sem eredményez üres
kártyát. A dimenzióleírás és a pontszám értelmezése nem használható
helyettesítő szövegként. A javítás magyarul és angolul is érvényes;
az angol cím is a kipróbálható lépést nevezi meg.

A pontozás, a 40 pontos kiválasztási határ és az Emocionalitás mindkét
pólusának semleges kezelése változatlan. A webes riport és az új PDF
közös forrásból kapja a javítást. Korábban letöltött PDF-et újra kell
exportálni a változás megjelenéséhez.

## Ellenőrzés

- A hibát valódi kérdésbankból vett dimenzióleírásokkal reprodukáló új
  tesztben a javítás előtt 8 eset sikertelen, 2 sikeres volt; utána
  mind a 10 sikeres. A készlet magyar/angol, Start/Plus, magas Nyitottság,
  alacsony Emocionalitás, hiányzó és üres külön javaslat esetét is vizsgálja.
- A webes komponens tesztje ténylegesen megjelenített gyakorlati szöveget
  ellenőriz, és kizárja a dimenzió általános leírását.
- Mind a 12 személyes PDF-forgatókönyv renderelt összképén ellenőrizzük
  a harmadik kártya címét és javaslatát, valamint a tördelést.
- Teljes unit készlet: 1336 sikeres. Teljes klienskészlet: 427 sikeres,
  83 tesztfájl. `pnpm check` és `pnpm build`: sikeres.
- Külön képi ellenőrzés: egy magas Nyitottságú, kiemelt alacsony dimenzió
  nélküli Plus-minta és egy alacsony Nyitottságú Start-minta. Mindkét
  összképen megfelelő szöveg, olvasható tördelés és helyes tartalomjegyzék.
