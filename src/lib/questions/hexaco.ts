import type { TestConfig } from "./types";

/**
 * Official HEXACO-PI-R (100 questions)
 */
export const hexacoConfig: TestConfig = {
  type: "HEXACO",
  name: "HEXACO-PI-R",
  description: "A hivatalos HEXACO személyiségteszt 100 kérdéssel.",
  format: "likert",
  dimensions: [
    {
      code: "H",
      label: "Honesty–Humility",
      labelByLocale: {
        en: "Honesty–Humility",
        hu: "Őszinteség–alázat",
      },
      color: "#818CF8",
      description: "Az őszinteség-alázat dimenzió azt tükrözi, mennyire tartózkodik valaki mások manipulálásától, a szabályszegéstől, az anyagi javak hajhászásától és a kiemelt társadalmi státusz hajszolásától. Négy alskálára bontható: Őszinteség (valódi, nem manipulatív viszonyulás másokhoz), Igazságosság (a csalás és korrupció kerülése), Kapzsiság-kerülés (az anyagi javak és státusz iránti közömbösség), Szerénység (nem tekinti magát privilegizáltnak vagy különlegesnek).",
      descriptionByLocale: {
        en: "The Honesty-Humility dimension reflects the extent to which a person avoids manipulating others for personal gain, feels little temptation to break rules, is uninterested in lavish wealth and luxury, and feels no special sense of entitlement. Its four facets are Sincerity (genuine, non-manipulative engagement with others), Fairness (avoidance of fraud and exploitation), Greed Avoidance (indifference to material wealth and social status), and Modesty (not viewing oneself as superior or deserving of special treatment).",
        hu: "Az őszinteség-alázat dimenzió azt tükrözi, mennyire tartózkodik valaki mások manipulálásától, a szabályszegéstől, az anyagi javak hajhászásától és a kiemelt társadalmi státusz hajszolásától. Négy alskálára bontható: Őszinteség (valódi, nem manipulatív viszonyulás másokhoz), Igazságosság (a csalás és korrupció kerülése), Kapzsiság-kerülés (az anyagi javak és státusz iránti közömbösség), Szerénység (nem tekinti magát privilegizáltnak vagy különlegesnek).",
      },
      insights: {
        low: "Hajlamos vagy másokat hízelgéssel vagy tettetett barátsággal befolyásolni, szabályokat megszegni személyes haszonszerzés céljából, és erős anyagi, illetve státuszorientált motivációval rendelkezel.",
        mid: "Általában becsületesen és igazságosan viszonyulsz másokhoz, bár bizonyos helyzetekben a személyes érdekek is befolyásolhatják a döntéseidet.",
        high: "Kerülöd a manipulációt és a megtévesztést, kevéssé vonz az anyagi gazdagság és a státusz, és valódi szerénységgel, őszintén viszonyulsz másokhoz.",
      },
      insightsByLocale: {
        en: {
          low: "You tend to flatter others or pretend to like them to get what you want, are inclined to bend or break rules for personal gain, and are motivated by material wealth and a strong sense of entitlement.",
          mid: "You generally act honestly and fairly toward others, though personal interests may influence your decisions in certain situations.",
          high: "You avoid manipulating or deceiving others, feel little pull toward material wealth or elevated status, and engage with others with genuine sincerity and humility.",
        },
        hu: {
          low: "Hajlamos vagy másokat hízelgéssel vagy tettetett barátsággal befolyásolni, szabályokat megszegni személyes haszonszerzés céljából, és erős anyagi, illetve státuszorientált motivációval rendelkezel.",
          mid: "Általában becsületesen és igazságosan viszonyulsz másokhoz, bár bizonyos helyzetekben a személyes érdekek is befolyásolhatják a döntéseidet.",
          high: "Kerülöd a manipulációt és a megtévesztést, kevéssé vonz az anyagi gazdagság és a státusz, és valódi szerénységgel, őszintén viszonyulsz másokhoz.",
        },
      },
      facets: [
        { code: "sincerity", label: "Sincerity", labelByLocale: { en: "Sincerity", hu: "Őszinteség" } },
        { code: "fairness", label: "Fairness", labelByLocale: { en: "Fairness", hu: "Igazságosság" } },
        { code: "greed_avoidance", label: "Greed Avoidance", labelByLocale: { en: "Greed Avoidance", hu: "Kapzsiság-kerülés" } },
        { code: "modesty", label: "Modesty", labelByLocale: { en: "Modesty", hu: "Szerénység" } },
      ],
    },
    {
      code: "E",
      label: "Emotionality",
      labelByLocale: {
        en: "Emotionality",
        hu: "Érzelmesség",
      },
      color: "#FB7185",
      description: "Az érzelmesség dimenzió azt méri, mennyire érzékeny valaki a fizikai veszélyekre és a stresszes helyzetekre, mennyire igényli mások érzelmi támogatását, és mennyire erős az érzelmi kötődése és empátiája. Négy facetje a Félelem (a fizikai sérülés elkerülésére való hajlam), a Szorongás (aggódásra való hajlam különféle nehézségekkel szemben), a Függőség (mások érzelmi támogatásának igénye) és az Érzelmesség (erős érzelmi kötődés és empatikus érzékenység mások iránt).",
      descriptionByLocale: {
        en: "The Emotionality dimension measures sensitivity to physical danger and life stresses, the need for emotional support from others, and the strength of emotional bonds and empathic sensitivity. Its four facets are Fearfulness (tendency to avoid physical harm), Anxiety (tendency to worry in response to difficulties), Dependence (need for emotional support from others), and Sentimentality (strong emotional attachments and empathic sensitivity to others' feelings).",
        hu: "Az érzelmesség dimenzió azt méri, mennyire érzékeny valaki a fizikai veszélyekre és a stresszes helyzetekre, mennyire igényli mások érzelmi támogatását, és mennyire erős az érzelmi kötődése és empátiája. Négy facetje a Félelem (a fizikai sérülés elkerülésére való hajlam), a Szorongás (aggódásra való hajlam különféle nehézségekkel szemben), a Függőség (mások érzelmi támogatásának igénye) és az Érzelmesség (erős érzelmi kötődés és empatikus érzékenység mások iránt).",
      },
      insights: {
        low: "Nem tántorítanak el a fizikai veszélyek, ritkán aggódsz stresszes helyzetekben, kevés szükséged van mások érzelmi támogatására, és érzelmileg elkülönülten éled meg a kapcsolataidat.",
        mid: "Mérsékelt érzelmi intenzitás jellemez: alkalmanként keresed mások támogatását, és empátiát érzel mások iránt, de általában önállóan is megbirkózol a kihívásokkal.",
        high: "Erős érzelmi kötődés és fogékonyság jellemez: mélyen megéled a félelmeket és a stresszt, fontos számodra a közel állókkal való érzelmi megosztás. Ez az empátia és érzelmi mélység a meleg, gondoskodó kapcsolatok alapja lehet.",
      },
      insightsByLocale: {
        en: {
          low: "You are not deterred by physical danger, feel little worry even in stressful situations, have little need to share your concerns with others, and tend to feel emotionally detached in your relationships.",
          mid: "You experience moderate emotional intensity: you occasionally seek support in stressful situations and feel empathy toward others, while generally managing challenges independently.",
          high: "You are strongly emotionally connected: sensitive to others' feelings, intensely affected by fears and stress, and feel a real need to share your concerns with those close to you. This emotional depth and empathy can be the foundation of warm, caring relationships.",
        },
        hu: {
          low: "Nem tántorítanak el a fizikai veszélyek, ritkán aggódsz stresszes helyzetekben, kevés szükséged van mások érzelmi támogatására, és érzelmileg elkülönülten éled meg a kapcsolataidat.",
          mid: "Mérsékelt érzelmi intenzitás jellemez: alkalmanként keresed mások támogatását, és empátiát érzel mások iránt, de általában önállóan is megbirkózol a kihívásokkal.",
          high: "Erős érzelmi kötődés és fogékonyság jellemez: mélyen megéled a félelmeket és a stresszt, fontos számodra a közel állókkal való érzelmi megosztás. Ez az empátia és érzelmi mélység a meleg, gondoskodó kapcsolatok alapja lehet.",
        },
      },
      facets: [
        { code: "fearfulness", label: "Fearfulness", labelByLocale: { en: "Fearfulness", hu: "Félelem" } },
        { code: "anxiety", label: "Anxiety", labelByLocale: { en: "Anxiety", hu: "Szorongás" } },
        { code: "dependence", label: "Dependence", labelByLocale: { en: "Dependence", hu: "Függőség" } },
        { code: "sentimentality", label: "Sentimentality", labelByLocale: { en: "Sentimentality", hu: "Érzelmesség" } },
      ],
    },
    {
      code: "X",
      label: "Extraversion",
      labelByLocale: {
        en: "Extraversion",
        hu: "Extraverzió",
      },
      color: "#F59E0B",
      description: "Az extraverzió a HEXACO-ban a társas önbizalmat, a különféle szociális helyzetekben való komfortot, a társalgás és összejövetelek élvezetét, valamint az általános lelkesedést és energiát tükrözi. Négy facetje a Társas önértékelés (pozitív önkép, különösen társas helyzetekben), a Társas bátorság (magabiztosság csoportban vagy nyilvánosan), a Társaságkedvelés (a társalgás, interakciók és összejövetelek élvezete) és az Élénkség (általános lelkesedés és optimizmus).",
      descriptionByLocale: {
        en: "Extraversion in the HEXACO model reflects social self-confidence, comfort across social situations, enjoyment of conversation and social gatherings, and overall enthusiasm and energy. Its four facets are Social Self-Esteem (positive self-regard, especially in social contexts), Social Boldness (confidence in group or public settings), Sociability (enjoyment of conversation, interaction, and social gatherings), and Liveliness (general sense of enthusiasm and optimism).",
        hu: "Az extraverzió a HEXACO-ban a társas önbizalmat, a különféle szociális helyzetekben való komfortot, a társalgás és összejövetelek élvezetét, valamint az általános lelkesedést és energiát tükrözi. Négy facetje a Társas önértékelés (pozitív önkép, különösen társas helyzetekben), a Társas bátorság (magabiztosság csoportban vagy nyilvánosan), a Társaságkedvelés (a társalgás, interakciók és összejövetelek élvezete) és az Élénkség (általános lelkesedés és optimizmus).",
      },
      insights: {
        low: "Kényelmetlenül érezheted magad a figyelem középpontjában, és hajlamos lehetsz kevésbé népszerűnek látni magad. Az egyéni tevékenységeket részesíted előnyben, és kevésbé érzel általános lelkesedést vagy optimizmust.",
        mid: "Társas helyzetekben általában magabiztosnak érzed magad, és tudsz vezető szerepet vállalni, miközben az egyéni tevékenységeket és a csendebb pillanatokat is értékeled.",
        high: "Magabiztosnak és energikusnak érzed magad társas közegben, élvezed a társalgást, az összejöveteleket és a csoporthelyzeteket, pozitívan gondolsz magadra, és lelkesedéssel és optimizmussal tekintesz a mindennapokra.",
      },
      insightsByLocale: {
        en: {
          low: "You may feel awkward when you are the center of social attention and tend to view yourself as less popular. You prefer solitary activities and feel less lively or optimistic than others around you.",
          mid: "You generally feel confident in social situations and can take on leadership roles, while also valuing time for independent activities and quieter moments.",
          high: "You feel confident and energized in social settings, enjoy conversation, gatherings, and group situations, hold a positive view of yourself, and approach daily life with enthusiasm and optimism.",
        },
        hu: {
          low: "Kényelmetlenül érezheted magad a figyelem középpontjában, és hajlamos lehetsz kevésbé népszerűnek látni magad. Az egyéni tevékenységeket részesíted előnyben, és kevésbé érzel általános lelkesedést vagy optimizmust.",
          mid: "Társas helyzetekben általában magabiztosnak érzed magad, és tudsz vezető szerepet vállalni, miközben az egyéni tevékenységeket és a csendebb pillanatokat is értékeled.",
          high: "Magabiztosnak és energikusnak érzed magad társas közegben, élvezed a társalgást, az összejöveteleket és a csoporthelyzeteket, pozitívan gondolsz magadra, és lelkesedéssel és optimizmussal tekintesz a mindennapokra.",
        },
      },
      facets: [
        { code: "social_self_esteem", label: "Social Self-Esteem", labelByLocale: { en: "Social Self-Esteem", hu: "Társas önértékelés" } },
        { code: "social_boldness", label: "Social Boldness", labelByLocale: { en: "Social Boldness", hu: "Társas bátorság" } },
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
      color: "#34D399",
      description: "A barátságosság dimenzió (a harag ellenpontjaként) azt tükrözi, mennyire hajlamos valaki megbocsátani a sérelmeket, elnézően ítélni meg másokat, kompromisszumra törekedni, és megőrizni a nyugalmát provokáció esetén. Négy facetje a Megbocsátás (a bizalom és a szívélyesség helyreállítása az őt megbántókkal szemben), a Szelídség (enyhe, toleráns ítélkezés másokról), a Rugalmasság (hajlandóság az alkalmazkodásra és a kompromisszumra) és a Türelem (a harag és az ingerültség visszafogása).",
      descriptionByLocale: {
        en: "The Agreeableness dimension (versus Anger) reflects the tendency to forgive wrongs, judge others with leniency, willingness to compromise and cooperate, and the ability to keep one's temper even when mistreated. Its four facets are Forgivingness (restoring trust and goodwill toward those who have caused harm), Gentleness (mild and lenient judgment of others), Flexibility (willingness to adapt and compromise), and Patience (restraining anger and irritation).",
        hu: "A barátságosság dimenzió (a harag ellenpontjaként) azt tükrözi, mennyire hajlamos valaki megbocsátani a sérelmeket, elnézően ítélni meg másokat, kompromisszumra törekedni, és megőrizni a nyugalmát provokáció esetén. Négy facetje a Megbocsátás (a bizalom és a szívélyesség helyreállítása az őt megbántókkal szemben), a Szelídség (enyhe, toleráns ítélkezés másokról), a Rugalmasság (hajlandóság az alkalmazkodásra és a kompromisszumra) és a Türelem (a harag és az ingerültség visszafogása).",
      },
      insights: {
        low: "Hajlamos vagy haragot tartani azok iránt, akik megbántottak, kritikusan ítéled meg mások hibáit, makacsan véded az álláspontodat, és provokáció hatására könnyen elveszíted a türelmedet.",
        mid: "Képes vagy megbocsátani és kompromisszumot kötni, miközben szükség esetén megvédeni az álláspontodat is. Általában megőrzöd a nyugalmad, de komoly provokáció esetén ingerültté válhatsz.",
        high: "Könnyen megbocsátasz azoknak, akik megbántottak, elnézően ítéled meg mások gyengéit, hajlandó vagy rugalmasan alkalmazkodni és kompromisszumot kötni, és ritkán veszíted el a türelmedet.",
      },
      insightsByLocale: {
        en: {
          low: "You tend to hold grudges against those who have wronged you, judge others' shortcomings critically, defend your point of view stubbornly, and feel anger readily in response to mistreatment.",
          mid: "You are capable of forgiving and compromising while still defending your position when it matters. You generally stay calm, though significant provocation may still stir your temper.",
          high: "You readily forgive those who have wronged you, judge others' shortcomings with leniency, are willing to adapt flexibly and reach compromises, and rarely lose your temper.",
        },
        hu: {
          low: "Hajlamos vagy haragot tartani azok iránt, akik megbántottak, kritikusan ítéled meg mások hibáit, makacsan véded az álláspontodat, és provokáció hatására könnyen elveszíted a türelmedet.",
          mid: "Képes vagy megbocsátani és kompromisszumot kötni, miközben szükség esetén megvédeni az álláspontodat is. Általában megőrzöd a nyugalmad, de komoly provokáció esetén ingerültté válhatsz.",
          high: "Könnyen megbocsátasz azoknak, akik megbántottak, elnézően ítéled meg mások gyengéit, hajlandó vagy rugalmasan alkalmazkodni és kompromisszumot kötni, és ritkán veszíted el a türelmedet.",
        },
      },
      facets: [
        { code: "forgiveness", label: "Forgiveness", labelByLocale: { en: "Forgiveness", hu: "Megbocsátás" } },
        { code: "gentleness", label: "Gentleness", labelByLocale: { en: "Gentleness", hu: "Szelídség" } },
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
      color: "#A78BFA",
      description: "A lelkiismeretesség dimenzió azt méri, mennyire szervezett és rendszeres valaki a mindennapi élete terén, mennyire kitartóan és fegyelmezetten törekszik a céljai elérésére, mennyire törekszik pontosságra és tökéletességre, és mennyire gondolkodik meg alaposan a döntések előtt. Négy facetje a Szervezettség (rendezett fizikai környezet és időbeosztás igénye), a Szorgalom (erős munkásmotiváció és kitartás), a Perfekcionizmus (aprólékosság és a részletekre való odafigyelés) és a Megfontoltság (impulzusok kontrollja, a döntések átgondolása).",
      descriptionByLocale: {
        en: "The Conscientiousness dimension measures how organized and structured a person is, how persistently and disciplinedly they work toward goals, their drive for accuracy and thoroughness, and how carefully they deliberate before making decisions. Its four facets are Organization (preference for tidy surroundings and structured schedules), Diligence (strong work ethic and motivation to achieve), Perfectionism (thoroughness and attention to detail), and Prudence (impulse control and careful deliberation).",
        hu: "A lelkiismeretesség dimenzió azt méri, mennyire szervezett és rendszeres valaki a mindennapi élete terén, mennyire kitartóan és fegyelmezetten törekszik a céljai elérésére, mennyire törekszik pontosságra és tökéletességre, és mennyire gondolkodik meg alaposan a döntések előtt. Négy facetje a Szervezettség (rendezett fizikai környezet és időbeosztás igénye), a Szorgalom (erős munkásmotiváció és kitartás), a Perfekcionizmus (aprólékosság és a részletekre való odafigyelés) és a Megfontoltság (impulzusok kontrollja, a döntések átgondolása).",
      },
      insights: {
        low: "Kevésbé foglalkoztat a rend és a struktúra: hajlamos vagy elkerülni a nehéz feladatokat, megelégedni a nem tökéletes eredményekkel, és inkább impulzívan, mint alapos mérlegelés után dönteni.",
        mid: "Megbízhatóan hajtod végre a feladatokat, és általában rendszerezetten végzed a munkát, de nem hajszolod el magad a tökéletesség érdekében. Rugalmasan alkalmazkodsz a változásokhoz anélkül, hogy elveszítenéd a fókuszodat.",
        high: "Gondosan szervezed az idődet és a fizikai környezetedet, fegyelmezetten és kitartóan dolgozol a céljaidért, alaposan odafigyelve a részletekre és a pontosságra, és döntés előtt mindig körültekintően mérlegelsz.",
      },
      insightsByLocale: {
        en: {
          low: "You are less concerned with order and structure: you tend to avoid difficult tasks, are satisfied with work that contains some errors, and make decisions more on impulse than after careful reflection.",
          mid: "You complete tasks reliably and generally work in an organized way, without pushing yourself to extremes of perfectionism. You adapt flexibly to changes without losing focus.",
          high: "You organize your time and surroundings carefully, work toward your goals with discipline and persistence, pay close attention to accuracy and detail, and deliberate carefully before making decisions.",
        },
        hu: {
          low: "Kevésbé foglalkoztat a rend és a struktúra: hajlamos vagy elkerülni a nehéz feladatokat, megelégedni a nem tökéletes eredményekkel, és inkább impulzívan, mint alapos mérlegelés után dönteni.",
          mid: "Megbízhatóan hajtod végre a feladatokat, és általában rendszerezetten végzed a munkát, de nem hajszolod el magad a tökéletesség érdekében. Rugalmasan alkalmazkodsz a változásokhoz anélkül, hogy elveszítenéd a fókuszodat.",
          high: "Gondosan szervezed az idődet és a fizikai környezetedet, fegyelmezetten és kitartóan dolgozol a céljaidért, alaposan odafigyelve a részletekre és a pontosságra, és döntés előtt mindig körültekintően mérlegelsz.",
        },
      },
      facets: [
        { code: "organization", label: "Organization", labelByLocale: { en: "Organization", hu: "Szervezettség" } },
        { code: "diligence", label: "Diligence", labelByLocale: { en: "Diligence", hu: "Szorgalom" } },
        { code: "perfectionism", label: "Perfectionism", labelByLocale: { en: "Perfectionism", hu: "Perfekcionizmus" } },
        { code: "prudence", label: "Prudence", labelByLocale: { en: "Prudence", hu: "Megfontoltság" } },
      ],
    },
    {
      code: "O",
      label: "Openness",
      labelByLocale: {
        en: "Openness",
        hu: "Nyitottság",
      },
      color: "#38BDF8",
      description: "A nyitottság dimenzió az esztétikai fogékonyságot, az intellektuális kíváncsiságot, a kreativitást és a szokatlan ötletek iránti befogadóképességet méri. Négy facetje az Esztétikai fogékonyság (elmerülés a természet és a művészet szépségébe), a Kíváncsiság (ismeretek és tapasztalatok aktív keresése), a Kreativitás (az innováció és a kísérletezés iránti preferencia, eredeti megoldások keresése) és az Eredetiség (nyitottság a szokatlan, esetleg radikális ötletekre).",
      descriptionByLocale: {
        en: "The Openness to Experience dimension measures aesthetic appreciation, intellectual curiosity, creativity, and receptiveness to unusual ideas and perspectives. Its four facets are Aesthetic Appreciation (absorption in the beauty of art and nature), Inquisitiveness (active seeking of knowledge and experience), Creativity (preference for innovation and experimentation, seeking original solutions), and Unconventionality (openness to ideas that may seem strange or radical).",
        hu: "A nyitottság dimenzió az esztétikai fogékonyságot, az intellektuális kíváncsiságot, a kreativitást és a szokatlan ötletek iránti befogadóképességet méri. Négy facetje az Esztétikai fogékonyság (elmerülés a természet és a művészet szépségébe), a Kíváncsiság (ismeretek és tapasztalatok aktív keresése), a Kreativitás (az innováció és a kísérletezés iránti preferencia, eredeti megoldások keresése) és az Eredetiség (nyitottság a szokatlan, esetleg radikális ötletekre).",
      },
      insights: {
        low: "Kevéssé ragadnak meg a műalkotások vagy a természeti csodák, nem különösebben foglalkoztat az intellektuális felfedezés, a kreatív tevékenységektől inkább tartózkodol, és a radikális vagy szokatlan ötletek nem vonzanak.",
        mid: "Nyitott vagy néhány új ötletre és kreatív élményre, miközben a praktikus, bevált megközelítések is vonzanak. A kíváncsiság és a pragmatizmus egyensúlyban van benned.",
        high: "Elmerülsz a természet és a művészet szépségébe, aktívan keresed az ismereteket és az új tapasztalatokat, szívesen kísérletezel eredeti megközelítésekkel, és nyitott vagy a szokatlan, esetleg radikális ötletekre.",
      },
      insightsByLocale: {
        en: {
          low: "You tend to be unimpressed by works of art or natural wonders, feel little pull toward intellectual exploration, tend to avoid creative pursuits, and feel little attraction toward ideas that are radical or unconventional.",
          mid: "You are open to some new ideas and creative experiences while also being drawn to practical, established approaches. Curiosity and pragmatism are in balance.",
          high: "You become absorbed in the beauty of art and nature, actively seek knowledge and new experiences, enjoy experimenting with original approaches, and are receptive to ideas that may seem strange or radical to others.",
        },
        hu: {
          low: "Kevéssé ragadnak meg a műalkotások vagy a természeti csodák, nem különösebben foglalkoztat az intellektuális felfedezés, a kreatív tevékenységektől inkább tartózkodol, és a radikális vagy szokatlan ötletek nem vonzanak.",
          mid: "Nyitott vagy néhány új ötletre és kreatív élményre, miközben a praktikus, bevált megközelítések is vonzanak. A kíváncsiság és a pragmatizmus egyensúlyban van benned.",
          high: "Elmerülsz a természet és a művészet szépségébe, aktívan keresed az ismereteket és az új tapasztalatokat, szívesen kísérletezel eredeti megközelítésekkel, és nyitott vagy a szokatlan, esetleg radikális ötletekre.",
        },
      },
      facets: [
        { code: "aesthetic_appreciation", label: "Aesthetic Appreciation", labelByLocale: { en: "Aesthetic Appreciation", hu: "Esztétikai fogékonyság" } },
        { code: "inquisitiveness", label: "Inquisitiveness", labelByLocale: { en: "Inquisitiveness", hu: "Kíváncsiság" } },
        { code: "creativity", label: "Creativity", labelByLocale: { en: "Creativity", hu: "Kreativitás" } },
        { code: "unconventionality", label: "Unconventionality", labelByLocale: { en: "Unconventionality", hu: "Eredetiség" } },
      ],
    },
    {
      code: "I",
      label: "Altruism",
      labelByLocale: {
        en: "Altruism",
        hu: "Altruizmus",
      },
      color: "#34D399",
      description: "Az altruizmus közbülső skála azt méri, mennyire érez valaki valódi együttérzést a hátrányos helyzetűek iránt, és mennyire motivált a nagylelkű segítségnyújtásra. Az alacsony értékű személyek kevéssé aggódnak mások baján, míg a magasak belső késztetést éreznek a rászoruló emberek aktív támogatására.",
      descriptionByLocale: {
        en: "The Altruism (Interstitial) scale measures the extent to which a person feels genuine sympathy for the less fortunate and is motivated to give generously to those in need. Low scorers are relatively unmoved by others' hardship, while high scorers feel a strong inner drive to help and support those who are weak or in difficulty.",
        hu: "Az altruizmus közbülső skála azt méri, mennyire érez valaki valódi együttérzést a hátrányos helyzetűek iránt, és mennyire motivált a nagylelkű segítségnyújtásra. Az alacsony értékű személyek kevéssé aggódnak mások baján, míg a magasak belső késztetést éreznek a rászoruló emberek aktív támogatására.",
      },
      insights: {
        low: "Nem az azonnali érzelmi bevonódás jellemző rád — inkább megfontoltan döntesz arról, mikor és hogyan segíts. Racionális hozzáállással közelítesz mások nehézségeihez.",
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
          low: "Nem az azonnali érzelmi bevonódás jellemző rád — inkább megfontoltan döntesz arról, mikor és hogyan segíts. Racionális hozzáállással közelítesz mások nehézségeihez.",
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
      text: "I would be quite bored by a visit to an art gallery.",
      textByLocale: {
        hu: "Meglehetősen untatna egy képtár meglátogatása.",
        en: "I would be quite bored by a visit to an art gallery.",
      },
      textObserver: "He/she would be quite bored by a visit to an art gallery.",
      textObserverByLocale: {
        en: "He/she would be quite bored by a visit to an art gallery.",
        hu: "Meglehetősen untatná egy képtár meglátogatása.",
      },
      reversed: true,
    },
    {
      id: 2,
      dimension: "C",
      facet: "organization",
      text: "I clean my office or home quite frequently.",
      textByLocale: {
        hu: "Mind a munkahelyemen, mind otthonomban rendszeresen ügyelek a rendre és tisztaságra.",
        en: "I clean my office or home quite frequently.",
      },
      textObserver: "He/she cleans his/her office or home quite frequently.",
      textObserverByLocale: {
        en: "He/she cleans his/her office or home quite frequently.",
        hu: "Mind a munkahelyén, mind otthonában rendszeresen ügyel a rendre és tisztaságra.",
      },
    },
    {
      id: 3,
      dimension: "A",
      facet: "forgiveness",
      text: "I rarely hold a grudge, even against people who have badly wronged me.",
      textByLocale: {
        hu: "Még azokkal szemben sem vagyok haragtartó, akik csúnyán megbántottak.",
        en: "I rarely hold a grudge, even against people who have badly wronged me.",
      },
      textObserver: "He/she rarely holds a grudge, even against people who have badly wronged him/her.",
      textObserverByLocale: {
        en: "He/she rarely holds a grudge, even against people who have badly wronged him/her.",
        hu: "Még azokkal szemben sem haragtartó, akik csúnyán megbántották.",
      },
    },
    {
      id: 4,
      dimension: "X",
      facet: "social_self_esteem",
      text: "I feel reasonably satisfied with myself overall.",
      textByLocale: {
        hu: "Alapjában véve úgy érzem, hogy elégedett vagyok magammal.",
        en: "I feel reasonably satisfied with myself overall.",
      },
      textObserver: "He/she feels reasonably satisfied with himself/herself overall.",
      textObserverByLocale: {
        en: "He/she feels reasonably satisfied with himself/herself overall.",
        hu: "Alapjában véve elégedett magával.",
      },
    },
    {
      id: 5,
      dimension: "E",
      facet: "fearfulness",
      text: "I would feel afraid if I had to travel in bad weather conditions.",
      textByLocale: {
        hu: "Félnék, ha rossz időjárási körülmények között kellene utaznom.",
        en: "I would feel afraid if I had to travel in bad weather conditions.",
      },
      textObserver: "He/she would feel afraid if he/she had to travel in bad weather conditions.",
      textObserverByLocale: {
        en: "He/she would feel afraid if he/she had to travel in bad weather conditions.",
        hu: "Félne, ha rossz időjárási körülmények között kellene utaznia.",
      },
    },
    {
      id: 6,
      dimension: "H",
      facet: "sincerity",
      text: "If I want something from a person I dislike, I will act very nicely toward that person in order to get it.",
      textByLocale: {
        hu: "Ha valakitől, akit tulajdonképpen nem is kedvelek, szeretnék valamit, a cél érdekében képes vagyok ehhez a személyhez nagyon kedves lenni.",
        en: "If I want something from a person I dislike, I will act very nicely toward that person in order to get it.",
      },
      textObserver: "If he/she wants something from a person he/she dislikes, he/she will act very nicely toward that person in order to get it.",
      textObserverByLocale: {
        en: "If he/she wants something from a person he/she dislikes, he/she will act very nicely toward that person in order to get it.",
        hu: "Ha valakitől, akit tulajdonképpen nem is kedvel, szeretne valamit, a cél érdekében képes ehhez a személyhez nagyon kedves lenni.",
      },
      reversed: true,
    },
    {
      id: 7,
      dimension: "O",
      facet: "inquisitiveness",
      text: "I'm interested in learning about the history and politics of other countries.",
      textByLocale: {
        hu: "Érdekelnek más országok történelmi és politikai sajátosságai.",
        en: "I'm interested in learning about the history and politics of other countries.",
      },
      textObserver: "He/she is interested in learning about the history and politics of other countries.",
      textObserverByLocale: {
        en: "He/she is interested in learning about the history and politics of other countries.",
        hu: "Érdeklik más országok történelmi és politikai sajátosságai.",
      },
    },
    {
      id: 8,
      dimension: "C",
      facet: "diligence",
      text: "When working, I often set ambitious goals for myself.",
      textByLocale: {
        hu: "A munkámban gyakran tűzök ki ambiciózus célokat magam elé.",
        en: "When working, I often set ambitious goals for myself.",
      },
      textObserver: "When working, he/she often sets ambitious goals for himself/herself.",
      textObserverByLocale: {
        en: "When working, he/she often sets ambitious goals for himself/herself.",
        hu: "A munkájában gyakran tűz ki ambiciózus célokat maga elé.",
      },
    },
    {
      id: 9,
      dimension: "A",
      facet: "gentleness",
      text: "People sometimes tell me that I am too critical of others.",
      textByLocale: {
        hu: "Az ismerőseim gyakran állítják, hogy túl kritikus vagyok másokhoz.",
        en: "People sometimes tell me that I am too critical of others.",
      },
      textObserver: "People sometimes say that he/she is too critical of others.",
      textObserverByLocale: {
        en: "People sometimes say that he/she is too critical of others.",
        hu: "Az ismerősei gyakran állítják, hogy túl kritikus másokhoz.",
      },
      reversed: true,
    },
    {
      id: 10,
      dimension: "X",
      facet: "social_boldness",
      text: "I rarely express my opinions in group meetings.",
      textByLocale: {
        hu: "Csoportos megbeszéléseken ritkán adok hangot véleményemnek.",
        en: "I rarely express my opinions in group meetings.",
      },
      textObserver: "He/she rarely expresses his/her opinions in group meetings.",
      textObserverByLocale: {
        en: "He/she rarely expresses his/her opinions in group meetings.",
        hu: "Csoportos megbeszéléseken ritkán ad hangot véleményének.",
      },
      reversed: true,
    },
    {
      id: 11,
      dimension: "E",
      facet: "anxiety",
      text: "I sometimes can't help worrying about little things.",
      textByLocale: {
        hu: "Néha nem tudom megállni, hogy ne aggodalmaskodjak apróságokon.",
        en: "I sometimes can't help worrying about little things.",
      },
      textObserver: "He/she worries about little things.",
      textObserverByLocale: {
        en: "He/she worries about little things.",
        hu: "Néha nem tudja megállni, hogy ne aggódjon apróságokon.",
      },
    },
    {
      id: 12,
      dimension: "H",
      facet: "fairness",
      text: "If I knew that I could never get caught, I would be willing to steal a million dollars.",
      textByLocale: {
        hu: "Ha tudnám, hogy sosem kapnak el, kész lennék egy millió dollárt vagy eurót ellopni.",
        en: "If I knew that I could never get caught, I would be willing to steal a million dollars.",
      },
      textObserver: "If he/she knew that he/she could never get caught, he/she would be willing to steal a million dollars.",
      textObserverByLocale: {
        en: "If he/she knew that he/she could never get caught, he/she would be willing to steal a million dollars.",
        hu: "Ha tudná, hogy sosem kapják el, kész lenne egy millió dollárt vagy eurót ellopni.",
      },
      reversed: true,
    },
    {
      id: 13,
      dimension: "O",
      facet: "creativity",
      text: "I would like a job that requires following a routine rather than being creative.",
      textByLocale: {
        hu: "Inkább olyan állást szeretnék, ahol a rutin fontosabb, mint a kreativitás.",
        en: "I would like a job that requires following a routine rather than being creative.",
      },
      textObserver: "He/she would like a job that requires following a routine rather than being creative.",
      textObserverByLocale: {
        en: "He/she would like a job that requires following a routine rather than being creative.",
        hu: "Inkább olyan állást szeretne, ahol a rutin fontosabb, mint a kreativitás.",
      },
      reversed: true,
    },
    {
      id: 14,
      dimension: "C",
      facet: "perfectionism",
      text: "I often check my work over repeatedly to find any mistakes.",
      textByLocale: {
        hu: "Gyakran ismételten is leellenőrzöm a munkámat, hogy nincs-e mégis hiba benne.",
        en: "I often check my work over repeatedly to find any mistakes.",
      },
      textObserver: "He/she often checks his/her work over repeatedly to find any mistakes.",
      textObserverByLocale: {
        en: "He/she often checks his/her work over repeatedly to find any mistakes.",
        hu: "Gyakran ismételten is leellenőrzi a munkáját, hogy nincs-e mégis hiba benne.",
      },
    },
    {
      id: 15,
      dimension: "A",
      facet: "flexibility",
      text: "People sometimes tell me that I'm too stubborn.",
      textByLocale: {
        hu: "Az ismerőseim néha azt mondják, hogy túlzottan makacs vagyok.",
        en: "People sometimes tell me that I'm too stubborn.",
      },
      textObserver: "People sometimes think that he/she is too stubborn.",
      textObserverByLocale: {
        en: "People sometimes think that he/she is too stubborn.",
        hu: "Az ismerősei néha azt mondják, hogy túlzottan makacs.",
      },
      reversed: true,
    },
    {
      id: 16,
      dimension: "X",
      facet: "sociability",
      text: "I avoid making \"small talk\" with people.",
      textByLocale: {
        hu: "Kerülöm az üres társalkodást.",
        en: "I avoid making \"small talk\" with people.",
      },
      textObserver: "He/she avoids making \"small talk\" with people.",
      textObserverByLocale: {
        en: "He/she avoids making \"small talk\" with people.",
        hu: "Kerüli az üres társalkodást.",
      },
      reversed: true,
    },
    {
      id: 17,
      dimension: "E",
      facet: "dependence",
      text: "When I suffer from a painful experience, I need someone to make me feel comfortable.",
      textByLocale: {
        hu: "Ha valami rossz történt velem, szükségem van valakire, aki megvigasztal.",
        en: "When I suffer from a painful experience, I need someone to make me feel comfortable.",
      },
      textObserver: "When he/she suffers from a painful experience, he/she needs someone to make him/her feel comfortable.",
      textObserverByLocale: {
        en: "When he/she suffers from a painful experience, he/she needs someone to make him/her feel comfortable.",
        hu: "Ha valami rossz történt vele, szüksége van valakire, aki megvigasztalja.",
      },
    },
    {
      id: 18,
      dimension: "H",
      facet: "greed_avoidance",
      text: "Having a lot of money is not especially important to me.",
      textByLocale: {
        hu: "Nem igazán fontos nekem, hogy sok pénzem legyen.",
        en: "Having a lot of money is not especially important to me.",
      },
      textObserver: "Having a lot of money is not especially important to him/her.",
      textObserverByLocale: {
        en: "Having a lot of money is not especially important to him/her.",
        hu: "Nem igazán fontos neki, hogy sok pénze legyen.",
      },
    },
    {
      id: 19,
      dimension: "O",
      facet: "unconventionality",
      text: "I think that paying attention to radical ideas is a waste of time.",
      textByLocale: {
        hu: "A radikális nézetekkel való foglalkozás egyszerűen időpocsékolás.",
        en: "I think that paying attention to radical ideas is a waste of time.",
      },
      textObserver: "He/she thinks that paying attention to radical ideas is a waste of time.",
      textObserverByLocale: {
        en: "He/she thinks that paying attention to radical ideas is a waste of time.",
        hu: "A radikális nézetekkel való foglalkozás szerinte egyszerűen időpocsékolás.",
      },
      reversed: true,
    },
    {
      id: 20,
      dimension: "C",
      facet: "prudence",
      text: "I make decisions based on the feeling of the moment rather than on careful thought.",
      textByLocale: {
        hu: "Inkább a pillanatnyi érzelmeim, mint a gondos megfontolás irányítják a döntéseimet.",
        en: "I make decisions based on the feeling of the moment rather than on careful thought.",
      },
      textObserver: "He/she makes decisions based on the feeling of the moment rather than on careful thought.",
      textObserverByLocale: {
        en: "He/she makes decisions based on the feeling of the moment rather than on careful thought.",
        hu: "Inkább a pillanatnyi érzelmei, mint a gondos megfontolás irányítják a döntéseit.",
      },
      reversed: true,
    },
    {
      id: 21,
      dimension: "A",
      facet: "patience",
      text: "People think of me as someone who has a quick temper.",
      textByLocale: {
        hu: "Az emberek robbanékony természetűnek tartanak.",
        en: "People think of me as someone who has a quick temper.",
      },
      textObserver: "People think of him/her as someone who has a quick temper.",
      textObserverByLocale: {
        en: "People think of him/her as someone who has a quick temper.",
        hu: "Az emberek robbanékony természetűnek tartják.",
      },
      reversed: true,
    },
    {
      id: 22,
      dimension: "X",
      facet: "liveliness",
      text: "I am energetic nearly all the time.",
      textByLocale: {
        hu: "Szinte mindig tele vagyok energiával.",
        en: "I am energetic nearly all the time.",
      },
      textObserver: "He/she is energetic nearly all the time.",
      textObserverByLocale: {
        en: "He/she is energetic nearly all the time.",
        hu: "Szinte mindig tele van energiával.",
      },
    },
    {
      id: 23,
      dimension: "E",
      facet: "sentimentality",
      text: "I feel like crying when I see other people crying.",
      textByLocale: {
        hu: "Úgy érzem, engem is elkap a sírás, ha másokat sírni látok.",
        en: "I feel like crying when I see other people crying.",
      },
      textObserver: "He/she feels like crying when he/she sees other people crying.",
      textObserverByLocale: {
        en: "He/she feels like crying when he/she sees other people crying.",
        hu: "Elérzékenyül, ha másokat sírni lát.",
      },
    },
    {
      id: 24,
      dimension: "H",
      facet: "modesty",
      text: "I am an ordinary person who is no better than others.",
      textByLocale: {
        hu: "Olyan vagyok, mint a többi ember: se jobb, se rosszabb.",
        en: "I am an ordinary person who is no better than others.",
      },
      textObserver: "He/she thinks that he/she is an ordinary person who is no better than others.",
      textObserverByLocale: {
        en: "He/she thinks that he/she is an ordinary person who is no better than others.",
        hu: "Úgy gondolja olyan, mint a többi ember: se jobb, se rosszabb.",
      },
    },
    {
      id: 25,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "I wouldn't spend my time reading a book of poetry.",
      textByLocale: {
        hu: "Nem fordítanám az időmet egy verses kötet olvasására.",
        en: "I wouldn't spend my time reading a book of poetry.",
      },
      textObserver: "He/she wouldn't spend his/her time reading a book of poetry.",
      textObserverByLocale: {
        en: "He/she wouldn't spend his/her time reading a book of poetry.",
        hu: "Nem fordítaná az idejét egy verses kötet olvasására.",
      },
      reversed: true,
    },
    {
      id: 26,
      dimension: "C",
      facet: "organization",
      text: "I plan ahead and organize things, to avoid scrambling at the last minute.",
      textByLocale: {
        hu: "A dolgaimat előre eltervezem, hogy elkerüljem az utolsó percben való kapkodást.",
        en: "I plan ahead and organize things, to avoid scrambling at the last minute.",
      },
      textObserver: "He/she plans ahead and organizes things, to avoid scrambling at the last minute.",
      textObserverByLocale: {
        en: "He/she plans ahead and organizes things, to avoid scrambling at the last minute.",
        hu: "A dolgait előre eltervezi, hogy elkerülje az utolsó percben való kapkodást.",
      },
    },
    {
      id: 27,
      dimension: "A",
      facet: "forgiveness",
      text: "My attitude toward people who have treated me badly is \"forgive and forget\".",
      textByLocale: {
        hu: "Ha valaki rosszul bánt velem, képes vagyok megbocsátani és a feledés fátylát borítani a történtekre.",
        en: "My attitude toward people who have treated me badly is \"forgive and forget\".",
      },
      textObserver: "His/her attitude toward people who have treated him/her badly is \"forgive and forget\".",
      textObserverByLocale: {
        en: "His/her attitude toward people who have treated him/her badly is \"forgive and forget\".",
        hu: "Ha valaki rosszul bánt vele, képes megbocsátani és a feledés fátylát borítani a történtekre.",
      },
    },
    {
      id: 28,
      dimension: "X",
      facet: "social_self_esteem",
      text: "I think that most people like some aspects of my personality.",
      textByLocale: {
        hu: "Úgy gondolom, hogy az emberek többsége talál bennem szimpatikus vonásokat.",
        en: "I think that most people like some aspects of my personality.",
      },
      textObserver: "He/she thinks that most people like some aspects of his/her personality.",
      textObserverByLocale: {
        en: "He/she thinks that most people like some aspects of his/her personality.",
        hu: "Úgy gondolja, hogy az emberek többsége talál benne szimpatikus vonásokat.",
      },
    },
    {
      id: 29,
      dimension: "E",
      facet: "fearfulness",
      text: "I don't mind doing jobs that involve dangerous work.",
      textByLocale: {
        hu: "Nem zavar, ha a munkám veszélyekkel is jár.",
        en: "I don't mind doing jobs that involve dangerous work.",
      },
      textObserver: "He/she doesn't mind doing jobs that involve dangerous work.",
      textObserverByLocale: {
        en: "He/she doesn't mind doing jobs that involve dangerous work.",
        hu: "Nem zavarja, ha a munkája veszélyekkel is jár.",
      },
      reversed: true,
    },
    {
      id: 30,
      dimension: "H",
      facet: "sincerity",
      text: "I wouldn't use flattery to get a raise or promotion at work, even if I thought it would succeed.",
      textByLocale: {
        hu: "Akkor sem hízelegnék a főnökömnek, ha tudnám, fizetésemelést vagy előrelépést érnék el vele.",
        en: "I wouldn't use flattery to get a raise or promotion at work, even if I thought it would succeed.",
      },
      textObserver: "He/she wouldn't use flattery to get a raise or promotion at work, even if he/she thought it would succeed.",
      textObserverByLocale: {
        en: "He/she wouldn't use flattery to get a raise or promotion at work, even if he/she thought it would succeed.",
        hu: "Akkor sem hízelgene a főnökének, ha tudná, fizetésemelést vagy előrelépést érne el vele.",
      },
    },
    {
      id: 31,
      dimension: "O",
      facet: "inquisitiveness",
      text: "I enjoy looking at maps of different places.",
      textByLocale: {
        hu: "Szívesen nézegetem idegen helyek térképeit.",
        en: "I enjoy looking at maps of different places.",
      },
      textObserver: "He/she enjoys looking at maps of different places.",
      textObserverByLocale: {
        en: "He/she enjoys looking at maps of different places.",
        hu: "Szívesen nézegeti idegen helyek térképeit.",
      },
    },
    {
      id: 32,
      dimension: "C",
      facet: "diligence",
      text: "I often push myself very hard when trying to achieve a goal.",
      textByLocale: {
        hu: "Céljaim elérésére gyakran minden erőmet bevetem.",
        en: "I often push myself very hard when trying to achieve a goal.",
      },
      textObserver: "He/she often pushes himself/herself very hard when trying to achieve a goal.",
      textObserverByLocale: {
        en: "He/she often pushes himself/herself very hard when trying to achieve a goal.",
        hu: "Céljainak elérésére gyakran minden erejét beveti.",
      },
    },
    {
      id: 33,
      dimension: "A",
      facet: "gentleness",
      text: "I generally accept people's faults without complaining about them.",
      textByLocale: {
        hu: "Általában zokszó nélkül elfogadom mások hibáit.",
        en: "I generally accept people's faults without complaining about them.",
      },
      textObserver: "He/she generally accepts people's faults without complaining about them.",
      textObserverByLocale: {
        en: "He/she generally accepts people's faults without complaining about them.",
        hu: "Általában zokszó nélkül elfogadja mások hibáit.",
      },
    },
    {
      id: 34,
      dimension: "X",
      facet: "social_boldness",
      text: "In social situations, I'm usually the one who makes the first move.",
      textByLocale: {
        hu: "Társas helyzetekben általában én vagyok az, aki beszélgetést kezdeményez.",
        en: "In social situations, I'm usually the one who makes the first move.",
      },
      textObserver: "In social situations, he/she is usually the one who makes the first move.",
      textObserverByLocale: {
        en: "In social situations, he/she is usually the one who makes the first move.",
        hu: "Társas helyzetekben általában ő az, aki beszélgetést kezdeményez.",
      },
    },
    {
      id: 35,
      dimension: "E",
      facet: "anxiety",
      text: "I worry a lot less than most people do.",
      textByLocale: {
        hu: "Sokkal kevesebbet aggódom, mint a legtöbb ember.",
        en: "I worry a lot less than most people do.",
      },
      textObserver: "He/she worries a lot less than most people do.",
      textObserverByLocale: {
        en: "He/she worries a lot less than most people do.",
        hu: "Sokkal kevesebbet aggódik, mint a legtöbb ember.",
      },
      reversed: true,
    },
    {
      id: 36,
      dimension: "H",
      facet: "fairness",
      text: "I would be tempted to buy stolen property if I were financially tight.",
      textByLocale: {
        hu: "Szűkös anyagi helyzetben kísértésbe tudnék esni, hogy lopott árut vásároljak.",
        en: "I would be tempted to buy stolen property if I were financially tight.",
      },
      textObserver: "He/she would be tempted to buy stolen property if he/she were financially tight.",
      textObserverByLocale: {
        en: "He/she would be tempted to buy stolen property if he/she were financially tight.",
        hu: "Szűkös anyagi helyzetben kísértésbe tudna esni, hogy lopott árut vásároljon.",
      },
      reversed: true,
    },
    {
      id: 37,
      dimension: "O",
      facet: "creativity",
      text: "I would enjoy creating a work of art, such as a novel, a song, or a painting.",
      textByLocale: {
        hu: "Szívesen alkotnék valami művészi munkát: egy regényt, zeneszámot, vagy festményt.",
        en: "I would enjoy creating a work of art, such as a novel, a song, or a painting.",
      },
      textObserver: "He/she would enjoy creating a work of art, such as a novel, a song, or a painting.",
      textObserverByLocale: {
        en: "He/she would enjoy creating a work of art, such as a novel, a song, or a painting.",
        hu: "Szívesen alkotna valami művészi munkát: egy regényt, zeneszámot, vagy festményt.",
      },
    },
    {
      id: 38,
      dimension: "C",
      facet: "perfectionism",
      text: "When working on something, I don't pay much attention to small details.",
      textByLocale: {
        hu: "Ha dolgozom valamin, nem igazán fordítok különös figyelmet az apró részletekre.",
        en: "When working on something, I don't pay much attention to small details.",
      },
      textObserver: "When working on something, he/she doesn't pay much attention to small details.",
      textObserverByLocale: {
        en: "When working on something, he/she doesn't pay much attention to small details.",
        hu: "Ha dolgozik valamin, nem igazán fordít különös figyelmet az apró részletekre.",
      },
      reversed: true,
    },
    {
      id: 39,
      dimension: "A",
      facet: "flexibility",
      text: "I am usually quite flexible in my opinions when people disagree with me.",
      textByLocale: {
        hu: "Általában könnyen megváltoztatom a véleményem, ha az emberek nem értenek vele egyet.",
        en: "I am usually quite flexible in my opinions when people disagree with me.",
      },
      textObserver: "He/she is usually quite flexible in his/her opinions when people disagree with him/her.",
      textObserverByLocale: {
        en: "He/she is usually quite flexible in his/her opinions when people disagree with him/her.",
        hu: "Általában könnyen megváltoztatja a véleményét, ha az emberek nem értenek vele egyet.",
      },
    },
    {
      id: 40,
      dimension: "X",
      facet: "sociability",
      text: "I enjoy having lots of people around to talk with.",
      textByLocale: {
        hu: "Szeretem, ha sokan vesznek körül és élénk beszélgetés folyik.",
        en: "I enjoy having lots of people around to talk with.",
      },
      textObserver: "He/she enjoys having lots of people around to talk with.",
      textObserverByLocale: {
        en: "He/she enjoys having lots of people around to talk with.",
        hu: "Szereti, ha sokan veszik körül és élénk beszélgetés folyik.",
      },
    },
    {
      id: 41,
      dimension: "E",
      facet: "dependence",
      text: "I can handle difficult situations without needing emotional support from anyone else.",
      textByLocale: {
        hu: "Nehezebb helyzetekkel is elboldogulok anélkül, hogy érzelmi támogatásra lenne szükségem.",
        en: "I can handle difficult situations without needing emotional support from anyone else.",
      },
      textObserver: "He/she can handle difficult situations without needing emotional support from anyone else.",
      textObserverByLocale: {
        en: "He/she can handle difficult situations without needing emotional support from anyone else.",
        hu: "Nehezebb helyzetekkel is elboldogul anélkül, hogy érzelmi támogatásra lenne szüksége.",
      },
      reversed: true,
    },
    {
      id: 42,
      dimension: "H",
      facet: "greed_avoidance",
      text: "I would like to live in a very expensive, high-class neighborhood.",
      textByLocale: {
        hu: "Szívesen laknék egy gazdag és előkelő negyedben.",
        en: "I would like to live in a very expensive, high-class neighborhood.",
      },
      textObserver: "He/she would like to live in a very expensive, high-class neighborhood.",
      textObserverByLocale: {
        en: "He/she would like to live in a very expensive, high-class neighborhood.",
        hu: "Szívesen lakna egy gazdag és előkelő negyedben.",
      },
      reversed: true,
    },
    {
      id: 43,
      dimension: "O",
      facet: "unconventionality",
      text: "I like people who have unconventional views.",
      textByLocale: {
        hu: "Nekem szimpatikusak azok az emberek, akiknek eredeti, az átlagtól eltérő nézeteik vannak.",
        en: "I like people who have unconventional views.",
      },
      textObserver: "He/she likes people who have unconventional views.",
      textObserverByLocale: {
        en: "He/she likes people who have unconventional views.",
        hu: "Szimpatikusak számára azok az emberek, akiknek eredeti, az átlagtól eltérő nézeteik vannak.",
      },
    },
    {
      id: 44,
      dimension: "C",
      facet: "prudence",
      text: "I make a lot of mistakes because I don't think before I act.",
      textByLocale: {
        hu: "Sok hibát követek el, mert előbb cselekszem és csak aztán gondolkodom.",
        en: "I make a lot of mistakes because I don't think before I act.",
      },
      textObserver: "He/she makes a lot of mistakes because he/she doesn't think before he/she acts.",
      textObserverByLocale: {
        en: "He/she makes a lot of mistakes because he/she doesn't think before he/she acts.",
        hu: "Sok hibát követ el, mert előbb cselekszik és csak aztán gondolkodik.",
      },
      reversed: true,
    },
    {
      id: 45,
      dimension: "A",
      facet: "patience",
      text: "I rarely feel anger, even when people treat me quite badly.",
      textByLocale: {
        hu: "Nem szoktam felkapni a vizet akkor sem, ha valaki rosszul bánik velem.",
        en: "I rarely feel anger, even when people treat me quite badly.",
      },
      textObserver: "He/she rarely feels anger, even when people treat him/her quite badly.",
      textObserverByLocale: {
        en: "He/she rarely feels anger, even when people treat him/her quite badly.",
        hu: "Nem szokta felkapni a vizet akkor sem, ha valaki rosszul bánik vele.",
      },
    },
    {
      id: 46,
      dimension: "X",
      facet: "liveliness",
      text: "On most days, I feel cheerful and optimistic.",
      textByLocale: {
        hu: "Többnyire vidám és optimista vagyok.",
        en: "On most days, I feel cheerful and optimistic.",
      },
      textObserver: "On most days, he/she feels cheerful and optimistic.",
      textObserverByLocale: {
        en: "On most days, he/she feels cheerful and optimistic.",
        hu: "Többnyire vidám és optimista.",
      },
    },
    {
      id: 47,
      dimension: "E",
      facet: "sentimentality",
      text: "When someone I know well is unhappy, I can almost feel that person's pain myself.",
      textByLocale: {
        hu: "Ha valaki, akit jól ismerek, el van keseredve, szinte fizikailag érzem a fájdalmát.",
        en: "When someone I know well is unhappy, I can almost feel that person's pain myself.",
      },
      textObserver: "When someone he/she knows well is unhappy, he/she can almost feel that person's pain himself/herself.",
      textObserverByLocale: {
        en: "When someone he/she knows well is unhappy, he/she can almost feel that person's pain himself/herself.",
        hu: "Ha valaki, akit jól ismer, el van keseredve, szinte fizikailag érzi a fájdalmát.",
      },
    },
    {
      id: 48,
      dimension: "H",
      facet: "modesty",
      text: "I wouldn't want people to treat me as though I were superior to them.",
      textByLocale: {
        hu: "Nem szeretném, ha mások jobbnak tartanának maguknál.",
        en: "I wouldn't want people to treat me as though I were superior to them.",
      },
      textObserver: "He/she wouldn't want people to treat him/her as though he/she were superior to them.",
      textObserverByLocale: {
        en: "He/she wouldn't want people to treat him/her as though he/she were superior to them.",
        hu: "Nem szeretné, ha mások jobbnak tartanák maguknál.",
      },
    },
    {
      id: 49,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "If I had the opportunity, I would like to attend a classical music concert.",
      textByLocale: {
        hu: "Ha az alkalom úgy hozná, szívesen elmennék egy klasszikus koncertre.",
        en: "If I had the opportunity, I would like to attend a classical music concert.",
      },
      textObserver: "If he/she had the opportunity, he/she would like to attend a classical music concert.",
      textObserverByLocale: {
        en: "If he/she had the opportunity, he/she would like to attend a classical music concert.",
        hu: "Ha az alkalom úgy hozná, szívesen elmenne egy klasszikus koncertre.",
      },
    },
    {
      id: 50,
      dimension: "C",
      facet: "organization",
      text: "People often joke with me about the messiness of my room or desk.",
      textByLocale: {
        hu: "Mások sokszor ugratnak a rendetlenségem miatt.",
        en: "People often joke with me about the messiness of my room or desk.",
      },
      textObserver: "People often joke with him/her about the messiness of his/her room or desk.",
      textObserverByLocale: {
        en: "People often joke with him/her about the messiness of his/her room or desk.",
        hu: "Mások sokszor ugratják a rendetlensége miatt.",
      },
      reversed: true,
    },
    {
      id: 51,
      dimension: "A",
      facet: "forgiveness",
      text: "If someone has cheated me once, I will always feel suspicious of that person.",
      textByLocale: {
        hu: "Ha valaki egyszer már átvert, azzal szemben mindig is gyanakvó maradok.",
        en: "If someone has cheated me once, I will always feel suspicious of that person.",
      },
      textObserver: "If someone has cheated him/her once, he/she will always feel suspicious of that person.",
      textObserverByLocale: {
        en: "If someone has cheated him/her once, he/she will always feel suspicious of that person.",
        hu: "Ha valaki egyszer már átverte, azzal szemben mindig is gyanakvó marad.",
      },
      reversed: true,
    },
    {
      id: 52,
      dimension: "X",
      facet: "social_self_esteem",
      text: "I feel that I am an unpopular person.",
      textByLocale: {
        hu: "Úgy érzem, hogy népszerűtlen vagyok.",
        en: "I feel that I am an unpopular person.",
      },
      textObserver: "He/she feels that he/she is an unpopular person.",
      textObserverByLocale: {
        en: "He/she feels that he/she is an unpopular person.",
        hu: "Úgy érzi, hogy népszerűtlen.",
      },
      reversed: true,
    },
    {
      id: 53,
      dimension: "E",
      facet: "fearfulness",
      text: "When it comes to physical danger, I am very fearful.",
      textByLocale: {
        hu: "Testi épségemet veszélyeztető helyzetekben nagyon félek.",
        en: "When it comes to physical danger, I am very fearful.",
      },
      textObserver: "When it comes to physical danger, he/she is very fearful.",
      textObserverByLocale: {
        en: "When it comes to physical danger, he/she is very fearful.",
        hu: "Testi épségét veszélyeztető helyzetekben nagyon fél.",
      },
    },
    {
      id: 54,
      dimension: "H",
      facet: "sincerity",
      text: "If I want something from someone, I will laugh at that person's worst jokes.",
      textByLocale: {
        hu: "Ha valakitől valamit akarok, akkor még a faviccein is képes vagyok nevetni.",
        en: "If I want something from someone, I will laugh at that person's worst jokes.",
      },
      textObserver: "If he/she wants something from someone, he/she will laugh at that person's worst jokes.",
      textObserverByLocale: {
        en: "If he/she wants something from someone, he/she will laugh at that person's worst jokes.",
        hu: "Ha valakitől valamit akar, akkor még a faviccein is képes nevetni.",
      },
      reversed: true,
    },
    {
      id: 55,
      dimension: "O",
      facet: "inquisitiveness",
      text: "I would be very bored by a book about the history of science and technology.",
      textByLocale: {
        hu: "Egy, a tudomány és technika történetéről szóló könyv, a végletekig untatna.",
        en: "I would be very bored by a book about the history of science and technology.",
      },
      textObserver: "He/she would be very bored by a book about the history of science and technology.",
      textObserverByLocale: {
        en: "He/she would be very bored by a book about the history of science and technology.",
        hu: "Egy, a tudomány és technika történetéről szóló könyv, a végletekig untatná.",
      },
      reversed: true,
    },
    {
      id: 56,
      dimension: "C",
      facet: "diligence",
      text: "Often when I set a goal, I end up quitting without having reached it.",
      textByLocale: {
        hu: "Ha kitűzök egy célt magam elé, gyakran feladom mielőtt elérném.",
        en: "Often when I set a goal, I end up quitting without having reached it.",
      },
      textObserver: "Often when he/she sets a goal, he/she ends up quitting without having reached it.",
      textObserverByLocale: {
        en: "Often when he/she sets a goal, he/she ends up quitting without having reached it.",
        hu: "Ha kitűz egy célt maga elé, gyakran feladja, mielőtt elérné.",
      },
      reversed: true,
    },
    {
      id: 57,
      dimension: "A",
      facet: "gentleness",
      text: "I tend to be lenient in judging other people.",
      textByLocale: {
        hu: "Jobbára jóindulattal ítélkezem mások felett.",
        en: "I tend to be lenient in judging other people.",
      },
      textObserver: "He/she tends to be lenient in judging other people.",
      textObserverByLocale: {
        en: "He/she tends to be lenient in judging other people.",
        hu: "Jobbára jóindulattal ítélkezik mások felett.",
      },
    },
    {
      id: 58,
      dimension: "X",
      facet: "social_boldness",
      text: "When I'm in a group of people, I'm often the one who speaks on behalf of the group.",
      textByLocale: {
        hu: "Ha egy csoport tagja vagyok, gyakran leszek a szóvivője is.",
        en: "When I'm in a group of people, I'm often the one who speaks on behalf of the group.",
      },
      textObserver: "When he/she is in a group of people, he/she is often the one who speaks on behalf of the group.",
      textObserverByLocale: {
        en: "When he/she is in a group of people, he/she is often the one who speaks on behalf of the group.",
        hu: "Ha egy csoport tagja, gyakran lesz a szóvivője is.",
      },
    },
    {
      id: 59,
      dimension: "E",
      facet: "anxiety",
      text: "I rarely, if ever, have trouble sleeping due to stress or anxiety.",
      textByLocale: {
        hu: "Szinte sosincs gondom az alvással stressz vagy szorongás miatt.",
        en: "I rarely, if ever, have trouble sleeping due to stress or anxiety.",
      },
      textObserver: "He/she rarely, if ever, has trouble sleeping due to stress or anxiety.",
      textObserverByLocale: {
        en: "He/she rarely, if ever, has trouble sleeping due to stress or anxiety.",
        hu: "Szinte sosincs gondja az alvással stressz vagy szorongás miatt.",
      },
      reversed: true,
    },
    {
      id: 60,
      dimension: "H",
      facet: "fairness",
      text: "I would never accept a bribe, even if it were very large.",
      textByLocale: {
        hu: "Sosem hagynám magam megvesztegetni, mindegy mekkora is lenne az az ajánlat.",
        en: "I would never accept a bribe, even if it were very large.",
      },
      textObserver: "He/she would never accept a bribe, even if it were very large.",
      textObserverByLocale: {
        en: "He/she would never accept a bribe, even if it were very large.",
        hu: "Sosem hagyná magát megvesztegetni, mindegy mekkora is lenne az az ajánlat.",
      },
    },
    {
      id: 61,
      dimension: "O",
      facet: "creativity",
      text: "People have often told me that I have a good imagination.",
      textByLocale: {
        hu: "Sokszor mondták már nekem, hogy jó a fantáziám.",
        en: "People have often told me that I have a good imagination.",
      },
      textObserver: "He/she has a good imagination.",
      textObserverByLocale: {
        en: "He/she has a good imagination.",
        hu: "Sokszor mondták már neki, hogy jó a fantáziája.",
      },
    },
    {
      id: 62,
      dimension: "C",
      facet: "perfectionism",
      text: "I always try to be accurate in my work, even at the expense of time.",
      textByLocale: {
        hu: "A munkámban megpróbálok még akkor is mindig precíznek lenni, ha ez többletidőmbe kerül.",
        en: "I always try to be accurate in my work, even at the expense of time.",
      },
      textObserver: "He/she always tries to be accurate in his/her work, even at the expense of time.",
      textObserverByLocale: {
        en: "He/she always tries to be accurate in his/her work, even at the expense of time.",
        hu: "A munkájában megpróbál még akkor is mindig precíz lenni, ha ez többletidejébe kerül.",
      },
    },
    {
      id: 63,
      dimension: "A",
      facet: "flexibility",
      text: "When people tell me that I'm wrong, my first reaction is to argue with them.",
      textByLocale: {
        hu: "Ha azt mondják, hogy nincs igazam, az első reakcióm, hogy vitába szállok.",
        en: "When people tell me that I'm wrong, my first reaction is to argue with them.",
      },
      textObserver: "When people tell him/her that he/she is wrong, his/her first reaction is to argue with them.",
      textObserverByLocale: {
        en: "When people tell him/her that he/she is wrong, his/her first reaction is to argue with them.",
        hu: "Ha azt mondják, hogy nincs igaza, az első reakciója, hogy vitába száll.",
      },
      reversed: true,
    },
    {
      id: 64,
      dimension: "X",
      facet: "sociability",
      text: "I prefer jobs that involve active social interaction to those that involve working alone.",
      textByLocale: {
        hu: "Inkább az olyan munkákat szeretem ahol emberekkel kell foglalkozni, mint ahol egyedül kell dolgozni.",
        en: "I prefer jobs that involve active social interaction to those that involve working alone.",
      },
      textObserver: "He/she prefers jobs that involve active social interaction to those that involve working alone.",
      textObserverByLocale: {
        en: "He/she prefers jobs that involve active social interaction to those that involve working alone.",
        hu: "Inkább az olyan munkákat szereti, ahol emberekkel kell foglalkozni, mint ahol egyedül kell dolgozni.",
      },
    },
    {
      id: 65,
      dimension: "E",
      facet: "dependence",
      text: "Whenever I feel worried about something, I want to share my concern with another person.",
      textByLocale: {
        hu: "Ha valami aggaszt, szeretem megosztani valakivel a gondom.",
        en: "Whenever I feel worried about something, I want to share my concern with another person.",
      },
      textObserver: "Whenever he/she feels worried about something, he/she wants to share his/her concern with another person.",
      textObserverByLocale: {
        en: "Whenever he/she feels worried about something, he/she wants to share his/her concern with another person.",
        hu: "Ha valami aggasztja, szereti megosztani valakivel a gondját.",
      },
    },
    {
      id: 66,
      dimension: "H",
      facet: "greed_avoidance",
      text: "I would like to be seen driving around in a very expensive car.",
      textByLocale: {
        hu: "Jó lenne, ha az emberek látnák, amint egy jó drága autóban ülve vezetek.",
        en: "I would like to be seen driving around in a very expensive car.",
      },
      textObserver: "He/she would like to be seen driving around in a very expensive car.",
      textObserverByLocale: {
        en: "He/she would like to be seen driving around in a very expensive car.",
        hu: "Örülne, ha az emberek látnák, amint egy jó drága autóban ülve vezet.",
      },
      reversed: true,
    },
    {
      id: 67,
      dimension: "O",
      facet: "unconventionality",
      text: "I think of myself as a somewhat eccentric person.",
      textByLocale: {
        hu: "Azt hiszem, kissé különc vagyok.",
        en: "I think of myself as a somewhat eccentric person.",
      },
      textObserver: "I think of him/her as a somewhat eccentric person.",
      textObserverByLocale: {
        en: "I think of him/her as a somewhat eccentric person.",
        hu: "Kissé különcnek tartja magát.",
      },
    },
    {
      id: 68,
      dimension: "C",
      facet: "prudence",
      text: "I don't allow my impulses to govern my behavior.",
      textByLocale: {
        hu: "Nem engedem, hogy a pillanatnyi érzelmeim irányítsák a viselkedésem.",
        en: "I don't allow my impulses to govern my behavior.",
      },
      textObserver: "He/she doesn't allow his/her impulses to govern his/her behavior.",
      textObserverByLocale: {
        en: "He/she doesn't allow his/her impulses to govern his/her behavior.",
        hu: "Nem engedi, hogy a pillanatnyi érzelmei irányítsák a viselkedését.",
      },
    },
    {
      id: 69,
      dimension: "A",
      facet: "patience",
      text: "Most people tend to get angry more quickly than I do.",
      textByLocale: {
        hu: "A legtöbb embert könnyebb felbosszantani, mint engem.",
        en: "Most people tend to get angry more quickly than I do.",
      },
      textObserver: "Most people tend to get angry more quickly than he/she does.",
      textObserverByLocale: {
        en: "Most people tend to get angry more quickly than he/she does.",
        hu: "A legtöbb embert könnyebb felbosszantani, mint őt.",
      },
    },
    {
      id: 70,
      dimension: "X",
      facet: "liveliness",
      text: "People often tell me that I should try to cheer up.",
      textByLocale: {
        hu: "Sokszor mondják nekem, hogy ne legyek olyan búval bélelt.",
        en: "People often tell me that I should try to cheer up.",
      },
      textObserver: "People often tell him/her that he/she should try to cheer up.",
      textObserverByLocale: {
        en: "People often tell him/her that he/she should try to cheer up.",
        hu: "Sokszor mondják neki, hogy ne legyen olyan búval bélelt.",
      },
      reversed: true,
    },
    {
      id: 71,
      dimension: "E",
      facet: "sentimentality",
      text: "I feel strong emotions when someone close to me is going away for a long time.",
      textByLocale: {
        hu: "Nagyon megindít, ha hozzám közelálló személyektől kell hosszú távra elbúcsúznom.",
        en: "I feel strong emotions when someone close to me is going away for a long time.",
      },
      textObserver: "He/she feels strong emotions when someone close to him/her is going away for a long time.",
      textObserverByLocale: {
        en: "He/she feels strong emotions when someone close to him/her is going away for a long time.",
        hu: "Nagyon megindítja, ha hozzá közelálló személyektől kell hosszú távra elbúcsúznia.",
      },
    },
    {
      id: 72,
      dimension: "H",
      facet: "modesty",
      text: "I think that I am entitled to more respect than the average person is.",
      textByLocale: {
        hu: "Úgy érzem, hogy több elismerés jár nekem mint egy átlagembernek.",
        en: "I think that I am entitled to more respect than the average person is.",
      },
      textObserver: "He/she thinks that he/she is entitled to more respect than the average person is.",
      textObserverByLocale: {
        en: "He/she thinks that he/she is entitled to more respect than the average person is.",
        hu: "Úgy érzi, hogy több elismerés jár neki, mint egy átlagembernek.",
      },
      reversed: true,
    },
    {
      id: 73,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "Sometimes I like to just watch the wind as it blows through the trees.",
      textByLocale: {
        hu: "Néha szeretem nézni, ahogy a szél bolyong a fák között.",
        en: "Sometimes I like to just watch the wind as it blows through the trees.",
      },
      textObserver: "Sometimes he/she likes to just watch the wind as it blows through the trees.",
      textObserverByLocale: {
        en: "Sometimes he/she likes to just watch the wind as it blows through the trees.",
        hu: "Néha szereti nézni, ahogy a szél bolyong a fák között.",
      },
    },
    {
      id: 74,
      dimension: "C",
      facet: "organization",
      text: "When working, I sometimes have difficulties due to being disorganized.",
      textByLocale: {
        hu: "A munkámban néha hátráltat, hogy nem vagyok jól szervezett.",
        en: "When working, I sometimes have difficulties due to being disorganized.",
      },
      textObserver: "When working, he/she sometimes has difficulties due to being disorganized.",
      textObserverByLocale: {
        en: "When working, he/she sometimes has difficulties due to being disorganized.",
        hu: "A munkájában néha hátráltatja, hogy nem jól szervezett.",
      },
      reversed: true,
    },
    {
      id: 75,
      dimension: "A",
      facet: "forgiveness",
      text: "I find it hard to fully forgive someone who has done something mean to me.",
      textByLocale: {
        hu: "Nehezemre esik teljes szívből megbocsátani, ha csúnyán megbántottak.",
        en: "I find it hard to fully forgive someone who has done something mean to me.",
      },
      textObserver: "He/she finds it hard to fully forgive someone who has done something mean to him/her.",
      textObserverByLocale: {
        en: "He/she finds it hard to fully forgive someone who has done something mean to him/her.",
        hu: "Nehéz számára teljes szívből megbocsátani, ha csúnyán megbántották.",
      },
      reversed: true,
    },
    {
      id: 76,
      dimension: "X",
      facet: "social_self_esteem",
      text: "I sometimes feel that I am a worthless person.",
      textByLocale: {
        hu: "Néha az az érzésem, hogy értéktelen ember vagyok.",
        en: "I sometimes feel that I am a worthless person.",
      },
      textObserver: "He/she sometimes feels that he/she is a worthless person.",
      textObserverByLocale: {
        en: "He/she sometimes feels that he/she is a worthless person.",
        hu: "Néha az az érzése, hogy értéktelen ember.",
      },
      reversed: true,
    },
    {
      id: 77,
      dimension: "E",
      facet: "fearfulness",
      text: "Even in an emergency I wouldn't feel like panicking.",
      textByLocale: {
        hu: "Még egy vészhelyzetben sem veszteném el a fejem.",
        en: "Even in an emergency I wouldn't feel like panicking.",
      },
      textObserver: "Even in an emergency he/she wouldn't feel like panicking.",
      textObserverByLocale: {
        en: "Even in an emergency he/she wouldn't feel like panicking.",
        hu: "Még egy vészhelyzetben sem vesztené el a fejét.",
      },
      reversed: true,
    },
    {
      id: 78,
      dimension: "H",
      facet: "sincerity",
      text: "I wouldn't pretend to like someone just to get that person to do favors for me.",
      textByLocale: {
        hu: "Nem tettetném, hogy kedvelek valakit csak azért, hogy rávegyem egy szívességre.",
        en: "I wouldn't pretend to like someone just to get that person to do favors for me.",
      },
      textObserver: "He/she wouldn't pretend to like someone just to get that person to do favors for him/her.",
      textObserverByLocale: {
        en: "He/she wouldn't pretend to like someone just to get that person to do favors for him/her.",
        hu: "Nem tettetné, hogy kedvel valakit, csak azért, hogy rávegye egy szívességre.",
      },
    },
    {
      id: 79,
      dimension: "O",
      facet: "inquisitiveness",
      text: "I've never really enjoyed looking through an encyclopedia.",
      textByLocale: {
        hu: "Igazából még sohasem lapozgattam élvezettel egy lexikonban.",
        en: "I've never really enjoyed looking through an encyclopedia.",
      },
      textObserver: "He/she has never really enjoyed looking through an encyclopedia.",
      textObserverByLocale: {
        en: "He/she has never really enjoyed looking through an encyclopedia.",
        hu: "Valószínű még sohasem lapozgatott élvezettel egy lexikonban.",
      },
      reversed: true,
    },
    {
      id: 80,
      dimension: "C",
      facet: "diligence",
      text: "I do only the minimum amount of work needed to get by.",
      textByLocale: {
        hu: "Ami a munkát illeti, csak a legszükségesebb erőfeszítéssel dolgozom.",
        en: "I do only the minimum amount of work needed to get by.",
      },
      textObserver: "He/she does only the minimum amount of work needed to get by.",
      textObserverByLocale: {
        en: "He/she does only the minimum amount of work needed to get by.",
        hu: "Ami a munkát illeti, csak a legszükségesebb erőfeszítéssel dolgozik.",
      },
      reversed: true,
    },
    {
      id: 81,
      dimension: "A",
      facet: "gentleness",
      text: "Even when people make a lot of mistakes, I rarely say anything negative.",
      textByLocale: {
        hu: "Még akkor sem nyilatkozom másokról negatívan, ha sok hibát követnek el.",
        en: "Even when people make a lot of mistakes, I rarely say anything negative.",
      },
      textObserver: "Even when people make a lot of mistakes, he/she rarely says anything negative.",
      textObserverByLocale: {
        en: "Even when people make a lot of mistakes, he/she rarely says anything negative.",
        hu: "Még akkor sem nyilatkozik másokról negatívan, ha sok hibát követnek el.",
      },
    },
    {
      id: 82,
      dimension: "X",
      facet: "social_boldness",
      text: "I tend to feel quite self-conscious when speaking in front of a group of people.",
      textByLocale: {
        hu: "Nem szeretek sok ember előtt felszólalni vagy beszédet tartani.",
        en: "I tend to feel quite self-conscious when speaking in front of a group of people.",
      },
      textObserver: "He/she tends to feel quite self-conscious when speaking in front of a group of people.",
      textObserverByLocale: {
        en: "He/she tends to feel quite self-conscious when speaking in front of a group of people.",
        hu: "Nem szeret sok ember előtt felszólalni vagy beszédet tartani.",
      },
      reversed: true,
    },
    {
      id: 83,
      dimension: "E",
      facet: "anxiety",
      text: "I get very anxious when waiting to hear about an important decision.",
      textByLocale: {
        hu: "Nagyon izgulok, ha egy fontos döntés eredményére kell várnom.",
        en: "I get very anxious when waiting to hear about an important decision.",
      },
      textObserver: "He/she gets very anxious when waiting to hear about an important decision.",
      textObserverByLocale: {
        en: "He/she gets very anxious when waiting to hear about an important decision.",
        hu: "Nagyon izgul, ha egy fontos döntés eredményére kell várnia.",
      },
    },
    {
      id: 84,
      dimension: "H",
      facet: "fairness",
      text: "I'd be tempted to use counterfeit money, if I were sure I could get away with it.",
      textByLocale: {
        hu: "Kísértésbe vinne, hogy hamisított pénzt használjak, ha tudnám, biztos nem buknék le vele.",
        en: "I'd be tempted to use counterfeit money, if I were sure I could get away with it.",
      },
      textObserver: "He/she'd be tempted to use counterfeit money, if he/she were sure he/she could get away with it.",
      textObserverByLocale: {
        en: "He/she'd be tempted to use counterfeit money, if he/she were sure he/she could get away with it.",
        hu: "Kísértésbe vinné, hogy hamisított pénzt használjon, ha tudná, biztosan nem bukna le vele.",
      },
      reversed: true,
    },
    {
      id: 85,
      dimension: "O",
      facet: "creativity",
      text: "I don't think of myself as the artistic or creative type.",
      textByLocale: {
        hu: "Nem hiszem, hogy én egy kreatív vagy művészileg tehetséges típus vagyok.",
        en: "I don't think of myself as the artistic or creative type.",
      },
      textObserver: "I don't think of him/her as the artistic or creative type.",
      textObserverByLocale: {
        en: "I don't think of him/her as the artistic or creative type.",
        hu: "Nem hiszi, hogy kreatív vagy művészileg tehetséges típus lenne.",
      },
      reversed: true,
    },
    {
      id: 86,
      dimension: "C",
      facet: "perfectionism",
      text: "People often call me a perfectionist.",
      textByLocale: {
        hu: "Az emberek gyakran tartanak perfekcionistának.",
        en: "People often call me a perfectionist.",
      },
      textObserver: "People often call him/her a perfectionist.",
      textObserverByLocale: {
        en: "People often call him/her a perfectionist.",
        hu: "Az emberek gyakran tartják perfekcionistának.",
      },
    },
    {
      id: 87,
      dimension: "A",
      facet: "flexibility",
      text: "I find it hard to compromise with people when I really think I'm right.",
      textByLocale: {
        hu: "Nehezemre esik másokkal kompromisszumot kötni, amikor tényleg úgy érzem, hogy igazam van.",
        en: "I find it hard to compromise with people when I really think I'm right.",
      },
      textObserver: "He/she finds it hard to compromise with people when he/she really thinks he/she is right.",
      textObserverByLocale: {
        en: "He/she finds it hard to compromise with people when he/she really thinks he/she is right.",
        hu: "Nehezére esik neki másokkal kompromisszumot kötni, amikor úgy érzi, hogy igaza van.",
      },
      reversed: true,
    },
    {
      id: 88,
      dimension: "X",
      facet: "sociability",
      text: "The first thing that I always do in a new place is to make friends.",
      textByLocale: {
        hu: "Ha egy új helyre kerülök, hamarosan új barátságokat is kötök.",
        en: "The first thing that I always do in a new place is to make friends.",
      },
      textObserver: "The first thing that he/she always does in a new place is to make friends.",
      textObserverByLocale: {
        en: "The first thing that he/she always does in a new place is to make friends.",
        hu: "Ha egy új helyre kerül, hamarosan új barátságokat is köt.",
      },
    },
    {
      id: 89,
      dimension: "E",
      facet: "dependence",
      text: "I rarely discuss my problems with other people.",
      textByLocale: {
        hu: "Szinte sosem vitatom meg másokkal a problémáimat.",
        en: "I rarely discuss my problems with other people.",
      },
      textObserver: "He/she rarely discusses his/her problems with other people.",
      textObserverByLocale: {
        en: "He/she rarely discusses his/her problems with other people.",
        hu: "Szinte sosem vitatja meg másokkal a problémáit.",
      },
      reversed: true,
    },
    {
      id: 90,
      dimension: "H",
      facet: "greed_avoidance",
      text: "I would get a lot of pleasure from owning expensive luxury goods.",
      textByLocale: {
        hu: "Nagyon örülnék neki, ha méregdrága, luxus cuccaim lennének.",
        en: "I would get a lot of pleasure from owning expensive luxury goods.",
      },
      textObserver: "He/she would get a lot of pleasure from owning expensive luxury goods.",
      textObserverByLocale: {
        en: "He/she would get a lot of pleasure from owning expensive luxury goods.",
        hu: "Nagyon örülne neki, ha méregdrága, luxus cuccai lennének.",
      },
      reversed: true,
    },
    {
      id: 91,
      dimension: "O",
      facet: "unconventionality",
      text: "I find it boring to discuss philosophy.",
      textByLocale: {
        hu: "A filozófiai eszmecseréket unalmasnak tartom.",
        en: "I find it boring to discuss philosophy.",
      },
      textObserver: "He/she finds it boring to discuss philosophy.",
      textObserverByLocale: {
        en: "He/she finds it boring to discuss philosophy.",
        hu: "A filozófiai eszmecseréket unalmasnak tartja.",
      },
      reversed: true,
    },
    {
      id: 92,
      dimension: "C",
      facet: "prudence",
      text: "I prefer to do whatever comes to mind, rather than stick to a plan.",
      textByLocale: {
        hu: "Inkább spontán szeretek cselekedni, mint mindent előre eltervezni.",
        en: "I prefer to do whatever comes to mind, rather than stick to a plan.",
      },
      textObserver: "He/she prefers to do whatever comes to mind, rather than stick to a plan.",
      textObserverByLocale: {
        en: "He/she prefers to do whatever comes to mind, rather than stick to a plan.",
        hu: "Inkább spontán szeret cselekedni, mint mindent előre eltervezni.",
      },
      reversed: true,
    },
    {
      id: 93,
      dimension: "A",
      facet: "patience",
      text: "I find it hard to keep my temper when people insult me.",
      textByLocale: {
        hu: "Nehezemre esik uralkodni magamon, ha megsértenek.",
        en: "I find it hard to keep my temper when people insult me.",
      },
      textObserver: "He/she finds it hard to keep his/her temper when people insult him/her.",
      textObserverByLocale: {
        en: "He/she finds it hard to keep his/her temper when people insult him/her.",
        hu: "Nehezére esik neki uralkodni magán, ha megsértik.",
      },
      reversed: true,
    },
    {
      id: 94,
      dimension: "X",
      facet: "liveliness",
      text: "Most people are more upbeat and dynamic than I generally am.",
      textByLocale: {
        hu: "A legtöbb ember dinamikusabb és élettelibb, mint én.",
        en: "Most people are more upbeat and dynamic than I generally am.",
      },
      textObserver: "Most people are more upbeat and dynamic than he/she generally is.",
      textObserverByLocale: {
        en: "Most people are more upbeat and dynamic than he/she generally is.",
        hu: "A legtöbb ember dinamikusabb és élettelibb nála.",
      },
      reversed: true,
    },
    {
      id: 95,
      dimension: "E",
      facet: "sentimentality",
      text: "I remain unemotional even in situations where most people get very sentimental.",
      textByLocale: {
        hu: "Semleges maradok olyan helyzetekben is, ahol mások érzelmessé válnak.",
        en: "I remain unemotional even in situations where most people get very sentimental.",
      },
      textObserver: "He/she remains unemotional even in situations where most people get very sentimental.",
      textObserverByLocale: {
        en: "He/she remains unemotional even in situations where most people get very sentimental.",
        hu: "Semleges marad olyan helyzetekben is, ahol mások érzelmessé válnak.",
      },
      reversed: true,
    },
    {
      id: 96,
      dimension: "H",
      facet: "modesty",
      text: "I want people to know that I am an important person of high status.",
      textByLocale: {
        hu: "Azt szeretném, ha mások fontos és magas pozícióban lévő embernek tartanának.",
        en: "I want people to know that I am an important person of high status.",
      },
      textObserver: "He/she wants people to know that he/she is an important person of high status.",
      textObserverByLocale: {
        en: "He/she wants people to know that he/she is an important person of high status.",
        hu: "Azt szeretné, ha mások fontos és magas pozícióban lévő embernek tartanák.",
      },
      reversed: true,
    },
    {
      id: 97,
      dimension: "I",
      facet: "altruism",
      text: "I have sympathy for people who are less fortunate than I am.",
      textByLocale: {
        hu: "Együttérzéssel tölt el, ha látom, másoknak kevesebb szerencse jutott az életben.",
        en: "I have sympathy for people who are less fortunate than I am.",
      },
      textObserver: "He/she has sympathy for people who are less fortunate than he/she is.",
      textObserverByLocale: {
        en: "He/she has sympathy for people who are less fortunate than he/she is.",
        hu: "Együttérzéssel tölti el, ha látja, másoknak kevesebb szerencse jutott az életben.",
      },
    },
    {
      id: 98,
      dimension: "I",
      facet: "altruism",
      text: "I try to give generously to those in need.",
      textByLocale: {
        hu: "Megpróbálok adakozni a rászorulóknak.",
        en: "I try to give generously to those in need.",
      },
      textObserver: "He/she tries to give generously to those in need.",
      textObserverByLocale: {
        en: "He/she tries to give generously to those in need.",
        hu: "Megpróbál adakozni a rászorulóknak.",
      },
    },
    {
      id: 99,
      dimension: "I",
      facet: "altruism",
      text: "It wouldn't bother me to harm someone I didn't like.",
      textByLocale: {
        hu: "Nem okozna lelkiismeret-furdalást, ha megbántanék valakit, akit nem kedvelek.",
        en: "It wouldn't bother me to harm someone I didn't like.",
      },
      textObserver: "It wouldn't bother him/her to harm someone he/she didn't like.",
      textObserverByLocale: {
        en: "It wouldn't bother him/her to harm someone he/she didn't like.",
        hu: "Nem okozna lelkiismeret-furdalást neki, ha megbántana valakit, akit nem kedvel.",
      },
      reversed: true,
    },
    {
      id: 100,
      dimension: "I",
      facet: "altruism",
      text: "People see me as a hard-hearted person.",
      textByLocale: {
        hu: "Keményszívű embernek tartanak.",
        en: "People see me as a hard-hearted person.",
      },
      textObserver: "People see him/her as a hard-hearted person.",
      textObserverByLocale: {
        en: "People see him/her as a hard-hearted person.",
        hu: "Keményszívű embernek tartják.",
      },
      reversed: true,
    },
  ],
};
