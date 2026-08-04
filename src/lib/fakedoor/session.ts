import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

// Fake door munkamenet-azonosító.
//
// EZ köti össze a megtekintést a válasszal (nevező ↔ számláló), és ebből
// sorsolódik az ársáv. Ezért kell tartósnak lennie: ha munkamenetenként
// újragenerálódna, ugyanaz a látogató más árat láthatna visszatéréskor, és a
// megtekintés-nevező is felhígulna.
//
// Nem azonosít személyt: véletlen UUID, csak a mérés két oldalát kapcsolja
// össze. Ezért nem is kell hozzá hozzájárulás-kezelés, viszont httpOnly, hogy
// kliens-oldali szkript ne írhassa át (különben a sorsolás manipulálható).

const COOKIE_NAME = "fd_sid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export interface FakeDoorSession {
  sessionId: string;
  /** Igaz, ha most jött létre — ilyenkor a válasz-oldalnak be kell állítania. */
  isNew: boolean;
}

/** Meglévő azonosító beolvasása, vagy új generálása (a cookie-t NEM írja). */
export async function readFakeDoorSession(): Promise<FakeDoorSession> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: randomUUID(), isNew: true };
}

/**
 * Cookie kiírása. Külön lépés, mert szerver-komponensből nem lehet cookie-t
 * írni — a page csak olvas, az írás a beágyazott route handlerre marad.
 */
export function fakeDoorCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  };
}

export const FAKE_DOOR_COOKIE_NAME = COOKIE_NAME;
