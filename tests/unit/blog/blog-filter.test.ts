import test from "node:test";
import assert from "node:assert/strict";
import { resolveBlogTopic, toBlogTopicParam } from "@/lib/blog-filter";

test("a blogtema URL-parametere ekezet- es irasjel-fuggetlen", () => {
  assert.equal(
    toBlogTopicParam("Pszichológiai biztonság"),
    "pszichologiai-biztonsag",
  );
  assert.equal(toBlogTopicParam("  Team dynamics / trust  "), "team-dynamics-trust");
});

test("az URL-parametert az aktualis nyelv cimkejehez oldjuk fel", () => {
  const tags = ["Csapatdinamika", "Önértékelés", "Pszichometria"];

  assert.equal(resolveBlogTopic("onertekeles", tags), "Önértékelés");
  assert.equal(resolveBlogTopic("CSAPATDINAMIKA", tags), "Csapatdinamika");
  assert.equal(resolveBlogTopic("nem-letezo-tema", tags), null);
  assert.equal(resolveBlogTopic(null, tags), null);
});
