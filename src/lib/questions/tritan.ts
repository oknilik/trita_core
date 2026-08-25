import type { TestConfig } from "./types";
import { DIMENSION_COLORS } from "@/lib/color-system";

/**
 * TSFI kérdésbank v2 (2026-07-16)
 *
 * FORRÁS ÉS LICENC
 * A 100 item az International Personality Item Pool (IPIP) készletéből
 * származik, amely PUBLIC DOMAIN: „permission has already been
 * automatically granted for any person to use IPIP items, scales, and
 * inventories for any purpose, commercial or non-commercial"
 * (https://ipip.ori.org/newPermission.htm). Engedélykérés, díj és
 * attribúció jogilag nem szükséges; a hivatkozás tudományos jó gyakorlat.
 *
 * Item-források:
 * - 92 item: IPIP–HEXACO skálák (24 facet) —
 *   https://ipip.ori.org/newHEXACO_PI_key.htm
 *   Ashton, M. C., Lee, K., & Goldberg, L. R. (2007). The IPIP–HEXACO
 *   scales: An alternative, public-domain measure of the personality
 *   constructs in the HEXACO model. Personality and Individual
 *   Differences, 42, 1515–1526.
 * - 4 item (social_self_esteem facet): IPIP itempool önértékelés-itemei
 *   (Feel comfortable with myself · Am very pleased with myself ·
 *   Dislike myself · Have a low opinion of myself) —
 *   https://ipip.ori.org/newNEOFacetsKey.htm
 * - 4 item (altruism): IPIP A3 Altruism skála —
 *   https://ipip.ori.org/newNEOFacetsKey.htm
 * - IPIP fő hivatkozás: Goldberg, L. R., et al. (2006). The international
 *   personality item pool and the future of public-domain personality
 *   measures. Journal of Research in Personality, 40, 84–96.
 *
 * SAJÁT ADAPTÁCIÓK (public domain forráson megengedett):
 * - E/1 alany hozzáadva (IPIP-formátum: „Keep things tidy." → „I keep
 *   things tidy."); 3 itemnél könnyű szövegigazítás (41, 50, 78).
 * - Magyar fordítás: saját (trita, 2026) — az IPIP a fordítást engedély
 *   nélkül megengedi.
 * - Observer-változatok (singular they / E/3): saját nyelvtani derivátum —
 *   jogilag korlátlan; publikált observer-validálása nincs, a saját
 *   pilot-adat validálja.
 *
 * Részletes jogi összefoglaló: docs/product/tsfi-item-provenance.md
 * Dimenziókódok: X/E/H/C/A/O (ld. src/lib/tritan.ts).
 *
 * RÖVID FORMA (TSFI-S, `short: true`) — 60 item, KIZÁRÓLAG fő dimenziós,
 * dimenziónként pontosan 10. A kiegészítő altruizmus-skála (`I`) NEM része:
 * 2026-08-11-ig 2 itemmel benne volt (98, 99), de két itemen a skála
 * megbízhatatlan volt (α ≈ 0,36), és egyetlen aggregátumba sem számított —
 * helyettük a 77 (E/fearfulness) és a 79 (O/inquisitiveness) lépett be,
 * így az itemszám 60 maradt, a hat dimenzió pedig kiegyensúlyozott lett.
 * A TELJES forma változatlan: mind a négy altruizmus-item (97-100) benne van.
 * A régi rövid forma id-halmazát a beadási kapu továbbra is elfogadja
 * (questions/index.ts → LEGACY_COMPLETE_FORM_ID_SETS).
 */
export const tritanConfig: TestConfig = {
  type: "TRITAN",
  name: "trita személyiségteszt",
  // A user-facing szöveg NEM nevezi a modellt „HEXACO-nak" (CLAUDE.md) — a
  // getTestConfig amúgy is a lokalizált testLabels-re cseréli, de a nyers mező
  // se hordozza a tiltott megfogalmazást.
  description: "Hatfaktoros, validált személyiségteszt (IPIP-itemek).",
  format: "likert",
  dimensions: [
    {
      code: "H",
      label: "Honesty-Humility",
      labelByLocale: {
        en: "Honesty-Humility",
        hu: "Becsületesség-Alázat",
      },
      color: DIMENSION_COLORS.H.base,
      description: "A becsületesség-alázat (H) dimenzió azt tükrözi, mennyire kerüli valaki mások manipulálását, a szabályszegést, valamint az anyagi javak és a kiemelt társadalmi státusz hajszolását. Négy alskálája az Őszinteség (egyenes, nem manipulatív viszonyulás másokhoz), a Méltányosság (a csalás és a korrupció kerülése), a Mohóságkerülés (az anyagi javak és a státusz iránti közömbösség), valamint a Szerénység (nem tekinti magát kiváltságosnak vagy különlegesnek).",
      descriptionByLocale: {
        en: "The Honesty-Humility (H) dimension reflects the extent to which a person avoids manipulating others for personal gain, feels little temptation to break rules, is uninterested in lavish wealth and luxury, and feels no special sense of entitlement. Its four facets are Sincerity (genuine, non-manipulative engagement with others), Fairness (avoidance of fraud and exploitation), Greed Avoidance (indifference to material wealth and social status), and Modesty (not viewing oneself as superior or deserving of special treatment).",
        hu: "A becsületesség-alázat (H) dimenzió azt tükrözi, mennyire kerüli valaki mások manipulálását, a szabályszegést, valamint az anyagi javak és a kiemelt társadalmi státusz hajszolását. Négy alskálája az Őszinteség (egyenes, nem manipulatív viszonyulás másokhoz), a Méltányosság (a csalás és a korrupció kerülése), a Mohóságkerülés (az anyagi javak és a státusz iránti közömbösség), valamint a Szerénység (nem tekinti magát kiváltságosnak vagy különlegesnek).",
      },
      insights: {
        low: "Az eredmény, az anyagi elismerés és a státusz erősen motivál. Érdekeid érvényesítésekor rugalmasan választasz eszközt, a szabályokat pedig inkább keretnek látod, mint korlátnak. Ez versengő közegben előny lehet, a bizalmi kapcsolatok viszont tudatosabb figyelmet igényelhetnek.",
        mid: "A helyzettől függően egyensúlyozol az egyenes út és a saját érdekeid érvényesítése között — többnyire méltányosan működsz, de tudsz taktikus is lenni, ha a helyzet úgy kívánja.",
        high: "A nyílt, közvetlen működést választod. Kevéssé motivál a státusz és az anyagi felhalmozás, és nem szívesen taktikázol, így mások gyorsan tudják, hányadán állnak veled.",
      },
      insightsByLocale: {
        en: {
          low: "Results, material recognition, and status are strong motivators for you, and you choose flexibly among tools when advancing your interests — rules read more as frames than limits. In competitive settings this is an advantage; trust-based relationships need more deliberate upkeep.",
          mid: "You balance between the direct route and advancing your own interests depending on the situation — mostly operating fairly, while able to be tactical when the moment calls for it.",
          high: "You choose open, direct operation: status and material accumulation motivate you little, and you're reluctant to use tactical tools — people quickly know where they stand with you.",
        },
        hu: {
          low: "Az eredmény, az anyagi elismerés és a státusz erősen motivál. Érdekeid érvényesítésekor rugalmasan választasz eszközt, a szabályokat pedig inkább keretnek látod, mint korlátnak. Ez versengő közegben előny lehet, a bizalmi kapcsolatok viszont tudatosabb figyelmet igényelhetnek.",
          mid: "A helyzettől függően egyensúlyozol az egyenes út és a saját érdekeid érvényesítése között — többnyire méltányosan működsz, de tudsz taktikus is lenni, ha a helyzet úgy kívánja.",
          high: "A nyílt, közvetlen működést választod. Kevéssé motivál a státusz és az anyagi felhalmozás, és nem szívesen taktikázol, így mások gyorsan tudják, hányadán állnak veled.",
        },
      },
      facets: [
        { code: "sincerity", label: "Sincerity", labelByLocale: { en: "Sincerity", hu: "Őszinteség" } },
        { code: "fairness", label: "Fairness", labelByLocale: { en: "Fairness", hu: "Méltányosság" } },
        { code: "greed_avoidance", label: "Greed Avoidance", labelByLocale: { en: "Greed Avoidance", hu: "Mohóságkerülés" } },
        { code: "modesty", label: "Modesty", labelByLocale: { en: "Modesty", hu: "Szerénység" } },
      ],
    },
    {
      code: "E",
      label: "Emotionality",
      labelByLocale: {
        en: "Emotionality",
        hu: "Emocionalitás",
      },
      color: DIMENSION_COLORS.E.base,
      description: "Az emocionalitás (E) dimenzió azt méri, mennyire érzékeny valaki a fizikai veszélyekre és a megterhelő helyzetekre, mennyire igényli mások érzelmi támogatását, valamint milyen erősek az érzelmi kötődései és az empátiája. Négy alskálája a Félelem (a fizikai sérülés elkerülésére való hajlam), a Szorongás (aggodalom a különféle nehézségekkel kapcsolatban), a Dependencia (mások érzelmi támogatásának igénye), valamint a Szentimentalitás (erős érzelmi kötődés és empatikus érzékenység mások iránt).",
      descriptionByLocale: {
        en: "The Emotionality (E) dimension measures sensitivity to physical danger and life stresses, the need for emotional support from others, and the strength of emotional bonds and empathic sensitivity. Its four facets are Fearfulness (tendency to avoid physical harm), Anxiety (tendency to worry in response to difficulties), Dependence (need for emotional support from others), and Sentimentality (strong emotional attachments and empathic sensitivity to others' feelings).",
        hu: "Az emocionalitás (E) dimenzió azt méri, mennyire érzékeny valaki a fizikai veszélyekre és a megterhelő helyzetekre, mennyire igényli mások érzelmi támogatását, valamint milyen erősek az érzelmi kötődései és az empátiája. Négy alskálája a Félelem (a fizikai sérülés elkerülésére való hajlam), a Szorongás (aggodalom a különféle nehézségekkel kapcsolatban), a Dependencia (mások érzelmi támogatásának igénye), valamint a Szentimentalitás (erős érzelmi kötődés és empatikus érzékenység mások iránt).",
      },
      insights: {
        low: "A fizikai veszélyek ritkán tántorítanak el, megterhelő helyzetekben is kevésbé aggódsz, és ritkán igényled mások érzelmi támogatását. Nyugalmadat ugyanakkor távolságtartásként is értelmezhetik.",
        mid: "Mérsékelt érzelmi intenzitás jellemez. Időnként keresed mások támogatását, és észleled a helyzetek érzelmi jelzéseit, de a kihívásokkal általában önállóan is megbirkózol.",
        high: "Erős érzelmi kötődés és fogékonyság jellemez. Intenzíven élheted meg a félelmet és a megterhelő helyzeteket, ezért fontos számodra, hogy megoszthasd az érzéseidet a hozzád közel állókkal. Így sok jelzést már korán észlelhetsz, de nagyobb érzelmi terhet is vihetsz magaddal.",
      },
      insightsByLocale: {
        en: {
          low: "You are not deterred by physical danger, feel little worry even in stressful situations, and have little need to share your concerns with others. In exchange, others' emotional signals reach you less often, and your calm can be read as distance.",
          mid: "You experience moderate emotional intensity: you occasionally seek support in stressful situations and pick up the emotional signals around you, while generally managing challenges independently.",
          high: "You are strongly emotionally connected: intensely affected by fears and stress, and you feel a real need to share your concerns with those close to you. A lot of early signal reaches you this way — and you carry a lot of it with you.",
        },
        hu: {
          low: "A fizikai veszélyek ritkán tántorítanak el, megterhelő helyzetekben is kevésbé aggódsz, és ritkán igényled mások érzelmi támogatását. Nyugalmadat ugyanakkor távolságtartásként is értelmezhetik.",
          mid: "Mérsékelt érzelmi intenzitás jellemez. Időnként keresed mások támogatását, és észleled a helyzetek érzelmi jelzéseit, de a kihívásokkal általában önállóan is megbirkózol.",
          high: "Erős érzelmi kötődés és fogékonyság jellemez. Intenzíven élheted meg a félelmet és a megterhelő helyzeteket, ezért fontos számodra, hogy megoszthasd az érzéseidet a hozzád közel állókkal. Így sok jelzést már korán észlelhetsz, de nagyobb érzelmi terhet is vihetsz magaddal.",
        },
      },
      facets: [
        { code: "fearfulness", label: "Fearfulness", labelByLocale: { en: "Fearfulness", hu: "Félelem" } },
        { code: "anxiety", label: "Anxiety", labelByLocale: { en: "Anxiety", hu: "Szorongás" } },
        { code: "dependence", label: "Dependence", labelByLocale: { en: "Dependence", hu: "Dependencia" } },
        { code: "sentimentality", label: "Sentimentality", labelByLocale: { en: "Sentimentality", hu: "Szentimentalitás" } },
      ],
    },
    {
      code: "X",
      label: "Extraversion",
      labelByLocale: {
        en: "Extraversion",
        hu: "Extraverzió",
      },
      color: DIMENSION_COLORS.X.base,
      description: "Az extraverzió (X) dimenzió azt tükrözi, mennyire magabiztos valaki társas helyzetekben, mennyire élvezi a beszélgetéseket és az összejöveteleket, valamint mennyi lelkesedés és energia jellemzi. Négy alskálája a Társas önértékelés (pozitív önkép, különösen társas helyzetekben), a Társas merészség (magabiztosság csoportban vagy nyilvánosan), a Társaságkedvelés (a beszélgetések, a kapcsolódás és az összejövetelek élvezete), valamint az Élénkség (általános lelkesedés és optimizmus).",
      descriptionByLocale: {
        en: "The Extraversion (X) dimension reflects social self-confidence, comfort across social situations, enjoyment of conversation and social gatherings, and overall enthusiasm and energy. Its four facets are Social Self-Esteem (positive self-regard, especially in social contexts), Social Boldness (confidence in group or public settings), Sociability (enjoyment of conversation, interaction, and social gatherings), and Liveliness (general sense of enthusiasm and optimism).",
        hu: "Az extraverzió (X) dimenzió azt tükrözi, mennyire magabiztos valaki társas helyzetekben, mennyire élvezi a beszélgetéseket és az összejöveteleket, valamint mennyi lelkesedés és energia jellemzi. Négy alskálája a Társas önértékelés (pozitív önkép, különösen társas helyzetekben), a Társas merészség (magabiztosság csoportban vagy nyilvánosan), a Társaságkedvelés (a beszélgetések, a kapcsolódás és az összejövetelek élvezete), valamint az Élénkség (általános lelkesedés és optimizmus).",
      },
      insights: {
        low: "Kényelmetlenül érezheted magad a figyelem középpontjában, és előfordulhat, hogy kevésbé népszerűnek látod magad. Szívesebben végzel önálló tevékenységeket, a lelkesedés és az optimizmus pedig ritkábban látszik rajtad.",
        mid: "Társas helyzetekben általában magabiztosnak érzed magad, és tudsz vezető szerepet vállalni, miközben az egyéni tevékenységeket és a csendesebb pillanatokat is értékeled.",
        high: "Társas közegben magabiztosnak és energikusnak érzed magad. Élvezed a beszélgetéseket, az összejöveteleket és a csoporthelyzeteket, pozitívan gondolsz magadra, a mindennapokhoz pedig lelkesedéssel és optimizmussal állsz.",
      },
      insightsByLocale: {
        en: {
          low: "You may feel awkward when you are the center of social attention and tend to view yourself as less popular. You prefer solitary activities and feel less lively or optimistic than others around you.",
          mid: "You generally feel confident in social situations and can take on leadership roles, while also valuing time for independent activities and quieter moments.",
          high: "You feel confident and energized in social settings, enjoy conversation, gatherings, and group situations, hold a positive view of yourself, and approach daily life with enthusiasm and optimism.",
        },
        hu: {
          low: "Kényelmetlenül érezheted magad a figyelem középpontjában, és előfordulhat, hogy kevésbé népszerűnek látod magad. Szívesebben végzel önálló tevékenységeket, a lelkesedés és az optimizmus pedig ritkábban látszik rajtad.",
          mid: "Társas helyzetekben általában magabiztosnak érzed magad, és tudsz vezető szerepet vállalni, miközben az egyéni tevékenységeket és a csendesebb pillanatokat is értékeled.",
          high: "Társas közegben magabiztosnak és energikusnak érzed magad. Élvezed a beszélgetéseket, az összejöveteleket és a csoporthelyzeteket, pozitívan gondolsz magadra, a mindennapokhoz pedig lelkesedéssel és optimizmussal állsz.",
        },
      },
      facets: [
        { code: "social_self_esteem", label: "Social Self-Esteem", labelByLocale: { en: "Social Self-Esteem", hu: "Társas önértékelés" } },
        { code: "social_boldness", label: "Social Boldness", labelByLocale: { en: "Social Boldness", hu: "Társas merészség" } },
        { code: "sociability", label: "Sociability", labelByLocale: { en: "Sociability", hu: "Társaságkedvelés" } },
        { code: "liveliness", label: "Liveliness", labelByLocale: { en: "Liveliness", hu: "Élénkség" } },
      ],
    },
    {
      code: "A",
      label: "Agreeableness",
      labelByLocale: {
        en: "Agreeableness",
        hu: "Barátságosság",
      },
      color: DIMENSION_COLORS.A.base,
      description: "A barátságosság (A) dimenzió — a harag ellenpontjaként — azt tükrözi, mennyire hajlamos valaki megbocsátani a sérelmeket, elnézően megítélni másokat, kompromisszumra törekedni és provokáció esetén is megőrizni a nyugalmát. Négy alskálája a Megbocsátás (a bizalom és a jóindulat helyreállítása az iránt, aki megbántotta), a Gyengédség (mások elnéző és türelmes megítélése), a Rugalmasság (alkalmazkodási és kompromisszumkészség), valamint a Türelem (a harag és az ingerültség visszafogása).",
      descriptionByLocale: {
        en: "The Agreeableness (A) dimension (versus Anger) reflects the tendency to forgive wrongs, judge others with leniency, willingness to compromise and cooperate, and the ability to keep one's temper even when mistreated. Its four facets are Forgivingness (restoring trust and goodwill toward those who have caused harm), Gentleness (mild and lenient judgment of others), Flexibility (willingness to adapt and compromise), and Patience (restraining anger and irritation).",
        hu: "A barátságosság (A) dimenzió — a harag ellenpontjaként — azt tükrözi, mennyire hajlamos valaki megbocsátani a sérelmeket, elnézően megítélni másokat, kompromisszumra törekedni és provokáció esetén is megőrizni a nyugalmát. Négy alskálája a Megbocsátás (a bizalom és a jóindulat helyreállítása az iránt, aki megbántotta), a Gyengédség (mások elnéző és türelmes megítélése), a Rugalmasság (alkalmazkodási és kompromisszumkészség), valamint a Türelem (a harag és az ingerültség visszafogása).",
      },
      // 2026-08-11, valencia-revízió (a E-döntés kiterjesztése): a skála-LEÍRÁS
      // fent irodalom-hű marad (az a konstruktum definíciója), a VERDIKT-
      // szövegek viszont csak azt mondhatják, amit a négy facet mér —
      // megbocsátás, elnéző ítélet, rugalmasság, türelem. Empátiát a
      // Barátságosság nem mér, ezért itt nem is ígérünk. Mindkét pólus
      // kétoldalú: a magasnál ott az ára, az alacsonynál ott a hozadéka.
      insights: {
        low: "Nehezen engedsz el egy sérelmet, kritikusan ítéled meg mások hibáit, kitartóan véded az álláspontodat, és provokáció hatására hamar elfogyhat a türelmed. Cserébe nem hagyod kimondatlanul a nézeteltéréseket: a visszajelzésed egyenes, a határaid pedig egyértelműek.",
        mid: "Képes vagy megbocsátani és kompromisszumot kötni, miközben szükség esetén meg tudod védeni az álláspontodat is. Általában megőrzöd a nyugalmad, de komoly provokáció esetén ingerültté válhatsz.",
        high: "Könnyen megbocsátasz azoknak, akik megbántottak, elnézően ítéled meg mások gyengéit, hajlandó vagy rugalmasan alkalmazkodni és kompromisszumot kötni, és ritkán veszíted el a türelmedet. Cserébe a saját sérelmed sokáig kimondatlan maradhat, és könnyen te leszel az, aki mindig enged.",
      },
      insightsByLocale: {
        en: {
          low: "You find it hard to let a wrong go, judge others' shortcomings critically, defend your point of view tenaciously, and run out of patience quickly under provocation. In exchange, you name disagreement instead of storing it — your feedback stays honest and your boundaries are visible.",
          mid: "You are capable of forgiving and compromising while still defending your position when it matters. You generally stay calm, though significant provocation may still stir your temper.",
          high: "You readily forgive those who have wronged you, judge others' shortcomings with leniency, are willing to adapt flexibly and reach compromises, and rarely lose your temper. In exchange, your own grievance can stay unspoken for a long time, and you can easily become the one who always yields.",
        },
        hu: {
          low: "Nehezen engedsz el egy sérelmet, kritikusan ítéled meg mások hibáit, kitartóan véded az álláspontodat, és provokáció hatására hamar elfogyhat a türelmed. Cserébe nem hagyod kimondatlanul a nézeteltéréseket: a visszajelzésed egyenes, a határaid pedig egyértelműek.",
          mid: "Képes vagy megbocsátani és kompromisszumot kötni, miközben szükség esetén meg tudod védeni az álláspontodat is. Általában megőrzöd a nyugalmad, de komoly provokáció esetén ingerültté válhatsz.",
          high: "Könnyen megbocsátasz azoknak, akik megbántottak, elnézően ítéled meg mások gyengéit, hajlandó vagy rugalmasan alkalmazkodni és kompromisszumot kötni, és ritkán veszíted el a türelmedet. Cserébe a saját sérelmed sokáig kimondatlan maradhat, és könnyen te leszel az, aki mindig enged.",
        },
      },
      facets: [
        { code: "forgiveness", label: "Forgiveness", labelByLocale: { en: "Forgiveness", hu: "Megbocsátás" } },
        { code: "gentleness", label: "Gentleness", labelByLocale: { en: "Gentleness", hu: "Gyengédség" } },
        { code: "flexibility", label: "Flexibility", labelByLocale: { en: "Flexibility", hu: "Rugalmasság" } },
        { code: "patience", label: "Patience", labelByLocale: { en: "Patience", hu: "Türelem" } },
      ],
    },
    {
      code: "C",
      label: "Conscientiousness",
      labelByLocale: {
        en: "Conscientiousness",
        hu: "Lelkiismeretesség",
      },
      color: DIMENSION_COLORS.C.base,
      description: "A lelkiismeretesség (C) dimenzió azt méri, mennyire szervezetten és rendszeresen működik valaki a mindennapokban, milyen kitartóan és fegyelmezetten dolgozik a céljaiért, mennyire törekszik pontosságra, és milyen alaposan gondolja át a döntéseit. Négy alskálája a Szervezettség (a rendezett környezet és időbeosztás igénye), a Szorgalom (erős munkamotiváció és kitartás), a Perfekcionizmus (aprólékosság és a részletekre fordított figyelem), valamint a Körültekintés (az impulzusok szabályozása és a döntések átgondolása).",
      descriptionByLocale: {
        en: "The Conscientiousness (C) dimension measures how organized and structured a person is, how persistently and disciplinedly they work toward goals, their drive for accuracy and thoroughness, and how carefully they deliberate before making decisions. Its four facets are Organization (preference for tidy surroundings and structured schedules), Diligence (strong work ethic and motivation to achieve), Perfectionism (thoroughness and attention to detail), and Prudence (impulse control and careful deliberation).",
        hu: "A lelkiismeretesség (C) dimenzió azt méri, mennyire szervezetten és rendszeresen működik valaki a mindennapokban, milyen kitartóan és fegyelmezetten dolgozik a céljaiért, mennyire törekszik pontosságra, és milyen alaposan gondolja át a döntéseit. Négy alskálája a Szervezettség (a rendezett környezet és időbeosztás igénye), a Szorgalom (erős munkamotiváció és kitartás), a Perfekcionizmus (aprólékosság és a részletekre fordított figyelem), valamint a Körültekintés (az impulzusok szabályozása és a döntések átgondolása).",
      },
      insights: {
        low: "Kevésbé igényled a rendet és a szoros kereteket. A részletekhez és a pontossághoz rugalmasabban viszonyulsz, döntéskor pedig gyakrabban támaszkodhatsz az első benyomásodra, mint hosszas mérlegelésre.",
        mid: "Megbízhatóan hajtod végre a feladatokat, és általában rendszerezetten végzed a munkát, de nem hajszolod túl magad a tökéletesség érdekében. Rugalmasan alkalmazkodsz a változásokhoz anélkül, hogy elveszítenéd a fókuszodat.",
        high: "Gondosan szervezed az idődet és a környezetedet. Fegyelmezetten és kitartóan dolgozol a céljaidért, nagy figyelmet fordítasz a részletekre és a pontosságra, döntés előtt pedig körültekintően mérlegelsz.",
      },
      insightsByLocale: {
        en: {
          low: "You are less concerned with order and structure: you tend to avoid difficult tasks, are satisfied with work that contains some errors, and make decisions more on impulse than after careful reflection.",
          mid: "You complete tasks reliably and generally work in an organized way, without pushing yourself to extremes of perfectionism. You adapt flexibly to changes without losing focus.",
          high: "You organize your time and surroundings carefully, work toward your goals with discipline and persistence, pay close attention to accuracy and detail, and deliberate carefully before making decisions.",
        },
        hu: {
          low: "Kevésbé igényled a rendet és a szoros kereteket. A részletekhez és a pontossághoz rugalmasabban viszonyulsz, döntéskor pedig gyakrabban támaszkodhatsz az első benyomásodra, mint hosszas mérlegelésre.",
          mid: "Megbízhatóan hajtod végre a feladatokat, és általában rendszerezetten végzed a munkát, de nem hajszolod túl magad a tökéletesség érdekében. Rugalmasan alkalmazkodsz a változásokhoz anélkül, hogy elveszítenéd a fókuszodat.",
          high: "Gondosan szervezed az idődet és a környezetedet. Fegyelmezetten és kitartóan dolgozol a céljaidért, nagy figyelmet fordítasz a részletekre és a pontosságra, döntés előtt pedig körültekintően mérlegelsz.",
        },
      },
      facets: [
        { code: "organization", label: "Organization", labelByLocale: { en: "Organization", hu: "Szervezettség" } },
        { code: "diligence", label: "Diligence", labelByLocale: { en: "Diligence", hu: "Szorgalom" } },
        { code: "perfectionism", label: "Perfectionism", labelByLocale: { en: "Perfectionism", hu: "Perfekcionizmus" } },
        { code: "prudence", label: "Prudence", labelByLocale: { en: "Prudence", hu: "Körültekintés" } },
      ],
    },
    {
      code: "O",
      label: "Openness",
      labelByLocale: {
        en: "Openness",
        hu: "Nyitottság",
      },
      color: DIMENSION_COLORS.O.base,
      description: "A nyitottság (O) dimenzió az esztétikai fogékonyságot, az intellektuális kíváncsiságot, a kreativitást és a szokatlan ötletek iránti befogadókészséget méri. Négy alskálája az Esztétikai fogékonyság (elmélyülés a természet és a művészet szépségében), a Kíváncsiság (ismeretek és tapasztalatok aktív keresése), a Kreativitás (kísérletezés és eredeti megoldások keresése), valamint a Konvenciómentesség (nyitottság a szokatlan, akár radikális ötletekre).",
      descriptionByLocale: {
        en: "The Openness to Experience (O) dimension measures aesthetic appreciation, intellectual curiosity, creativity, and receptiveness to unusual ideas and perspectives. Its four facets are Aesthetic Appreciation (absorption in the beauty of art and nature), Inquisitiveness (active seeking of knowledge and experience), Creativity (preference for innovation and experimentation, seeking original solutions), and Unconventionality (openness to ideas that may seem strange or radical).",
        hu: "A nyitottság (O) dimenzió az esztétikai fogékonyságot, az intellektuális kíváncsiságot, a kreativitást és a szokatlan ötletek iránti befogadókészséget méri. Négy alskálája az Esztétikai fogékonyság (elmélyülés a természet és a művészet szépségében), a Kíváncsiság (ismeretek és tapasztalatok aktív keresése), a Kreativitás (kísérletezés és eredeti megoldások keresése), valamint a Konvenciómentesség (nyitottság a szokatlan, akár radikális ötletekre).",
      },
      insights: {
        low: "A műalkotások és a természeti élmények kevésbé ragadnak magukkal, az elméleti felfedezésnél pedig jobban vonzanak a kézzelfogható kérdések. Inkább a bevált megoldásokra építesz, mint a szokatlan vagy radikális ötletekre.",
        mid: "Nyitott vagy néhány új ötletre és kreatív élményre, miközben a gyakorlatias, bevált megközelítések is vonzanak. Kíváncsiságod és gyakorlatias szemléleted kiegyensúlyozza egymást.",
        high: "Szívesen elmélyülsz a természet és a művészet szépségében, aktívan keresed az új ismereteket és tapasztalatokat, és örömmel kísérletezel eredeti megközelítésekkel. A szokatlan, akár radikális ötletekre is nyitott vagy.",
      },
      insightsByLocale: {
        en: {
          low: "You tend to be unimpressed by works of art or natural wonders, feel little pull toward intellectual exploration, tend to avoid creative pursuits, and feel little attraction toward ideas that are radical or unconventional.",
          mid: "You are open to some new ideas and creative experiences while also being drawn to practical, established approaches. Curiosity and pragmatism are in balance.",
          high: "You become absorbed in the beauty of art and nature, actively seek knowledge and new experiences, enjoy experimenting with original approaches, and are receptive to ideas that may seem strange or radical to others.",
        },
        hu: {
          low: "A műalkotások és a természeti élmények kevésbé ragadnak magukkal, az elméleti felfedezésnél pedig jobban vonzanak a kézzelfogható kérdések. Inkább a bevált megoldásokra építesz, mint a szokatlan vagy radikális ötletekre.",
          mid: "Nyitott vagy néhány új ötletre és kreatív élményre, miközben a gyakorlatias, bevált megközelítések is vonzanak. Kíváncsiságod és gyakorlatias szemléleted kiegyensúlyozza egymást.",
          high: "Szívesen elmélyülsz a természet és a művészet szépségében, aktívan keresed az új ismereteket és tapasztalatokat, és örömmel kísérletezel eredeti megközelítésekkel. A szokatlan, akár radikális ötletekre is nyitott vagy.",
        },
      },
      facets: [
        { code: "aesthetic_appreciation", label: "Aesthetic Appreciation", labelByLocale: { en: "Aesthetic Appreciation", hu: "Esztétikai fogékonyság" } },
        { code: "inquisitiveness", label: "Inquisitiveness", labelByLocale: { en: "Inquisitiveness", hu: "Kíváncsiság" } },
        { code: "creativity", label: "Creativity", labelByLocale: { en: "Creativity", hu: "Kreativitás" } },
        { code: "unconventionality", label: "Unconventionality", labelByLocale: { en: "Unconventionality", hu: "Konvenciómentesség" } },
      ],
    },
    {
      code: "I",
      label: "Altruism",
      labelByLocale: {
        en: "Altruism",
        hu: "Altruizmus",
      },
      color: DIMENSION_COLORS.A.strong,
      description: "Az altruizmus kiegészítő skálája azt méri, mennyire érez valaki együttérzést a nehéz helyzetben lévők iránt, és mennyire motivált a segítségnyújtásra. Alacsonyabb pontszámnál kevésbé jellemző az azonnali érzelmi bevonódás, magasabb pontszámnál pedig erősebb lehet a késztetés a rászorulók aktív támogatására.",
      descriptionByLocale: {
        en: "The Altruism (Interstitial) scale measures the extent to which a person feels genuine sympathy for the less fortunate and is motivated to give generously to those in need. Low scorers are relatively unmoved by others' hardship, while high scorers feel a strong inner drive to help and support those who are weak or in difficulty.",
        hu: "Az altruizmus kiegészítő skálája azt méri, mennyire érez valaki együttérzést a nehéz helyzetben lévők iránt, és mennyire motivált a segítségnyújtásra. Alacsonyabb pontszámnál kevésbé jellemző az azonnali érzelmi bevonódás, magasabb pontszámnál pedig erősebb lehet a késztetés a rászorulók aktív támogatására.",
      },
      insights: {
        low: "Kevésbé jellemző rád az azonnali érzelmi bevonódás. Inkább megfontoltan döntesz arról, mikor és hogyan segíts, és tárgyilagosan közelítesz mások nehézségeihez.",
        mid: "Helyzetfüggően hajlandó vagy segíteni másokon. Nem a pillanatnyi érzelem, hanem a helyzet mérlegelése vezérel.",
        high: "Mélyen érint mások helyzete, és természetes késztetést érzel a segítésre. Az empátia és a cselekvés nálad összekapcsolódik.",
      },
      insightsByLocale: {
        en: {
          low: "You tend to approach others' difficulties rationally rather than with immediate emotional involvement — you decide thoughtfully when and how to help.",
          mid: "You are willing to help others depending on the situation. You are guided by assessment of the circumstances rather than momentary emotion.",
          high: "You are deeply moved by others' situations and feel a natural drive to help. Empathy and action are naturally connected for you.",
        },
        hu: {
          low: "Kevésbé jellemző rád az azonnali érzelmi bevonódás. Inkább megfontoltan döntesz arról, mikor és hogyan segíts, és tárgyilagosan közelítesz mások nehézségeihez.",
          mid: "Helyzetfüggően hajlandó vagy segíteni másokon. Nem a pillanatnyi érzelem, hanem a helyzet mérlegelése vezérel.",
          high: "Mélyen érint mások helyzete, és természetes késztetést érzel a segítésre. Az empátia és a cselekvés nálad összekapcsolódik.",
        },
      },
      facets: [
        { code: "altruism", label: "Altruism", labelByLocale: { en: "Altruism", hu: "Altruizmus" } },
      ],
    },
  ],
  questions: [
    {
      id: 1,
      dimension: "O",
      facet: "aesthetic_appreciation",
      short: true,
      text: "I do not like art.",
      textByLocale: {
        hu: "Nem érdekel a művészet.",
        en: "I do not like art.",
      },
      textObserver: "They do not like art.",
      textObserverByLocale: {
        en: "They do not like art.",
        hu: "Nem érdekli a művészet.",
      },
      reversed: true,
    },
    {
      id: 2,
      dimension: "C",
      facet: "organization",
      short: true,
      text: "I keep things tidy.",
      textByLocale: {
        hu: "Rendben tartom a dolgaimat.",
        en: "I keep things tidy.",
      },
      textObserver: "They keep things tidy.",
      textObserverByLocale: {
        en: "They keep things tidy.",
        hu: "Rendben tartja a dolgait.",
      },
    },
    {
      id: 3,
      dimension: "A",
      facet: "forgiveness",
      text: "I try to forgive and forget.",
      textByLocale: {
        hu: "Igyekszem megbocsátani és továbblépni.",
        en: "I try to forgive and forget.",
      },
      textObserver: "They try to forgive and forget.",
      textObserverByLocale: {
        en: "They try to forgive and forget.",
        hu: "Igyekszik megbocsátani és továbblépni.",
      },
    },
    {
      id: 4,
      dimension: "X",
      facet: "social_self_esteem",
      short: true,
      text: "I feel comfortable with myself.",
      textByLocale: {
        hu: "Jól érzem magam a bőrömben.",
        en: "I feel comfortable with myself.",
      },
      textObserver: "They feel comfortable with themselves.",
      textObserverByLocale: {
        en: "They feel comfortable with themselves.",
        hu: "Jól érzi magát a bőrében.",
      },
    },
    {
      id: 5,
      dimension: "E",
      facet: "fearfulness",
      short: true,
      text: "I begin to panic when there is danger.",
      textByLocale: {
        hu: "Veszélyhelyzetben könnyen pánikba esem.",
        en: "I begin to panic when there is danger.",
      },
      textObserver: "They begin to panic when there is danger.",
      textObserverByLocale: {
        en: "They begin to panic when there is danger.",
        hu: "Veszélyhelyzetben könnyen pánikba esik.",
      },
    },
    {
      id: 6,
      dimension: "H",
      facet: "sincerity",
      short: true,
      text: "I use flattery to get ahead.",
      textByLocale: {
        hu: "Hízelgéssel szoktam elérni, amit akarok.",
        en: "I use flattery to get ahead.",
      },
      textObserver: "They use flattery to get ahead.",
      textObserverByLocale: {
        en: "They use flattery to get ahead.",
        hu: "Hízelgéssel szokta elérni, amit akar.",
      },
      reversed: true,
    },
    {
      id: 7,
      dimension: "O",
      facet: "inquisitiveness",
      text: "I find political discussions interesting.",
      textByLocale: {
        hu: "Érdekesnek találom a politikai témájú beszélgetéseket.",
        en: "I find political discussions interesting.",
      },
      textObserver: "They find political discussions interesting.",
      textObserverByLocale: {
        en: "They find political discussions interesting.",
        hu: "Érdekesnek találja a politikai témájú beszélgetéseket.",
      },
    },
    {
      id: 8,
      dimension: "C",
      facet: "diligence",
      text: "I push myself very hard to succeed.",
      textByLocale: {
        hu: "Keményen hajtom magam, hogy sikeres legyek.",
        en: "I push myself very hard to succeed.",
      },
      textObserver: "They push themselves very hard to succeed.",
      textObserverByLocale: {
        en: "They push themselves very hard to succeed.",
        hu: "Keményen hajtja magát, hogy sikeres legyen.",
      },
    },
    {
      id: 9,
      dimension: "A",
      facet: "gentleness",
      short: true,
      text: "I am quick to judge others.",
      textByLocale: {
        hu: "Hamar ítélkezem mások felett.",
        en: "I am quick to judge others.",
      },
      textObserver: "They are quick to judge others.",
      textObserverByLocale: {
        en: "They are quick to judge others.",
        hu: "Hamar ítélkezik mások felett.",
      },
      reversed: true,
    },
    {
      id: 10,
      dimension: "X",
      facet: "social_boldness",
      short: true,
      text: "I keep in the background.",
      textByLocale: {
        hu: "Inkább a háttérben maradok.",
        en: "I keep in the background.",
      },
      textObserver: "They keep in the background.",
      textObserverByLocale: {
        en: "They keep in the background.",
        hu: "Inkább a háttérben marad.",
      },
      reversed: true,
    },
    {
      id: 11,
      dimension: "E",
      facet: "anxiety",
      short: true,
      text: "I often worry about things that turn out to be unimportant.",
      textByLocale: {
        hu: "Gyakran aggódom olyan dolgok miatt, amelyekről később kiderül, hogy nem is fontosak.",
        en: "I often worry about things that turn out to be unimportant.",
      },
      textObserver: "They often worry about things that turn out to be unimportant.",
      textObserverByLocale: {
        en: "They often worry about things that turn out to be unimportant.",
        hu: "Gyakran aggódik olyan dolgok miatt, amelyekről később kiderül, hogy nem is fontosak.",
      },
    },
    {
      id: 12,
      dimension: "H",
      facet: "fairness",
      text: "I would admire a really clever scam.",
      textByLocale: {
        hu: "Titkon csodálnék egy igazán ügyes átverést.",
        en: "I would admire a really clever scam.",
      },
      textObserver: "They would admire a really clever scam.",
      textObserverByLocale: {
        en: "They would admire a really clever scam.",
        hu: "Titkon csodálna egy igazán ügyes átverést.",
      },
      reversed: true,
    },
    {
      id: 13,
      dimension: "O",
      facet: "creativity",
      short: true,
      text: "I do not have a good imagination.",
      textByLocale: {
        hu: "Nincs túl jó fantáziám.",
        en: "I do not have a good imagination.",
      },
      textObserver: "They do not have a good imagination.",
      textObserverByLocale: {
        en: "They do not have a good imagination.",
        hu: "Nincs túl jó fantáziája.",
      },
      reversed: true,
    },
    {
      id: 14,
      dimension: "C",
      facet: "perfectionism",
      short: true,
      text: "I pay attention to details.",
      textByLocale: {
        hu: "Odafigyelek a részletekre.",
        en: "I pay attention to details.",
      },
      textObserver: "They pay attention to details.",
      textObserverByLocale: {
        en: "They pay attention to details.",
        hu: "Odafigyel a részletekre.",
      },
    },
    {
      id: 15,
      dimension: "A",
      facet: "flexibility",
      short: true,
      text: "I am hard to convince.",
      textByLocale: {
        hu: "Nehéz engem meggyőzni.",
        en: "I am hard to convince.",
      },
      textObserver: "They are hard to convince.",
      textObserverByLocale: {
        en: "They are hard to convince.",
        hu: "Nehéz őt meggyőzni.",
      },
      reversed: true,
    },
    {
      id: 16,
      dimension: "X",
      facet: "sociability",
      short: true,
      text: "I would not enjoy a job that involves a lot of social interaction.",
      textByLocale: {
        hu: "Nem élvezném az olyan munkát, amely sok társas érintkezéssel jár.",
        en: "I would not enjoy a job that involves a lot of social interaction.",
      },
      textObserver: "They would not enjoy a job that involves a lot of social interaction.",
      textObserverByLocale: {
        en: "They would not enjoy a job that involves a lot of social interaction.",
        hu: "Nem élvezné az olyan munkát, amely sok társas érintkezéssel jár.",
      },
      reversed: true,
    },
    {
      id: 17,
      dimension: "E",
      facet: "dependence",
      short: true,
      text: "I need reassurance.",
      textByLocale: {
        hu: "Szükségem van mások megerősítésére.",
        en: "I need reassurance.",
      },
      textObserver: "They need reassurance.",
      textObserverByLocale: {
        en: "They need reassurance.",
        hu: "Szüksége van mások megerősítésére.",
      },
    },
    {
      id: 18,
      dimension: "H",
      facet: "greed_avoidance",
      short: true,
      text: "I would not enjoy being a famous celebrity.",
      textByLocale: {
        hu: "Nem élvezném, ha híres ember lennék.",
        en: "I would not enjoy being a famous celebrity.",
      },
      textObserver: "They would not enjoy being a famous celebrity.",
      textObserverByLocale: {
        en: "They would not enjoy being a famous celebrity.",
        hu: "Nem élvezné, ha híres ember lenne.",
      },
    },
    {
      id: 19,
      dimension: "O",
      facet: "unconventionality",
      text: "I like to be viewed as proper and conventional.",
      textByLocale: {
        hu: "Szeretem, ha rendes, hagyománykövető embernek látnak.",
        en: "I like to be viewed as proper and conventional.",
      },
      textObserver: "They like to be viewed as proper and conventional.",
      textObserverByLocale: {
        en: "They like to be viewed as proper and conventional.",
        hu: "Szereti, ha rendes, hagyománykövető embernek látják.",
      },
      reversed: true,
    },
    {
      id: 20,
      dimension: "C",
      facet: "prudence",
      text: "I make rash decisions.",
      textByLocale: {
        hu: "Elhamarkodott döntéseket hozok.",
        en: "I make rash decisions.",
      },
      textObserver: "They make rash decisions.",
      textObserverByLocale: {
        en: "They make rash decisions.",
        hu: "Elhamarkodott döntéseket hoz.",
      },
      reversed: true,
    },
    {
      id: 21,
      dimension: "A",
      facet: "patience",
      short: true,
      text: "I get angry easily.",
      textByLocale: {
        hu: "Könnyen méregbe gurulok.",
        en: "I get angry easily.",
      },
      textObserver: "They get angry easily.",
      textObserverByLocale: {
        en: "They get angry easily.",
        hu: "Könnyen méregbe gurul.",
      },
      reversed: true,
    },
    {
      id: 22,
      dimension: "X",
      facet: "liveliness",
      short: true,
      text: "I am usually active and full of energy.",
      textByLocale: {
        hu: "Általában aktív és energikus vagyok.",
        en: "I am usually active and full of energy.",
      },
      textObserver: "They are usually active and full of energy.",
      textObserverByLocale: {
        en: "They are usually active and full of energy.",
        hu: "Általában aktív és energikus.",
      },
    },
    {
      id: 23,
      dimension: "E",
      facet: "sentimentality",
      short: true,
      text: "I feel others' emotions.",
      textByLocale: {
        hu: "Átérzem mások érzelmeit.",
        en: "I feel others' emotions.",
      },
      textObserver: "They feel others' emotions.",
      textObserverByLocale: {
        en: "They feel others' emotions.",
        hu: "Átérzi mások érzelmeit.",
      },
    },
    {
      id: 24,
      dimension: "H",
      facet: "modesty",
      short: true,
      text: "I don't think that I'm better than other people.",
      textByLocale: {
        hu: "Nem gondolom magam jobbnak másoknál.",
        en: "I don't think that I'm better than other people.",
      },
      textObserver: "They don't think that they are better than other people.",
      textObserverByLocale: {
        en: "They don't think that they are better than other people.",
        hu: "Nem gondolja magát jobbnak másoknál.",
      },
    },
    {
      id: 25,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "I do not like poetry.",
      textByLocale: {
        hu: "Nem szeretem a verseket.",
        en: "I do not like poetry.",
      },
      textObserver: "They do not like poetry.",
      textObserverByLocale: {
        en: "They do not like poetry.",
        hu: "Nem szereti a verseket.",
      },
      reversed: true,
    },
    {
      id: 26,
      dimension: "C",
      facet: "organization",
      short: true,
      text: "I like order.",
      textByLocale: {
        hu: "Szeretem a rendet.",
        en: "I like order.",
      },
      textObserver: "They like order.",
      textObserverByLocale: {
        en: "They like order.",
        hu: "Szereti a rendet.",
      },
    },
    {
      id: 27,
      dimension: "A",
      facet: "forgiveness",
      short: true,
      text: "I am inclined to forgive others.",
      textByLocale: {
        hu: "Hajlamos vagyok megbocsátani másoknak.",
        en: "I am inclined to forgive others.",
      },
      textObserver: "They are inclined to forgive others.",
      textObserverByLocale: {
        en: "They are inclined to forgive others.",
        hu: "Hajlamos megbocsátani másoknak.",
      },
    },
    {
      id: 28,
      dimension: "X",
      facet: "social_self_esteem",
      text: "I am very pleased with myself.",
      textByLocale: {
        hu: "Alapvetően elégedett vagyok önmagammal.",
        en: "I am very pleased with myself.",
      },
      textObserver: "They are very pleased with themselves.",
      textObserverByLocale: {
        en: "They are very pleased with themselves.",
        hu: "Alapvetően elégedett önmagával.",
      },
    },
    {
      id: 29,
      dimension: "E",
      facet: "fearfulness",
      short: true,
      text: "I face danger confidently.",
      textByLocale: {
        hu: "Magabiztosan nézek szembe a veszéllyel.",
        en: "I face danger confidently.",
      },
      textObserver: "They face danger confidently.",
      textObserverByLocale: {
        en: "They face danger confidently.",
        hu: "Magabiztosan néz szembe a veszéllyel.",
      },
      reversed: true,
    },
    {
      id: 30,
      dimension: "H",
      facet: "sincerity",
      short: true,
      text: "I don't pretend to be more than I am.",
      textByLocale: {
        hu: "Nem tettetem magam többnek, mint ami vagyok.",
        en: "I don't pretend to be more than I am.",
      },
      textObserver: "They don't pretend to be more than they are.",
      textObserverByLocale: {
        en: "They don't pretend to be more than they are.",
        hu: "Nem tetteti magát többnek, mint ami.",
      },
    },
    {
      id: 31,
      dimension: "O",
      facet: "inquisitiveness",
      short: true,
      text: "I would love to explore strange places.",
      textByLocale: {
        hu: "Imádnék ismeretlen helyeket felfedezni.",
        en: "I would love to explore strange places.",
      },
      textObserver: "They would love to explore strange places.",
      textObserverByLocale: {
        en: "They would love to explore strange places.",
        hu: "Imádna ismeretlen helyeket felfedezni.",
      },
    },
    {
      id: 32,
      dimension: "C",
      facet: "diligence",
      short: true,
      text: "I work hard.",
      textByLocale: {
        hu: "Keményen dolgozom.",
        en: "I work hard.",
      },
      textObserver: "They work hard.",
      textObserverByLocale: {
        en: "They work hard.",
        hu: "Keményen dolgozik.",
      },
    },
    {
      id: 33,
      dimension: "A",
      facet: "gentleness",
      short: true,
      text: "I accept people as they are.",
      textByLocale: {
        hu: "Elfogadom az embereket olyannak, amilyenek.",
        en: "I accept people as they are.",
      },
      textObserver: "They accept people as they are.",
      textObserverByLocale: {
        en: "They accept people as they are.",
        hu: "Elfogadja az embereket olyannak, amilyenek.",
      },
    },
    {
      id: 34,
      dimension: "X",
      facet: "social_boldness",
      text: "I am good at making impromptu speeches.",
      textByLocale: {
        hu: "Jó vagyok a rögtönzött felszólalásokban.",
        en: "I am good at making impromptu speeches.",
      },
      textObserver: "They are good at making impromptu speeches.",
      textObserverByLocale: {
        en: "They are good at making impromptu speeches.",
        hu: "Jó a rögtönzött felszólalásokban.",
      },
    },
    {
      id: 35,
      dimension: "E",
      facet: "anxiety",
      short: true,
      text: "I rarely worry.",
      textByLocale: {
        hu: "Ritkán aggódom.",
        en: "I rarely worry.",
      },
      textObserver: "They rarely worry.",
      textObserverByLocale: {
        en: "They rarely worry.",
        hu: "Ritkán aggódik.",
      },
      reversed: true,
    },
    {
      id: 36,
      dimension: "H",
      facet: "fairness",
      short: true,
      text: "I would cheat to get ahead.",
      textByLocale: {
        hu: "Az érvényesülésért csalni is képes lennék.",
        en: "I would cheat to get ahead.",
      },
      textObserver: "They would cheat to get ahead.",
      textObserverByLocale: {
        en: "They would cheat to get ahead.",
        hu: "Az érvényesülésért csalni is képes lenne.",
      },
      reversed: true,
    },
    {
      id: 37,
      dimension: "O",
      facet: "creativity",
      short: true,
      text: "I love to think up new ways of doing things.",
      textByLocale: {
        hu: "Imádok új megoldásokat kitalálni.",
        en: "I love to think up new ways of doing things.",
      },
      textObserver: "They love to think up new ways of doing things.",
      textObserverByLocale: {
        en: "They love to think up new ways of doing things.",
        hu: "Imád új megoldásokat kitalálni.",
      },
    },
    {
      id: 38,
      dimension: "C",
      facet: "perfectionism",
      short: true,
      text: "I pay too little attention to details.",
      textByLocale: {
        hu: "Túl kevés figyelmet fordítok a részletekre.",
        en: "I pay too little attention to details.",
      },
      textObserver: "They pay too little attention to details.",
      textObserverByLocale: {
        en: "They pay too little attention to details.",
        hu: "Túl kevés figyelmet fordít a részletekre.",
      },
      reversed: true,
    },
    {
      id: 39,
      dimension: "A",
      facet: "flexibility",
      short: true,
      text: "I am good at taking advice.",
      textByLocale: {
        hu: "Jól fogadom a tanácsokat.",
        en: "I am good at taking advice.",
      },
      textObserver: "They are good at taking advice.",
      textObserverByLocale: {
        en: "They are good at taking advice.",
        hu: "Jól fogadja a tanácsokat.",
      },
    },
    {
      id: 40,
      dimension: "X",
      facet: "sociability",
      text: "I love to chat.",
      textByLocale: {
        hu: "Imádok beszélgetni.",
        en: "I love to chat.",
      },
      textObserver: "They love to chat.",
      textObserverByLocale: {
        en: "They love to chat.",
        hu: "Imád beszélgetni.",
      },
    },
    {
      id: 41,
      dimension: "E",
      facet: "dependence",
      short: true,
      text: "I seek support when I need it.",
      textByLocale: {
        hu: "Támogatást keresek, ha szükségem van rá.",
        en: "I seek support when I need it.",
      },
      textObserver: "They seek support when they need it.",
      textObserverByLocale: {
        en: "They seek support when they need it.",
        hu: "Támogatást keres, ha szüksége van rá.",
      },
    },
    {
      id: 42,
      dimension: "H",
      facet: "greed_avoidance",
      short: true,
      text: "I love luxury.",
      textByLocale: {
        hu: "Imádom a luxust.",
        en: "I love luxury.",
      },
      textObserver: "They love luxury.",
      textObserverByLocale: {
        en: "They love luxury.",
        hu: "Imádja a luxust.",
      },
      reversed: true,
    },
    {
      id: 43,
      dimension: "O",
      facet: "unconventionality",
      text: "I know that my ideas sometimes surprise people.",
      textByLocale: {
        hu: "Tudom, hogy az ötleteim néha meglepik az embereket.",
        en: "I know that my ideas sometimes surprise people.",
      },
      textObserver: "They know that their ideas sometimes surprise people.",
      textObserverByLocale: {
        en: "They know that their ideas sometimes surprise people.",
        hu: "Tudja, hogy az ötletei néha meglepik az embereket.",
      },
    },
    {
      id: 44,
      dimension: "C",
      facet: "prudence",
      text: "I do things without thinking of the consequences.",
      textByLocale: {
        hu: "Anélkül cselekszem, hogy a következményekre gondolnék.",
        en: "I do things without thinking of the consequences.",
      },
      textObserver: "They do things without thinking of the consequences.",
      textObserverByLocale: {
        en: "They do things without thinking of the consequences.",
        hu: "Anélkül cselekszik, hogy a következményekre gondolna.",
      },
      reversed: true,
    },
    {
      id: 45,
      dimension: "A",
      facet: "patience",
      text: "I find that it takes a lot to make me feel angry at someone.",
      textByLocale: {
        hu: "Nálam sok kell ahhoz, hogy megharagudjak valakire.",
        en: "I find that it takes a lot to make me feel angry at someone.",
      },
      textObserver: "They find that it takes a lot to make them feel angry at someone.",
      textObserverByLocale: {
        en: "They find that it takes a lot to make them feel angry at someone.",
        hu: "Nála sok kell ahhoz, hogy megharagudjon valakire.",
      },
    },
    {
      id: 46,
      dimension: "X",
      facet: "liveliness",
      text: "I maintain high energy throughout the day.",
      textByLocale: {
        hu: "A nap végéig energikus maradok.",
        en: "I maintain high energy throughout the day.",
      },
      textObserver: "They maintain high energy throughout the day.",
      textObserverByLocale: {
        en: "They maintain high energy throughout the day.",
        hu: "A nap végéig energikus marad.",
      },
    },
    {
      id: 47,
      dimension: "E",
      facet: "sentimentality",
      text: "I am deeply moved by others' misfortunes.",
      textByLocale: {
        hu: "Mélyen megérint mások balszerencséje.",
        en: "I am deeply moved by others' misfortunes.",
      },
      textObserver: "They are deeply moved by others' misfortunes.",
      textObserverByLocale: {
        en: "They are deeply moved by others' misfortunes.",
        hu: "Mélyen megérinti mások balszerencséje.",
      },
    },
    {
      id: 48,
      dimension: "H",
      facet: "modesty",
      text: "I see myself as an average person.",
      textByLocale: {
        hu: "Átlagos embernek tartom magam.",
        en: "I see myself as an average person.",
      },
      textObserver: "They see themselves as an average person.",
      textObserverByLocale: {
        en: "They see themselves as an average person.",
        hu: "Átlagos embernek tartja magát.",
      },
    },
    {
      id: 49,
      dimension: "O",
      facet: "aesthetic_appreciation",
      short: true,
      text: "I believe in the importance of art.",
      textByLocale: {
        hu: "Hiszek a művészet fontosságában.",
        en: "I believe in the importance of art.",
      },
      textObserver: "They believe in the importance of art.",
      textObserverByLocale: {
        en: "They believe in the importance of art.",
        hu: "Hisz a művészet fontosságában.",
      },
    },
    {
      id: 50,
      dimension: "C",
      facet: "organization",
      text: "I leave a mess around me.",
      textByLocale: {
        hu: "Rendetlenséget hagyok magam körül.",
        en: "I leave a mess around me.",
      },
      textObserver: "They leave a mess around them.",
      textObserverByLocale: {
        en: "They leave a mess around them.",
        hu: "Rendetlenséget hagy maga körül.",
      },
      reversed: true,
    },
    {
      id: 51,
      dimension: "A",
      facet: "forgiveness",
      short: true,
      text: "I hold a grudge.",
      textByLocale: {
        hu: "Haragtartó vagyok.",
        en: "I hold a grudge.",
      },
      textObserver: "They hold a grudge.",
      textObserverByLocale: {
        en: "They hold a grudge.",
        hu: "Haragtartó.",
      },
      reversed: true,
    },
    {
      id: 52,
      dimension: "X",
      facet: "social_self_esteem",
      text: "I dislike myself.",
      textByLocale: {
        hu: "Nem kedvelem önmagam.",
        en: "I dislike myself.",
      },
      textObserver: "They dislike themselves.",
      textObserverByLocale: {
        en: "They dislike themselves.",
        hu: "Nem kedveli önmagát.",
      },
      reversed: true,
    },
    {
      id: 53,
      dimension: "E",
      facet: "fearfulness",
      text: "I would fear walking in a high-crime part of a city.",
      textByLocale: {
        hu: "Félnék végigmenni egy város rossz hírű negyedén.",
        en: "I would fear walking in a high-crime part of a city.",
      },
      textObserver: "They would fear walking in a high-crime part of a city.",
      textObserverByLocale: {
        en: "They would fear walking in a high-crime part of a city.",
        hu: "Félne végigmenni egy város rossz hírű negyedén.",
      },
    },
    {
      id: 54,
      dimension: "H",
      facet: "sincerity",
      short: true,
      text: "I put on a show to impress people.",
      textByLocale: {
        hu: "Megjátszom magam, hogy lenyűgözzek másokat.",
        en: "I put on a show to impress people.",
      },
      textObserver: "They put on a show to impress people.",
      textObserverByLocale: {
        en: "They put on a show to impress people.",
        hu: "Megjátssza magát, hogy lenyűgözzön másokat.",
      },
      reversed: true,
    },
    {
      id: 55,
      dimension: "O",
      facet: "inquisitiveness",
      short: true,
      text: "I avoid difficult reading material.",
      textByLocale: {
        hu: "Kerülöm a nehéz olvasmányokat.",
        en: "I avoid difficult reading material.",
      },
      textObserver: "They avoid difficult reading material.",
      textObserverByLocale: {
        en: "They avoid difficult reading material.",
        hu: "Kerüli a nehéz olvasmányokat.",
      },
      reversed: true,
    },
    {
      id: 56,
      dimension: "C",
      facet: "diligence",
      short: true,
      text: "I do just enough work to get by.",
      textByLocale: {
        hu: "Csak annyit dolgozom, amennyi feltétlenül szükséges.",
        en: "I do just enough work to get by.",
      },
      textObserver: "They do just enough work to get by.",
      textObserverByLocale: {
        en: "They do just enough work to get by.",
        hu: "Csak annyit dolgozik, amennyi feltétlenül szükséges.",
      },
      reversed: true,
    },
    {
      id: 57,
      dimension: "A",
      facet: "gentleness",
      text: "I have a good word for everyone.",
      textByLocale: {
        hu: "Mindenkiről van egy jó szavam.",
        en: "I have a good word for everyone.",
      },
      textObserver: "They have a good word for everyone.",
      textObserverByLocale: {
        en: "They have a good word for everyone.",
        hu: "Mindenkiről van egy jó szava.",
      },
    },
    {
      id: 58,
      dimension: "X",
      facet: "social_boldness",
      short: true,
      text: "I don't mind being the center of attention.",
      textByLocale: {
        hu: "Nem zavar, ha rám irányul a figyelem.",
        en: "I don't mind being the center of attention.",
      },
      textObserver: "They don't mind being the center of attention.",
      textObserverByLocale: {
        en: "They don't mind being the center of attention.",
        hu: "Nem zavarja, ha rá irányul a figyelem.",
      },
    },
    {
      id: 59,
      dimension: "E",
      facet: "anxiety",
      text: "I remain calm under pressure.",
      textByLocale: {
        hu: "Nyomás alatt is nyugodt maradok.",
        en: "I remain calm under pressure.",
      },
      textObserver: "They remain calm under pressure.",
      textObserverByLocale: {
        en: "They remain calm under pressure.",
        hu: "Nyomás alatt is nyugodt marad.",
      },
      reversed: true,
    },
    {
      id: 60,
      dimension: "H",
      facet: "fairness",
      short: true,
      text: "I would never take things that aren't mine.",
      textByLocale: {
        hu: "Soha nem vennék el olyat, ami nem az enyém.",
        en: "I would never take things that aren't mine.",
      },
      textObserver: "They would never take things that aren't theirs.",
      textObserverByLocale: {
        en: "They would never take things that aren't theirs.",
        hu: "Soha nem venne el olyat, ami nem az övé.",
      },
    },
    {
      id: 61,
      dimension: "O",
      facet: "creativity",
      short: true,
      text: "I have a vivid imagination.",
      textByLocale: {
        hu: "Élénk a fantáziám.",
        en: "I have a vivid imagination.",
      },
      textObserver: "They have a vivid imagination.",
      textObserverByLocale: {
        en: "They have a vivid imagination.",
        hu: "Élénk a fantáziája.",
      },
    },
    {
      id: 62,
      dimension: "C",
      facet: "perfectionism",
      text: "I continue until everything is perfect.",
      textByLocale: {
        hu: "Addig dolgozom, amíg minden tökéletes nem lesz.",
        en: "I continue until everything is perfect.",
      },
      textObserver: "They continue until everything is perfect.",
      textObserverByLocale: {
        en: "They continue until everything is perfect.",
        hu: "Addig dolgozik, amíg minden tökéletes nem lesz.",
      },
    },
    {
      id: 63,
      dimension: "A",
      facet: "flexibility",
      short: true,
      text: "I can't stand being contradicted.",
      textByLocale: {
        hu: "Ki nem állhatom, ha ellentmondanak nekem.",
        en: "I can't stand being contradicted.",
      },
      textObserver: "They can't stand being contradicted.",
      textObserverByLocale: {
        en: "They can't stand being contradicted.",
        hu: "Ki nem állhatja, ha ellentmondanak neki.",
      },
      reversed: true,
    },
    {
      id: 64,
      dimension: "X",
      facet: "sociability",
      short: true,
      text: "I enjoy being part of a group.",
      textByLocale: {
        hu: "Élvezem, ha egy csapat része lehetek.",
        en: "I enjoy being part of a group.",
      },
      textObserver: "They enjoy being part of a group.",
      textObserverByLocale: {
        en: "They enjoy being part of a group.",
        hu: "Élvezi, ha egy csapat része lehet.",
      },
    },
    {
      id: 65,
      dimension: "E",
      facet: "dependence",
      text: "I often need help.",
      textByLocale: {
        hu: "Gyakran van szükségem segítségre.",
        en: "I often need help.",
      },
      textObserver: "They often need help.",
      textObserverByLocale: {
        en: "They often need help.",
        hu: "Gyakran van szüksége segítségre.",
      },
    },
    {
      id: 66,
      dimension: "H",
      facet: "greed_avoidance",
      text: "I seek status.",
      textByLocale: {
        hu: "Törekszem a magas státuszra.",
        en: "I seek status.",
      },
      textObserver: "They seek status.",
      textObserverByLocale: {
        en: "They seek status.",
        hu: "Törekszik a magas státuszra.",
      },
      reversed: true,
    },
    {
      id: 67,
      dimension: "O",
      facet: "unconventionality",
      short: true,
      text: "I am considered to be kind of eccentric.",
      textByLocale: {
        hu: "Kissé különcnek tartanak.",
        en: "I am considered to be kind of eccentric.",
      },
      textObserver: "They are considered to be kind of eccentric.",
      textObserverByLocale: {
        en: "They are considered to be kind of eccentric.",
        hu: "Kissé különcnek tartják.",
      },
    },
    {
      id: 68,
      dimension: "C",
      facet: "prudence",
      short: true,
      text: "I do things according to a plan.",
      textByLocale: {
        hu: "Terv szerint intézem a dolgaimat.",
        en: "I do things according to a plan.",
      },
      textObserver: "They do things according to a plan.",
      textObserverByLocale: {
        en: "They do things according to a plan.",
        hu: "Terv szerint intézi a dolgait.",
      },
    },
    {
      id: 69,
      dimension: "A",
      facet: "patience",
      short: true,
      text: "I am usually a patient person.",
      textByLocale: {
        hu: "Általában türelmes ember vagyok.",
        en: "I am usually a patient person.",
      },
      textObserver: "They are usually a patient person.",
      textObserverByLocale: {
        en: "They are usually a patient person.",
        hu: "Általában türelmes ember.",
      },
    },
    {
      id: 70,
      dimension: "X",
      facet: "liveliness",
      text: "I often feel blue.",
      textByLocale: {
        hu: "Gyakran vagyok nyomott hangulatban.",
        en: "I often feel blue.",
      },
      textObserver: "They often feel blue.",
      textObserverByLocale: {
        en: "They often feel blue.",
        hu: "Gyakran van nyomott hangulatban.",
      },
      reversed: true,
    },
    {
      id: 71,
      dimension: "E",
      facet: "sentimentality",
      text: "I immediately feel sad when hearing of an unhappy event.",
      textByLocale: {
        hu: "Azonnal elszomorodom, ha egy szomorú eseményről hallok.",
        en: "I immediately feel sad when hearing of an unhappy event.",
      },
      textObserver: "They immediately feel sad when hearing of an unhappy event.",
      textObserverByLocale: {
        en: "They immediately feel sad when hearing of an unhappy event.",
        hu: "Azonnal elszomorodik, ha egy szomorú eseményről hall.",
      },
    },
    {
      id: 72,
      dimension: "H",
      facet: "modesty",
      short: true,
      text: "I would like to have more power than other people.",
      textByLocale: {
        hu: "Szeretnék nagyobb hatalommal rendelkezni, mint mások.",
        en: "I would like to have more power than other people.",
      },
      textObserver: "They would like to have more power than other people.",
      textObserverByLocale: {
        en: "They would like to have more power than other people.",
        hu: "Szeretne nagyobb hatalommal rendelkezni, mint mások.",
      },
      reversed: true,
    },
    {
      id: 73,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "I see beauty in things that others might not notice.",
      textByLocale: {
        hu: "Meglátom a szépséget olyan dolgokban is, amelyeket mások észre sem vesznek.",
        en: "I see beauty in things that others might not notice.",
      },
      textObserver: "They see beauty in things that others might not notice.",
      textObserverByLocale: {
        en: "They see beauty in things that others might not notice.",
        hu: "Meglátja a szépséget olyan dolgokban is, amelyeket mások észre sem vesznek.",
      },
    },
    {
      id: 74,
      dimension: "C",
      facet: "organization",
      short: true,
      text: "I often forget to put things back in their proper place.",
      textByLocale: {
        hu: "Gyakran elfelejtem a helyükre visszatenni a dolgokat.",
        en: "I often forget to put things back in their proper place.",
      },
      textObserver: "They often forget to put things back in their proper place.",
      textObserverByLocale: {
        en: "They often forget to put things back in their proper place.",
        hu: "Gyakran elfelejti a helyükre visszatenni a dolgokat.",
      },
      reversed: true,
    },
    {
      id: 75,
      dimension: "A",
      facet: "forgiveness",
      text: "I find it hard to forgive others.",
      textByLocale: {
        hu: "Nehezemre esik megbocsátani másoknak.",
        en: "I find it hard to forgive others.",
      },
      textObserver: "They find it hard to forgive others.",
      textObserverByLocale: {
        en: "They find it hard to forgive others.",
        hu: "Nehezére esik megbocsátani másoknak.",
      },
      reversed: true,
    },
    {
      id: 76,
      dimension: "X",
      facet: "social_self_esteem",
      short: true,
      text: "I have a low opinion of myself.",
      textByLocale: {
        hu: "Rossz véleménnyel vagyok önmagamról.",
        en: "I have a low opinion of myself.",
      },
      textObserver: "They have a low opinion of themselves.",
      textObserverByLocale: {
        en: "They have a low opinion of themselves.",
        hu: "Rossz véleménnyel van önmagáról.",
      },
      reversed: true,
    },
    {
      id: 77,
      dimension: "E",
      facet: "fearfulness",
      short: true,
      text: "I like to do frightening things.",
      textByLocale: {
        hu: "Szeretek borzongató dolgokat csinálni.",
        en: "I like to do frightening things.",
      },
      textObserver: "They like to do frightening things.",
      textObserverByLocale: {
        en: "They like to do frightening things.",
        hu: "Szeret borzongató dolgokat csinálni.",
      },
      reversed: true,
    },
    {
      id: 78,
      dimension: "H",
      facet: "sincerity",
      text: "I tell people what they want to hear so that they will do what I want.",
      textByLocale: {
        hu: "Azt mondom az embereknek, amit hallani akarnak, hogy azt tegyék, amit szeretnék.",
        en: "I tell people what they want to hear so that they will do what I want.",
      },
      textObserver: "They tell people what they want to hear so that those people will do what they want.",
      textObserverByLocale: {
        en: "They tell people what they want to hear so that those people will do what they want.",
        hu: "Azt mondja az embereknek, amit hallani akarnak, hogy azt tegyék, amit szeretne.",
      },
      reversed: true,
    },
    {
      id: 79,
      dimension: "O",
      facet: "inquisitiveness",
      short: true,
      text: "I will not probe deeply into a subject.",
      textByLocale: {
        hu: "Nem szoktam mélyebbre ásni egy-egy témában.",
        en: "I will not probe deeply into a subject.",
      },
      textObserver: "They will not probe deeply into a subject.",
      textObserverByLocale: {
        en: "They will not probe deeply into a subject.",
        hu: "Nem szokott mélyebbre ásni egy-egy témában.",
      },
      reversed: true,
    },
    {
      id: 80,
      dimension: "C",
      facet: "diligence",
      short: true,
      text: "I quickly lose interest in the tasks I start.",
      textByLocale: {
        hu: "Hamar elveszítem az érdeklődésemet a megkezdett feladatok iránt.",
        en: "I quickly lose interest in the tasks I start.",
      },
      textObserver: "They quickly lose interest in the tasks they start.",
      textObserverByLocale: {
        en: "They quickly lose interest in the tasks they start.",
        hu: "Hamar elveszíti az érdeklődését a megkezdett feladatok iránt.",
      },
      reversed: true,
    },
    {
      id: 81,
      dimension: "A",
      facet: "gentleness",
      text: "I rarely complain.",
      textByLocale: {
        hu: "Ritkán panaszkodom.",
        en: "I rarely complain.",
      },
      textObserver: "They rarely complain.",
      textObserverByLocale: {
        en: "They rarely complain.",
        hu: "Ritkán panaszkodik.",
      },
    },
    {
      id: 82,
      dimension: "X",
      facet: "social_boldness",
      short: true,
      text: "I would be afraid to give a speech in public.",
      textByLocale: {
        hu: "Félnék nyilvánosan beszédet tartani.",
        en: "I would be afraid to give a speech in public.",
      },
      textObserver: "They would be afraid to give a speech in public.",
      textObserverByLocale: {
        en: "They would be afraid to give a speech in public.",
        hu: "Félne nyilvánosan beszédet tartani.",
      },
      reversed: true,
    },
    {
      id: 83,
      dimension: "E",
      facet: "anxiety",
      short: true,
      text: "I get stressed out easily.",
      textByLocale: {
        hu: "Könnyen stresszes leszek.",
        en: "I get stressed out easily.",
      },
      textObserver: "They get stressed out easily.",
      textObserverByLocale: {
        en: "They get stressed out easily.",
        hu: "Könnyen stresszes lesz.",
      },
    },
    {
      id: 84,
      dimension: "H",
      facet: "fairness",
      short: true,
      text: "I return extra change when a cashier makes a mistake.",
      textByLocale: {
        hu: "Visszaadom a különbözetet, ha a pénztáros tévedésből többet ad vissza.",
        en: "I return extra change when a cashier makes a mistake.",
      },
      textObserver: "They return extra change when a cashier makes a mistake.",
      textObserverByLocale: {
        en: "They return extra change when a cashier makes a mistake.",
        hu: "Visszaadja a különbözetet, ha a pénztáros tévedésből többet ad vissza.",
      },
    },
    {
      id: 85,
      dimension: "O",
      facet: "creativity",
      text: "I have difficulty imagining things.",
      textByLocale: {
        hu: "Nehezen tudok dolgokat elképzelni.",
        en: "I have difficulty imagining things.",
      },
      textObserver: "They have difficulty imagining things.",
      textObserverByLocale: {
        en: "They have difficulty imagining things.",
        hu: "Nehezen tud dolgokat elképzelni.",
      },
      reversed: true,
    },
    {
      id: 86,
      dimension: "C",
      facet: "perfectionism",
      text: "I demand quality.",
      textByLocale: {
        hu: "Megkövetelem a minőséget.",
        en: "I demand quality.",
      },
      textObserver: "They demand quality.",
      textObserverByLocale: {
        en: "They demand quality.",
        hu: "Megköveteli a minőséget.",
      },
    },
    {
      id: 87,
      dimension: "A",
      facet: "flexibility",
      text: "I am hard to reason with.",
      textByLocale: {
        hu: "Nehéz engem jobb belátásra bírni.",
        en: "I am hard to reason with.",
      },
      textObserver: "They are hard to reason with.",
      textObserverByLocale: {
        en: "They are hard to reason with.",
        hu: "Nehéz őt jobb belátásra bírni.",
      },
      reversed: true,
    },
    {
      id: 88,
      dimension: "X",
      facet: "sociability",
      short: true,
      text: "I make friends easily.",
      textByLocale: {
        hu: "Könnyen barátkozom.",
        en: "I make friends easily.",
      },
      textObserver: "They make friends easily.",
      textObserverByLocale: {
        en: "They make friends easily.",
        hu: "Könnyen barátkozik.",
      },
    },
    {
      id: 89,
      dimension: "E",
      facet: "dependence",
      text: "I can't do without the company of others.",
      textByLocale: {
        hu: "Nem tudok meglenni mások társasága nélkül.",
        en: "I can't do without the company of others.",
      },
      textObserver: "They can't do without the company of others.",
      textObserverByLocale: {
        en: "They can't do without the company of others.",
        hu: "Nem tud meglenni mások társasága nélkül.",
      },
    },
    {
      id: 90,
      dimension: "H",
      facet: "greed_avoidance",
      text: "I am mainly interested in money.",
      textByLocale: {
        hu: "Elsősorban a pénz érdekel.",
        en: "I am mainly interested in money.",
      },
      textObserver: "They are mainly interested in money.",
      textObserverByLocale: {
        en: "They are mainly interested in money.",
        hu: "Elsősorban a pénz érdekli.",
      },
      reversed: true,
    },
    {
      id: 91,
      dimension: "O",
      facet: "unconventionality",
      short: true,
      text: "I would hate to be considered odd or strange.",
      textByLocale: {
        hu: "Nagyon zavarna, ha furcsának tartanának.",
        en: "I would hate to be considered odd or strange.",
      },
      textObserver: "They would hate to be considered odd or strange.",
      textObserverByLocale: {
        en: "They would hate to be considered odd or strange.",
        hu: "Nagyon zavarná, ha furcsának tartanák.",
      },
      reversed: true,
    },
    {
      id: 92,
      dimension: "C",
      facet: "prudence",
      short: true,
      text: "I jump into things without thinking.",
      textByLocale: {
        hu: "Gondolkodás nélkül vágok bele a dolgokba.",
        en: "I jump into things without thinking.",
      },
      textObserver: "They jump into things without thinking.",
      textObserverByLocale: {
        en: "They jump into things without thinking.",
        hu: "Gondolkodás nélkül vág bele a dolgokba.",
      },
      reversed: true,
    },
    {
      id: 93,
      dimension: "A",
      facet: "patience",
      short: true,
      text: "I lose my temper.",
      textByLocale: {
        hu: "Könnyen elveszítem az önuralmamat.",
        en: "I lose my temper.",
      },
      textObserver: "They lose their temper.",
      textObserverByLocale: {
        en: "They lose their temper.",
        hu: "Könnyen elveszíti az önuralmát.",
      },
      reversed: true,
    },
    {
      id: 94,
      dimension: "X",
      facet: "liveliness",
      short: true,
      text: "I tire out quickly.",
      textByLocale: {
        hu: "Hamar elfáradok.",
        en: "I tire out quickly.",
      },
      textObserver: "They tire out quickly.",
      textObserverByLocale: {
        en: "They tire out quickly.",
        hu: "Hamar elfárad.",
      },
      reversed: true,
    },
    {
      id: 95,
      dimension: "E",
      facet: "sentimentality",
      short: true,
      text: "I seldom get emotional.",
      textByLocale: {
        hu: "Ritkán hatódom meg.",
        en: "I seldom get emotional.",
      },
      textObserver: "They seldom get emotional.",
      textObserverByLocale: {
        en: "They seldom get emotional.",
        hu: "Ritkán hatódik meg.",
      },
      reversed: true,
    },
    {
      id: 96,
      dimension: "H",
      facet: "modesty",
      text: "I am likely to show off if I get the chance.",
      textByLocale: {
        hu: "Ha alkalmam nyílik rá, szívesen felvágok.",
        en: "I am likely to show off if I get the chance.",
      },
      textObserver: "They are likely to show off if they get the chance.",
      textObserverByLocale: {
        en: "They are likely to show off if they get the chance.",
        hu: "Ha alkalma nyílik rá, szívesen felvág.",
      },
      reversed: true,
    },
    {
      id: 97,
      dimension: "I",
      facet: "altruism",
      text: "I am concerned about others.",
      textByLocale: {
        hu: "Törődöm másokkal.",
        en: "I am concerned about others.",
      },
      textObserver: "They are concerned about others.",
      textObserverByLocale: {
        en: "They are concerned about others.",
        hu: "Törődik másokkal.",
      },
    },
    {
      id: 98,
      dimension: "I",
      facet: "altruism",
      text: "I love to help others.",
      textByLocale: {
        hu: "Szeretek segíteni másoknak.",
        en: "I love to help others.",
      },
      textObserver: "They love to help others.",
      textObserverByLocale: {
        en: "They love to help others.",
        hu: "Szeret segíteni másoknak.",
      },
    },
    {
      id: 99,
      dimension: "I",
      facet: "altruism",
      text: "I am indifferent to the feelings of others.",
      textByLocale: {
        hu: "Hidegen hagynak mások érzései.",
        en: "I am indifferent to the feelings of others.",
      },
      textObserver: "They are indifferent to the feelings of others.",
      textObserverByLocale: {
        en: "They are indifferent to the feelings of others.",
        hu: "Hidegen hagyják mások érzései.",
      },
      reversed: true,
    },
    {
      id: 100,
      dimension: "I",
      facet: "altruism",
      text: "I take no time for others.",
      textByLocale: {
        hu: "Nem szánok időt másokra.",
        en: "I take no time for others.",
      },
      textObserver: "They take no time for others.",
      textObserverByLocale: {
        en: "They take no time for others.",
        hu: "Nem szán időt másokra.",
      },
      reversed: true,
    },
  ],
};
