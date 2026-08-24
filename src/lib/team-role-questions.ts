// ─────────────────────────────────────────────────────────────────────
// trita csapatszerep-itembank v1 (2026-07-20)
//
// 27 saját megfogalmazású viselkedés-állítás (9 szerep × 3), két
// perspektívában: self (E/1, önkitöltés) és peer (E/3, csapattársi
// visszajelzés). A korábbi 7×8-as, pontelosztásos SPI-tükör kivezetve —
// jogi indoklás és terv: docs/product/team-role-instrument-replacement-plan.md,
// itemek forrása: docs/product/team-role-items-draft.md.
//
// Kitöltési formátum (mindkét perspektíva):
//   - a kitöltő kiválasztja a leginkább jellemző 8–12 állítást,
//   - közülük pontosan 3-at „kiemelten jellemző"-ként jelöl (dupla súly).
// A pontozás a team-role-scoring.ts-ben él.
// ─────────────────────────────────────────────────────────────────────

import type { TeamRoleCode } from "./team-role-scoring";

export interface TeamRoleItem {
  /** Stabil item-azonosító (pl. "OG1") — a mentett selections kulcsa. */
  id: string;
  role: TeamRoleCode;
  self: { hu: string; en: string };
  peer: { hu: string; en: string };
}

export type TeamRolePerspective = "self" | "peer";

/** Kiválasztási súly: 1 = jellemző, 2 = kiemelten jellemző. */
export type TeamRoleSelections = Record<string, 1 | 2>;

export const TEAM_ROLE_MIN_SELECT = 8;
export const TEAM_ROLE_MAX_SELECT = 12;
export const TEAM_ROLE_TOP_SELECT = 3;

export const TEAM_ROLE_ITEMS: TeamRoleItem[] = [
  // ── Ötletgazda ──────────────────────────────────────────────────────
  {
    id: "OG1",
    role: "OG",
    self: {
      hu: "Amikor a csapat elakad, gyakran én állok elő szokatlan, új megközelítéssel.",
      en: "When the team is stuck, I'm often the one who comes up with an unusual, fresh approach.",
    },
    peer: {
      hu: "Amikor a csapat elakad, gyakran ő áll elő szokatlan, új megközelítéssel.",
      en: "When the team is stuck, they often come up with an unusual, fresh approach.",
    },
  },
  {
    id: "OG2",
    role: "OG",
    self: {
      hu: "Olyan megoldásokat vetek fel, amikre más nem gondolt.",
      en: "I raise solutions no one else had thought of.",
    },
    peer: {
      hu: "Olyan megoldásokat vet fel, amikre más nem gondolt.",
      en: "Raises solutions no one else had thought of.",
    },
  },
  {
    id: "OG3",
    role: "OG",
    self: {
      hu: "Szívesen gondolkodom hangosan merész, még kiforratlan ötleteken.",
      en: "I enjoy thinking out loud about bold, half-formed ideas.",
    },
    peer: {
      hu: "Szívesen gondolkodik hangosan merész, még kiforratlan ötleteken.",
      en: "Enjoys thinking out loud about bold, half-formed ideas.",
    },
  },
  // ── Kapcsolatépítő ──────────────────────────────────────────────────
  {
    id: "KE1",
    role: "KE",
    self: {
      hu: "Gyorsan megtalálom, kihez érdemes fordulni egy kérdéssel a csapaton kívül.",
      en: "I quickly find the right person to turn to outside the team.",
    },
    peer: {
      hu: "Gyorsan megtalálja, kihez érdemes fordulni egy kérdéssel a csapaton kívül.",
      en: "Quickly finds the right person to turn to outside the team.",
    },
  },
  {
    id: "KE2",
    role: "KE",
    self: {
      hu: "Külső ötleteket, lehetőségeket és információkat hozok be a csapatba.",
      en: "I bring outside ideas, opportunities and information into the team.",
    },
    peer: {
      hu: "Külső ötleteket, lehetőségeket és információkat hoz be a csapatba.",
      en: "Brings outside ideas, opportunities and information into the team.",
    },
  },
  {
    id: "KE3",
    role: "KE",
    self: {
      hu: "Könnyen teremtek kapcsolatot új emberekkel, és ezt a csapat javára fordítom.",
      en: "I connect easily with new people and turn it to the team's advantage.",
    },
    peer: {
      hu: "Könnyen teremt kapcsolatot új emberekkel, és ezt a csapat javára fordítja.",
      en: "Connects easily with new people and turns it to the team's advantage.",
    },
  },
  // ── Koordinátor ─────────────────────────────────────────────────────
  {
    id: "KO1",
    role: "KO",
    self: {
      hu: "Jó érzékkel osztom el a feladatokat aszerint, ki miben erős.",
      en: "I distribute work with a good sense of who is strong at what.",
    },
    peer: {
      hu: "Jó érzékkel osztja el a feladatokat aszerint, ki miben erős.",
      en: "Distributes work with a good sense of who is strong at what.",
    },
  },
  {
    id: "KO2",
    role: "KO",
    self: {
      hu: "Megbeszéléseken összefogom a szálakat, és közös irányt adok a csapatnak.",
      en: "In meetings I pull the threads together and set a shared direction.",
    },
    peer: {
      hu: "Megbeszéléseken összefogja a szálakat, és közös irányt ad a csapatnak.",
      en: "Pulls the threads together in meetings and sets a shared direction.",
    },
  },
  {
    id: "KO3",
    role: "KO",
    self: {
      hu: "Teret adok másoknak, és elő tudom hívni a hozzájárulásukat.",
      en: "I make room for others and draw out their contribution.",
    },
    peer: {
      hu: "Teret ad másoknak, és elő tudja hívni a hozzájárulásukat.",
      en: "Makes room for others and draws out their contribution.",
    },
  },
  // ── Hajtóerő ────────────────────────────────────────────────────────
  {
    id: "HA1",
    role: "HA",
    self: {
      hu: "Nyomás alatt is lendületben tartom a csapatot.",
      en: "I keep the team moving even under pressure.",
    },
    peer: {
      hu: "Nyomás alatt is lendületben tartja a csapatot.",
      en: "Keeps the team moving even under pressure.",
    },
  },
  {
    id: "HA2",
    role: "HA",
    self: {
      hu: "Kimondom a kényelmetlen kérdéseket is, hogy előrébb jussunk.",
      en: "I voice the uncomfortable questions so the team moves forward.",
    },
    peer: {
      hu: "Kimondja a kényelmetlen kérdéseket is, hogy előrébb jussunk.",
      en: "Voices the uncomfortable questions so the team moves forward.",
    },
  },
  {
    id: "HA3",
    role: "HA",
    self: {
      hu: "Nem hagyom, hogy a csapat megelégedjen a legkényelmesebb megoldással.",
      en: "I don't let the team settle for the most comfortable answer.",
    },
    peer: {
      hu: "Nem hagyja, hogy a csapat megelégedjen a legkényelmesebb megoldással.",
      en: "Doesn't let the team settle for the most comfortable answer.",
    },
  },
  // ── Értékelő-elemző ─────────────────────────────────────────────────
  {
    id: "ER1",
    role: "ER",
    self: {
      hu: "Döntés előtt higgadtan mérlegre teszem az opciók gyenge pontjait.",
      en: "Before a decision I calmly weigh the weak points of each option.",
    },
    peer: {
      hu: "Döntés előtt higgadtan mérlegre teszi az opciók gyenge pontjait.",
      en: "Calmly weighs the weak points of each option before a decision.",
    },
  },
  {
    id: "ER2",
    role: "ER",
    self: {
      hu: "Tényekre alapozva érvelek akkor is, ha a többség már lelkes.",
      en: "I argue from facts even when the majority is already enthusiastic.",
    },
    peer: {
      hu: "Tényekre alapozva érvel akkor is, ha a többség már lelkes.",
      en: "Argues from facts even when the majority is already enthusiastic.",
    },
  },
  {
    id: "ER3",
    role: "ER",
    self: {
      hu: "Észreveszem a tervek logikai buktatóit, mielőtt drágák lennének.",
      en: "I spot the logical pitfalls in plans before they get expensive.",
    },
    peer: {
      hu: "Észreveszi a tervek logikai buktatóit, mielőtt drágák lennének.",
      en: "Spots the logical pitfalls in plans before they get expensive.",
    },
  },
  // ── Csapatsegítő ────────────────────────────────────────────────────
  {
    id: "CS1",
    role: "CS",
    self: {
      hu: "Odafigyelek rá, hogy mindenki szóhoz jusson és meghallgassák.",
      en: "I make sure everyone gets a chance to speak and be heard.",
    },
    peer: {
      hu: "Odafigyel rá, hogy mindenki szóhoz jusson és meghallgassák.",
      en: "Makes sure everyone gets heard.",
    },
  },
  {
    id: "CS2",
    role: "CS",
    self: {
      hu: "Feszültség esetén közvetítek, és oldom a hangulatot.",
      en: "When there is tension, I mediate and ease the mood.",
    },
    peer: {
      hu: "Feszültség esetén közvetít, és oldja a hangulatot.",
      en: "Mediates when there is tension and eases the mood.",
    },
  },
  {
    id: "CS3",
    role: "CS",
    self: {
      hu: "Észreveszem, ha valaki elakadt vagy túlterhelt, és magamtól segítek.",
      en: "I notice when someone is stuck or overloaded and help unprompted.",
    },
    peer: {
      hu: "Észreveszi, ha valaki elakadt vagy túlterhelt, és magától segít.",
      en: "Notices when someone is stuck or overloaded and helps unprompted.",
    },
  },
  // ── Megvalósító ─────────────────────────────────────────────────────
  {
    id: "MV1",
    role: "MV",
    self: {
      hu: "A megbeszéltekből működő, kézzelfogható eredményt csinálok.",
      en: "I turn what was agreed into tangible, working results.",
    },
    peer: {
      hu: "A megbeszéltekből működő, kézzelfogható eredményt csinál.",
      en: "Turns what was agreed into tangible, working results.",
    },
  },
  {
    id: "MV2",
    role: "MV",
    self: {
      hu: "Amit elvállalok, azt megbízhatóan végig is viszem.",
      en: "I reliably follow through on what I commit to.",
    },
    peer: {
      hu: "Amit elvállal, azt megbízhatóan végig is viszi.",
      en: "Reliably follows through on what they commit to.",
    },
  },
  {
    id: "MV3",
    role: "MV",
    self: {
      hu: "Rendet és működő folyamatot viszek a kusza feladatokba.",
      en: "I bring order and workable process to messy tasks.",
    },
    peer: {
      hu: "Rendet és működő folyamatot visz a kusza feladatokba.",
      en: "Brings order and workable process to messy tasks.",
    },
  },
  // ── Minőségőr ───────────────────────────────────────────────────────
  {
    id: "MI1",
    role: "MI",
    self: {
      hu: "Kiszúrom a hibákat, amik mások figyelmét elkerülték.",
      en: "I catch the errors that slipped past everyone else.",
    },
    peer: {
      hu: "Kiszúrja a hibákat, amik mások figyelmét elkerülték.",
      en: "Catches the errors that slipped past everyone else.",
    },
  },
  {
    id: "MI2",
    role: "MI",
    self: {
      hu: "A határidők és a részletek nálam biztos kezekben vannak.",
      en: "Deadlines and details are safe in my hands.",
    },
    peer: {
      hu: "A határidők és a részletek nála biztos kezekben vannak.",
      en: "Deadlines and details are safe in their hands.",
    },
  },
  {
    id: "MI3",
    role: "MI",
    self: {
      hu: "Addig nem engedem ki a kezemből a munkát, amíg az nem igényes.",
      en: "I don't let work go out until it meets the bar.",
    },
    peer: {
      hu: "Addig nem engedi ki a kezéből a munkát, amíg az nem igényes.",
      en: "Doesn't let work go out until it meets the bar.",
    },
  },
  // ── Szakértő ────────────────────────────────────────────────────────
  {
    id: "SZ1",
    role: "SZ",
    self: {
      hu: "Mély szaktudást hozok, amire a csapat építeni tud.",
      en: "I bring deep expertise the team can build on.",
    },
    peer: {
      hu: "Mély szaktudást hoz, amire a csapat építeni tud.",
      en: "Brings deep expertise the team can build on.",
    },
  },
  {
    id: "SZ2",
    role: "SZ",
    self: {
      hu: "A szakterületemen naprakész vagyok, és a tudásomat megosztom.",
      en: "I stay current in my field and share what I know.",
    },
    peer: {
      hu: "A szakterületén naprakész, és a tudását megosztja.",
      en: "Stays current in their field and shares what they know.",
    },
  },
  {
    id: "SZ3",
    role: "SZ",
    self: {
      hu: "Bonyolult szakmai kérdésekben hozzám fordul a csapat.",
      en: "The team turns to me on complex specialist questions.",
    },
    peer: {
      hu: "Bonyolult szakmai kérdésekben hozzá fordul a csapat.",
      en: "The team turns to them on complex specialist questions.",
    },
  },
];

export const TEAM_ROLE_ITEM_COUNT = TEAM_ROLE_ITEMS.length;

const ITEM_ID_SET = new Set(TEAM_ROLE_ITEMS.map((i) => i.id));

export function getTeamRoleItemText(
  item: TeamRoleItem,
  perspective: TeamRolePerspective,
  locale: "hu" | "en",
): string {
  return item[perspective][locale];
}

/**
 * Érvényes-e egy kiválasztás-halmaz: minden id létező item, a kijelölt
 * itemek száma a [MIN, MAX] sávban van, és pontosan TOP darab kiemelt.
 */
export function isValidTeamRoleSelectionSet(
  selections: unknown,
): selections is TeamRoleSelections {
  if (!selections || typeof selections !== "object" || Array.isArray(selections)) {
    return false;
  }
  const entries = Object.entries(selections as Record<string, unknown>);
  if (
    entries.length < TEAM_ROLE_MIN_SELECT ||
    entries.length > TEAM_ROLE_MAX_SELECT
  ) {
    return false;
  }
  let top = 0;
  for (const [id, weight] of entries) {
    if (!ITEM_ID_SET.has(id)) return false;
    if (weight !== 1 && weight !== 2) return false;
    if (weight === 2) top += 1;
  }
  return top === TEAM_ROLE_TOP_SELECT;
}
