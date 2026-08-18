import test from "node:test";
import assert from "node:assert/strict";
import { isFocusRoute } from "@/lib/navigation/focus-routes";

test("a kitöltési és meghívási útvonalak fókusz módot használnak", () => {
  const focusRoutes = [
    "/try",
    "/try/complete",
    "/assessment",
    "/assessment/psych-safety",
    "/observe/token-123",
    "/apply/token-123",
    "/join/token-123",
    "/join/org/invite-123",
    "/onboarding",
  ];

  for (const route of focusRoutes) {
    assert.equal(isFocusRoute(route), true, `${route} legyen fókusz útvonal`);
  }
});

test("a route-prefix csak teljes útvonalszegmensre illeszkedik", () => {
  for (const route of ["/", "/pilot", "/trying", "/assessment-guide", "/blog"]) {
    assert.equal(isFocusRoute(route), false, `${route} ne legyen fókusz útvonal`);
  }
});

