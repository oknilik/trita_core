import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSignInPath,
  sanitizeInternalRedirect,
} from "../../../src/lib/navigation/auth-redirects";

test("keeps an internal path with query and fragment", () => {
  assert.equal(
    sanitizeInternalRedirect("/team/family/settings?tab=members#invite"),
    "/team/family/settings?tab=members#invite",
  );
  assert.equal(
    buildSignInPath("/tasks?filter=open"),
    "/sign-in?redirect_url=%2Ftasks%3Ffilter%3Dopen",
  );
});

test("rejects external, ambiguous and auth-loop redirects", () => {
  for (const unsafe of [
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    " /dashboard",
    "/dashboard\n/evil",
    "/sign-in",
    "/sign-up?redirect_url=/dashboard",
  ]) {
    assert.equal(sanitizeInternalRedirect(unsafe), null, unsafe);
  }
  assert.equal(buildSignInPath("//evil.example"), "/sign-in");
});
