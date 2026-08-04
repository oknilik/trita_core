// A wizard-iparágak kulcsai és ISCO-tájolása. A scope-szűrés NEM ezen fut —
// azt a katalógus tételes `occupation.industries` címkéi adják
// (scripts/career-catalog/step10_industry_tags.py); ez a térkép a címke-
// generálás egyik forrása és az API-séma kulcslistája.

export const INDUSTRY_ISCO: Record<string, string[]> = {
  // IT / szoftver
  tech: ["25", "35"],
  // Egészségügy / gondoskodás
  health: ["22", "32", "53"],
  // Oktatás / képzés
  education: ["23", "34"],
  // Pénzügy / számvitel
  finance: ["24", "33", "41", "42"],
  // Értékesítés / ügyfélkapcsolat
  sales: ["52", "42", "33"],
  // Marketing / kreatív
  creative: ["21", "26", "34"],
  // Média / kommunikáció
  media: ["26", "34", "35"],
  // Gyártás / logisztika
  operations: ["31", "81", "82", "83", "93"],
  // HR / szervezetfejlesztés
  people: ["12", "24", "33"],
  // Jog / közszféra
  public: ["26", "33", "34", "54", "11"],
  // Építőipar / mérnöki
  engineering: ["21", "31", "71", "72"],
  // Vendéglátás / turizmus
  hospitality: ["34", "51", "94"],
  // Tudomány / kutatás
  science: ["21", "22", "31"],
  // Szakmák / ipar
  trades: ["71", "72", "73", "74", "75"],
  // Közlekedés / szállítmányozás
  transport: ["83", "43", "93"],
  // Személyi szolgáltatás / wellness
  services: ["51", "53", "91"],
};
