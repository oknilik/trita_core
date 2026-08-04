import type { Locale } from "@/lib/i18n";

interface Country {
  code: string;
  hu: string;
  en: string;
}

const COUNTRIES: Country[] = [
  { code: "HU", hu: "Magyarorszag", en: "Hungary" },
  { code: "AT", hu: "Ausztria", en: "Austria" },
  { code: "DE", hu: "Nemetorszag", en: "Germany" },
  { code: "SK", hu: "Szlovakia", en: "Slovakia" },
  { code: "RO", hu: "Romania", en: "Romania" },
  { code: "HR", hu: "Horvatorszag", en: "Croatia" },
  { code: "RS", hu: "Szerbia", en: "Serbia" },
  { code: "SI", hu: "Szlovenia", en: "Slovenia" },
  { code: "UA", hu: "Ukrajna", en: "Ukraine" },
  { code: "CZ", hu: "Csehorszag", en: "Czechia" },
  { code: "PL", hu: "Lengyelorszag", en: "Poland" },
  { code: "CH", hu: "Svajc", en: "Switzerland" },
  { code: "GB", hu: "Egyesult Kiralysag", en: "United Kingdom" },
  { code: "IE", hu: "Irorszag", en: "Ireland" },
  { code: "FR", hu: "Franciaorszag", en: "France" },
  { code: "IT", hu: "Olaszorszag", en: "Italy" },
  { code: "ES", hu: "Spanyolorszag", en: "Spain" },
  { code: "PT", hu: "Portugalia", en: "Portugal" },
  { code: "NL", hu: "Hollandia", en: "Netherlands" },
  { code: "BE", hu: "Belgium", en: "Belgium" },
  { code: "LU", hu: "Luxemburg", en: "Luxembourg" },
  { code: "DK", hu: "Dania", en: "Denmark" },
  { code: "SE", hu: "Svedorszag", en: "Sweden" },
  { code: "NO", hu: "Norvegia", en: "Norway" },
  { code: "FI", hu: "Finnorszag", en: "Finland" },
  { code: "EE", hu: "Esztorszag", en: "Estonia" },
  { code: "LV", hu: "Lettorszag", en: "Latvia" },
  { code: "LT", hu: "Litvania", en: "Lithuania" },
  { code: "GR", hu: "Gorogorszag", en: "Greece" },
  { code: "BG", hu: "Bulgaria", en: "Bulgaria" },
  { code: "CY", hu: "Ciprus", en: "Cyprus" },
  { code: "MT", hu: "Malta", en: "Malta" },
  { code: "TR", hu: "Torokorszag", en: "Turkey" },
  { code: "US", hu: "Egyesult Allamok", en: "United States" },
  { code: "CA", hu: "Kanada", en: "Canada" },
  { code: "AU", hu: "Ausztralia", en: "Australia" },
  { code: "NZ", hu: "Uj-Zeland", en: "New Zealand" },
  { code: "JP", hu: "Japan", en: "Japan" },
  { code: "KR", hu: "Del-Korea", en: "South Korea" },
  { code: "CN", hu: "Kina", en: "China" },
  { code: "IN", hu: "India", en: "India" },
  { code: "BR", hu: "Brazilia", en: "Brazil" },
  { code: "MX", hu: "Mexiko", en: "Mexico" },
  { code: "AR", hu: "Argentina", en: "Argentina" },
  { code: "ZA", hu: "Del-afrikai Koztarsasag", en: "South Africa" },
  { code: "IL", hu: "Izrael", en: "Israel" },
  { code: "AE", hu: "Egyesult Arab Emirsegek", en: "United Arab Emirates" },
  { code: "SG", hu: "Szingapur", en: "Singapore" },
  { code: "AL", hu: "Albania", en: "Albania" },
  { code: "BA", hu: "Bosznia-Hercegovina", en: "Bosnia and Herzegovina" },
  { code: "ME", hu: "Montenegro", en: "Montenegro" },
  { code: "MK", hu: "Eszak-Macedoinia", en: "North Macedonia" },
  { code: "XK", hu: "Koszovo", en: "Kosovo" },
  { code: "MD", hu: "Moldova", en: "Moldova" },
];

export function getCountryOptions(locale: Locale): { value: string; label: string }[] {
  return COUNTRIES.map((c) => ({
    value: c.code,
    label: c[locale],
  })).sort((a, b) => {
    if (a.value === "HU") return -1;
    if (b.value === "HU") return 1;
    return a.label.localeCompare(b.label, locale);
  });
}
