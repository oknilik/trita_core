import type { Locale } from "@/lib/i18n";

interface Country {
  code: string;
  hu: string;
  en: string;
  de: string;
}

const COUNTRIES: Country[] = [
  { code: "HU", hu: "Magyarorszag", en: "Hungary", de: "Ungarn" },
  { code: "AT", hu: "Ausztria", en: "Austria", de: "Oesterreich" },
  { code: "DE", hu: "Nemetorszag", en: "Germany", de: "Deutschland" },
  { code: "SK", hu: "Szlovakia", en: "Slovakia", de: "Slowakei" },
  { code: "RO", hu: "Romania", en: "Romania", de: "Rumaenien" },
  { code: "HR", hu: "Horvatorszag", en: "Croatia", de: "Kroatien" },
  { code: "RS", hu: "Szerbia", en: "Serbia", de: "Serbien" },
  { code: "SI", hu: "Szlovenia", en: "Slovenia", de: "Slowenien" },
  { code: "UA", hu: "Ukrajna", en: "Ukraine", de: "Ukraine" },
  { code: "CZ", hu: "Csehorszag", en: "Czechia", de: "Tschechien" },
  { code: "PL", hu: "Lengyelorszag", en: "Poland", de: "Polen" },
  { code: "CH", hu: "Svajc", en: "Switzerland", de: "Schweiz" },
  { code: "GB", hu: "Egyesult Kiralysag", en: "United Kingdom", de: "Vereinigtes Koenigreich" },
  { code: "IE", hu: "Irorszag", en: "Ireland", de: "Irland" },
  { code: "FR", hu: "Franciaorszag", en: "France", de: "Frankreich" },
  { code: "IT", hu: "Olaszorszag", en: "Italy", de: "Italien" },
  { code: "ES", hu: "Spanyolorszag", en: "Spain", de: "Spanien" },
  { code: "PT", hu: "Portugalia", en: "Portugal", de: "Portugal" },
  { code: "NL", hu: "Hollandia", en: "Netherlands", de: "Niederlande" },
  { code: "BE", hu: "Belgium", en: "Belgium", de: "Belgien" },
  { code: "LU", hu: "Luxemburg", en: "Luxembourg", de: "Luxemburg" },
  { code: "DK", hu: "Dania", en: "Denmark", de: "Daenemark" },
  { code: "SE", hu: "Svedorszag", en: "Sweden", de: "Schweden" },
  { code: "NO", hu: "Norvegia", en: "Norway", de: "Norwegen" },
  { code: "FI", hu: "Finnorszag", en: "Finland", de: "Finnland" },
  { code: "EE", hu: "Esztorszag", en: "Estonia", de: "Estland" },
  { code: "LV", hu: "Lettorszag", en: "Latvia", de: "Lettland" },
  { code: "LT", hu: "Litvania", en: "Lithuania", de: "Litauen" },
  { code: "GR", hu: "Gorogorszag", en: "Greece", de: "Griechenland" },
  { code: "BG", hu: "Bulgaria", en: "Bulgaria", de: "Bulgarien" },
  { code: "CY", hu: "Ciprus", en: "Cyprus", de: "Zypern" },
  { code: "MT", hu: "Malta", en: "Malta", de: "Malta" },
  { code: "TR", hu: "Torokorszag", en: "Turkey", de: "Tuerkei" },
  { code: "US", hu: "Egyesult Allamok", en: "United States", de: "Vereinigte Staaten" },
  { code: "CA", hu: "Kanada", en: "Canada", de: "Kanada" },
  { code: "AU", hu: "Ausztralia", en: "Australia", de: "Australien" },
  { code: "NZ", hu: "Uj-Zeland", en: "New Zealand", de: "Neuseeland" },
  { code: "JP", hu: "Japan", en: "Japan", de: "Japan" },
  { code: "KR", hu: "Del-Korea", en: "South Korea", de: "Suedkorea" },
  { code: "CN", hu: "Kina", en: "China", de: "China" },
  { code: "IN", hu: "India", en: "India", de: "Indien" },
  { code: "BR", hu: "Brazilia", en: "Brazil", de: "Brasilien" },
  { code: "MX", hu: "Mexiko", en: "Mexico", de: "Mexiko" },
  { code: "AR", hu: "Argentina", en: "Argentina", de: "Argentinien" },
  { code: "ZA", hu: "Del-afrikai Koztarsasag", en: "South Africa", de: "Suedafrika" },
  { code: "IL", hu: "Izrael", en: "Israel", de: "Israel" },
  { code: "AE", hu: "Egyesult Arab Emirsegek", en: "United Arab Emirates", de: "Vereinigte Arabische Emirate" },
  { code: "SG", hu: "Szingapur", en: "Singapore", de: "Singapur" },
  { code: "AL", hu: "Albania", en: "Albania", de: "Albanien" },
  { code: "BA", hu: "Bosznia-Hercegovina", en: "Bosnia and Herzegovina", de: "Bosnien und Herzegowina" },
  { code: "ME", hu: "Montenegro", en: "Montenegro", de: "Montenegro" },
  { code: "MK", hu: "Eszak-Macedoinia", en: "North Macedonia", de: "Nordmazedonien" },
  { code: "XK", hu: "Koszovo", en: "Kosovo", de: "Kosovo" },
  { code: "MD", hu: "Moldova", en: "Moldova", de: "Moldau" },
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
