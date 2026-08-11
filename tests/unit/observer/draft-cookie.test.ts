/**
 * Observer-draft „birtoklás-bizonyíték" cookie helper tesztek.
 *
 * A cookie a KÜLSŐ meghívó szerver-oldali draftjának kiadását köti ahhoz a
 * böngészőhöz, amelyik a draftot írta (logged-out draft-szivárgás elleni fix
 * — a token bearer-jellege miatt maga az ÉRTÉKELT is megnyithatná kijelent-
 * kezve a rater folyamatban lévő válaszait).
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidObserverDraftCookie,
  observerDraftCookieName,
  observerDraftCookieValue,
} from "@/lib/observer/draft-cookie";

test("observer draft cookie helper", async (t) => {
  await t.test("cookie-név a meghívó-id-hoz kötött", () => {
    assert.equal(observerDraftCookieName("inv_abc123"), "trita_obsdraft_inv_abc123");
  });

  await t.test("az érték determinisztikus hex HMAC — meghívónként különböző", () => {
    const a1 = observerDraftCookieValue("inv_a");
    const a2 = observerDraftCookieValue("inv_a");
    const b = observerDraftCookieValue("inv_b");

    assert.equal(a1, a2, "ugyanarra az id-ra stabil");
    assert.notEqual(a1, b, "más meghívóra más érték — nem vihető át");
    assert.match(a1, /^[0-9a-f]{64}$/, "SHA-256 hex");
  });

  await t.test("a helyes érték átmegy, minden más elbukik", () => {
    const value = observerDraftCookieValue("inv_valid");

    assert.equal(isValidObserverDraftCookie("inv_valid", value), true);
    // Másik meghívó értéke NEM jó ehhez a meghívóhoz.
    assert.equal(
      isValidObserverDraftCookie("inv_valid", observerDraftCookieValue("inv_other")),
      false,
    );
    assert.equal(isValidObserverDraftCookie("inv_valid", "nem-hmac"), false);
    assert.equal(isValidObserverDraftCookie("inv_valid", ""), false);
    assert.equal(isValidObserverDraftCookie("inv_valid", null), false);
    assert.equal(isValidObserverDraftCookie("inv_valid", undefined), false);
    // Azonos hosszú, de rossz tartalmú hamisítvány.
    assert.equal(
      isValidObserverDraftCookie("inv_valid", "0".repeat(value.length)),
      false,
    );
  });

  await t.test("a titok (ANALYTICS_SALT) cseréje érvényteleníti a régi értéket", () => {
    const original = process.env.ANALYTICS_SALT;
    try {
      process.env.ANALYTICS_SALT = "unit-test-salt-1";
      const before = observerDraftCookieValue("inv_salted");
      assert.equal(isValidObserverDraftCookie("inv_salted", before), true);

      process.env.ANALYTICS_SALT = "unit-test-salt-2";
      assert.equal(
        isValidObserverDraftCookie("inv_salted", before),
        false,
        "sócsere után a régi bizonyíték nem érvényes",
      );
    } finally {
      if (original === undefined) delete process.env.ANALYTICS_SALT;
      else process.env.ANALYTICS_SALT = original;
    }
  });
});
