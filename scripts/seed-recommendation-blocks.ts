/**
 * Seed script: RecommendationBlock tábla feltöltése
 * Dim-szintű: 6 dims × 3 levels × 2 locales = 36 blokk
 * Facet-szintű: 6 dims × 4 facets × HIGH/LOW × 2 locales = 96 blokk
 * Összesen: ~132 blokk
 *
 * Futtatás: pnpm seed:blocks
 * --force flag: meglévő sorok felülírása upsert-tel
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FORCE = process.argv.includes("--force");

type BlockDef = {
  testType: string;
  dimension: string;
  facetCode: string | null;
  level: "HIGH" | "MED" | "LOW";
  locale: string;
  body: string;
};

// ─── Dimenzió-szintű blokkok ──────────────────────────────────────────────────

const DIM_BLOCKS: BlockDef[] = [
  // ── H (Honesty-Humility) ──────────────────────────────────────────────────
  {
    testType: "HEXACO", dimension: "H", facetCode: null, level: "HIGH", locale: "hu",
    body: "Magas Őszinteség-Alázatod etikai horgonyt jelent: nem vagy könnyen megvásárolható sem presztízzsel, sem anyagi előnyökkel. Mások jellemzően megbíznak benned, még akkor is, ha ez néha lassítja az előrehaladásodat. Olyan szerepekben vagy igazán a helyeden, ahol a hitelesség maga a tőke.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: null, level: "HIGH", locale: "en",
    body: "High Honesty-Humility is your ethical anchor: you are not easily swayed by prestige, flattery, or material gain. Others tend to trust you deeply, even when that sometimes slows your progress. You are most at home in roles where credibility is the core currency.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: null, level: "MED", locale: "hu",
    body: "Közepes Őszinteség-Alázatod rugalmasságot jelent: általában becsületes és közvetlen vagy, de tudod, mikor érdemes taktikusan kommunikálni. Ez pragmatikus előny sokféle munkahelyi helyzetben, bár néha elmoshatja a határt az adaptivitás és a kompromisszum között.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: null, level: "MED", locale: "en",
    body: "Medium Honesty-Humility means flexibility: you are generally honest and direct, but you know when to communicate tactically. This is a pragmatic advantage across many workplace situations, though it can occasionally blur the line between adaptability and compromise.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: null, level: "LOW", locale: "hu",
    body: "Alacsony Őszinteség-Alázatod magas presztízsigényt és taktikus önérvényesítést takar. Ez karrierambíciót és stratégiai gondolkodást fűt — ám hosszú távon bizalomveszteséget okozhat, ha mások instrumentálisnak érzik a bánásmódot.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: null, level: "LOW", locale: "en",
    body: "Low Honesty-Humility signals a high need for prestige and a tendency to engage in strategic self-promotion. This can fuel career ambition and tactical thinking — but risks eroding trust over time if others feel they are being treated instrumentally.",
  },

  // ── E (Emotionality) ──────────────────────────────────────────────────────
  {
    testType: "HEXACO", dimension: "E", facetCode: null, level: "HIGH", locale: "hu",
    body: "Magas Érzelmi érzékenységed empátiát és kapcsolati tudatosságot jelent — jól érzékeled mások állapotát és szükségleteit. Ugyanakkor bizonytalanság vagy stressz esetén az aggodalom és szorongás erősen befolyásol, és fontos számodra, hogy támaszt is kapj. Olyan környezetben működsz a legjobban, ahol nyitottak az érzelmi kommunikációra.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: null, level: "HIGH", locale: "en",
    body: "High Emotionality means empathy and relational awareness — you sense others' states and needs with precision. On the other hand, uncertainty and stress strongly affect you, and having emotional support matters. You thrive in environments where emotional communication is welcomed.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: null, level: "MED", locale: "hu",
    body: "Közepes Érzelmi érzékenységed kiegyensúlyozott: általában stabilan kezeled a stresszt, de nem zársz el teljesen az érzelmek elől. Rugalmasan mozog a racionális és az empatikus kommunikáció között — ez sokoldalú együttműködési stílust eredményez.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: null, level: "MED", locale: "en",
    body: "Medium Emotionality gives you balance: you generally manage stress steadily without shutting down emotionally. You move flexibly between rational and empathic communication, which makes for a versatile collaboration style.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: null, level: "LOW", locale: "hu",
    body: "Alacsony Érzelmi érzékenységed erős stressztűrést és érzelmi stabilitást jelent — ritkán ingat meg a nyomás vagy a bizonytalanság. Ez nagy előny válsághelyzetekben és nagy tétű döntéseknél, de érdemes figyelni arra, hogy mások érzelmi szükségleteit ne hagyd figyelmen kívül.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: null, level: "LOW", locale: "en",
    body: "Low Emotionality means strong stress tolerance and emotional stability — pressure and uncertainty rarely destabilize you. This is a significant asset in crisis situations and high-stakes decisions, but it's worth watching that you don't overlook others' emotional needs.",
  },

  // ── X (Extraversion) ──────────────────────────────────────────────────────
  {
    testType: "HEXACO", dimension: "X", facetCode: null, level: "HIGH", locale: "hu",
    body: "Magas Extroverziód társas energiát és természetes láthatóságot jelent — könnyen veszed fel a ritmust csoportokban, és élvezed a kapcsolatépítést. Assertív és határozott megjelenésed vezető szerepekben értéket teremt, ugyanakkor fontos odafigyelni, hogy hallgatói teret is adj másoknak.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: null, level: "HIGH", locale: "en",
    body: "High Extraversion means social energy and natural visibility — you easily find your rhythm in groups and enjoy building connections. Your assertive and decisive presence creates value in leadership roles; just make sure to also create listening space for others.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: null, level: "MED", locale: "hu",
    body: "Közepes Extroverziód rugalmasságot jelent: egyformán tudod élvezni az intenzív csoportos munkát és az elmélyültebb, egyedüli feladatokat. Ez értékes alkalmazkodóképességet ad különböző munkakörnyezetekben.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: null, level: "MED", locale: "en",
    body: "Medium Extraversion gives you flexibility: you can equally enjoy intense group work and deeper solo tasks. This is a valuable adaptability across different work environments.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: null, level: "LOW", locale: "hu",
    body: "Alacsony Extroverziód mélységet és fókuszt jelent: jobban teljesítesz kiscsoportban vagy egyéni munkában, mint nagy, zajos közegben. Az introverzió nem hátrány — erős figyelmi kapacitást és elmélyült gondolkodást takar, amelyet különösen szakmai közegben ismernek fel.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: null, level: "LOW", locale: "en",
    body: "Low Extraversion means depth and focus: you perform best in small groups or solo work rather than large, noisy settings. Introversion is not a weakness — it covers strong attentional capacity and deep thinking that professional environments particularly appreciate.",
  },

  // ── A (Agreeableness) ─────────────────────────────────────────────────────
  {
    testType: "HEXACO", dimension: "A", facetCode: null, level: "HIGH", locale: "hu",
    body: "Magas Együttműködési szinted melegséget és konfliktuskerülő beállítódást jelent — szívesen adsz engedményeket a harmónia érdekében. Ez erős csapatépítő képességet és megbízható partneri attitűdöt takar, ugyanakkor érdemes figyelni arra, hogy ne menj el saját szükségleteid ellenében.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: null, level: "HIGH", locale: "en",
    body: "High Agreeableness means warmth and a conflict-avoidant stance — you readily make concessions for the sake of harmony. This covers strong team-building ability and a reliably cooperative attitude; however, it's worth watching that you don't compromise your own needs too readily.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: null, level: "MED", locale: "hu",
    body: "Közepes Együttműködési szinted egyensúlyt jelent: tudod vállalni a konfrontációt, ha szükséges, de alapvetően nyitott vagy a másik fél nézőpontjára. Ez rugalmas tárgyalási stílust és jó együttdolgozási képességet eredményez.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: null, level: "MED", locale: "en",
    body: "Medium Agreeableness means balance: you can handle confrontation when needed but remain genuinely open to others' perspectives. This results in a flexible negotiation style and strong collaborative capacity.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: null, level: "LOW", locale: "hu",
    body: "Alacsony Együttműködési szinted magabiztosságot és határozott önérvényesítést jelent — nem kerülöd a konfrontációt, és nem engedsz könnyen. Ez erős tárgyalói és döntéshozói pozíciót eredményez, bár csoportos munkában érdemes a merevség helyett a rugalmas együttműködést keresni.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: null, level: "LOW", locale: "en",
    body: "Low Agreeableness means confidence and firm self-assertion — you don't shy from confrontation and don't give in easily. This produces strong negotiating and decision-making positions, though in group work it's worth seeking flexible collaboration over rigidity.",
  },

  // ── C (Conscientiousness) ─────────────────────────────────────────────────
  {
    testType: "HEXACO", dimension: "C", facetCode: null, level: "HIGH", locale: "hu",
    body: "Magas Lelkiismeretességed szervezettséget, megbízhatóságot és magas minőségigényt jelent. Komolyan veszed a kötelezettségeidet, és mások számíthatnak rád határidőkben. Érdemes figyelni arra, hogy a perfekcionizmus ne lassítsa a döntéseket vagy a cselekvést ott, ahol az elégséges jobb, mint a tökéletes.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: null, level: "HIGH", locale: "en",
    body: "High Conscientiousness means organization, reliability, and high quality standards. You take commitments seriously and others can count on you to meet deadlines. It is worth watching that perfectionism doesn't slow decisions or action in situations where good enough beats perfect.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: null, level: "MED", locale: "hu",
    body: "Közepes Lelkiismeretességed kontextusfüggő: tudsz szervezett és módszeres lenni, amikor kell, de nem merevítesz bele a struktúrákba. Ez jól működik változékony, gyors alkalmazkodást igénylő munkakörnyezetben.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: null, level: "MED", locale: "en",
    body: "Medium Conscientiousness is context-dependent: you can be organized and methodical when needed, but you don't lock into rigid structures. This works well in dynamic, fast-adapting work environments.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: null, level: "LOW", locale: "hu",
    body: "Alacsony Lelkiismeretességed spontaneitást és rugalmasságot jelent — jól alkalmazkodsz váratlan helyzetekhez, és nem köt meg a bürokrácia. Ugyanakkor fontos rendszereket vagy külső struktúrákat kiépíteni, hogy a határidők és a minőség tartható maradjon.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: null, level: "LOW", locale: "en",
    body: "Low Conscientiousness means spontaneity and flexibility — you adapt well to unexpected situations and aren't bound by bureaucracy. However, it's important to build systems or external structures to keep deadlines and quality sustainable.",
  },

  // ── O (Openness) ──────────────────────────────────────────────────────────
  {
    testType: "HEXACO", dimension: "O", facetCode: null, level: "HIGH", locale: "hu",
    body: "Magas Nyitottságod kíváncsiságot, kreativitást és az összetettség iránti vonzalmat jelent. Jól működöl bizonytalan, kreatív vagy intellektuálisan igényes feladatokban, és szívesen böngészel szélesen. Érdemes figyelni arra, hogy az ötletbőség ne forgásoljon szét a fókuszt igénylő megvalósítási szakaszokban.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: null, level: "HIGH", locale: "en",
    body: "High Openness means curiosity, creativity, and an attraction to complexity. You perform well in ambiguous, creative, or intellectually demanding tasks, and you enjoy broad exploration. It's worth watching that abundance of ideas doesn't fragment focus during execution phases.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: null, level: "MED", locale: "hu",
    body: "Közepes Nyitottságod pragmatikus egyensúlyt jelent: nyitott vagy az újra, de az értékes bevált módszereket sem dobod el csak az újszerűség kedvéért. Ez megbízható és mérsékelt innovációs stílust eredményez.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: null, level: "MED", locale: "en",
    body: "Medium Openness means pragmatic balance: you welcome new ideas but don't discard proven methods just for novelty's sake. This produces a reliable and moderate innovation style.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: null, level: "LOW", locale: "hu",
    body: "Alacsony Nyitottságod praktikusságot és következetességet jelent — inkább a bevált módszereket részesíted előnyben, mint a kísérletezést. Ez értékes stabilitást és megbízhatóságot ad operatív környezetekben, ahol a konzisztencia kritikus.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: null, level: "LOW", locale: "en",
    body: "Low Openness means practicality and consistency — you prefer proven methods over experimentation. This brings valuable stability and reliability in operational environments where consistency is critical.",
  },
];

// ─── Facet-szintű blokkok ─────────────────────────────────────────────────────

const FACET_BLOCKS: BlockDef[] = [
  // ── H facetek ──────────────────────────────────────────────────────────────

  // sincerity
  {
    testType: "HEXACO", dimension: "H", facetCode: "sincerity", level: "HIGH", locale: "hu",
    body: "Magas Szinceritásod azt jelzi, hogy kerülöd a kettős játékot: amit gondolsz, azt mondod is. Ez hiteles és kiszámítható partnerré tesz, még ha időnként simogatóbb kommunikáció hatékonyabb lenne.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "sincerity", level: "HIGH", locale: "en",
    body: "High Sincerity means you avoid double standards: you say what you think. This makes you credible and predictable, even when a more diplomatic approach would occasionally be more effective.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "sincerity", level: "LOW", locale: "hu",
    body: "Alacsony Szinceritásod azt mutatja, hogy tudatosan alakítod a benyomást magadról — ügyesen navigálsz elvárások között. Ez erős taktikai képesség, de közeli munkatársak idővel érzékelik a rétegeket.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "sincerity", level: "LOW", locale: "en",
    body: "Low Sincerity suggests you consciously manage impressions and navigate expectations with skill. This is a strong tactical ability, but close colleagues tend to sense the layers over time.",
  },

  // fairness
  {
    testType: "HEXACO", dimension: "H", facetCode: "fairness", level: "HIGH", locale: "hu",
    body: "Magas Méltányosságod azt jelzi, hogy kerülöd a kedvezményes elbánást és a szabályok kijátszását, még ha saját haszonnal is járna. Elosztási helyzetekben és döntéshozatalban igazságos szereplőként tartanak számon.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "fairness", level: "HIGH", locale: "en",
    body: "High Fairness means you avoid preferential treatment and rules-bending even when personally advantageous. In resource allocation and decision-making, you are seen as an equitable actor.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "fairness", level: "LOW", locale: "hu",
    body: "Alacsony Méltányosságod pragmatikus hozzáállást jelent a szabályokhoz — a célra fókuszálsz, nem a folyamat egyenlőségére. Rövid távon hatékony, de csoportos közegben bizalmi kérdéseket vethet fel.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "fairness", level: "LOW", locale: "en",
    body: "Low Fairness suggests a pragmatic approach to rules — you focus on outcomes over procedural equality. Effective in the short term, but may raise trust questions in group settings.",
  },

  // greed_avoidance
  {
    testType: "HEXACO", dimension: "H", facetCode: "greed_avoidance", level: "HIGH", locale: "hu",
    body: "Magas Kapzsiság-kerülésed azt mutatja, hogy az anyagi jutalmak és presztízsszimbólumok nem húzzák erősen a motivációdat. Ez belső hajtóerőt erősít, de tárgyalásokon és kompenzációs kérdésekben passzivitáshoz vezethet.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "greed_avoidance", level: "HIGH", locale: "en",
    body: "High Greed Avoidance means material rewards and status symbols are not strong drivers for you. This strengthens intrinsic motivation but can lead to passivity in salary negotiations or compensation discussions.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "greed_avoidance", level: "LOW", locale: "hu",
    body: "Alacsony Kapzsiság-kerülésed azt jelzi, hogy az anyagi jutalmak és előrelépés fontos motivátorok. Ez ambiciózussá tesz karrierépítésben — érdemes tudatosnak lenni, hogy ez mikor válik mások szemében öncélúvá.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "greed_avoidance", level: "LOW", locale: "en",
    body: "Low Greed Avoidance means material rewards and advancement are important motivators. This drives career ambition — it's worth staying aware of when this starts to appear self-serving to others.",
  },

  // modesty
  {
    testType: "HEXACO", dimension: "H", facetCode: "modesty", level: "HIGH", locale: "hu",
    body: "Magas Szerénységed azt mutatja, hogy nem keresed a rivaldafényt és nem töltekezel az ego-megerősítéssel. Könnyen megközelíthető vagy, kollaboratív légkört teremtesz — de előrehaladásod saját érdekérvényesítésed hiányán is múlhat.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "modesty", level: "HIGH", locale: "en",
    body: "High Modesty means you don't seek the spotlight or ego-validation. You are approachable and create collaborative atmospheres — but your advancement may also depend on advocating for yourself more.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "modesty", level: "LOW", locale: "hu",
    body: "Alacsony Szerénységed azt jelzi, hogy szívesen hangsúlyozod az eredményeidet és magabiztosan adod el magad. Ez előnyös az önmárkaépítésben — de mások számára időnként túlzónak tűnhet az önpromóció.",
  },
  {
    testType: "HEXACO", dimension: "H", facetCode: "modesty", level: "LOW", locale: "en",
    body: "Low Modesty means you readily highlight your achievements and sell yourself confidently. This is an asset in self-promotion — but can occasionally come across as excessive to others.",
  },

  // ── E facetek ──────────────────────────────────────────────────────────────

  // fearfulness
  {
    testType: "HEXACO", dimension: "E", facetCode: "fearfulness", level: "HIGH", locale: "hu",
    body: "Magas Félelmességed fokozott kockázatérzékenységet jelent — óvatos vagy, és kerülöd a fizikai vagy szociális veszélyeket. Ez jó kockázatbecslő képességgé válik, bár néha megakadályozhat a merészebb lépések megtételében.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "fearfulness", level: "HIGH", locale: "en",
    body: "High Fearfulness means heightened risk sensitivity — you are cautious and avoid physical or social dangers. This translates into solid risk-assessment ability, though it can sometimes prevent you from taking bolder steps.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "fearfulness", level: "LOW", locale: "hu",
    body: "Alacsony Félelmességed bátorságot és kockázattűrést jelent — nem riadsz vissza a merész lépésektől. Ez nagy előny innovációban és vállalkozói kontextusban, de érdemes a kockázatbecslést tudatosan fenntartani.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "fearfulness", level: "LOW", locale: "en",
    body: "Low Fearfulness means courage and risk tolerance — you don't shy from bold moves. This is a major asset in innovation and entrepreneurial contexts, but it's worth maintaining deliberate risk assessment.",
  },

  // anxiety
  {
    testType: "HEXACO", dimension: "E", facetCode: "anxiety", level: "HIGH", locale: "hu",
    body: "Magas Szorongásod azt jelzi, hogy a bizonytalanság és a stresszes helyzetek erősen foglalkoztatják a gondolataidat. Ez éberré és előrelátóvá tesz problémás helyzetekben, de rendszeres érzelmi levezetési rutinok nélkül kimerítő lehet.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "anxiety", level: "HIGH", locale: "en",
    body: "High Anxiety means uncertainty and stressful situations occupy your thoughts intensely. This makes you alert and forward-thinking in tricky situations, but without regular emotional regulation routines it can be draining.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "anxiety", level: "LOW", locale: "hu",
    body: "Alacsony Szorongásod azt mutatja, hogy jól tolerálod a bizonytalanságot, és a nyomás sem hoz ki belőled pánikot. Ez felbecsülhetetlen nagy tétű döntéseknél és válsághelyzetekben.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "anxiety", level: "LOW", locale: "en",
    body: "Low Anxiety means you tolerate uncertainty well and pressure doesn't trigger panic. This is invaluable in high-stakes decisions and crisis situations.",
  },

  // dependence
  {
    testType: "HEXACO", dimension: "E", facetCode: "dependence", level: "HIGH", locale: "hu",
    body: "Magas Függőség-igényed azt jelzi, hogy fontos számodra a külső támasz és visszajelzés, különösen stresszes időszakokban. Ez erős kapcsolatigényt és csapatmunkára való nyitottságot takar — érdemes az autonóm döntéshozatalt is tudatosan erősíteni.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "dependence", level: "HIGH", locale: "en",
    body: "High Dependence means external support and feedback matter to you, especially in stressful periods. This shows strong relationship needs and openness to teamwork — it's worth consciously building autonomous decision-making capacity as well.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "dependence", level: "LOW", locale: "hu",
    body: "Alacsony Függőség-igényed önállóságot és autonóm működést jelent — jól boldogulsz külső megerősítés nélkül. Ez értékes remote vagy önálló munkakörökben, de érdemes aktívan keresni a visszajelzési lehetőségeket fejlődés céljából.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "dependence", level: "LOW", locale: "en",
    body: "Low Dependence means self-sufficiency and autonomous functioning — you manage well without external validation. This is valuable in remote or independent roles, but it's worth actively seeking feedback opportunities for growth.",
  },

  // sentimentality
  {
    testType: "HEXACO", dimension: "E", facetCode: "sentimentality", level: "HIGH", locale: "hu",
    body: "Magas Érzelmességed azt jelzi, hogy erősen átéled az érzelmeket és empátiával közeledel mások helyzetéhez. Ez mélyebb emberi kapcsolatokat tesz lehetővé, de a túlzott azonosulás eláraszthatja a határokat.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "sentimentality", level: "HIGH", locale: "en",
    body: "High Sentimentality means you experience emotions intensely and approach others' situations with empathy. This enables deeper human connections, but excessive identification can blur boundaries.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "sentimentality", level: "LOW", locale: "hu",
    body: "Alacsony Érzelmességed racionális, tárgyilagos megközelítést jelent — ritkán sodornak el az érzelmek. Ez értékes elemzői és döntéshozói helyzetekben, bár empátia-hiányként is leolvasható, ha nem ellensúlyozzák más jelzések.",
  },
  {
    testType: "HEXACO", dimension: "E", facetCode: "sentimentality", level: "LOW", locale: "en",
    body: "Low Sentimentality means rational, objective engagement — emotions rarely sweep you away. This is valuable in analytical and decision-making roles, though it can read as a lack of empathy if not offset by other signals.",
  },

  // ── X facetek ──────────────────────────────────────────────────────────────

  // social_boldness
  {
    testType: "HEXACO", dimension: "X", facetCode: "social_boldness", level: "HIGH", locale: "hu",
    body: "Magas Szociális bátorságod azt jelzi, hogy nem félsz a nyilvános szereplésektől, ismeretlen csoportoktól vagy nehéz szituációktól. Ez természetes előadói és hálózatépítői képességet takar, és nagy közönség előtt is magabiztosan funkcionálsz.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "social_boldness", level: "HIGH", locale: "en",
    body: "High Social Boldness means you don't fear public performance, unfamiliar groups, or difficult social situations. This covers natural presentation and networking ability — you function confidently even before large audiences.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "social_boldness", level: "LOW", locale: "hu",
    body: "Alacsony Szociális bátorságod azt jelzi, hogy a nyilvános szereplés vagy ismeretlen csoportok szorongást kelthetnek. Az igazi értéked jellemzően kisebb, bizalmi közegben mutatkozik meg — ahol mélységgel tudod pótolni a láthatóságot.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "social_boldness", level: "LOW", locale: "en",
    body: "Low Social Boldness means public performance or unfamiliar groups can trigger anxiety. Your real value typically shows in smaller, trusted settings — where you can substitute depth for visibility.",
  },

  // assertiveness
  {
    testType: "HEXACO", dimension: "X", facetCode: "assertiveness", level: "HIGH", locale: "hu",
    body: "Magas Assertivitásod azt jelzi, hogy magabiztosan képviseled az álláspontodat és vezeted a vitákat. Természetes hangja van a gondolataidnak csoportban — érdemes figyelni arra, hogy mások is egyenlő teret kapjanak.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "assertiveness", level: "HIGH", locale: "en",
    body: "High Assertiveness means you confidently advocate for your position and lead discussions. Your ideas naturally carry weight in groups — it's worth making sure others get equal space too.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "assertiveness", level: "LOW", locale: "hu",
    body: "Alacsony Assertivitásod azt jelzi, hogy hajlamos vagy visszafogni az álláspontodat, különösen ha ellenzésre számítasz. Ez konfliktuskerülővé tehet — érdemes tudatosan gyakorolni a konstruktív önérvényesítést.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "assertiveness", level: "LOW", locale: "en",
    body: "Low Assertiveness suggests you tend to hold back your position, especially when you anticipate opposition. This can make you conflict-avoidant — it's worth consciously practicing constructive self-assertion.",
  },

  // enthusiasm
  {
    testType: "HEXACO", dimension: "X", facetCode: "enthusiasm", level: "HIGH", locale: "hu",
    body: "Magas Lelkesedésed pozitív társas energiát sugároz — mások szívesen vannak veled, és a hangulatod ragadós. Ez erős csapatmotiváló hatást jelent, bár tartósan magas intenzitást fenntartani fárasztó lehet.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "enthusiasm", level: "HIGH", locale: "en",
    body: "High Enthusiasm radiates positive social energy — others enjoy your company and your mood is contagious. This has a strong team-motivating effect, though sustaining high intensity long-term can be tiring.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "enthusiasm", level: "LOW", locale: "hu",
    body: "Alacsony Lelkesedésed visszafogottabb, mértékletesebb társas stílust jelent. Nem töltekezel a felszínes interakciókon — inkább a tartalmas, elmélyült kapcsolatokban vagy a legelégedettebb.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "enthusiasm", level: "LOW", locale: "en",
    body: "Low Enthusiasm means a more reserved, measured social style. You don't recharge through superficial interactions — you are most satisfied in meaningful, deeper connections.",
  },

  // liveliness
  {
    testType: "HEXACO", dimension: "X", facetCode: "liveliness", level: "HIGH", locale: "hu",
    body: "Magas Élénkséged dinamikus és energikus megjelenést jelent — mások szívesen vonnak be döntésekbe és csapatmunkába, mert jelenléted mozgásban tartja a dolgokat.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "liveliness", level: "HIGH", locale: "en",
    body: "High Liveliness means a dynamic and energetic presence — others readily involve you in decisions and teamwork because your presence keeps things moving.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "liveliness", level: "LOW", locale: "hu",
    body: "Alacsony Élénkséged csendesebb, visszafogottabb megjelenést jelent — nem törekedel arra, hogy folyamatosan a mozgás középpontjában legyél. Ez mélységet és stabilitást adhat, amit mások horgonypontként értékelnek.",
  },
  {
    testType: "HEXACO", dimension: "X", facetCode: "liveliness", level: "LOW", locale: "en",
    body: "Low Liveliness means a quieter, more reserved presence — you don't strive to be at the center of activity. This can provide depth and stability that others value as an anchor point.",
  },

  // ── A facetek ──────────────────────────────────────────────────────────────

  // forgiveness
  {
    testType: "HEXACO", dimension: "A", facetCode: "forgiveness", level: "HIGH", locale: "hu",
    body: "Magas Megbocsátási hajlamod azt jelzi, hogy elengedett tartod a sérelmeket és nem tartasz hosszú ideig haragot. Ez egészséges csapatdinamikát teremt és csökkenti a tartós konfliktusokat.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "forgiveness", level: "HIGH", locale: "en",
    body: "High Forgiveness means you let go of grievances and don't hold grudges for long. This creates healthy team dynamics and reduces sustained conflicts.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "forgiveness", level: "LOW", locale: "hu",
    body: "Alacsony Megbocsátási hajlamod azt jelzi, hogy a sérelmeket nem felejtőd el könnyen, és számot tartasz a kölcsönösségi mérlegenként. Ez határokat húz, de hosszabb konfliktusspirálok kockázatát is magában hordozza.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "forgiveness", level: "LOW", locale: "en",
    body: "Low Forgiveness means you don't easily forget grievances and track reciprocity closely. This draws clear boundaries but also carries the risk of longer conflict spirals.",
  },

  // gentleness
  {
    testType: "HEXACO", dimension: "A", facetCode: "gentleness", level: "HIGH", locale: "hu",
    body: "Magas Szelídséged empátiás és gyengéd kommunikációs stílust jelent — ritkán kritikus vagy harcias, inkább megértő és befogadó. Ez bizalomteremtő, de néha megnehezíti a kemény visszajelzés megadását.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "gentleness", level: "HIGH", locale: "en",
    body: "High Gentleness means an empathic and soft communication style — you are rarely critical or combative, preferring understanding and receptiveness. This builds trust but can sometimes make it hard to deliver tough feedback.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "gentleness", level: "LOW", locale: "hu",
    body: "Alacsony Szelídséged közvetlen, kritikus kommunikációt jelent — nem finomkodod el az álláspontodat. Ez hatékony ott, ahol egyértelmű visszajelzés kell, de néha érzékenyek figyelhetnek fel a hangnem élességére.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "gentleness", level: "LOW", locale: "en",
    body: "Low Gentleness means direct, critical communication — you don't soften your position. This is effective when clear feedback is needed, but sensitive people may notice the sharpness of tone.",
  },

  // flexibility
  {
    testType: "HEXACO", dimension: "A", facetCode: "flexibility", level: "HIGH", locale: "hu",
    body: "Magas Rugalmasságod kompromisszumkészséget és alkalmazkodóképességet jelent — nem ragaszkodol mereven az eredeti álláspontodhoz. Ez elősegíti a tárgyalási sikereket, de érdemes figyelni arra, hogy ne a saját értékeléseid ellenére adj engedményeket.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "flexibility", level: "HIGH", locale: "en",
    body: "High Flexibility means willingness to compromise and adapt — you don't rigidly hold your original position. This facilitates negotiation success, but it's worth watching that you don't concede against your own assessments.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "flexibility", level: "LOW", locale: "hu",
    body: "Alacsony Rugalmasságod határozott állásponttartást jelent — nem tágítasz könnyen, ha meggyőződésed áll szemben a nyomással. Ez erős integritás-jel, de a csapatmunkában érdemes keresni a kölcsönös engedményt is.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "flexibility", level: "LOW", locale: "en",
    body: "Low Flexibility means holding firm positions — you don't yield easily when conviction faces pressure. This signals strong integrity, but in teamwork it's worth also seeking mutual concession.",
  },

  // patience
  {
    testType: "HEXACO", dimension: "A", facetCode: "patience", level: "HIGH", locale: "hu",
    body: "Magas Türelmed azt jelzi, hogy lassan kerülsz ki a sodrából, és képes vagy empátiásan kezelni az irritáló helyzeteket. Ez nyugodt, stabil csapatkörnyezetet teremt és csökkenti a felesleges konfrontációt.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "patience", level: "HIGH", locale: "en",
    body: "High Patience means you are slow to be provoked and can handle irritating situations with empathy. This creates a calm, stable team environment and reduces unnecessary confrontation.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "patience", level: "LOW", locale: "hu",
    body: "Alacsony Türelmed azt jelzi, hogy a lassúság, az ismétlődő hibák vagy a körülményes folyamatok gyorsan megviselnek. Ez erős hatékonyságigényt takar — érdemes felismerni, mikor van szüksége a helyzetnek időre.",
  },
  {
    testType: "HEXACO", dimension: "A", facetCode: "patience", level: "LOW", locale: "en",
    body: "Low Patience means slowness, repeated errors, or cumbersome processes quickly wear on you. This reflects a strong need for efficiency — it's worth recognizing when a situation simply needs more time.",
  },

  // ── C facetek ──────────────────────────────────────────────────────────────

  // organization
  {
    testType: "HEXACO", dimension: "C", facetCode: "organization", level: "HIGH", locale: "hu",
    body: "Magas Szervezettséged azt jelzi, hogy természetes módon rendezel és struktúrálsz — a körülötted lévő káoszt hamar rendszerré alakítod. Mások gyakran támaszkodnak erre a képességedre komplex projekteknél.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "organization", level: "HIGH", locale: "en",
    body: "High Organization means you naturally arrange and structure — you quickly turn surrounding chaos into systems. Others frequently rely on this capacity in complex projects.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "organization", level: "LOW", locale: "hu",
    body: "Alacsony Szervezettséged spontán, nem-lineáris gondolkodást takar — ritkán érdekel a rendszerezés önmagáért. Érdemes külső eszközöket (naptár, project board) használni, hogy az ötletek megvalósuljanak.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "organization", level: "LOW", locale: "en",
    body: "Low Organization covers spontaneous, non-linear thinking — you are rarely interested in systematizing for its own sake. It's worth using external tools (calendar, project board) to turn ideas into outcomes.",
  },

  // diligence
  {
    testType: "HEXACO", dimension: "C", facetCode: "diligence", level: "HIGH", locale: "hu",
    body: "Magas Szorgalmad azt jelzi, hogy keményen dolgozol és nem hagyod félbe a feladataidat. Mások megbíznak abban, hogy amit elvállalsz, azt befejezed — ez alapvető bizalomtőke munkahelyi kontextusban.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "diligence", level: "HIGH", locale: "en",
    body: "High Diligence means you work hard and don't leave tasks unfinished. Others trust that what you take on, you complete — this is fundamental trust capital in workplace contexts.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "diligence", level: "LOW", locale: "hu",
    body: "Alacsony Szorgalmad azt jelzi, hogy energiádat szelektíven osztod be — nem minden feladatot kezelsz azonos intenzitással. Érdemes azonosítani, melyek azok, amelyek valóban motiválnak, és ott koncentrálni az energiát.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "diligence", level: "LOW", locale: "en",
    body: "Low Diligence means you allocate energy selectively — not every task gets equal intensity. It's worth identifying which tasks genuinely motivate you and concentrating energy there.",
  },

  // perfectionism
  {
    testType: "HEXACO", dimension: "C", facetCode: "perfectionism", level: "HIGH", locale: "hu",
    body: "Magas Perfekcionizmusod magas minőségi mércét és részletességet jelent. Ez kiváló minőségű munkát eredményez, de fontos megtanulni, mikor érdemes 'elég jónak' minősíteni valamit, hogy elkerüld az időbeli és energetikai veszteséget.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "perfectionism", level: "HIGH", locale: "en",
    body: "High Perfectionism means high quality standards and attention to detail. This produces excellent work, but it's important to learn when 'good enough' is the right call to avoid time and energy loss.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "perfectionism", level: "LOW", locale: "hu",
    body: "Alacsony Perfekcionizmusod pragmatikus hozzáállást jelent a minőséghez — elfogadod a jó munkát anélkül, hogy a tökéletlent keresnéd. Ez gyors iterációt tesz lehetővé, bár egyes közegekben a minőség tudatos emelése hasznos lehet.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "perfectionism", level: "LOW", locale: "en",
    body: "Low Perfectionism means a pragmatic attitude toward quality — you accept good work without chasing perfection. This enables fast iteration, though in some contexts deliberately raising quality standards is beneficial.",
  },

  // prudence
  {
    testType: "HEXACO", dimension: "C", facetCode: "prudence", level: "HIGH", locale: "hu",
    body: "Magas Körültekintésed azt jelzi, hogy átgondolt, elővigyázatos döntéshozó vagy — mérlegelsz, mielőtt cselekszel. Ez értékes kockázatkezelési szemléletet takar, és elkerülöd a kapkodó hibákat.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "prudence", level: "HIGH", locale: "en",
    body: "High Prudence means you are a deliberate, cautious decision-maker — you weigh carefully before acting. This reflects valuable risk-management thinking and helps you avoid impulsive mistakes.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "prudence", level: "LOW", locale: "hu",
    body: "Alacsony Körültekintésed impulzív, gyors cselekvési stílust jelent — nem viszel sokat az előkészítési fázisra. Ez gyors reagálási képességet takar, bár fontos a szándékos szünet beépítése nagyobb döntéseknél.",
  },
  {
    testType: "HEXACO", dimension: "C", facetCode: "prudence", level: "LOW", locale: "en",
    body: "Low Prudence means an impulsive, fast-action style — you don't invest much in the preparation phase. This covers quick responsiveness, though intentional pausing is important for larger decisions.",
  },

  // ── O facetek ──────────────────────────────────────────────────────────────

  // aesthetic_appreciation
  {
    testType: "HEXACO", dimension: "O", facetCode: "aesthetic_appreciation", level: "HIGH", locale: "hu",
    body: "Magas Esztétikai érzékenységed azt jelzi, hogy a szépség, a forma és a minőség fontos szerepet játszik az élményeidben. Ez kreatív és design-orientált munkakörökben különösen értékes szemléletet ad.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "aesthetic_appreciation", level: "HIGH", locale: "en",
    body: "High Aesthetic Appreciation means beauty, form, and quality play an important role in your experiences. This brings a particularly valuable perspective in creative and design-oriented roles.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "aesthetic_appreciation", level: "LOW", locale: "hu",
    body: "Alacsony Esztétikai érzékenységed azt jelzi, hogy a forma és a megjelenés másodlagos a funkcióhoz képest. Ez praktikus, eredményorientált megközelítést takar — ott a legerősebb, ahol az output számít, nem az esztétikum.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "aesthetic_appreciation", level: "LOW", locale: "en",
    body: "Low Aesthetic Appreciation means form and appearance are secondary to function for you. This covers a practical, outcome-oriented approach — strongest where output matters more than aesthetics.",
  },

  // inquisitiveness
  {
    testType: "HEXACO", dimension: "O", facetCode: "inquisitiveness", level: "HIGH", locale: "hu",
    body: "Magas Kíváncsiságod azt jelzi, hogy szívesen merülsz el komplex kérdésekben, és az ismeretlen inkább vonz, mint elriaszt. Ez erős tanulási motivációt és intellektuális rugalmasságot jelent.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "inquisitiveness", level: "HIGH", locale: "en",
    body: "High Inquisitiveness means you readily dive into complex questions, and the unknown attracts rather than repels you. This reflects strong learning motivation and intellectual flexibility.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "inquisitiveness", level: "LOW", locale: "hu",
    body: "Alacsony Kíváncsiságod azt jelzi, hogy nem keresed aktívan az összetett, elméleti kérdéseket — inkább a gyakorlati, konkrét problémákat preferálod. Ez értékes pragmatizmust takar operatív munkakörökben.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "inquisitiveness", level: "LOW", locale: "en",
    body: "Low Inquisitiveness means you don't actively seek out complex theoretical questions — you prefer practical, concrete problems. This reflects valuable pragmatism in operational roles.",
  },

  // creativity
  {
    testType: "HEXACO", dimension: "O", facetCode: "creativity", level: "HIGH", locale: "hu",
    body: "Magas Kreativitásod azt jelzi, hogy szívesen gondolkodsz out-of-the-box, és az ötleteid szokatlan szögekből érkeznek. Értéket teremtesz ott, ahol a konvencionális megközelítések nem hoznak megoldást.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "creativity", level: "HIGH", locale: "en",
    body: "High Creativity means you enjoy thinking out of the box, and your ideas come from unusual angles. You create value where conventional approaches don't deliver solutions.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "creativity", level: "LOW", locale: "hu",
    body: "Alacsony Kreativitásod azt jelzi, hogy inkább a bevált, tesztelt megoldásokat részesíted előnyben az újítással szemben. Ez megbízható végrehajtói stílust takar — különösen értékes ott, ahol a stabilitás fontosabb a kísérletezésnél.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "creativity", level: "LOW", locale: "en",
    body: "Low Creativity means you prefer proven, tested solutions over innovation. This covers a reliable execution style — especially valuable where stability matters more than experimentation.",
  },

  // unconventionality
  {
    testType: "HEXACO", dimension: "O", facetCode: "unconventionality", level: "HIGH", locale: "hu",
    body: "Magas Konvenciótlanságod azt jelzi, hogy szívesen kérdőjelezed meg az alapfeltételezéseket és keresel szokatlan utakat. Ez szükséges disruptív innovátor képesség, bár néha ütközhet a meglévő rendszerekkel és elvárásokkal.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "unconventionality", level: "HIGH", locale: "en",
    body: "High Unconventionality means you readily challenge assumptions and seek unusual paths. This is an essential disruptive innovator capacity, though it can sometimes clash with existing systems and expectations.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "unconventionality", level: "LOW", locale: "hu",
    body: "Alacsony Konvenciótlanságod azt jelzi, hogy a bevált normákat és struktúrákat értékeled — nem keresed a rebelliót önmagáért. Ez stabil, kiszámítható működési stílust eredményez, amit mások megbízhatóságként értékelnek.",
  },
  {
    testType: "HEXACO", dimension: "O", facetCode: "unconventionality", level: "LOW", locale: "en",
    body: "Low Unconventionality means you value established norms and structures — you don't seek rebellion for its own sake. This produces a stable, predictable operating style that others read as reliability.",
  },
];

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function main() {
  const allBlocks = [...DIM_BLOCKS, ...FACET_BLOCKS];
  console.log(`Seeding ${allBlocks.length} RecommendationBlock records...`);

  let created = 0;
  let skipped = 0;

  for (const block of allBlocks) {
    const stableId = [
      block.testType,
      block.dimension,
      block.facetCode ?? "dim",
      block.level,
      block.locale,
    ].join(":");

    const data = {
      id: stableId,
      testType: block.testType,
      dimensionCode: block.dimension,
      facetCode: block.facetCode ?? null,
      scoreRange: block.level as "HIGH" | "MED" | "LOW",
      locale: block.locale,
      content: { body: block.body },
    };

    if (FORCE) {
      await prisma.recommendationBlock.upsert({
        where: { id: stableId },
        update: { content: data.content },
        create: data,
      });
      created++;
    } else {
      const existing = await prisma.recommendationBlock.findUnique({ where: { id: stableId } });
      if (existing) {
        skipped++;
      } else {
        await prisma.recommendationBlock.create({ data });
        created++;
      }
    }
  }

  console.log(`Done. Created: ${created}, Skipped: ${skipped}`);
  console.log(`  Dim-level blocks: ${DIM_BLOCKS.length}`);
  console.log(`  Facet-level blocks: ${FACET_BLOCKS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
