import type { Locale } from "@/lib/i18n/core";
import { COMPANY, SUPERVISORY_AUTHORITY } from "./company";

/**
 * Az adatvédelmi tájékoztató TARTALMA, dokumentum-struktúraként.
 *
 * MIÉRT NEM i18n-KULCSOK (eltérés a projekt-konvenciótól, tudatosan):
 * a konvenció célja, hogy a HU és az EN szöveg ne csússzon szét. Egy ~17
 * szakaszos, táblázatokat is tartalmazó jogi dokumentumnál ezt egy lapos
 * kulcskészlet ROSSZABBUL szolgálja: 200+ kulcs mellett a szakaszok sorrendje,
 * a táblázatok oszlopszáma és a felsorolások hossza semmilyen ellenőrzés alatt
 * nem áll. Itt a dokumentum TIPIZÁLT: a `Record<Locale, PolicyDocument>` miatt
 * mindkét nyelv kötelező, és a `tests/unit/legal/privacy-policy.test.ts`
 * szerkezeti egyezést is követel (azonos szakasz-id-k, azonos blokk-típusok,
 * azonos táblázat-alak). A UI-szövegek (TOC-felirat stb.) is itt élnek, mert
 * ezek is a dokumentum részei, nem újrahasznosított felület-címkék.
 *
 * TARTALMI ELVEK:
 * - Amit állítunk, az a termék tényleges működése (anonimitási küszöb,
 *   observer-lejárat, adatfeldolgozók listája) — nem sablonszöveg.
 * - A GDPR 13-14. cikk kötelező elemei mind szerepelnek: adatkezelő, célok,
 *   JOGALAPOK, címzettek, harmadik országba továbbítás, megőrzési idők,
 *   érintetti jogok, panaszjog (NAIH), automatizált döntéshozatal.
 * - A cégadatok jelenleg placeholderek (ld. `company.ts`), ezért a lap
 *   „tervezet" jelölést kap. Ez szándékos: kitalált cégadatokkal közölt
 *   tájékoztató nem teljesíti a tájékoztatási kötelezettséget.
 */

export type PolicyBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "dl"; items: { term: string; description: string }[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "note"; text: string };

export interface PolicySection {
  /** Horgony-id — a tartalomjegyzék és a mélylinkek használják. */
  id: string;
  title: string;
  blocks: PolicyBlock[];
}

export interface PolicyDocument {
  title: string;
  /** Rövid, emberi összefoglaló a hero alatt. */
  lead: string;
  lastUpdated: string;
  effectiveFrom: string;
  draftBadge: string;
  draftNote: string;
  tocLabel: string;
  eyebrow: string;
  backToTop: string;
  sections: PolicySection[];
}

const NAIH_LINE_HU = `${SUPERVISORY_AUTHORITY.name} · ${SUPERVISORY_AUTHORITY.address} (postacím: ${SUPERVISORY_AUTHORITY.postalAddress}) · ${SUPERVISORY_AUTHORITY.phone} · ${SUPERVISORY_AUTHORITY.email} · ${SUPERVISORY_AUTHORITY.website}`;
const NAIH_LINE_EN = `${SUPERVISORY_AUTHORITY.nameEn} · ${SUPERVISORY_AUTHORITY.address}, Hungary (postal: ${SUPERVISORY_AUTHORITY.postalAddress}) · ${SUPERVISORY_AUTHORITY.phone} · ${SUPERVISORY_AUTHORITY.email} · ${SUPERVISORY_AUTHORITY.website}`;

const HU: PolicyDocument = {
  title: "Adatvédelmi tájékoztató",
  lead: "Ez a tájékoztató azt írja le, milyen személyes adatokat kezelünk, miért, milyen jogalapon, meddig, kivel osztjuk meg — és mit tehetsz, ha nem értesz egyet valamivel. Röviden: a felmérési eredményed a tiéd, egyéni válaszod soha nem jelenik meg csapatszintű nézetben, és a profilodat bármikor törölheted.",
  lastUpdated: "Utoljára frissítve: 2026. augusztus 6.",
  effectiveFrom: "Hatályos: 2026. augusztus 6-tól",
  draftBadge: "Tervezet",
  draftNote:
    "Ez a tájékoztató tartalmilag kész, de az adatkezelő cégadatai (cégnév, székhely, cégjegyzékszám, adószám) még véglegesítés alatt állnak — a lenti értékek helykitöltők. A végleges adatok bevezetéséig a dokumentumot tervezetként kezeld. Az adatkezelési gyakorlat, amit leír, a valós működésünk.",
  tocLabel: "Tartalom",
  eyebrow: "jogi",
  backToTop: "Vissza a tetejére",
  sections: [
    {
      id: "controller",
      title: "Ki kezeli az adataidat?",
      blocks: [
        {
          kind: "p",
          text: "A Trita platformot az alábbi társaság üzemelteti. Adatvédelmi kérdésben bármikor fordulhatsz hozzánk a megadott e-mail-címen.",
        },
        {
          kind: "dl",
          items: [
            { term: "Adatkezelő", description: COMPANY.legalName },
            { term: "Székhely", description: COMPANY.address },
            { term: "Cégjegyzékszám", description: COMPANY.registrationNumber },
            { term: "Adószám", description: COMPANY.taxNumber },
            { term: "Képviselő", description: COMPANY.representative },
            { term: "E-mail", description: COMPANY.privacyEmail },
            { term: "Weboldal", description: "https://trita.io" },
          ],
        },
        {
          kind: "p",
          text: "Adatvédelmi tisztviselőt nem jelöltünk ki: tevékenységünk nem jár a GDPR 37. cikke szerinti kötelező kijelölési esettel (nem végzünk nagy léptékű, rendszeres és szisztematikus megfigyelést, és nem kezelünk nagy léptékben különleges adatot). Adatvédelmi megkeresésekre a fenti címen válaszolunk.",
        },
      ],
    },
    {
      id: "roles",
      title: "Mikor vagyunk adatkezelők, és mikor adatfeldolgozók?",
      blocks: [
        {
          kind: "p",
          text: "Ez a legfontosabb megkülönböztetés a tájékoztatóban, mert eldönti, kihez fordulj a jogaiddal.",
        },
        {
          kind: "dl",
          items: [
            {
              term: "Egyéni használat — mi vagyunk az adatkezelő",
              description:
                "Ha magadtól regisztrálsz vagy kitöltöd az ingyenes felmérést, a saját adataid kezeléséről mi döntünk. Ilyenkor ez a tájékoztató az irányadó, és a jogaidat velünk szemben gyakorolhatod.",
            },
            {
              term: "Szervezeti megrendelés — a munkáltatód az adatkezelő, mi adatfeldolgozók vagyunk",
              description:
                "Ha a felmérésen a munkáltatód vagy egy megbízó szervezet felkérésére veszel részt (csapatfelmérés, 360°-os kampány, jelölti folyamat), az adatkezelés céljáról az a szervezet dönt — mi az ő megbízásából, adatfeldolgozói szerződés alapján járunk el. Ilyenkor elsősorban a szervezet saját adatkezelési tájékoztatója irányadó, és a törlési vagy hozzáférési kérésedet a szervezet felé is jelezheted. Ha hozzánk fordulsz, továbbítjuk a megrendelőnek.",
            },
            {
              term: "Megfigyelői (observer) visszajelzés — vegyes",
              description:
                "Ha valakinek a meghívására töltesz ki róla visszajelzést, a te válaszaidat a meghívó személy eredményéhez rendeljük. A megadott e-mail-címedet kizárólag a meghívó kézbesítéséhez használjuk.",
            },
          ],
        },
      ],
    },
    {
      id: "data",
      title: "Milyen adatokat kezelünk?",
      blocks: [
        {
          kind: "dl",
          items: [
            {
              term: "Fiókadatok",
              description:
                "E-mail-cím, felhasználónév, hitelesítési azonosítók (a Clerk szolgáltatáson keresztül), Google-fiók azonosító, ha Google-lel lépsz be. Jelszót mi magunk nem tárolunk.",
            },
            {
              term: "Profil- és háttéradatok",
              description:
                "Születési év, nem, végzettség, ország, jelenlegi státusz (munka/tanulás), munkarend, cégméret. Ezek megadása önkéntes; hiányukban a felmérés kitölthető, csak az összehasonlító értelmezés lesz szűkebb.",
            },
            {
              term: "Felmérési adatok",
              description:
                "A kérdőívek itemenkénti válaszai, a belőlük számított dimenzió- és alskála-pontszámok, a csapatszerep- és érdeklődés-eredmények, a kitöltés időbélyegei és a félbehagyott kitöltés piszkozata.",
            },
            {
              term: "Visszajelzési adatok",
              description:
                "Az ismerősi/kollégai (observer) értékelések, a meghívó és a meghívott közötti kapcsolat típusa, a válaszadó saját megbízhatóság-jelölése, valamint az eredmények után kitöltött elégedettségi kérdőív.",
            },
            {
              term: "Szervezeti adatok",
              description:
                "Szervezeti és csapattagság, szerepkör (tag, vezető, adminisztrátor, tanácsadó), kampány-részvétel és -állapot.",
            },
            {
              term: "Kapcsolatfelvételi adatok",
              description:
                "Ha írsz nekünk a kapcsolati űrlapon: név, e-mail-cím, cégnév, a megkeresés témája és az üzenet szövege.",
            },
            {
              term: "Feliratkozási adatok",
              description:
                "Ha feliratkozol a hírlevelünkre vagy az új blogbejegyzés-értesítőre: e-mail-cím, nyelv, a feliratkozás forrása (melyik oldalról), a megerősítés és az esetleges leiratkozás időpontja. A megerősítés időpontja a hozzájárulásod igazolása.",
            },
            {
              term: "Technikai adatok",
              description:
                "Nyelvi beállítás (süti), munkamenet-azonosítók, hibanaplók, valamint süti nélküli, összesített látogatottsági és teljesítmény-statisztikák.",
            },
          ],
        },
        {
          kind: "note",
          text: "Amit NEM kezelünk: a GDPR 9. cikke szerinti különleges adatot (egészségügyi adat, vallási vagy politikai meggyőződés, szexuális irányultság, biometrikus adat) nem gyűjtünk. A személyiség-felmérés eredménye nem egészségügyi adat és nem diagnózis: viselkedési preferenciák önbevalláson alapuló mérése. Bankkártya- és fizetési adatot sem kezelünk — a számlázás a platformon kívül történik.",
        },
      ],
    },
    {
      id: "purposes",
      title: "Miért és milyen jogalapon kezeljük?",
      blocks: [
        {
          kind: "p",
          text: "Minden adatkezelési célnak megvan a maga jogalapja a GDPR 6. cikke szerint. Ahol a jogalap a jogos érdek, ott érdekmérlegelést végeztünk, és annak összefoglalóját kérésre megküldjük.",
        },
        {
          kind: "table",
          columns: ["Cél", "Érintett adatkör", "Jogalap"],
          rows: [
            [
              "Fiók létrehozása és működtetése, bejelentkezés",
              "Fiókadatok",
              "Szerződés teljesítése — GDPR 6. cikk (1) b)",
            ],
            [
              "A felmérés kiszolgálása, pontszámítás, eredmények megjelenítése",
              "Felmérési és profiladatok",
              "Szerződés teljesítése — 6. cikk (1) b)",
            ],
            [
              "Observer-meghívó kiküldése és a visszajelzés összevetése az önértékeléssel",
              "Meghívott e-mail-címe, visszajelzési adatok",
              "Jogos érdek — 6. cikk (1) f): a felhasználó kifejezett kérésére küldünk meghívót; a címzett bármikor kérheti a törlést",
            ],
            [
              "Csapat- és szervezeti szintű mérések, riportok, kampánykezelés",
              "Felmérési, visszajelzési és szervezeti adatok",
              "A megrendelő szervezet utasítása alapján, adatfeldolgozóként — a szervezet jogalapja (jellemzően jogos érdek vagy szerződés)",
            ],
            [
              "Kapcsolatfelvétel megválaszolása, ajánlatadás",
              "Kapcsolatfelvételi adatok",
              "Szerződéskötést megelőző lépések / jogos érdek — 6. cikk (1) b) és f)",
            ],
            [
              "Hírlevél és új blogbejegyzés-értesítő küldése",
              "Feliratkozási adatok",
              "Hozzájárulás — 6. cikk (1) a); kétlépcsős (megerősítő linkes) feliratkozás, bármikor, egy kattintással visszavonható",
            ],
            [
              "Szolgáltatás- és módszertan-fejlesztés összesített adatokon",
              "Felmérési adatok, anonimizálás után",
              "Jogos érdek — 6. cikk (1) f); az anonimizált, aggregált eredmény már nem személyes adat",
            ],
            [
              "Üzemeltetés, biztonság, visszaélés-megelőzés, hibakeresés",
              "Technikai adatok, naplók",
              "Jogos érdek — 6. cikk (1) f)",
            ],
            [
              "A felület használatának mérése (mely oldalak, hol akad el a folyamat)",
              "Felületi események: megnyitott oldal, gombkattintás, a kitöltés hányadik kérdésénél tart",
              "Jogos érdek — 6. cikk (1) f); saját, first-party mérés, külső szolgáltató nélkül",
            ],
            [
              "Számviteli kötelezettségek teljesítése",
              "Számlázási és kapcsolattartói adatok",
              "Jogi kötelezettség — 6. cikk (1) c), a számvitelről szóló 2000. évi C. törvény alapján",
            ],
          ],
        },
      ],
    },
    {
      id: "team-feedback",
      title: "Csapatszintű visszajelzések és anonimitás",
      blocks: [
        {
          kind: "p",
          text: "A csapatszintű mérések (csapattársi szerep-visszajelzés, bizalmi kör, pszichológiai biztonság pulzusmérés) csak akkor működnek, ha a válaszadó biztos lehet abban, hogy az egyedi válasza nem azonosítható. Ezért a következő szabályok technikailag is érvényesülnek, nem csak ígéretként:",
        },
        {
          kind: "ul",
          items: [
            "Egyéni válasz soha nem jelenik meg csapat- vagy szervezeti nézetben — kizárólag összesített formában.",
            "Összesített eredmény is csak akkor jelenik meg, ha legalább 3 értékelő, illetve kitöltő válasza rendelkezésre áll. A küszöb alatt a felület nem mutat eredményt.",
            "A pszichológiai biztonság pulzusválaszait eleve felhasználói azonosító nélkül rögzítjük — ezeket utólag sem tudjuk személyhez kötni.",
            "Az összesített csapatképet a csapat vezetője, a szervezeti adminisztrátor és a szervezethez rendelt tanácsadó látja; te a rólad szóló, összesített visszajelzést látod.",
            "A bizalmi kör eredménye páronkénti, két irány átlagából képzett formában jelenik meg — az egyes irányított válaszok ott sem láthatók.",
          ],
        },
        {
          kind: "p",
          text: "A profilod törlésével a hozzád köthető válaszok is törlődnek. A már anonimizált, összesített eredmények személyhez nem vezethetők vissza, ezért azok nem törölhetők — ez a GDPR szerint már nem személyesadat-kezelés.",
        },
      ],
    },
    {
      id: "automated",
      title: "Automatizált döntéshozatal és profilalkotás",
      blocks: [
        {
          kind: "p",
          text: "A pontszámokat és az illeszkedési mutatókat algoritmus számolja ki — ez profilalkotásnak minősül. Ugyanakkor a GDPR 22. cikke szerinti, KIZÁRÓLAG automatizált, rád nézve joghatással járó vagy hasonlóan jelentős döntést nem hozunk és nem hozunk létre.",
        },
        {
          kind: "ul",
          items: [
            "Az eredmény önmagában nem alkalmas felvételi, előléptetési vagy elbocsátási döntésre, és mi ilyet nem hozunk.",
            "Jelölti folyamatban a döntést mindig a munkáltató hozza meg, emberi mérlegeléssel; a mi kimenetünk egy értelmezendő szempont, nem ítélet.",
            "Minden becsült (nem közvetlenül mért) értéket a felületen forrás- és megbízhatóság-jelöléssel látunk el, hogy ne lehessen mért ténynek olvasni.",
            "Ha úgy érzed, egy rád vonatkozó eredményt hibásan értelmeztek, kérheted az emberi felülvizsgálatot és kifejtheted az álláspontodat.",
          ],
        },
      ],
    },
    {
      id: "recipients",
      title: "Ki fér hozzá az adataidhoz?",
      blocks: [
        {
          kind: "p",
          text: "Személyes adatot nem adunk el és nem adunk át reklámcélra. Az alábbi adatfeldolgozók a szolgáltatás működtetéséhez szükséges mértékben férnek hozzá, szerződéses kötelezettség mellett.",
        },
        {
          kind: "table",
          columns: ["Adatfeldolgozó", "Mit végez", "Hol tárol"],
          rows: [
            [
              "Clerk (clerk.com)",
              "Hitelesítés, munkamenet-kezelés",
              "USA — EU–U.S. Data Privacy Framework, illetve általános szerződési feltételek (SCC)",
            ],
            [
              "Neon (neon.tech)",
              "PostgreSQL adatbázis, a felhasználói és felmérési adatok tárolása",
              "EU (uniós régió)",
            ],
            [
              "Vercel (vercel.com)",
              "Alkalmazás-üzemeltetés, süti nélküli látogatottsági és teljesítmény-statisztika",
              "EU/USA — DPA és SCC alapján",
            ],
            [
              "Resend (resend.com)",
              "Tranzakciós e-mailek kézbesítése (meghívók, értesítők)",
              "USA — SCC alapján",
            ],
          ],
        },
        {
          kind: "p",
          text: "Ezen felül hozzáférhet az adatodhoz a szervezeted arra jogosult munkatársa (vezető, adminisztrátor) és a szervezethez rendelt tanácsadónk — a fenti anonimitási szabályok keretei között. Hatóság felé kizárólag jogszabályi kötelezettség esetén adunk ki adatot.",
        },
      ],
    },
    {
      id: "transfers",
      title: "Adattovábbítás az EGT-n kívülre",
      blocks: [
        {
          kind: "p",
          text: "Egyes szolgáltatóink az Egyesült Államokban működnek. Az ilyen továbbítás jogalapja vagy az Európai Bizottság megfelelőségi határozata (EU–U.S. Data Privacy Framework, ahol a szolgáltató tanúsított), vagy az Európai Bizottság által elfogadott általános szerződési feltételek (SCC), kiegészítő biztosítékokkal. A tárolás elsődleges helye az adatbázis szintjén az Európai Unió.",
        },
      ],
    },
    {
      id: "retention",
      title: "Meddig őrizzük az adatokat?",
      blocks: [
        {
          kind: "table",
          columns: ["Adat", "Megőrzési idő"],
          rows: [
            [
              "Fiók-, profil- és felmérési adatok",
              "A fiókod törléséig. Törlés után 30 napon belül a biztonsági mentésekből is kikerülnek.",
            ],
            [
              "Félbehagyott kitöltés piszkozata",
              "A kitöltés befejezéséig, legfeljebb 90 napig.",
            ],
            [
              "Observer-meghívó és -token",
              "A meghívó kiküldésétől számított 30 nap (lejárat), illetve a visszavonásig.",
            ],
            [
              "Csapat- és szervezeti mérési adatok",
              "A megrendelő szervezettel fennálló szerződés végéig, azt követően 90 napon belüli törlés vagy visszaadás — a szervezet utasítása szerint.",
            ],
            [
              "Kapcsolatfelvételi üzenetek",
              "A megkeresés lezárásától számított 12 hónap.",
            ],
            [
              "Hírlevél-feliratkozás",
              "A leiratkozásig. Leiratkozás után a címet a hozzájárulás igazolása és az ismételt megkeresés elkerülése végett további 12 hónapig megőrizzük, majd töröljük. A meg nem erősített feliratkozás 7 nap után magától érvénytelenné válik.",
            ],
            [
              "Számlázási és számviteli bizonylatok",
              "8 év (a számvitelről szóló 2000. évi C. törvény 169. §-a alapján).",
            ],
            [
              "Üzemeltetési naplók",
              "Legfeljebb 12 hónap.",
            ],
            [
              "Felületi használati események",
              "12 hónap, utána automatikus törlés. A profilod törlésekor az események azonnal elveszítik a kapcsolatot veled.",
            ],
            [
              "Anonimizált, összesített statisztikák",
              "Időbeli korlát nélkül — ezek már nem személyes adatok.",
            ],
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "Sütik",
      blocks: [
        {
          kind: "p",
          text: "Kizárólag a működéshez szükséges sütiket használunk. Marketing- és nyomkövető sütit nem helyezünk el, és nem osztunk meg adatot hirdetési hálózatokkal — ezért nem is jelenítünk meg süti-elfogadó felugrót.",
        },
        {
          kind: "table",
          columns: ["Süti", "Cél", "Élettartam"],
          rows: [
            ["trita_locale", "A választott felületnyelv megjegyzése", "1 év"],
            ["__session (Clerk)", "Bejelentkezett munkamenet fenntartása", "A munkamenet végéig"],
            ["__client_uat (Clerk)", "A bejelentkezési állapot frissítésének vezérlése", "1 év"],
          ],
        },
        {
          kind: "p",
          text: "A látogatottság- és teljesítménymérés (Vercel Analytics, Speed Insights) sütit nem használ; az IP-címet rövid ideig, hasított (anonimizált) formában dolgozza fel az egyedi látogatók megkülönböztetéséhez, és nem tárolja személyes adatként. A kimenet összesített forgalmi statisztika és Core Web Vitals mutató.",
        },
        {
          kind: "p",
          text: "A saját használat-mérésünk sem tesz le sütit, és semmilyen más azonosítót nem tárol az eszközödön: a látogató azonosítója NAPONTA ROTÁLÓ álnév, amit az IP-címből és a böngésző-azonosítóból számolt visszafejthetetlen kivonat ad — magát az IP-címet nem tároljuk, és másnap ugyanaz a látogató már más álnév alatt jelenik meg. Az események a mi szervereinkre érkeznek és a mi adatbázisunkban maradnak; nincs mögötte külső analitikai szolgáltató, és semmilyen adat nem megy ki reklámhálózathoz. Ha a böngésződ nyomkövetés-tiltást jelez (Global Privacy Control vagy Do Not Track), semmit nem mérünk. Esemény-tulajdonságban nincs név, e-mail-cím, szabad szöveg, kérdőív-válasz, pontszám vagy meghívó-token. Ezért nincs süti-elfogadó felugró sem.",
        },
      ],
    },
    {
      id: "security",
      title: "Hogyan védjük az adataidat?",
      blocks: [
        {
          kind: "ul",
          items: [
            "Titkosított átvitel (HTTPS/TLS) minden kérésnél, és titkosított tárolás az adatbázis szintjén.",
            "Jelszót nem tárolunk: a hitelesítést erre szakosodott szolgáltató (Clerk) végzi, kétlépcsős azonosítás lehetőségével.",
            "Szerepkör-alapú hozzáférés-szabályozás: a csapat- és szervezeti adatokhoz csak a jogosult szerepkörök férnek hozzá, és minden lekérés jogosultság-ellenőrzésen megy át.",
            "A megosztó és megfigyelői linkek egyedi, lejáró tokent használnak, amely bármikor visszavonható.",
            "Belső hozzáférés szükségesség alapján, naplózva; a fejlesztéshez és teszteléshez nem éles adatot használunk.",
          ],
        },
        {
          kind: "p",
          text: "Ha mégis olyan adatvédelmi incidens történik, amely valószínűsíthetően magas kockázattal jár rád nézve, indokolatlan késedelem nélkül tájékoztatunk, és a hatóság felé 72 órán belül bejelentjük.",
        },
      ],
    },
    {
      id: "rights",
      title: "A te jogaid",
      blocks: [
        {
          kind: "dl",
          items: [
            {
              term: "Hozzáférés",
              description:
                "Tájékoztatást kérhetsz arról, milyen adatot kezelünk rólad, és másolatot kérhetsz róla. A legtöbb adatod közvetlenül látható a profilodban.",
            },
            {
              term: "Helyesbítés",
              description: "Kérheted a pontatlan adat javítását; a profiladataidat magad is szerkesztheted.",
            },
            {
              term: "Törlés",
              description:
                "Bármikor törölheted a profilodat a profiloldalon — ezzel a hozzád köthető felmérési és visszajelzési adatok is törlődnek. Kivétel: amit jogszabály alapján meg kell őriznünk (pl. számviteli bizonylat).",
            },
            {
              term: "Az adatkezelés korlátozása",
              description:
                "Kérheted, hogy az adatod kezelését függesszük fel, amíg egy vitatott kérdés (pl. pontosság vagy jogos érdek) tisztázódik.",
            },
            {
              term: "Adathordozhatóság",
              description:
                "Kérheted, hogy a megadott és a mért adataidat géppel olvasható formátumban add ki, vagy — ha technikailag megvalósítható — továbbítsuk másik szolgáltatónak.",
            },
            {
              term: "Tiltakozás",
              description:
                "Tiltakozhatsz a jogos érdeken alapuló adatkezelés ellen. Ilyenkor addig nem kezeljük tovább az adatot, amíg nem igazoljuk, hogy kényszerítő erejű jogos okunk van rá.",
            },
            {
              term: "Hozzájárulás visszavonása",
              description:
                "Ahol hozzájáruláson alapul az adatkezelés, azt bármikor visszavonhatod. A visszavonás a korábbi kezelés jogszerűségét nem érinti.",
            },
          ],
        },
        {
          kind: "p",
          text: `Kérésedet a ${COMPANY.privacyEmail} címre küldheted. Indokolatlan késedelem nélkül, de legkésőbb a kérés beérkezésétől számított egy hónapon belül válaszolunk; összetett vagy nagyszámú kérés esetén ez a határidő további két hónappal meghosszabbítható, amiről egy hónapon belül tájékoztatunk. A válasz díjmentes.`,
        },
      ],
    },
    {
      id: "complaint",
      title: "Panasz és jogorvoslat",
      blocks: [
        {
          kind: "p",
          text: "Ha úgy látod, hogy az adatkezelésünk jogszabályba ütközik, először érdemes közvetlenül nekünk írni — a legtöbb ügy így rendeződik a leggyorsabban. Ettől függetlenül panaszt tehetsz a felügyeleti hatóságnál:",
        },
        { kind: "note", text: NAIH_LINE_HU },
        {
          kind: "p",
          text: "Jogaid megsértése esetén bírósághoz is fordulhatsz. A per — választásod szerint — a lakóhelyed vagy tartózkodási helyed szerinti törvényszék előtt is megindítható.",
        },
      ],
    },
    {
      id: "minors",
      title: "Kiskorúak",
      blocks: [
        {
          kind: "p",
          text: "A szolgáltatás 16 éven felülieknek készült. 16 év alatti személy adatait tudatosan nem kezeljük; ha ilyet észlelünk, az adatot töröljük. Ha szülőként vagy gondviselőként úgy látod, hogy a gyermeked adatot adott meg nekünk, jelezd, és haladéktalanul törlünk.",
        },
      ],
    },
    {
      id: "changes",
      title: "A tájékoztató módosítása",
      blocks: [
        {
          kind: "p",
          text: "A tájékoztatót időről időre frissítjük — például új funkció vagy új adatfeldolgozó bevezetésekor. A lap tetején mindig szerepel a legutóbbi frissítés dátuma. Ha a változás érdemben érinti a jogaidat vagy az adatkezelés célját, a változás hatálybalépése előtt e-mailben vagy a felületen külön értesítünk.",
        },
      ],
    },
    {
      id: "contact",
      title: "Kapcsolat",
      blocks: [
        {
          kind: "p",
          text: `Adatvédelmi kérdésben, kérésben vagy panasszal írj a ${COMPANY.privacyEmail} címre, vagy postai úton a székhelyünkre: ${COMPANY.address}. Igyekszünk egy munkanapon belül visszajelezni.`,
        },
      ],
    },
  ],
};

const EN: PolicyDocument = {
  title: "Privacy Policy",
  lead: "This policy explains what personal data we process, why, on what legal basis, for how long, and who we share it with — and what you can do if you disagree with something. In short: your assessment results are yours, your individual answers never appear in a team-level view, and you can delete your profile at any time.",
  lastUpdated: "Last updated: 6 August 2026",
  effectiveFrom: "Effective from: 6 August 2026",
  draftBadge: "Draft",
  draftNote:
    "The content of this policy is complete, but the controller's company details (legal name, registered address, company registration and tax numbers) are still being finalised — the values below are placeholders. Until the final details are in place, treat this document as a draft. The processing practices it describes are how we actually operate.",
  tocLabel: "Contents",
  eyebrow: "legal",
  backToTop: "Back to top",
  sections: [
    {
      id: "controller",
      title: "Who processes your data?",
      blocks: [
        {
          kind: "p",
          text: "The Trita platform is operated by the company below. You can reach us at the email address given here with any privacy question.",
        },
        {
          kind: "dl",
          items: [
            { term: "Controller", description: COMPANY.legalName },
            { term: "Registered address", description: COMPANY.address },
            { term: "Company registration number", description: COMPANY.registrationNumber },
            { term: "Tax number", description: COMPANY.taxNumber },
            { term: "Represented by", description: COMPANY.representative },
            { term: "Email", description: COMPANY.privacyEmail },
            { term: "Website", description: "https://trita.io" },
          ],
        },
        {
          kind: "p",
          text: "We have not appointed a data protection officer: our activities do not trigger the mandatory appointment criteria under Article 37 GDPR (we carry out no large-scale regular and systematic monitoring, and we do not process special categories of data on a large scale). Privacy requests are handled at the address above.",
        },
      ],
    },
    {
      id: "roles",
      title: "When are we a controller, and when a processor?",
      blocks: [
        {
          kind: "p",
          text: "This is the most important distinction in this policy, because it determines who you should turn to when exercising your rights.",
        },
        {
          kind: "dl",
          items: [
            {
              term: "Individual use — we are the controller",
              description:
                "If you sign up on your own or take the free assessment, we decide how your data is processed. This policy applies, and you can exercise your rights against us.",
            },
            {
              term: "Organizational engagement — your employer is the controller, we are a processor",
              description:
                "If you take part at the request of your employer or a client organization (team assessment, 360° campaign, candidate process), that organization decides the purpose of the processing — we act on their instructions under a data processing agreement. In that case the organization's own privacy notice applies first, and you may also address deletion or access requests to them. If you contact us, we forward the request to the client.",
            },
            {
              term: "Observer feedback — mixed",
              description:
                "If you rate someone at their invitation, your answers are linked to that person's results. Your email address is used solely to deliver the invitation.",
            },
          ],
        },
      ],
    },
    {
      id: "data",
      title: "What data do we process?",
      blocks: [
        {
          kind: "dl",
          items: [
            {
              term: "Account data",
              description:
                "Email address, username, authentication identifiers (via Clerk), and your Google account identifier if you sign in with Google. We do not store passwords ourselves.",
            },
            {
              term: "Profile and background data",
              description:
                "Birth year, gender, education, country, current status (work/study), work arrangement, company size. Providing these is optional; without them the assessment still works, only the comparative interpretation is narrower.",
            },
            {
              term: "Assessment data",
              description:
                "Item-level questionnaire answers, the dimension and facet scores calculated from them, team-role and interest results, completion timestamps, and the draft of an unfinished assessment.",
            },
            {
              term: "Feedback data",
              description:
                "Peer and acquaintance (observer) ratings, the type of relationship between inviter and invitee, the respondent's own confidence rating, and the satisfaction survey completed after results.",
            },
            {
              term: "Organizational data",
              description:
                "Organization and team membership, role (member, manager, admin, consultant), campaign participation and status.",
            },
            {
              term: "Contact data",
              description:
                "If you write to us through the contact form: name, email address, company name, topic and the message itself.",
            },
            {
              term: "Subscription data",
              description:
                "If you subscribe to our newsletter or new-article updates: email address, language, the source of the subscription (which page), the time of confirmation and of any later unsubscribe. The confirmation timestamp is the proof of your consent.",
            },
            {
              term: "Technical data",
              description:
                "Language preference (cookie), session identifiers, error logs, and cookie-free aggregated traffic and performance statistics.",
            },
          ],
        },
        {
          kind: "note",
          text: "What we do NOT process: we collect no special category data under Article 9 GDPR (health data, religious or political beliefs, sexual orientation, biometric data). Personality assessment results are not health data and not a diagnosis: they are a self-reported measurement of behavioural preferences. We also process no card or payment data — invoicing happens outside the platform.",
        },
      ],
    },
    {
      id: "purposes",
      title: "Why and on what legal basis do we process it?",
      blocks: [
        {
          kind: "p",
          text: "Every purpose has its own legal basis under Article 6 GDPR. Where the basis is legitimate interest, we have carried out a balancing test and will send you a summary of it on request.",
        },
        {
          kind: "table",
          columns: ["Purpose", "Data involved", "Legal basis"],
          rows: [
            [
              "Creating and operating your account, signing in",
              "Account data",
              "Performance of a contract — Art. 6(1)(b) GDPR",
            ],
            [
              "Delivering the assessment, scoring, displaying results",
              "Assessment and profile data",
              "Performance of a contract — Art. 6(1)(b)",
            ],
            [
              "Sending observer invitations and comparing feedback with your self-assessment",
              "Invitee's email address, feedback data",
              "Legitimate interest — Art. 6(1)(f): invitations are sent at the user's explicit request; recipients may request deletion at any time",
            ],
            [
              "Team and organization-level measurements, reports, campaign management",
              "Assessment, feedback and organizational data",
              "On the client organization's instructions, as a processor — the organization's own legal basis (typically legitimate interest or contract)",
            ],
            [
              "Responding to enquiries and preparing quotes",
              "Contact data",
              "Steps prior to entering into a contract / legitimate interest — Art. 6(1)(b) and (f)",
            ],
            [
              "Sending the newsletter and new-article updates",
              "Subscription data",
              "Consent — Art. 6(1)(a); double opt-in subscription, withdrawable at any time with one click",
            ],
            [
              "Improving the service and the methodology on aggregated data",
              "Assessment data, after anonymization",
              "Legitimate interest — Art. 6(1)(f); anonymized, aggregated results are no longer personal data",
            ],
            [
              "Operations, security, abuse prevention, debugging",
              "Technical data, logs",
              "Legitimate interest — Art. 6(1)(f)",
            ],
            [
              "Measuring interface usage (which pages, where the flow stalls)",
              "Interface events: page opened, button clicked, which question of the assessment you are on",
              "Legitimate interest — Art. 6(1)(f); our own first-party measurement, with no third-party provider",
            ],
            [
              "Meeting accounting obligations",
              "Invoicing and contact data",
              "Legal obligation — Art. 6(1)(c), under Hungarian Act C of 2000 on Accounting",
            ],
          ],
        },
      ],
    },
    {
      id: "team-feedback",
      title: "Team-level feedback and anonymity",
      blocks: [
        {
          kind: "p",
          text: "Team-level measurements (teammate role feedback, trust circle, psychological safety pulse) only work if respondents can be certain their individual answer cannot be identified. These rules are therefore enforced technically, not just promised:",
        },
        {
          kind: "ul",
          items: [
            "Individual answers never appear in a team or organization view — only in aggregated form.",
            "Even aggregated results appear only once responses from at least 3 raters or respondents exist. Below that threshold the interface shows no result.",
            "Psychological safety pulse responses are recorded without any user identifier from the outset — we cannot link them to a person afterwards either.",
            "The aggregated team picture is visible to the team's manager, the organization admin and the consultant assigned to the organization; you see the aggregated feedback about yourself.",
            "Trust circle results are shown pairwise, averaged across both directions — individual directed answers are never displayed there either.",
          ],
        },
        {
          kind: "p",
          text: "Deleting your profile also deletes the responses linked to you. Already anonymized, aggregated results cannot be traced back to a person and therefore cannot be deleted — under the GDPR that is no longer processing of personal data.",
        },
      ],
    },
    {
      id: "automated",
      title: "Automated decision-making and profiling",
      blocks: [
        {
          kind: "p",
          text: "Scores and fit indicators are calculated by an algorithm — this qualifies as profiling. However, we do not make and do not produce decisions based SOLELY on automated processing that produce legal effects concerning you or similarly significantly affect you within the meaning of Article 22 GDPR.",
        },
        {
          kind: "ul",
          items: [
            "Results alone are not suitable for hiring, promotion or dismissal decisions, and we make no such decisions.",
            "In candidate processes the decision is always made by the employer, with human judgement; our output is one input to interpret, not a verdict.",
            "Every estimated (not directly measured) value is labelled in the interface with its source and confidence, so it cannot be read as a measured fact.",
            "If you believe a result about you was misinterpreted, you may request human review and state your point of view.",
          ],
        },
      ],
    },
    {
      id: "recipients",
      title: "Who has access to your data?",
      blocks: [
        {
          kind: "p",
          text: "We do not sell personal data and do not share it for advertising. The processors below have access only to the extent necessary to run the service, under contractual obligations.",
        },
        {
          kind: "table",
          columns: ["Processor", "What they do", "Where data is stored"],
          rows: [
            [
              "Clerk (clerk.com)",
              "Authentication and session management",
              "USA — EU–U.S. Data Privacy Framework and/or standard contractual clauses (SCC)",
            ],
            [
              "Neon (neon.tech)",
              "PostgreSQL database storing user and assessment data",
              "EU (European region)",
            ],
            [
              "Vercel (vercel.com)",
              "Application hosting, cookie-free traffic and performance statistics",
              "EU/USA — under a DPA and SCCs",
            ],
            [
              "Resend (resend.com)",
              "Transactional email delivery (invitations, notifications)",
              "USA — under SCCs",
            ],
          ],
        },
        {
          kind: "p",
          text: "In addition, authorized staff of your organization (manager, admin) and the consultant assigned to it may access your data — within the anonymity rules described above. We disclose data to authorities only where legally required.",
        },
      ],
    },
    {
      id: "transfers",
      title: "Transfers outside the EEA",
      blocks: [
        {
          kind: "p",
          text: "Some of our providers operate in the United States. Such transfers rely either on an adequacy decision of the European Commission (EU–U.S. Data Privacy Framework, where the provider is certified) or on standard contractual clauses adopted by the Commission, with supplementary safeguards. At the database level, the primary place of storage is the European Union.",
        },
      ],
    },
    {
      id: "retention",
      title: "How long do we keep your data?",
      blocks: [
        {
          kind: "table",
          columns: ["Data", "Retention period"],
          rows: [
            [
              "Account, profile and assessment data",
              "Until you delete your account. After deletion it is also removed from backups within 30 days.",
            ],
            ["Draft of an unfinished assessment", "Until completion, for a maximum of 90 days."],
            [
              "Observer invitation and token",
              "30 days from sending (expiry), or until revoked.",
            ],
            [
              "Team and organizational measurement data",
              "For the term of the contract with the client organization; afterwards deleted or returned within 90 days, as the organization instructs.",
            ],
            ["Contact form messages", "12 months from closing the enquiry."],
            [
              "Newsletter subscription",
              "Until you unsubscribe. After unsubscribing we keep the address for a further 12 months to evidence the consent and to avoid contacting you again, then delete it. An unconfirmed subscription expires on its own after 7 days.",
            ],
            [
              "Invoices and accounting records",
              "8 years (Section 169 of Hungarian Act C of 2000 on Accounting).",
            ],
            ["Operational logs", "Up to 12 months."],
            [
              "Interface usage events",
              "12 months, then automatic deletion. Deleting your profile immediately severs the link between the events and you.",
            ],
            [
              "Anonymized, aggregated statistics",
              "No time limit — these are no longer personal data.",
            ],
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      blocks: [
        {
          kind: "p",
          text: "We use strictly necessary cookies only. We set no marketing or tracking cookies and share no data with advertising networks — which is why there is no cookie consent banner.",
        },
        {
          kind: "table",
          columns: ["Cookie", "Purpose", "Lifetime"],
          rows: [
            ["trita_locale", "Remembers your chosen interface language", "1 year"],
            ["__session (Clerk)", "Maintains your signed-in session", "Until the session ends"],
            ["__client_uat (Clerk)", "Controls refreshing of the sign-in state", "1 year"],
          ],
        },
        {
          kind: "p",
          text: "Traffic and performance measurement (Vercel Analytics, Speed Insights) uses no cookies; IP addresses are processed briefly in hashed (anonymized) form to distinguish unique visitors and are not stored as personal data. The output is aggregated traffic statistics and Core Web Vitals metrics.",
        },
        {
          kind: "p",
          text: "Our own usage measurement also sets no cookie and stores no other identifier on your device: the visitor identifier is a DAILY ROTATING pseudonym derived as an irreversible digest of the IP address and browser identifier — we do not store the IP address itself, and the next day the same visitor appears under a different pseudonym. Events arrive at our servers and stay in our database; there is no third-party analytics provider behind it, and no data goes to advertising networks. If your browser signals a tracking opt-out (Global Privacy Control or Do Not Track), we measure nothing. Event properties contain no name, email address, free text, questionnaire answer, score or invitation token. This is why there is no cookie consent banner either.",
        },
      ],
    },
    {
      id: "security",
      title: "How we protect your data",
      blocks: [
        {
          kind: "ul",
          items: [
            "Encrypted transport (HTTPS/TLS) for every request, and encryption at rest at the database level.",
            "We store no passwords: authentication is handled by a specialist provider (Clerk), with two-factor authentication available.",
            "Role-based access control: team and organizational data is reachable only by authorized roles, and every query passes an authorization check.",
            "Share and observer links use unique, expiring tokens that can be revoked at any time.",
            "Internal access on a need-to-know basis, logged; development and testing use non-production data.",
          ],
        },
        {
          kind: "p",
          text: "If a personal data breach occurs that is likely to result in a high risk to you, we will inform you without undue delay and notify the supervisory authority within 72 hours.",
        },
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      blocks: [
        {
          kind: "dl",
          items: [
            {
              term: "Access",
              description:
                "You can ask what data we hold about you and request a copy. Most of your data is directly visible in your profile.",
            },
            {
              term: "Rectification",
              description: "You can request correction of inaccurate data; you can also edit your profile data yourself.",
            },
            {
              term: "Erasure",
              description:
                "You can delete your profile at any time from the profile page — this also deletes the assessment and feedback data linked to you. Exception: data we must retain by law (e.g. accounting records).",
            },
            {
              term: "Restriction of processing",
              description:
                "You can ask us to suspend processing while a disputed question (e.g. accuracy or legitimate interest) is resolved.",
            },
            {
              term: "Data portability",
              description:
                "You can ask for the data you provided and the data we measured in a machine-readable format, or — where technically feasible — to have it transmitted to another provider.",
            },
            {
              term: "Objection",
              description:
                "You can object to processing based on legitimate interest. We will then stop processing unless we demonstrate compelling legitimate grounds.",
            },
            {
              term: "Withdrawal of consent",
              description:
                "Where processing is based on consent, you can withdraw it at any time. Withdrawal does not affect the lawfulness of processing before it.",
            },
          ],
        },
        {
          kind: "p",
          text: `Send your request to ${COMPANY.privacyEmail}. We respond without undue delay and at the latest within one month of receiving it; for complex or numerous requests this may be extended by a further two months, of which we will inform you within one month. Responding is free of charge.`,
        },
      ],
    },
    {
      id: "complaint",
      title: "Complaints and remedies",
      blocks: [
        {
          kind: "p",
          text: "If you believe our processing breaches the law, it is usually fastest to write to us first. Regardless, you may lodge a complaint with the supervisory authority:",
        },
        { kind: "note", text: NAIH_LINE_EN },
        {
          kind: "p",
          text: "You may also seek a judicial remedy. In Hungary, proceedings may be brought — at your choice — before the regional court of your place of residence or stay.",
        },
      ],
    },
    {
      id: "minors",
      title: "Minors",
      blocks: [
        {
          kind: "p",
          text: "The service is intended for people aged 16 and over. We do not knowingly process the data of anyone under 16; if we detect such data, we delete it. If you are a parent or guardian and believe your child has provided data to us, let us know and we will delete it promptly.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        {
          kind: "p",
          text: "We update this policy from time to time — for example when we launch a feature or add a processor. The date of the latest update is always shown at the top of the page. If a change materially affects your rights or the purpose of processing, we will notify you by email or in the app before it takes effect.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          kind: "p",
          text: `For any privacy question, request or complaint, write to ${COMPANY.privacyEmail}, or by post to our registered address: ${COMPANY.address}. We aim to reply within one business day.`,
        },
      ],
    },
  ],
};

export const PRIVACY_POLICY: Record<Locale, PolicyDocument> = { hu: HU, en: EN };

export function getPrivacyPolicy(locale: Locale): PolicyDocument {
  return PRIVACY_POLICY[locale];
}
