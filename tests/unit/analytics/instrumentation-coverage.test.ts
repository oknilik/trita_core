import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ANALYTICS_EVENTS, ANALYTICS_EVENT_NAMES } from "@/lib/analytics/events";

/**
 * BEÉPÍTÉSI LEFEDETTSÉG — a katalógusban deklarált eseménynek legyen is
 * hívóhelye.
 *
 * MIÉRT KELL: a katalógusba felvenni egy eseményt olcsó, bekötni drágább —
 * és pont ez a rés nyílt ki az első körben (négy esemény deklarálva volt, de
 * senki nem küldte). Egy „deklarált, de sosem érkező" esemény rosszabb, mint
 * ha nem is lenne: az admin-felületen üres sorként ül, és senki nem tudja,
 * hogy hiba-e vagy tényleg nem történt meg.
 *
 * A teszt a FORRÁSKÓDOT pásztázza (a check-colors / public-dictionary
 * guardrail mintájára), nem futásidejű viselkedést mér.
 */

const SRC_ROOT = join(process.cwd(), "src");

/** Az analitika saját moduljai — ott a nevek definícióként, nem hívásként állnak. */
const EXCLUDED_PATHS = [
  join("src", "lib", "analytics"),
  join("src", "app", "api", "e"),
];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, acc);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (EXCLUDED_PATHS.some((excluded) => full.includes(excluded))) continue;
    acc.push(full);
  }
  return acc;
}

/** Minden `track("…")` / `trackServerEvent("…")` hívás esemény-neve. */
function collectCallSites(): Map<string, string[]> {
  const sites = new Map<string, string[]>();
  const pattern = /\btrack(?:ServerEvent)?\(\s*["'`]([a-z_.]+)["'`]/g;

  for (const file of collectSourceFiles(SRC_ROOT)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) {
      const name = match[1];
      if (!sites.has(name)) sites.set(name, []);
      sites.get(name)!.push(file.replace(process.cwd() + "/", ""));
    }
  }
  return sites;
}

const callSites = collectCallSites();

test("minden deklarált eseménynek van hívóhelye", () => {
  const missing = ANALYTICS_EVENT_NAMES.filter((name) => !callSites.has(name));
  assert.deepEqual(
    missing,
    [],
    `deklarált, de sehol nem küldött esemény: ${missing.join(", ")} – vagy kösd be, vagy vedd ki a katalógusból`,
  );
});

test("nincs hívás nem létező esemény-névre", () => {
  const unknown = [...callSites.keys()].filter(
    (name) => !(ANALYTICS_EVENT_NAMES as string[]).includes(name),
  );
  assert.deepEqual(unknown, [], `ismeretlen esemény-névre hívás: ${unknown.join(", ")}`);
});

test("a szerver-only eseményeket csak szerver-oldali kód küldi", () => {
  // A hívóhelynek `trackServerEvent`-et kell használnia – a kliens-oldali
  // `track()` amúgy is elbukna a végponton, de itt már fordítás előtt szólunk.
  for (const name of ANALYTICS_EVENT_NAMES) {
    if (ANALYTICS_EVENTS[name].origin !== "server") continue;
    for (const file of callSites.get(name) ?? []) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      const clientCall = new RegExp(`(?<!Server)\\btrack\\(\\s*["'\`]${name.replace(".", "\\.")}`);
      assert.ok(
        !clientCall.test(source),
        `szerver-only eseményt kliens-oldali track() hív: ${name} (${file})`,
      );
    }
  }
});

test("a kliens-only eseményeket nem küldi szerver-oldali kód", () => {
  for (const name of ANALYTICS_EVENT_NAMES) {
    if (ANALYTICS_EVENTS[name].origin !== "client") continue;
    for (const file of callSites.get(name) ?? []) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      const serverCall = new RegExp(`trackServerEvent\\(\\s*["'\`]${name.replace(".", "\\.")}`);
      assert.ok(
        !serverCall.test(source),
        `kliens-only eseményt szerver-oldali hívás küld: ${name} (${file})`,
      );
    }
  }
});
