import test from "node:test";
import assert from "node:assert/strict";
import { buildOnboardingSchema } from "@/lib/onboarding-payload";

const schema = buildOnboardingSchema(2026);

test("onboarding payload – progresszív profilozás", async (t) => {
  await t.test("gyors aktiválásnál a név és hozzájárulás elegendő", () => {
    const result = schema.safeParse({
      username: "Anna",
      consentedAt: "2026-08-12T09:00:00.000Z",
    });
    assert.equal(result.success, true);
  });

  await t.test("a teljes onboarding demográfiai payloadja változatlanul érvényes", () => {
    const result = schema.safeParse({
      username: "Anna",
      birthYear: 1992,
      gender: "female",
      country: "HU",
      consentedAt: "2026-08-12T09:00:00.000Z",
      eduLevel: "higher",
      eduField: "economics",
      currentIndustry: "consulting",
    });
    assert.equal(result.success, true);
  });

  await t.test("fél demográfiai payloadot nem fogad el", () => {
    const result = schema.safeParse({
      username: "Anna",
      birthYear: 1992,
      consentedAt: "2026-08-12T09:00:00.000Z",
    });
    assert.equal(result.success, false);
  });

  await t.test("a profilbeállításokból a karrier-háttér mezői üríthetők", () => {
    const result = schema.safeParse({
      username: "Anna",
      eduLevel: null,
      eduField: null,
      currentIndustry: null,
    });
    assert.equal(result.success, true);
  });
});
