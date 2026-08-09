import type { Locale } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────
// Az EGYSZERŰ eredmény-nézet szöveg-táblái.
//
// Ugyanaz a minta, mint a `dimension-insights.ts`-ben: dimenzió-kód →
// nyelv → szöveg. (A felület minden más felirata i18n kulcson megy; ezek
// a tömbök azért élnek külön modulban, mert dimenzió-kód szerint
// indexeltek, és a PDF/riport-oldali testvéreik is így élnek.)
//
// Nyelvi elvek — ezek nem stílus-kérdések:
//  · A felmérés BECSÜL, nem bizonyít: tendencia-nyelv („jellemzően",
//    „többnyire"), sosem kategorikus jellem-ítélet.
//  · Egyik pólus sem „rosszabb" a másiknál — az alacsony érték is
//    viselkedést ír le, nem hiányt.
//  · A „figyelendő" szövegek mindig konkrét, megtehető lépéssel zárnak.
//  · A modell neve nem hangzik el (nincs „HEXACO"); a dimenzió-címkék a
//    `tritan.ts` hivatalos értékei, azokat ez a modul nem írja felül.
// ─────────────────────────────────────────────────────────────────────

type LocalizedText = Record<Locale, string>;

/** Kétpólusú skála végpontjai — viselkedés-leírók, nem dimenzió-nevek. */
export const SIMPLE_POLES: Record<
  string,
  { low: LocalizedText; high: LocalizedText }
> = {
  INTE: {
    low: { hu: "Stratégiai pozicionálás", en: "Strategic positioning" },
    high: { hu: "Nyílt lapokkal", en: "Open cards" },
  },
  RESO: {
    low: { hu: "Higgadt távolságtartás", en: "Calm distance" },
    high: { hu: "Mély érzelmi bevonódás", en: "Deep emotional involvement" },
  },
  TEMP: {
    low: { hu: "Csendes háttér", en: "Quiet background" },
    high: { hu: "Lendületes jelenlét", en: "Energetic presence" },
  },
  ADAP: {
    low: { hu: "Éles visszajelzés", en: "Sharp feedback" },
    high: { hu: "Türelmes egyeztetés", en: "Patient negotiation" },
  },
  THOR: {
    low: { hu: "Rugalmas rögtönzés", en: "Flexible improvisation" },
    high: { hu: "Rendszerezett végrehajtás", en: "Structured execution" },
  },
  OPEN: {
    low: { hu: "Bevált megoldások", en: "Proven solutions" },
    high: { hu: "Kísérletező gondolkodás", en: "Experimental thinking" },
  },
};

/** Egy mondat arról, hol áll a felhasználó az adott skálán (szint szerint). */
export const SIMPLE_DIM_SENTENCE: Record<
  string,
  { high: LocalizedText; mid: LocalizedText; low: LocalizedText }
> = {
  INTE: {
    high: {
      hu: "Nyílt lapokkal dolgozol, és nem a pozíciódból akarsz erőt meríteni.",
      en: "You work with open cards, and you don't draw your strength from status.",
    },
    mid: {
      hu: "Nyíltan dolgozol, de tudod, mikor érdemes megválogatni, mit mondasz ki.",
      en: "You work openly, but you know when it pays to choose your words.",
    },
    low: {
      hu: "A státusz és a pozíció természetes terepe neked — a nyílt lapok kevésbé.",
      en: "Status and positioning are natural terrain for you — open cards less so.",
    },
  },
  RESO: {
    high: {
      hu: "Mélyen kapcsolódsz másokhoz, és megérzed azt is, ami a szavak mögött van.",
      en: "You connect deeply with others and sense what sits behind the words.",
    },
    mid: {
      hu: "Megérzed mások hullámait, de nem viszed haza őket.",
      en: "You pick up on other people's waves without carrying them home.",
    },
    low: {
      hu: "Nyomás alatt is higgadt maradsz; az érzelmi bevonódás kevésbé természetes tereped.",
      en: "You stay calm under pressure; emotional involvement is less natural terrain for you.",
    },
  },
  TEMP: {
    high: {
      hu: "Energiát viszel a térbe: társaságban, vitában, indításnál te vagy a mozgató.",
      en: "You bring energy into the room: in company, in debate, at the start, you get things moving.",
    },
    mid: {
      hu: "Ha kell, előre állsz, de nem keresed folyamatosan a reflektorfényt.",
      en: "You step forward when needed, but you don't chase the spotlight.",
    },
    low: {
      hu: "A csendesebb, kisebb körű jelenlét a természetes tereped — a nagy nyilvánosság kevésbé.",
      en: "Quieter, smaller-circle presence is your natural terrain — a big audience less so.",
    },
  },
  ADAP: {
    high: {
      hu: "Türelemmel kezeled a súrlódásokat, és ritkán élezed ki a helyzeteket.",
      en: "You handle friction with patience and rarely sharpen a situation.",
    },
    mid: {
      hu: "Tudsz türelmes lenni, de ha valami nem stimmel, ki is mondod.",
      en: "You can be patient, but you say it when something is off.",
    },
    low: {
      hu: "Ha valami nem jó, azt gyorsan és élesen jelzed — a hosszú egyeztetés kevésbé a tereped.",
      en: "When something is wrong you flag it fast and sharply — long negotiation is less your terrain.",
    },
  },
  THOR: {
    high: {
      hu: "Rendszerben dolgozol, és végigviszed, amit elkezdtél.",
      en: "You work in a system and finish what you start.",
    },
    mid: {
      hu: "A rendszert eszköznek nézed: ott használod, ahol tényleg számít.",
      en: "You treat structure as a tool: you use it where it actually matters.",
    },
    low: {
      hu: "Gyorsan indulsz, de a hosszú, aprólékos követés nem a te örömöd.",
      en: "You start fast, but long, meticulous follow-through isn't where you enjoy yourself.",
    },
  },
  OPEN: {
    high: {
      hu: "Szívesen indulsz el új úton akkor is, ha nincs kitaposva.",
      en: "You gladly take a new path even when it isn't worn in yet.",
    },
    mid: {
      hu: "Nyitott vagy az újra, de nem dobod el azt, ami működik.",
      en: "You're open to the new without throwing away what works.",
    },
    low: {
      hu: "A bevált, kipróbált megoldásokra építesz — a kísérletezés kevésbé vonz.",
      en: "You build on proven, tested solutions — experimenting appeals to you less.",
    },
  },
};

/** „Ami a legjobban megy" — a LEGERŐSEBB dimenzióhoz. */
export const SIMPLE_STRENGTH: Record<
  string,
  { headline: LocalizedText; body: LocalizedText }
> = {
  INTE: {
    headline: {
      hu: "Amit mondasz, arra lehet építeni.",
      en: "People can build on what you say.",
    },
    body: {
      hu: "Nem taktikázol, és nem a pozíciódból akarsz erőt meríteni. A bizalom emiatt gyorsan épül körülötted — ez főleg ott ér sokat, ahol a többiek egymást méregetik.",
      en: "You don't play angles, and you don't draw your strength from status. Trust builds quickly around you — which counts most where everyone else is sizing each other up.",
    },
  },
  RESO: {
    headline: {
      hu: "Megérzed azt, ami a szavak mögött van.",
      en: "You sense what sits behind the words.",
    },
    body: {
      hu: "Ott is észreveszed a feszültséget vagy a lelkesedést, ahol más csak a tényeket hallja. Ez a ráhangolódás bizalmat teremt — és korán jelez, ha valami nem stimmel egy csapatban.",
      en: "You notice tension or enthusiasm where others only hear the facts. That attunement creates trust — and it flags early when something is off in a team.",
    },
  },
  TEMP: {
    headline: {
      hu: "Lendületet viszel oda, ahol állóvíz van.",
      en: "You bring momentum where things have gone still.",
    },
    body: {
      hu: "Te vagy az, aki elindít valamit: megszólal, felteszi a kérdést, megmozgat egy elakadt beszélgetést. A jelenléted önmagában dolgozik, mielőtt bármit is elmagyaráznál.",
      en: "You're the one who starts things: you speak up, ask the question, move a stuck conversation along. Your presence works before you explain anything.",
    },
  },
  ADAP: {
    headline: {
      hu: "Kibírod a súrlódást anélkül, hogy elmérgesedne.",
      en: "You can hold friction without letting it turn sour.",
    },
    body: {
      hu: "Ott is nyitva tudod tartani a beszélgetést, ahol mások már bevágnák az ajtót. Ez tartja együtt a csapatokat a nehezebb heteken.",
      en: "You keep the conversation open where others would already slam the door. That's what holds teams together through the harder weeks.",
    },
  },
  THOR: {
    headline: {
      hu: "Amit elvállalsz, az meg is lesz.",
      en: "What you take on gets done.",
    },
    body: {
      hu: "Nem az intenzitásod a különleges, hanem az, hogy kitart. A csapat rád tudja bízni azt, aminek hetek múlva is állnia kell.",
      en: "It isn't your intensity that stands out, it's that it lasts. A team can hand you the thing that still has to hold up weeks from now.",
    },
  },
  OPEN: {
    headline: {
      hu: "Meglátod azt az irányt, ami még nincs kitaposva.",
      en: "You spot the direction nobody has worn in yet.",
    },
    body: {
      hu: "Nem a meglévő listából választasz, hanem újat teszel hozzá. Ez ott ér a legtöbbet, ahol a bevált megoldás már nem viszi tovább a helyzetet.",
      en: "You don't pick from the existing list, you add to it. That's worth the most where the proven answer no longer moves the situation forward.",
    },
  },
};

/** „Ahogy dolgozol" — a MÁSODIK legerősebb dimenzióhoz. */
export const SIMPLE_PATTERN: Record<
  string,
  { headline: LocalizedText; body: LocalizedText }
> = {
  INTE: {
    headline: { hu: "Nyílt lapokkal dolgozol.", en: "You work with open cards." },
    body: {
      hu: "Kimondod, amit gondolsz, és nem építesz rejtett szándékokra. Ez tisztaságot visz a helyzetekbe — cserébe érdemes figyelned arra, hogy a nyíltság ne előzze meg az időzítést.",
      en: "You say what you think and don't build on hidden intentions. That brings clarity — in exchange, watch that openness doesn't outrun timing.",
    },
  },
  RESO: {
    headline: {
      hu: "Az érzelmi hőmérséklet is információ neked.",
      en: "Emotional temperature is information to you.",
    },
    body: {
      hu: "Nemcsak azt figyeled, mit mondanak, hanem azt is, hogyan. Ez sok bajt megelőz — cserébe könnyen magadra veszed azt is, ami nem rólad szól.",
      en: "You track not just what people say but how. That prevents a lot of trouble — in exchange, you easily take on things that aren't about you.",
    },
  },
  TEMP: {
    headline: { hu: "Hangosan gondolkodsz.", en: "You think out loud." },
    body: {
      hu: "Nálad a beszélgetés maga a gondolkodás formája — menet közben áll össze a kép. Aki csendben dolgozik, annak ez néha kapkodásnak látszik, ezért érdemes kimondanod, hogy még alakul.",
      en: "For you, talking is a form of thinking — the picture comes together as you go. To quieter workers this can look like rushing, so it's worth saying out loud that it's still forming.",
    },
  },
  ADAP: {
    headline: {
      hu: "Előbb megérted, aztán vitatkozol.",
      en: "You understand first, argue second.",
    },
    body: {
      hu: "Adsz esélyt a másik verziójának, mielőtt eldöntenéd, mi a helyes. Ez sok felesleges konfliktust megelőz — cserébe figyelj rá, hogy a saját álláspontod is elhangozzon.",
      en: "You give the other version a chance before deciding what's right. That prevents a lot of pointless conflict — in exchange, make sure your own position gets said too.",
    },
  },
  THOR: {
    headline: {
      hu: "Rendet raksz magad körül, mielőtt nekifutnál.",
      en: "You put things in order before you run at them.",
    },
    body: {
      hu: "Előbb a keret, aztán a munka — így ritkán éget meg a káosz. Cserébe érdemes engedni, hogy néhány dolog félkészen is elinduljon.",
      en: "Frame first, work second — so chaos rarely burns you. In exchange, it's worth letting some things start half-finished.",
    },
  },
  OPEN: {
    headline: {
      hu: "A „mindig így csináltuk” nálad kérdés, nem válasz.",
      en: "“We've always done it this way” is a question to you, not an answer.",
    },
    body: {
      hu: "Szívesen kipróbálsz más utat akkor is, ha a régi működik. Érdemes jelezned, mikor kísérletezel — a többiek különben lezárt döntésnek hallják.",
      en: "You'll try another route even when the old one works. Worth signalling when you're experimenting — otherwise people hear it as a decision already made.",
    },
  },
};

/** „Amire figyelj" — a LEGALACSONYABB dimenzióhoz. */
export const SIMPLE_WATCH: Record<
  string,
  { headline: LocalizedText; body: LocalizedText }
> = {
  INTE: {
    headline: {
      hu: "A nyílt kártyák nálad nem az első reflex.",
      en: "Open cards aren't your first reflex.",
    },
    body: {
      hu: "Nincs baj azzal, ha figyelsz a pozíciódra — de ahol a bizalom a tét, ott a kimondott szándék többet ér, mint a jól időzített lépés. Segít, ha néha azt is kimondod, amit taktikailag nem muszáj.",
      en: "There's nothing wrong with minding your position — but where trust is at stake, a stated intention beats a well-timed move. It helps to say the thing you don't tactically have to.",
    },
  },
  RESO: {
    headline: {
      hu: "Mások érzelmi jelzései könnyen kicsúsznak a képből.",
      en: "Other people's emotional signals slip out of the picture easily.",
    },
    body: {
      hu: "A higgadtságod nyugalmat visz a helyzetekbe, de ami nincs kimondva, az melletted könnyen elmegy. Segít, ha időnként rákérdezel arra, amit a másik magától nem hozna szóba.",
      en: "Your calm steadies situations, but what goes unsaid can pass you by. It helps to ask now and then about the thing the other person wouldn't raise on their own.",
    },
  },
  TEMP: {
    headline: {
      hu: "Ami nem hangzik el, arról nem tudnak.",
      en: "What isn't said doesn't get noticed.",
    },
    body: {
      hu: "A háttérből is sokat teszel hozzá, de a munkád egy része csak akkor látszik, ha ki is mondod. Segít, ha a fontos dolgokat tudatosan viszed be a közös térbe, nem csak négyszemközt.",
      en: "You add a lot from the background, but part of your work only shows if you say it. It helps to bring the important things into the shared space on purpose, not just one-to-one.",
    },
  },
  ADAP: {
    headline: {
      hu: "Az élesség gyorsabban érkezik, mint a magyarázat.",
      en: "The sharpness arrives faster than the explanation.",
    },
    body: {
      hu: "Az egyenes visszajelzés érték, de a másik gyakran a hangnemre reagál, nem a tartalomra. Egy mondat arról, hogy mit szeretnél elérni vele, sokat visz.",
      en: "Direct feedback is valuable, but people often react to the tone rather than the content. One sentence about what you're trying to achieve carries a long way.",
    },
  },
  THOR: {
    headline: {
      hu: "A végigvitel több figyelmet kíván, mint az indulás.",
      en: "Finishing needs more attention than starting.",
    },
    body: {
      hu: "Az indulás nálad könnyű, a hosszú szakasz a nehéz. Külső kapaszkodó — határidő, társ, rövidebb szakaszok — többet segít, mint az elhatározás.",
      en: "Starting comes easily to you; the long stretch is the hard part. An external handhold — a deadline, a partner, shorter stages — helps more than resolve does.",
    },
  },
  OPEN: {
    headline: {
      hu: "Az új megoldás nem az első reflexed.",
      en: "The new solution isn't your first reflex.",
    },
    body: {
      hu: "A kipróbált út biztonságot ad, de néha a helyzet mást kíván. Segít, ha kis léptékben, alacsony tétnél engeded be a kísérletet.",
      en: "The tested route gives you safety, but sometimes the situation asks for something else. It helps to let experiments in on a small scale, where the stakes are low.",
    },
  },
};

/**
 * Kiegyensúlyozott profil „amire figyelj" szövege: ha a legalacsonyabb
 * dimenzió sem lóg ki lefelé, hiány-nyelv helyett ezt mondjuk.
 */
export const SIMPLE_WATCH_BALANCED: { headline: LocalizedText; body: LocalizedText } = {
  headline: {
    hu: "Nincs olyan területed, ami kilógna lefelé.",
    en: "You have no area that stands out on the low side.",
  },
  body: {
    hu: "Ez ritka: nincs olyan oldalad, ami rendszeresen elgáncsolna. A figyelem ilyenkor arra megy, hogy a legerősebb oldalaidat ne vidd túl — egy erősség túladagolva is tud akadály lenni.",
    en: "That's rare: no side of you trips you up regularly. The thing to watch instead is not overplaying your strongest sides — a strength can become an obstacle when overdosed.",
  },
};
