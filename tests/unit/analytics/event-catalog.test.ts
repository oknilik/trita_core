import test from "node:test";
import assert from "node:assert/strict";
import {
  ANALYTICS_EVENTS,
  ANALYTICS_EVENT_NAMES,
  FORBIDDEN_PROP_NAMES,
  acceptsOrigin,
  isAnalyticsEventName,
  parseEventProps,
} from "@/lib/analytics/events";

// ─────────────────────────────────────────────────────────────────────
// A katalógus a rendszer adatvédelmi garanciája. Ez a teszt az, ami a
// garanciát ŐRZI: ha valaki PII-t engedő tulajdonságot venne fel, vagy
// megnyitná a sémát, a CI itt bukik el — MIELŐTT bármi adat keletkezne.
// ─────────────────────────────────────────────────────────────────────

test("minden esemény sémája zárt (.strict) — ismeretlen kulcs nem mehet át", () => {
  for (const name of ANALYTICS_EVENT_NAMES) {
    const result = parseEventProps(name, { __szemet: "akarmi" });
    assert.equal(
      result.ok,
      false,
      `a(z) "${name}" séma átengedett egy ismeretlen kulcsot — nyitott séma esetén PII szivároghatna be`,
    );
  }
});

test("egyetlen esemény sem deklarál tiltott nevű tulajdonságot", () => {
  for (const name of ANALYTICS_EVENT_NAMES) {
    const shape = ANALYTICS_EVENTS[name].schema.shape;
    for (const propName of Object.keys(shape)) {
      const normalized = propName.toLowerCase();
      assert.ok(
        !(FORBIDDEN_PROP_NAMES as readonly string[]).includes(normalized),
        `tiltott tulajdonság-név a(z) "${name}" eseményben: ${propName}`,
      );
    }
  }
});

test("minden eseményhez tartozik mérési kérdés és leírás", () => {
  // „Ha nincs kérdés, nincs esemény" — a zaj elleni fegyelmi szabály
  // (docs/product/analytics-plan-2026-08.md, II. fejezet).
  for (const name of ANALYTICS_EVENT_NAMES) {
    const spec = ANALYTICS_EVENTS[name];
    assert.ok(spec.question.trim().length > 0, `hiányzó mérési kérdés: ${name}`);
    assert.ok(spec.description.trim().length > 0, `hiányzó leírás: ${name}`);
  }
});

test("az esemény-nevek a domain.action konvenciót követik", () => {
  for (const name of ANALYTICS_EVENT_NAMES) {
    assert.match(
      name,
      /^[a-z]+(?:\.[a-z_]+)+$/,
      `nem konvenciós esemény-név: ${name} (várt alak: domain.action)`,
    );
  }
});

test("a szerver-only események NEM fogadhatók el kliensről", () => {
  // Ez a hamisítás elleni védelem: a „kitöltés kész" vagy a „regisztráció"
  // eseményt bárki küldhetné a böngészőből, és elrontaná az üzleti számot.
  const serverOnly = ANALYTICS_EVENT_NAMES.filter(
    (name) => ANALYTICS_EVENTS[name].origin === "server",
  );
  assert.ok(serverOnly.length > 0, "nincs egyetlen szerver-only esemény sem — gyanús");

  for (const name of serverOnly) {
    assert.equal(acceptsOrigin(name, "client"), false, `kliensről elfogadható lenne: ${name}`);
    assert.equal(acceptsOrigin(name, "server"), true);
  }
});

test("az üzletileg kritikus események szerver-oldaliak", () => {
  // Ezek adják a tölcsér ÜZLETI számait — ha kliens-oldaliak lennének,
  // ad-blocker és hamisítás egyaránt torzítaná őket.
  for (const name of ["assessment.complete", "auth.signup", "inquiry.submit"] as const) {
    assert.equal(ANALYTICS_EVENTS[name].origin, "server", `${name} nem szerver-oldali`);
  }
});

test("ismeretlen esemény-név elutasítva", () => {
  assert.equal(isAnalyticsEventName("nincs.ilyen"), false);
  assert.equal(isAnalyticsEventName("cta.click"), true);
});

test("a validált tulajdonságok csak skalárok lehetnek", () => {
  const result = parseEventProps("cta.click", { cta_id: "hero_primary", surface: "landing" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  for (const [key, value] of Object.entries(result.props)) {
    assert.ok(
      ["string", "number", "boolean"].includes(typeof value),
      `nem skalár tulajdonság: ${key}`,
    );
  }
});

test("a túl hosszú szöveges tulajdonság elutasításra kerül", () => {
  // Szabad szöveg így sem tud „belecsúszni" egy tag-mezőbe.
  const result = parseEventProps("cta.click", {
    cta_id: "x".repeat(200),
    surface: "landing",
  });
  assert.equal(result.ok, false);
});
