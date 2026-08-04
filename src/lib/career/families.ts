// Karrier-családok — a foglalkozás-katalógus felhasználónak mutatott csoportjai.
//
// Miért kell: 477 egyedi szakmát rangsorolni nem védhető állítás — a 3. és a
// 12. hely közti különbség mérési hibán belül van. Családszinten viszont igen,
// mert egy család viselkedésileg homogén (a hozzárendelés a profil-alakon,
// a preferencia-tengelyeken és a RIASEC-vektoron fut).
//
// A besorolás OFFLINE készül (`scripts/career-catalog/step12_families.mjs`) és
// BEFAGYVA él a katalógusban (`Occupation.family`). Futásidőben soha nem
// számoljuk újra: mérés szerint az ismételt klaszterezés a foglalkozások
// 91%-át átsorolná, tehát a felhasználó két látogatás közt más családban
// találná magát. Levezetés és mérések: docs/product/career-families.md

import familiesData from "./catalog/families.json";
import type { Locale } from "@/lib/i18n";

export interface CareerFamily {
  key: string;
  hu: string;
  en: string;
  defHu: string;
  defEn: string;
  /** A család viselkedési magja — a hozzárendelés ezek centroidjához mér. */
  anchors: string[];
  /** Szemantikus korlát: mely ISCO-prefixek kerülhetnek ide (leghosszabb nyer). */
  iscoPrefix: string[];
  /** Tételesen ide sorolt foglalkozás-nevek — minden szabályt felülírnak. */
  pinned: string[];
}

interface FamiliesFile {
  meta: { version: string; note: string; assignedBy: string };
  families: CareerFamily[];
}

const file = familiesData as unknown as FamiliesFile;

export const FAMILY_VERSION = file.meta.version;
export const CAREER_FAMILIES: CareerFamily[] = file.families;

const byKey = new Map(CAREER_FAMILIES.map((f) => [f.key, f]));

export function getCareerFamily(key: string | undefined | null): CareerFamily | undefined {
  return key ? byKey.get(key) : undefined;
}

export function familyLabel(key: string | undefined | null, locale: Locale): string | null {
  const family = getCareerFamily(key);
  if (!family) return null;
  return locale === "hu" ? family.hu : family.en;
}

export function familyDefinition(key: string | undefined | null, locale: Locale): string | null {
  const family = getCareerFamily(key);
  if (!family) return null;
  return locale === "hu" ? family.defHu : family.defEn;
}

/**
 * Kis család: a családszintű átlag maga is zajos, ezért a felületen
 * halkabb, „tájékoztató jellegű" jelöléssel kell mutatni. A küszöb a
 * mérésből jön: 8 tétel alatt a szórás-becslés már nem megbízható.
 */
export const SMALL_FAMILY_THRESHOLD = 8;
